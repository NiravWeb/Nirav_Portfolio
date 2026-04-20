// main.js — GSAP Orchestration
// Requires: GSAP 3.12 + ScrollTrigger (loaded from CDN in HTML)

// ─── Wait for GSAP ────────────────────────────────────────────
function waitForGSAP(cb) {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') cb();
  else setTimeout(() => waitForGSAP(cb), 50);
}

waitForGSAP(init);

function init() {
  gsap.registerPlugin(ScrollTrigger);

  // ── Intro Overlay ──────────────────────────────────────────
  const overlay = createIntroOverlay();
  animateIntro(overlay);

  // ── Cursor ─────────────────────────────────────────────────
  initCursor();

  // ── Rolodex ────────────────────────────────────────────────
  initRolodex();

  // ── Museum (Projects) ───────────────────────────────────────
  initMuseum();

  // ── Skills Ticker ──────────────────────────────────────────
  initSkillsScroll();

  // ── About Ticker ───────────────────────────────────────────
  initAboutTicker();

  // ── Section Reveals ─────────────────────────────────────────
  initReveal();

  // ── Smooth Scroll ─────────────────────────────────────────
  initSmoothScroll();
}

// ══════════════════════════════════════════════════════════════
// INTRO OVERLAY
// ══════════════════════════════════════════════════════════════
function createIntroOverlay() {
  const div = document.createElement('div');
  div.id = 'intro-overlay';
  div.innerHTML = `
    <div class="intro-logo">NR</div>
    <div class="intro-line"></div>
  `;
  document.body.appendChild(div);
  return div;
}

function animateIntro(overlay) {
  const tl = gsap.timeline();
  tl.from('.intro-logo', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' })
    .to('.intro-line', { width: '120px', duration: 0.6, ease: 'power2.out' }, '-=0.3')
    .to(overlay, {
      opacity: 0,
      duration: 0.7,
      ease: 'power2.inOut',
      delay: 0.4,
      onComplete: () => { overlay.remove(); animateHeroEntrance(); }
    });
}

function animateHeroEntrance() {
  gsap.from('#rolodex-container', {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(20px)',
    duration: 1.2,
    ease: 'power3.out',
    delay: 0.1
  });
  gsap.from('#hero-scroll-hint', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    delay: 1.0,
    ease: 'power2.out'
  });
  gsap.from('#navbar', {
    opacity: 0,
    y: -20,
    duration: 0.8,
    delay: 0.5,
    ease: 'power2.out'
  });
}

// ══════════════════════════════════════════════════════════════
// CURSOR
// ══════════════════════════════════════════════════════════════
function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.set(cursor, { x: mouseX, y: mouseY });
  });

  function animateFollower() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    gsap.set(follower, { x: followerX, y: followerY });
    requestAnimationFrame(animateFollower);
  }
  animateFollower();
}

// ══════════════════════════════════════════════════════════════
// ROLODEX — 3D Card Stack with Mouse Parallax + Scroll Rotation
// ══════════════════════════════════════════════════════════════
function initRolodex() {
  const cards = document.querySelectorAll('.rolo-card');
  if (!cards.length) return;

  // Stack cards
  cards.forEach((card, i) => {
    gsap.set(card, {
      rotateX: i * 30,
      z: -i * 120,
      opacity: i === 0 ? 1 : 0.6 - i * 0.15,
      transformOrigin: 'center center'
    });
  });

  // Mouse parallax tilt
  let tiltX = 0, tiltY = 0;
  document.addEventListener('mousemove', (e) => {
    tiltX = (e.clientY / window.innerHeight - 0.5) * 12;
    tiltY = -(e.clientX / window.innerWidth - 0.5) * 12;
  });

  let raf;
  const rolodex = document.getElementById('rolodex');
  let baseRotX = 0;

  function updateTilt() {
    raf = requestAnimationFrame(updateTilt);
    const currentX = gsap.getProperty(rolodex, 'rotateX');
    const currentY = gsap.getProperty(rolodex, 'rotateY');
    gsap.set(rolodex, {
      rotateX: baseRotX + tiltX * 0.3,
      rotateY: tiltY * 0.3,
    });
  }
  updateTilt();

  // Scroll-tied rotation
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5,
    onUpdate: (self) => {
      const progress = self.progress;
      baseRotX = progress * -90;

      cards.forEach((card, i) => {
        const offset = i * 30;
        const rot = progress * -90 + offset;
        const opacity = Math.max(0, 1 - Math.abs(rot) / 60) * (1 - i * 0.15);
        gsap.set(card, { rotateX: rot, opacity });
      });
    }
  });

  // Hero exit
  gsap.to('#hero-scroll-hint', {
    opacity: 0, y: -20,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '20% top',
      scrub: true
    }
  });
}

// ══════════════════════════════════════════════════════════════
// MUSEUM (PROJECTS) — Z-axis camera journey
// ══════════════════════════════════════════════════════════════
function initMuseum() {
  const panels = gsap.utils.toArray('.museum-panel');
  const track = document.getElementById('museum-track');
  if (!panels.length || !track) return;

  // Add ambient dust particles
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'depth-particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particleDrift ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate;
      opacity: ${Math.random() * 0.5};
    `;
    track.appendChild(p);
  }

  // Inject particle drift keyframes
  if (!document.getElementById('particle-anim')) {
    const style = document.createElement('style');
    style.id = 'particle-anim';
    style.textContent = `
      @keyframes particleDrift {
        from { transform: translate(0,0) scale(1); }
        to { transform: translate(${Math.random() > 0.5 ? '' : '-'}${10 + Math.random()*20}px, ${Math.random() > 0.5 ? '' : '-'}${5+Math.random()*15}px) scale(${0.5+Math.random()}); }
      }
    `;
    document.head.appendChild(style);
  }

  // Set initial Z positions
  panels.forEach((panel, i) => {
    gsap.set(panel, {
      z: i * -600,
      opacity: i === 0 ? 1 : 0,
      scale: 1 - i * 0.05,
    });
  });

  const progressBar = document.getElementById('museum-progress-bar');
  const totalScroll = panels.length;

  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top top',
    end: `+=${panels.length * 100}%`,
    scrub: 1.5,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const prog = self.progress;
      const panelIndex = prog * (panels.length - 1);

      panels.forEach((panel, i) => {
        const dist = panelIndex - i;
        const z = dist * 600;
        const opacity = Math.max(0, 1 - Math.abs(dist) * 1.5);
        const scale = Math.max(0.7, 1 - Math.abs(dist) * 0.1);

        gsap.set(panel, { z, opacity, scale });
      });

      if (progressBar) {
        progressBar.style.height = `${prog * 100}%`;
      }
    }
  });

  // Hover lighting on panels
  panels.forEach((panel) => {
    panel.addEventListener('mousemove', (e) => {
      const rect = panel.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(panel.querySelector('.panel-inner'), {
        rotateY: x * 8,
        rotateX: -y * 5,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800
      });
    });
    panel.addEventListener('mouseleave', () => {
      gsap.to(panel.querySelector('.panel-inner'), {
        rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power2.out'
      });
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SKILLS — Horizontal scroll driven by vertical scroll
// ══════════════════════════════════════════════════════════════
function initSkillsScroll() {
  const track = document.getElementById('skills-track');
  const ribbon = track?.querySelector('.skills-ribbon');
  if (!ribbon) return;

  const ribbonWidth = ribbon.scrollWidth / 2; // half since we doubled content

  ScrollTrigger.create({
    trigger: '#skills',
    start: 'top top',
    end: `+=${ribbonWidth}`,
    scrub: 0.8,
    pin: '#skills-track-wrapper',
    anticipatePin: 1,
    onUpdate: (self) => {
      const x = -self.progress * ribbonWidth;
      gsap.set(track, { x });
    }
  });

  // Auto-highlight skill on scroll area center
  const skillItems = document.querySelectorAll('.skill-item');
  ScrollTrigger.create({
    trigger: '#skills',
    start: 'top top',
    end: `+=${ribbonWidth}`,
    scrub: true,
    onUpdate: (self) => {
      const prog = self.progress;
      const idx = Math.floor(prog * skillItems.length);
      skillItems.forEach((item, i) => {
        const dist = Math.abs(i - idx);
        gsap.to(item, {
          opacity: dist === 0 ? 1 : dist < 3 ? 0.6 : 0.25,
          duration: 0.3,
          ease: 'power1.out',
          overwrite: 'auto'
        });
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════
// ABOUT TICKER — Continuous horizontal flow
// ══════════════════════════════════════════════════════════════
function initAboutTicker() {
  const ribbon = document.getElementById('ticker-ribbon');
  if (!ribbon) return;

  let baseSpeed = 0.5; // px per frame
  let currentX = 0;
  let scrollVel = 0;
  const halfWidth = ribbon.scrollWidth / 2;
  let raf;

  function animateTicker() {
    raf = requestAnimationFrame(animateTicker);
    scrollVel *= 0.95;
    currentX -= baseSpeed + scrollVel;
    if (Math.abs(currentX) >= halfWidth) currentX = 0;
    gsap.set(ribbon, { x: currentX });
  }
  animateTicker();

  // Scroll affects speed
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScrollY;
    scrollVel += dy * 0.08;
    lastScrollY = window.scrollY;
  }, { passive: true });

  // Pause when not visible
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { if (!raf) animateTicker(); }
    else { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.1 });
  observer.observe(document.getElementById('about'));
}

// ══════════════════════════════════════════════════════════════
// SECTION REVEAL ANIMATIONS
// ══════════════════════════════════════════════════════════════
function initReveal() {
  // About content
  gsap.from('#about-content', {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#about-content',
      start: 'top 80%',
    }
  });

  gsap.from('.stat', {
    opacity: 0,
    y: 30,
    duration: 0.7,
    stagger: 0.15,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: '.about-stats',
      start: 'top 85%',
    }
  });

  // Contact
  gsap.from('.contact-headline', {
    opacity: 0,
    y: 80,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 70%',
    }
  });
  gsap.from('.contact-email, .contact-links', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 65%',
    }
  });

  // Skills header
  gsap.from('.skills-header .section-title, .skills-header .section-eyebrow', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#skills',
      start: 'top 80%',
    }
  });
}

// ══════════════════════════════════════════════════════════════
// SMOOTH SCROLL — GSAP-based lerped scroll
// ══════════════════════════════════════════════════════════════
function initSmoothScroll() {
  // Nav links smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 0 },
        duration: 1.2,
        ease: 'power3.inOut'
      });
    });
  });

  // Register scrollTo plugin if available
  if (typeof ScrollToPlugin !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin);
  } else {
    // Fallback nav click
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
}
