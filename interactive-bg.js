/* interactive-bg.js
   - Tracks mouse / touch and renders a subtle interactive background.
   - Uses a radial gradient that follows the pointer and floating particles.
   - Lightweight and uses requestAnimationFrame for performance.
*/
(function () {
  const canvas = document.getElementById('interactive-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let pointer = { x: null, y: null, isActive: false };
  const particles = [];
  const PARTICLE_COUNT = 40;

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

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.3,
      });
    }
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

  function step() {
    ctx.clearRect(0, 0, width, height);

    // background subtle gradient
    const gx = pointer.x !== null ? pointer.x : width / 2;
    const gy = pointer.y !== null ? pointer.y : height / 2;
    const grd = ctx.createRadialGradient(gx, gy, 20, width / 2, height / 2, Math.max(width, height));
    grd.addColorStop(0, 'rgba(80,20,20,0.12)');
    grd.addColorStop(0.35, 'rgba(40,10,10,0.06)');
    grd.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    // update and draw particles
    for (let p of particles) {
      // simple attraction/repel from pointer
      if (pointer.isActive) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.min(150 / dist, 0.6);
        p.vx += (dx / dist) * force * 0.02;
        p.vy += (dy / dist) * force * 0.02;
      }
      p.x += p.vx;
      p.y += p.vy;

      // gentle damping and wrap-around
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,200,180,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle pointer halo
    if (pointer.isActive) {
      const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 160);
      grad.addColorStop(0, 'rgba(255,240,220,0.12)');
      grad.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(pointer.x - 160, pointer.y - 160, 320, 320);
    }

    requestAnimationFrame(step);
  }

  // init
  function start() {
    resize();
    initParticles();
    requestAnimationFrame(step);
  }

  // event listeners
  window.addEventListener('resize', () => {
    // debounce resize
    clearTimeout(window._interactiveBgResize);
    window._interactiveBgResize = setTimeout(() => {
      resize();
      initParticles();
    }, 120);
  });
  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('mouseleave', onPointerLeave, { passive: true });
  window.addEventListener('touchend', onPointerLeave, { passive: true });

  // start once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Reveal-on-scroll: mark project boxes (and similar elements) hidden then reveal when visible
  function setupRevealOnScroll() {
    const nodes = document.querySelectorAll('.project-card, .projects, section');
    if (!nodes.length) return;

    nodes.forEach(n => n.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

      nodes.forEach(n => io.observe(n));
    } else {
      // fallback: show all
      nodes.forEach(n => n.classList.add('is-visible'));
    }
  }

  // call after DOM ready/start
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupRevealOnScroll();
  } else {
    document.addEventListener('DOMContentLoaded', setupRevealOnScroll);
  }
})();
