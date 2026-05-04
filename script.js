// script.js — improved & well-documented
document.addEventListener('DOMContentLoaded', () => {
  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const preferReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- DOM elements (optional chaining + guards) ----------
  const menuBtn = $('#menu-btn');
  const navLinks = $('#nav-links');
  const themeToggle = $('#theme-toggle');
  const yearEl = $('#year');
  const navLinkEls = $$('.nav-link');
  const projectCards = $$('.project-card');
  const modal = $('#proj-modal');
  const modalTitle = $('#modal-title');
  const modalDesc = $('#modal-desc');
  const modalTech = $('#modal-tech');
  const modalClose = $('#modal-close');

  // ---------- Year (footer) ----------
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------- Mobile menu toggle ----------
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      navLinks.classList.toggle('open', !expanded);

      if (!expanded) {
        const firstLink = navLinks.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });
  }

  function closeMobileNav() {
    if (menuBtn && navLinks) {
      menuBtn.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }
  }

  // ---------- Smooth scroll for in-page anchors + mobile close ----------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href === '#0') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: preferReducedMotion ? 'auto' : 'smooth', block: 'start' });
        closeMobileNav();
      }
    });
  });

  // ---------- Highlight active nav link on scroll ----------
  (function initActiveNavObserver() {
    const sections = document.querySelectorAll('main section[id], header[id]');
    if (!sections.length || !navLinkEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        if (!id) return;
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinkEls.forEach(n => n.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
  })();

  // ---------- Theme toggle with persistence ----------
  (function initTheme() {
    if (!themeToggle) return;
    const THEME_KEY = 'site-theme';
    const stored = localStorage.getItem(THEME_KEY);
    const systemPrefLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = stored || (systemPrefLight ? 'light' : 'dark');

    function applyTheme(theme) {
      document.body.classList.toggle('light', theme === 'light');
      themeToggle.textContent = theme === 'light' ? '🌞' : '🌙';
    }

    applyTheme(initial);

    themeToggle.addEventListener('click', () => {
      const next = document.body.classList.contains('light') ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  })();

  // ---------- Project modal (open/close, focus trap, keyboard) ----------
  (function initModal() {
    if (!modal) return;
    let lastFocused = null;

    function openModal(fromCard, btn) {
  if (!modal) return;
  lastFocused = document.activeElement;

  modalTitle.textContent = fromCard.dataset.title || 'Project';
  modalDesc.textContent = fromCard.dataset.desc || '';
  modalTech.textContent = fromCard.dataset.tech || '';


  // ---- NEW IMAGE PREVIEW SUPPORT ----
  const modalMedia = document.getElementById('modal-media');
  if (modalMedia) {
     modalMedia.addEventListener('click', closeModal);
    const imgSrc = fromCard.dataset.img || '';
    if (imgSrc) {
      modalMedia.innerHTML = `<img src="${imgSrc}" alt="${fromCard.dataset.title} screenshot" loading="lazy">`;
      modalMedia.setAttribute('aria-hidden', 'false');
    } else {
      modalMedia.innerHTML = '';
      modalMedia.setAttribute('aria-hidden', 'true');
    }
  }

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (modalClose) modalClose.focus();
  document.addEventListener('keydown', onModalKey);
}


    function closeModal() {
      if (!modal) return;
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onModalKey);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function onModalKey(e) {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    projectCards.forEach(card => {
      const viewBtn = card.querySelector('.view-btn');

      card.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          openModal(card, viewBtn);
        }
      });

      if (viewBtn) {
        viewBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openModal(card, viewBtn);
        });
      } else {
        card.addEventListener('click', () => openModal(card, null));
      }
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  })();

  // ---------- Reveal-on-scroll (adds .reveal) ----------
  (function initReveal() {
    const revealEls = $$('.project-card, .skills-card, .about-text, .contact-info, .hero-card, .tool-chip');
    if (!revealEls.length) return;

    if (preferReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('reveal'));
      return;
    }

    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('reveal');
          obs.unobserve(ent.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach(el => ro.observe(el));
  })();

  // ---------- Count-Up Stats ----------
  (function initStats() {
    const container = $('#stats-container');
    const nums = $$('.stat-num');
    if (!container || !nums.length) return;

    if (preferReducedMotion || !('IntersectionObserver' in window)) {
      nums.forEach(n => n.textContent = n.dataset.target);
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        nums.forEach(num => {
          const target = parseFloat(num.dataset.target);
          const isFloat = num.dataset.target.includes('.');
          const duration = 2000;
          let startTimestamp = null;

          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = target * easeOut;
            num.textContent = isFloat ? current.toFixed(2) : Math.floor(current);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              num.textContent = num.dataset.target; // ensure exact ending string
            }
          };
          window.requestAnimationFrame(step);
        });
        obs.unobserve(container);
      }
    }, { threshold: 0.5 });
    obs.observe(container);
  })();

  // ---------- small defensive cleanup ----------
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) closeMobileNav();
  });
});
