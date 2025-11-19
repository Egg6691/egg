// --- Fireflies ---
const FIREFLY_COUNT = 15; // Change this number to increase/decrease fireflies
const firefliesContainer = document.querySelector('.fireflies');
if (firefliesContainer) {
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    // Random position
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    // Random animation delay and duration
    const delay = (Math.random() * 3).toFixed(2);
    const duration = (10 + Math.random() * 5).toFixed(2);
    dot.style.animationDelay = `${delay}s`;
    dot.style.setProperty('--dur', `${duration}s`);
    // Random movement
    const dx = (Math.random() * 80 - 40).toFixed(0); // -40 to 40 px
    const dy = (Math.random() * 80 - 40).toFixed(0); // -40 to 40 px
    dot.style.setProperty('--dx', `${dx}px`);
    dot.style.setProperty('--dy', `${dy}px`);
    firefliesContainer.appendChild(dot);
  }
}
import './style.css'

// Show navbar after scrolling 100vh
const navbar = document.querySelector('.scroll-navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight) {
      navbar.classList.add('visible');
    } else {
      navbar.classList.remove('visible');
    }
  });
}
