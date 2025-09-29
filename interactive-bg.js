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

  // grace particles
  let graceParticles = [];
  const MAX_GRACE_PARTICLES = 15;

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

  function spawnGraceParticle() {
    // Spawn near the bottom where Site of Grace is
    const graceY = height - 150; // approximate Site of Grace position
    graceParticles.push({
      x: width * 0.4 + Math.random() * width * 0.2, // center area
      y: graceY + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 1.5, // float upward
      life: 1.0,
      decay: 0.008 + Math.random() * 0.005,
      size: 2 + Math.random() * 3,
      hue: 45 + Math.random() * 10, // golden hues
    });
    if (graceParticles.length > MAX_GRACE_PARTICLES) graceParticles.shift();
  }

  function initGraceParticles() {
    graceParticles = [];
    for (let i = 0; i < MAX_GRACE_PARTICLES / 2; i++) spawnGraceParticle();
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

  }

  function onPointerLeave() {
    pointer.isActive = false;
  }

  function drawBackground() {
    const VIGNETTE_STRENGTH = 2.2; 
    const gx = pointer.x !== null ? pointer.x : width / 2;
    const gy = pointer.y !== null ? pointer.y : height / 2;
    
    // First, create overall darkness from edges (normal vignette effect)
    ctx.save();
    const maxDistance = Math.max(width, height) * 0.7;
    const edgeVignette = ctx.createRadialGradient(
      width / 2, height / 2, 0,  // center of screen
      width / 2, height / 2, maxDistance  // to edges
    );
    edgeVignette.addColorStop(0, 'rgba(0,0,0,0)');  // center: no darkening
    edgeVignette.addColorStop(0.6, `rgba(0,0,0,${0.15 * VIGNETTE_STRENGTH})`);  // middle: some darkening
    edgeVignette.addColorStop(1, `rgba(0,0,0,${0.4 * VIGNETTE_STRENGTH})`);   // edges: heavy darkening
    ctx.fillStyle = edgeVignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Then add warm glow around mouse cursor  
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowRadius = Math.max(width, height) * 0.15;
    const mouseGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowRadius);
    mouseGlow.addColorStop(0, `rgba(255,220,150,${0.08 * VIGNETTE_STRENGTH})`);  // warm center
    mouseGlow.addColorStop(0.25, `rgba(220,180,120,${0.04 * VIGNETTE_STRENGTH})`);  // softer middle
    mouseGlow.addColorStop(.7, 'rgba(220,180,120,0)');  // fade to nothing
    ctx.fillStyle = mouseGlow;
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

  function updateGraceParticles(delta) {
    // Spawn new grace particles occasionally
    if (Math.random() < 0.015) spawnGraceParticle();

    for (let i = graceParticles.length - 1; i >= 0; i--) {
      const p = graceParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      
      // Add some gentle drift
      p.vx += (Math.random() - 0.5) * 0.01;
      p.vy -= 0.005; // slight upward acceleration
      
      // Remove when faded
      if (p.life <= 0) {
        graceParticles.splice(i, 1);
      }
    }
  }

  function drawGraceParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    for (const p of graceParticles) {
      const alpha = p.life * 0.8;
      const size = p.size * (0.5 + p.life * 0.5);
      
      // Create golden glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
      grad.addColorStop(0.3, `hsla(${p.hue}, 100%, 60%, ${alpha * 0.6})`);
      grad.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Core bright spot
      ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  let last = performance.now();
  function frame(now) {
    const delta = now - last;
    last = now;

    ctx.clearRect(0, 0, width, height);
    drawBackground();
    updateDrops(delta);
    drawDrops();
    updateGraceParticles(delta);
    drawGraceParticles();
    requestAnimationFrame(frame);
  }

  function start() {
    resize();
    initDrops();
    initGraceParticles();
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
    setupHeaderScroll();
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

  function setupRevealOnScroll() { // show elements with .reveal when in viewport
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

  // Header scroll visibility
  function setupHeaderScroll() {
    const header = document.querySelector('header');
    let ticking = false;
    function updateHeader() {
      const scrollY = window.scrollY;
      const shouldShow = scrollY > 10; // Show after scrolling 100px
      
      if (shouldShow) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Initialize header scroll on DOM ready
})();
