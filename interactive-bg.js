/* interactive-bg.js
   - Tracks mouse / touch and renders a subtle interactive background.
   - Raindrops fall continuously; pointer creates a sword-swing trail.
   - Uses requestAnimationFrame and resize handling for performance.
*/
(function () {
  const canvas = document.getElementById('interactive-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  const pointer = { x: null, y: null, isActive: false };

  // raindrops
  let drops = [];
  const MAX_DROPS = 180;

  // sword trail (pointer history)
  const trail = [];
  const TRAIL_MAX = 24;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnDrop() {
    drops.push({
      x: Math.random() * width,
      y: -10 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 2 + Math.random() * 4,
      len: 8 + Math.random() * 18,
      alpha: 0.25 + Math.random() * 0.6,
    });
    if (drops.length > MAX_DROPS) drops.shift();
  }

  function initDrops() {
    drops = [];
    for (let i = 0; i < MAX_DROPS / 3; i++) spawnDrop();
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      pointer.isActive = true;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      pointer.isActive = true;
    }
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;

    // add to trail
    trail.push({ x: pointer.x, y: pointer.y, t: performance.now() });
    if (trail.length > TRAIL_MAX) trail.shift();
  }

  function onPointerLeave() {
    pointer.isActive = false;
  }

  function drawBackground() {
    const VIGNETTE_STRENGTH = 1.8; 
    const gx = pointer.x !== null ? pointer.x : width / 2;
    const gy = pointer.y !== null ? pointer.y : height / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowRadius = Math.max(width, height) * 0.1;
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowRadius);
    glow.addColorStop(0, `rgba(220,200,180,${0.06 * VIGNETTE_STRENGTH})`);
    glow.addColorStop(1, 'rgba(220,200,180,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const grd = ctx.createRadialGradient(gx, gy, 20, width / 2, height / 2, Math.max(width, height));
    grd.addColorStop(0, `rgba(15,10,20,${0.06 * VIGNETTE_STRENGTH})`);
    grd.addColorStop(0.6, `rgba(5,5,10,${0.02 * VIGNETTE_STRENGTH})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(10,8,12,${0.02 * VIGNETTE_STRENGTH})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function updateDrops(delta) {
    const spawnCount = Math.min(3, Math.max(0, Math.floor(delta * 0.06)));
    for (let i = 0; i < spawnCount; i++) spawnDrop();

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += 0.06; 
      d.x += d.vx;
      d.y += d.vy;

      // slight wind influenced by pointer x
      if (pointer.x !== null) {
        const wind = (pointer.x - width / 2) / width * 0.02;
        d.vx += wind * 0.02;
      }

      // respawn when below screen
      if (d.y - d.len > height + 40) {
        drops.splice(i, 1);
        spawnDrop();
      }
    }
  }

  function drawDrops() {
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.beginPath();
      const x1 = d.x - d.vx * 2;
      const y1 = d.y - d.len;
      const x2 = d.x;
      const y2 = d.y;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, `rgba(200,220,255,${Math.max(0, d.alpha - 0.25)})`);
      grad.addColorStop(1, `rgba(200,220,255,${d.alpha})`);
      ctx.strokeStyle = grad;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  function drawSwordTrail(now) {
    if (!trail.length) return;


    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < trail.length - 1; i++) {
      const p0 = trail[i];
      const p1 = trail[i + 1];
      const age = (now - p0.t) / 600; 
      const alpha = Math.max(0, 1 - age);
      const widthFactor = 18 * (1 - i / trail.length) + 2;
      ctx.strokeStyle = `rgba(220,220,220,${alpha * 0.9})`;
      ctx.lineWidth = widthFactor;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }


    while (trail.length && now - trail[0].t > 700) trail.shift();
  }

  let last = performance.now();
  function frame(now) {
    const delta = now - last;
    last = now;

    ctx.clearRect(0, 0, width, height);
    drawBackground();
    updateDrops(delta);
    drawDrops();
    requestAnimationFrame(frame);
  }

  function start() {
    resize();
    initDrops();
    last = performance.now();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    clearTimeout(window._interactiveBgResize);
    window._interactiveBgResize = setTimeout(() => {
      resize();
      initDrops();
    }, 120);
  });
  
  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('mouseleave', onPointerLeave, { passive: true });
  window.addEventListener('touchend', onPointerLeave, { passive: true });

  function boot() {
    const startBtn = document.getElementById('start-btn');
    const overlay = document.getElementById('loading-overlay');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // hide overlay
        if (overlay) overlay.style.display = 'none';
        start();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Reveal-on-scroll (unchanged)
  function setupRevealOnScroll() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      nodes.forEach(n => io.observe(n));
    } else {
      nodes.forEach(n => n.classList.add('is-visible'));
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupRevealOnScroll();
  } else {
    document.addEventListener('DOMContentLoaded', setupRevealOnScroll);
  }
})();
