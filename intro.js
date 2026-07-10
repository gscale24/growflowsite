// Signature intro: the "GF" mark draws its stroke in, fills terracotta with
// a spring-eased pulse, then the whole overlay slides up to reveal the
// hero already rendered underneath. The "should this run at all" decision
// (prefers-reduced-motion, once-per-session via sessionStorage) is made by
// the inline script right after the overlay markup in index.html, so it
// can run before first paint — this file only runs the animation itself
// when window.__showIntro is true.
(function () {
  if (!window.__showIntro) return;

  var overlay = document.getElementById('intro');
  var logo = document.getElementById('intro-logo');
  var counterValue = document.getElementById('intro-counter-value');
  if (!overlay || !logo || !counterValue) return;

  var paths = Array.prototype.slice.call(overlay.querySelectorAll('.intro__logo-path'));

  var DRAW_MS = 1250;
  var PAUSE_MS = 200;
  var FILL_MS = 350;
  var EXIT_MS = 700;
  var SPECTACLE_MS = DRAW_MS + PAUSE_MS + FILL_MS;

  paths.forEach(function (path) {
    var length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
  });

  var finished = false;
  var timers = [];

  function clearTimers() {
    timers.forEach(function (id) {
      clearTimeout(id);
    });
    timers = [];
  }

  function startDraw() {
    // Force layout so the fully-undrawn state is committed before we
    // change it — otherwise the browser can coalesce both style writes
    // into one paint and skip the transition entirely.
    void overlay.offsetHeight;
    paths.forEach(function (path) {
      path.style.strokeDashoffset = '0';
    });
  }

  function startFill() {
    logo.classList.add('is-filled');
    logo.classList.add('is-pulsing');
  }

  function exit() {
    if (finished) return;
    finished = true;
    clearTimers();
    overlay.removeEventListener('click', exit);

    overlay.classList.add('is-leaving');
    var hide = function () {
      overlay.style.display = 'none';
    };
    overlay.addEventListener('transitionend', function onEnd(e) {
      if (e.propertyName !== 'transform') return;
      overlay.removeEventListener('transitionend', onEnd);
      hide();
    });
    // Safety net in case transitionend never fires (e.g. the tab was
    // backgrounded mid-transition).
    timers.push(setTimeout(hide, EXIT_MS + 250));
  }

  function animateCounter() {
    var start = performance.now();
    function tick(now) {
      if (finished) return;
      var t = Math.min(1, (now - start) / SPECTACLE_MS);
      var eased = 1 - Math.pow(1 - t, 3);
      var value = Math.round(eased * 100);
      counterValue.textContent = value < 10 ? '0' + value : String(value);
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  // Skip on click/tap anywhere on the overlay — jumps straight to exit
  // instead of waiting out the rest of the draw/fill/counter sequence.
  overlay.addEventListener('click', exit);

  animateCounter();
  timers.push(setTimeout(startDraw, 16));
  timers.push(setTimeout(startFill, DRAW_MS + PAUSE_MS));
  timers.push(setTimeout(exit, SPECTACLE_MS));
})();
