(function () {
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
      });
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) {
        nav.classList.remove('is-open');
      }
    });

    window.addEventListener('scroll', function () {
      nav.classList.remove('is-open');
    }, { passive: true });
  }

  var modal = document.getElementById('modal');

  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      modal.classList.add('is-open');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', function () {
      modal.classList.remove('is-open');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      modal.classList.remove('is-open');
      if (nav) {
        nav.classList.remove('is-open');
      }
    }
  });

  function handleFormSubmit(formId, statusId) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = 'Спасибо! Заявка отправлена, мы скоро свяжемся с вами.';
      form.reset();
      setTimeout(function () {
        status.textContent = '';
      }, 5000);
    });
  }

  handleFormSubmit('contact-form', 'form-status');
  handleFormSubmit('modal-form', 'modal-form-status');
})();

(function () {
  // Reusable cursor-following glow for every glass card (services, cases,
  // testimonials, values). mouseenter/mousemove/mouseleave handle the direct
  // hover case; a rAF-throttled scroll listener re-checks the last known
  // cursor position via elementFromPoint so a card scrolling in under a
  // stationary cursor still lights up.
  var lastX = null;
  var lastY = null;
  var activeCard = null;

  function setGlowPosition(el, x, y) {
    var rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', (x - rect.left) + 'px');
    el.style.setProperty('--glow-y', (y - rect.top) + 'px');
  }

  document.querySelectorAll('.glow-card').forEach(function (el) {
    el.addEventListener('mouseenter', function (e) {
      setGlowPosition(el, e.clientX, e.clientY);
      el.classList.add('is-hover');
      activeCard = el;
    });
    el.addEventListener('mousemove', function (e) {
      setGlowPosition(el, e.clientX, e.clientY);
    });
    el.addEventListener('mouseleave', function () {
      el.classList.remove('is-hover');
      if (activeCard === el) activeCard = null;
    });
  });

  document.addEventListener('mousemove', function (e) {
    lastX = e.clientX;
    lastY = e.clientY;
  }, { passive: true });

  var scrollTicking = false;

  function checkCardUnderCursor() {
    if (lastX === null) return;
    var el = document.elementFromPoint(lastX, lastY);
    var card = el ? el.closest('.glow-card') : null;

    if (card !== activeCard) {
      if (activeCard) activeCard.classList.remove('is-hover');
      if (card) {
        setGlowPosition(card, lastX, lastY);
        card.classList.add('is-hover');
      }
      activeCard = card;
    } else if (card) {
      setGlowPosition(card, lastX, lastY);
    }
  }

  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      checkCardUnderCursor();
      scrollTicking = false;
    });
  }, { passive: true });
})();

(function () {
  var stage = document.getElementById('values-stage');
  var dotsContainer = document.getElementById('values-dots');
  var prevBtn = document.getElementById('values-prev');
  var nextBtn = document.getElementById('values-next');
  if (!stage || !dotsContainer) return;

  var cards = Array.prototype.slice.call(stage.querySelectorAll('.values__card'));
  var count = cards.length;
  if (!count) return;

  var dots = cards.map(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'values__dot';
    dot.setAttribute('aria-label', 'Перейти к ценности ' + (i + 1));
    dot.addEventListener('click', function () {
      goTo(i);
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  var activeIndex = 0;

  function mod(n) {
    return ((n % count) + count) % count;
  }

  function render() {
    var prevIndex = mod(activeIndex - 1);
    var nextIndex = mod(activeIndex + 1);

    cards.forEach(function (card, i) {
      card.classList.remove('is-active', 'is-prev', 'is-next');
      if (i === activeIndex) {
        card.classList.add('is-active');
      } else if (i === prevIndex) {
        card.classList.add('is-prev');
      } else if (i === nextIndex) {
        card.classList.add('is-next');
      }
    });

    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === activeIndex);
    });
  }

  function goTo(i) {
    activeIndex = mod(i);
    render();
  }

  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      if (i !== activeIndex) goTo(i);
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      goTo(activeIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      goTo(activeIndex + 1);
    });
  }

  // Touch swipe support (mobile), independent of the arrow/dot navigation.
  var touchStartX = null;

  stage.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  stage.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var deltaX = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) < 40) return;
    goTo(activeIndex + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  render();
})();

(function () {
  // Scroll-triggered "immersive reveal": cards/key blocks fall in from
  // above while fading in, once, the first time they enter the viewport.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  // .card/.case/.testimonial carry their reveal fall+fade baked directly
  // into their own base rule (see styles.css) instead of a wrapper div, so
  // grid-column spans (bento cases) and negative-margin overlaps (team
  // diagonal) still resolve against the real element, not a wrapper.
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll('.card, .case, .testimonial, .values, #contacts .form, #contacts .contacts__info')
  );

  // Stagger siblings that share the same parent container (grids of cards),
  // each one firing ~90ms after the previous within that group.
  var parentDelayCounters = new Map();
  var delays = new Map();
  revealEls.forEach(function (el) {
    var parent = el.parentElement;
    var count = parentDelayCounters.get(parent) || 0;
    parentDelayCounters.set(parent, count + 1);
    delays.set(el, count * 90);
  });

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      setTimeout(function () {
        el.classList.add('is-visible');
      }, delays.get(el) || 0);
      obs.unobserve(el);
    });
  }, { threshold: 0.15 });

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  // Count 0 -> target once a stat becomes visible; the "+" suffix stays in
  // the markup outside this span, so only the digits themselves animate.
  var counters = Array.prototype.slice.call(document.querySelectorAll('.stat__number-value[data-count-to]'));
  if (!counters.length || !('IntersectionObserver' in window)) return;

  var duration = 1800;

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    var start = performance.now();

    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(tick);
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  counters.forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  // Case video: set data-video="url.mp4" on a .case (see index.html) and
  // it plays (muted, loop) over the gradient placeholder — on hover for
  // pointer devices, or automatically while scrolled into view on
  // touch/mobile, since there's no hover there. Cases with no data-video
  // are untouched: same static placeholder as always.
  var isMobile = window.matchMedia('(max-width: 720px)').matches;

  document.querySelectorAll('.case').forEach(function (caseEl) {
    var videoUrl = caseEl.getAttribute('data-video');
    if (!videoUrl) return;

    var imageEl = caseEl.querySelector('.case__image');
    if (!imageEl) return;

    var video = document.createElement('video');
    video.className = 'case__video';
    video.src = videoUrl;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    imageEl.appendChild(video);

    function playVideo() {
      imageEl.classList.add('is-video-active');
      video.play().catch(function () {});
    }

    function stopVideo() {
      imageEl.classList.remove('is-video-active');
      video.pause();
      video.currentTime = 0;
    }

    if (isMobile) {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              playVideo();
            } else {
              stopVideo();
            }
          });
        }, { threshold: 0.5 });
        observer.observe(caseEl);
      }
    } else {
      caseEl.addEventListener('mouseenter', playVideo);
      caseEl.addEventListener('mouseleave', stopVideo);
    }
  });
})();

(function () {
  // Unified, page-wide parallax: one continuous requestAnimationFrame loop
  // computes every layer's offset together (not per-section observers,
  // and not gated behind the 'scroll' event), matching the "seamless page"
  // architecture. Every frame re-reads the current, absolute window.scrollY
  // and element positions — there is no lastScrollY/direction state and no
  // dependency on how often the browser dispatches 'scroll' — so the exact
  // same scrollY always produces the exact same transform whether the user
  // got there by scrolling down or back up. Layer 1 — the background
  // canvas — pans its own noise sampling internally in the shader (see
  // hero-shader.js) rather than being translated here, since a fixed,
  // viewport-sized element has nowhere to move to without revealing empty
  // edges. Layers 2 and 4 below use each element's own distance from the
  // viewport center, clamped, so the effect stays small and bounded
  // regardless of how far down the page the element sits.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var isMobile = window.matchMedia('(max-width: 720px)').matches;
  var lowPower = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  if (isMobile || lowPower) return;

  // Layer 2: decorative titles/dashes/numbers — slower than scroll (~0.55x).
  var layer2 = Array.prototype.slice.call(document.querySelectorAll('.section__title'));
  // Layer 4: small foreground accents — faster than scroll (~1.25x).
  var layer4 = Array.prototype.slice.call(document.querySelectorAll('.stat__number, .testimonial__quote-mark'));
  // Hero-only accent blobs: tied to raw scroll position (see below) because
  // they sit inside the sticky hero, whose own viewport position freezes
  // while pinned — a viewport-center-relative offset would go still there.
  var heroBlobs = Array.prototype.slice.call(document.querySelectorAll('.hero__blob'));
  if (!layer2.length && !layer4.length && !heroBlobs.length) return;

  var LAYER2_COEF = 0.045;
  var LAYER2_MAX = 14;
  var LAYER4_COEF = 0.09;
  var LAYER4_MAX = 26;
  var BLOB_COEF = 0.18;
  var MAX_BLOB_SHIFT = 90;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function applyLayer(els, coef, max) {
    var vh = window.innerHeight;
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var distance = vh / 2 - (rect.top + rect.height / 2);
      var offset = clamp(distance * coef, -max, max);
      el.style.transform = 'translateY(' + offset + 'px)';
    });
  }

  function update() {
    applyLayer(layer2, LAYER2_COEF, LAYER2_MAX);
    applyLayer(layer4, LAYER4_COEF, LAYER4_MAX);

    var blobShift = clamp(window.scrollY * BLOB_COEF, 0, MAX_BLOB_SHIFT);
    heroBlobs.forEach(function (blob) {
      blob.style.transform = 'translateY(' + blobShift + 'px)';
    });
  }

  function loop() {
    update();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

(function () {
  // Hero → Services sticky handoff: .hero is 150vh tall with a 100vh
  // sticky inner, so it stays pinned for 50vh of extra scroll while
  // #services (pulled up by margin-top: -50vh) slides over it from below.
  // Fading the pinned hero out over that same 50vh keeps the handoff a
  // graceful recede instead of the incoming content visually colliding
  // with hero text that's still at full opacity underneath it. Runs as a
  // continuous rAF loop reading absolute scrollY every frame (same
  // reasoning as the parallax loop above) so the fade is identical
  // whether scrolling down into it or back up out of it.
  var sticky = document.querySelector('.hero__sticky');
  if (!sticky) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function update() {
    var fadeDistance = window.innerHeight * 0.5;
    var t = Math.max(0, Math.min(1, window.scrollY / fadeDistance));
    sticky.style.opacity = String(1 - t);
  }

  function loop() {
    update();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
