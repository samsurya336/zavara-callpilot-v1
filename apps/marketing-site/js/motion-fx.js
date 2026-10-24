/* CallPilot AI V2: Motion (motion.dev) enhancements. Loads after motion.min.js; every effect
   degrades gracefully when the library is missing or the visitor prefers reduced motion. */
(function () {
  'use strict';
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || !M.animate || reduce) return;
  document.documentElement.classList.add('motion');
  var spring = { type: 'spring', stiffness: 320, damping: 22 };

  /* Scroll progress bar in the header */
  var bar = document.querySelector('.scroll-progress');
  if (bar && M.scroll) M.scroll(M.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));

  /* Icon tiles pop in with a spring, staggered per section */
  if (M.inView) {
    document.querySelectorAll('.section, .hero').forEach(function (section) {
      var icons = section.querySelectorAll('.icon-tile .icon');
      if (!icons.length) return;
      M.inView(section, function () {
        M.animate(icons, { opacity: [0, 1], scale: [0.4, 1], rotate: [-18, 0] }, Object.assign({ delay: M.stagger(0.08) }, spring));
      }, { amount: 0.2 });
    });
  }

  /* Hero wave follows the pointer with a gentle parallax */
  var heroWrap = document.querySelector('.hero-wrap');
  var waveLayer = heroWrap && heroWrap.querySelector('.hero-bg .wave-lines');
  if (heroWrap && waveLayer) {
    heroWrap.addEventListener('pointermove', function (e) {
      var r = heroWrap.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      M.animate(waveLayer, { x: nx * 28, y: ny * 16 }, { type: 'spring', stiffness: 90, damping: 22 });
    }, { passive: true });
    heroWrap.addEventListener('pointerleave', function () { M.animate(waveLayer, { x: 0, y: 0 }, { type: 'spring', stiffness: 90, damping: 22 }); });
  }

  /* Orbit: nodes pop in with a spring */
  var orbit = document.querySelector('.orbit-svg');
  if (orbit && M.inView) {
    M.inView(orbit, function () {
      M.animate(orbit.querySelectorAll('.pop'), { opacity: [0, 1], scale: [0.6, 1] }, Object.assign({ delay: M.stagger(0.1) }, spring));
    }, { amount: 0.3 });
  }

  /* Travelling dot along the How-it-works track */
  var track = document.querySelector('.flow-track');
  var dot = track && track.querySelector('.flow-dot');
  if (dot && M.inView) {
    M.inView(track, function () {
      var run = M.animate(dot, { left: ['0%', '100%'] }, { duration: 5, ease: 'linear', repeat: Infinity });
      return function () { run.stop(); };
    });
  }

  /* Avatars: pupils follow the pointer, cards nod on hover */
  var pupils = Array.prototype.slice.call(document.querySelectorAll('.av-pupils'));
  if (pupils.length) {
    var raf = null, lastX = 0, lastY = 0;
    document.addEventListener('pointermove', function (e) {
      lastX = e.clientX; lastY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        pupils.forEach(function (p) {
          var r = p.getBoundingClientRect();
          if (r.width === 0) return;
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          var dx = lastX - cx, dy = lastY - cy;
          var dist = Math.max(1, Math.hypot(dx, dy));
          var k = Math.min(1, dist / 240);
          M.animate(p, { x: (dx / dist) * 2.2 * k, y: (dy / dist) * 2.2 * k }, { type: 'spring', stiffness: 200, damping: 18 });
        });
      });
    }, { passive: true });
  }
  if (M.hover) {
    document.querySelectorAll('.persona').forEach(function (card) {
      var av = card.querySelector('.avatar-svg');
      if (!av) return;
      M.hover(card, function () {
        M.animate(av, { y: -4, rotate: -6 }, spring);
        return function () { M.animate(av, { y: 0, rotate: 0 }, spring); };
      });
    });
  }

  /* Buttons compress on press */
  if (M.press) {
    M.press('.btn, .icon-btn, .segmented button', function (el) {
      M.animate(el, { scale: 0.95 }, { duration: 0.12 });
      return function () { M.animate(el, { scale: 1 }, spring); };
    });
  }

  /* Time Machine branch diagram draws itself */
  var svg = document.querySelector('.tm-svg');
  if (svg) {
    var forks = svg.querySelectorAll('.tm-fork');
    var forkDots = svg.querySelectorAll('.tm-fork-dot');
    var label = svg.querySelector('.tm-label-branch');
    document.addEventListener('tm:branch', function (e) {
      var i = e.detail && e.detail.index ? e.detail.index : 0;
      forks.forEach(function (f, k) {
        if (k === i) M.animate(f, { pathLength: [0, 1] }, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] });
        else M.animate(f, { pathLength: 0 }, { duration: 0.25 });
      });
      forkDots.forEach(function (d, k) {
        if (k === i) M.animate(d, { scale: [0, 1] }, spring);
        else M.animate(d, { scale: 0 }, { duration: 0 });
      });
      if (label) M.animate(label, { opacity: 1 }, { duration: 0.4, delay: 0.5 });
      var branch = document.querySelector('.tm-branch.live');
      if (branch) M.animate(branch.children, { opacity: [0, 1], y: [10, 0] }, Object.assign({ delay: M.stagger(0.12) }, spring));
    });
    /* If the demo already played before this script loaded (slow CDN), draw the current branch now */
    var liveBranch = document.querySelector('.tm-branch.live');
    if (liveBranch) {
      var turnsNow = document.querySelectorAll('[data-time-machine] .tm-turn.you');
      var selIdx = Array.prototype.findIndex.call(turnsNow, function (t) { return t.classList.contains('selected'); });
      document.dispatchEvent(new CustomEvent('tm:branch', { detail: { index: selIdx < 0 ? 0 : selIdx } }));
    }
    document.addEventListener('tm:reset', function () {
      forks.forEach(function (f) { M.animate(f, { pathLength: 0 }, { duration: 0.4 }); });
      forkDots.forEach(function (d) { M.animate(d, { scale: 0 }, { duration: 0 }); });
      if (label) M.animate(label, { opacity: 0 }, { duration: 0.2 });
    });
  }

  /* Hero demo: new bubbles spring in */
  var transcript = document.querySelector('.demo-transcript');
  if (transcript && 'MutationObserver' in window) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (n.nodeType === 1 && n.classList.contains('bubble')) M.animate(n, { opacity: [0, 1], y: [10, 0], scale: [0.97, 1] }, spring);
        });
      });
    }).observe(transcript, { childList: true });
  }
})();
