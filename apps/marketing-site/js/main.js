/* CallPilot AI marketing site V2. Plain JavaScript, no dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle (light / dark, remembered per browser) ---------- */
  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('cp-theme', theme); } catch (e) { /* storage unavailable */ }
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.setAttribute('aria-pressed', currentTheme() === 'dark' ? 'true' : 'false');
    btn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    btn.addEventListener('click', function () { setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); });
  });

  /* ---------- Header: shadow on scroll, mobile drawer ---------- */
  var header = document.querySelector('.site-header');
  var menuBtn = document.querySelector('.menu-btn');
  var drawer = document.querySelector('.nav-drawer');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    var toTop = document.querySelector('.to-top');
    if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeDrawer() {
    document.body.classList.remove('nav-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () {
      var open = !document.body.classList.contains('nav-open');
      document.body.classList.toggle('nav-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', closeDrawer);
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Active navigation link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-desktop a[href^="#"]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---------- Live practice demo (hero) ---------- */
  var demo = document.querySelector('[data-demo]');
  if (demo) {
    var transcript = demo.querySelector('.demo-transcript');
    var coach = demo.querySelector('.demo-coach');
    var coachText = demo.querySelector('.demo-coach span');
    var timer = demo.querySelector('.demo-timer');
    var people = demo.querySelectorAll('.demo-people li');
    var scenes = [
      { who: 'cfo', them: 'At ₹18 lakh a year, I need to see payback within two quarters. Why should we move mid-year?',
        you: 'Fair question. Before price, may I ask what the current tool costs you in deals that slip each quarter?',
        hint: 'Good redirect. Quantify the slipped deals with the CFO before you return to annual pricing.' },
      { who: 'cto', them: 'We run on-prem for compliance. Where does our customer data actually sit?',
        you: 'Understood. Which data would need to stay within your own servers, and which can live in a managed region in India?',
        hint: 'Separate data residency from hosting model. Ask about their audit requirements next.' },
      { who: 'ceo', them: 'Our team is 40 people. Why would this matter to us now rather than next year?',
        you: 'Because the next ten hires will sell the way the first forty were trained. May I show what onboarding looks like today?',
        hint: 'Tie the timing to a hiring plan the CEO already owns, then ask for the onboarding timeline.' }
    ];
    var sceneIndex = 0, seconds = 8 * 60 + 42;

    function setSpeaker(who) {
      people.forEach(function (li) { li.classList.toggle('speaking', li.getAttribute('data-who') === who); });
    }
    function addBubble(cls, label, text, typed) {
      var p = document.createElement('p');
      p.className = 'bubble ' + cls;
      var small = document.createElement('small'); small.textContent = label; p.appendChild(small);
      var span = document.createElement('span'); p.appendChild(span);
      transcript.appendChild(p);
      while (transcript.children.length > 2) transcript.removeChild(transcript.firstChild);
      if (!typed) { span.textContent = text; return Promise.resolve(); }
      var caret = document.createElement('i'); caret.className = 'caret'; p.appendChild(caret);
      return new Promise(function (resolve) {
        var i = 0;
        (function tick() {
          span.textContent = text.slice(0, i++);
          if (i <= text.length) setTimeout(tick, 18); else { caret.remove(); resolve(); }
        })();
      });
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function runScene() {
      var s = scenes[sceneIndex % scenes.length];
      var label = { cfo: 'Rohan Desai, CFO', cto: 'Arjun Mehta, CTO', ceo: 'Priya Nair, CEO' }[s.who];
      transcript.innerHTML = '';
      coach.classList.add('hidden');
      setSpeaker(s.who);
      addBubble('bubble-them', label, s.them, true)
        .then(function () { return wait(500); })
        .then(function () { setSpeaker('you'); return addBubble('bubble-you', 'You', s.you, true); })
        .then(function () { return wait(400); })
        .then(function () { coachText.textContent = s.hint; coach.classList.remove('hidden'); setSpeaker(''); return wait(4200); })
        .then(function () { sceneIndex++; runScene(); });
    }
    if (reduceMotion) {
      var s0 = scenes[0];
      setSpeaker(s0.who);
      addBubble('bubble-them', 'Rohan Desai, CFO', s0.them, false);
      addBubble('bubble-you', 'You', s0.you, false);
      coachText.textContent = s0.hint;
    } else {
      runScene();
      setInterval(function () {
        seconds++;
        var m = Math.floor(seconds / 60), sec = seconds % 60;
        timer.textContent = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      }, 1000);
    }
  }

  /* ---------- Persona cards: tap to hear a sample question ---------- */
  document.querySelectorAll('.persona').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  /* ---------- Assist / Battle switch ---------- */
  var seg = document.querySelector('[data-modes]');
  if (seg) {
    var tabs = seg.querySelectorAll('[role="tab"]');
    var panels = document.querySelectorAll('.mode-panel');
    function selectMode(id) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('aria-controls') === id ? 'true' : 'false'); t.tabIndex = t.getAttribute('aria-controls') === id ? 0 : -1; });
      panels.forEach(function (p) { p.classList.toggle('active', p.id === id); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectMode(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          next.focus(); selectMode(next.getAttribute('aria-controls'));
        }
      });
    });
    if (!reduceMotion) {
      var autoSwap = setInterval(function () {
        var cur = Array.prototype.findIndex.call(tabs, function (t) { return t.getAttribute('aria-selected') === 'true'; });
        selectMode(tabs[(cur + 1) % tabs.length].getAttribute('aria-controls'));
      }, 6000);
      seg.addEventListener('click', function () { clearInterval(autoSwap); });
    }
  }

  /* ---------- Time Machine demo ---------- */
  var tm = document.querySelector('[data-time-machine]');
  if (tm) {
    var branch = tm.querySelector('.tm-branch');
    var turns = tm.querySelectorAll('.tm-turn.you');
    var resetBtn = tm.querySelector('[data-tm-reset]');
    var status = tm.querySelector('[data-tm-status]');
    tm.querySelectorAll('[data-branch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var turn = btn.closest('.tm-turn');
        var alt = btn.getAttribute('data-alt');
        var reply = btn.getAttribute('data-reply');
        var outcome = btn.getAttribute('data-outcome');
        turns.forEach(function (t) { t.classList.toggle('selected', t === turn); });
        branch.classList.remove('live');
        void branch.offsetWidth; /* restart the CSS entrance animation */
        branch.classList.add('live');
        branch.innerHTML =
          '<p class="tm-turn you"><small>You, in the new branch</small>' + alt + '</p>' +
          '<p class="tm-turn"><small>' + btn.getAttribute('data-who') + '</small>' + reply + '</p>' +
          '<p class="tm-outcome"><strong>Simulated outcome in this branch</strong>' + outcome + '</p>';
        if (status) status.textContent = 'Branch created from ' + turn.getAttribute('data-label') + '. The original call on the left is unchanged.';
        if (resetBtn) resetBtn.hidden = false;
        if (window.innerWidth < 1024) branch.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
        document.dispatchEvent(new CustomEvent('tm:branch', { detail: { index: Array.prototype.indexOf.call(turns, turn) } }));
      });
    });
    /* Play the demo automatically the first time the section comes into view */
    var autoPlayed = false;
    tm.addEventListener('click', function () { autoPlayed = true; }, true);
    function autoPlay() {
      if (autoPlayed) return;
      autoPlayed = true;
      var first = tm.querySelector('[data-branch]');
      if (first) setTimeout(function () { first.click(); }, 700);
    }
    if ('IntersectionObserver' in window) {
      var tmIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { autoPlay(); tmIo.disconnect(); } });
      }, { threshold: 0.45 });
      tmIo.observe(tm);
    } else {
      autoPlay();
    }
    if (location.hash === '#time-machine') setTimeout(autoPlay, 900);
    if (resetBtn) resetBtn.addEventListener('click', function () {
      turns.forEach(function (t) { t.classList.remove('selected'); });
      branch.classList.remove('live');
      branch.innerHTML = '<span>Choose one of your answers on the left and press <strong>Try a different answer</strong>.</span>';
      if (status) status.textContent = 'No branch yet. The original call is complete and saved.';
      resetBtn.hidden = true;
      document.dispatchEvent(new CustomEvent('tm:reset'));
    });
  }

  /* ---------- FAQ accordion with height animation ---------- */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.faq-body');
    if (!summary || !body) return;
    summary.addEventListener('click', function (e) {
      if (reduceMotion) return; /* native behaviour */
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.style.height = h + 'px';
        requestAnimationFrame(function () { body.style.transition = 'height 280ms cubic-bezier(0.2,0.8,0.2,1)'; body.style.height = '0px'; });
        body.addEventListener('transitionend', function done() { body.removeEventListener('transitionend', done); d.open = false; body.style.height = ''; body.style.transition = ''; });
      } else {
        d.open = true;
        var target = body.offsetHeight;
        body.style.height = '0px';
        requestAnimationFrame(function () { body.style.transition = 'height 280ms cubic-bezier(0.2,0.8,0.2,1)'; body.style.height = target + 'px'; });
        body.addEventListener('transitionend', function done() { body.removeEventListener('transitionend', done); body.style.height = ''; body.style.transition = ''; });
      }
    });
  });

  /* ---------- Back to top ---------- */
  var toTop = document.querySelector('.to-top');
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
})();
