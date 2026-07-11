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

  // Layer 2 writes to a CSS variable rather than the transform property
  // directly, because .section__title also carries the velocity-based
  // skewY from the kinetic-typography IIFE below — both need to land in
  // the same transform without one overwriting the other (see the
  // combined `translateY(var(--parallax-y)) skewY(var(--skew-deg))` rule
  // in styles.css). Layer 4's targets have no competing transform, so
  // they can keep setting it directly.
  function applyLayer(els, coef, max, useVar) {
    var vh = window.innerHeight;
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var distance = vh / 2 - (rect.top + rect.height / 2);
      var offset = clamp(distance * coef, -max, max);
      if (useVar) {
        el.style.setProperty('--parallax-y', offset + 'px');
      } else {
        el.style.transform = 'translateY(' + offset + 'px)';
      }
    });
  }

  function update() {
    applyLayer(layer2, LAYER2_COEF, LAYER2_MAX, true);
    applyLayer(layer4, LAYER4_COEF, LAYER4_MAX, false);

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

(function () {
  // Kinetic typography: headings skew proportionally to scroll VELOCITY
  // (not position), as if resisting scroll inertia — fast flings tilt them
  // up to ~9deg, and easing off scroll lets a lerp settle it back to 0
  // (a lightweight stand-in for a real spring). Explicitly required to
  // run on mobile too (unlike the position-based parallax above), so
  // there's no isMobile/lowPower gate here — only reduced-motion.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = Array.prototype.slice.call(document.querySelectorAll('.hero__title, .section__title'));
  if (!targets.length) return;

  var SKEW_MAX = 9;
  var SKEW_SENSITIVITY = 3.2;
  var SPRING_RATE = 0.25;

  var lastScrollY = window.scrollY;
  var lastTime = performance.now();
  var currentSkew = 0;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function loop(now) {
    var dt = Math.max(1, now - lastTime);
    var velocity = (window.scrollY - lastScrollY) / dt;
    lastScrollY = window.scrollY;
    lastTime = now;

    var target = clamp(velocity * SKEW_SENSITIVITY, -SKEW_MAX, SKEW_MAX);
    currentSkew += (target - currentSkew) * SPRING_RATE;
    if (Math.abs(currentSkew) < 0.01) currentSkew = 0;

    var value = currentSkew.toFixed(2) + 'deg';
    targets.forEach(function (el) {
      el.style.setProperty('--skew-deg', value);
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

(function () {
  // Word-by-word stagger reveal for headings, plus a scale-punch for the
  // section number sitting inside them — one-shot, via IntersectionObserver,
  // same as the card reveal system. Runs on mobile too (cheap: just CSS
  // transitions/keyframes triggered by a class), only reduced-motion opts
  // out entirely.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  function splitWords(el) {
    var originalNodes = Array.prototype.slice.call(el.childNodes);
    var replacementNodes = [];
    var words = [];

    originalNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var parts = node.textContent.split(/(\s+)/);
        parts.forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            replacementNodes.push(document.createTextNode(part));
            return;
          }
          var span = document.createElement('span');
          span.className = 'split-word';
          span.textContent = part;
          replacementNodes.push(span);
          words.push(span);
        });
      } else {
        // Element nodes (e.g. the .accent span) are kept as one whole
        // stagger unit rather than split further — except .section__num,
        // which has its own bespoke punch animation and must keep its
        // resting opacity/color instead of inheriting .split-word's
        // opacity: 0 starting state.
        if (!node.classList.contains('section__num')) {
          node.classList.add('split-word');
          words.push(node);
        }
        replacementNodes.push(node);
      }
    });

    el.innerHTML = '';
    replacementNodes.forEach(function (node) {
      el.appendChild(node);
    });

    return words;
  }

  var headings = Array.prototype.slice.call(document.querySelectorAll('.hero__title, .section__title'));

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var heading = entry.target;
      var words = splitWords(heading);
      var numEl = heading.querySelector('.section__num');

      words.forEach(function (word, i) {
        setTimeout(function () {
          word.classList.add('is-visible');
        }, i * 40);
      });

      if (numEl) numEl.classList.add('is-visible');
      obs.unobserve(heading);
    });
  }, { threshold: 0.2 });

  headings.forEach(function (heading) {
    observer.observe(heading);
  });
})();

(function () {
  // Magnetic buttons: CTAs pull toward the cursor within ~90px, spring
  // back on release. Desktop/mouse only — meaningless on touch.
  var isMobile = window.matchMedia('(max-width: 720px)').matches;
  var noHover = window.matchMedia('(hover: none)').matches;
  if (isMobile || noHover) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var buttons = Array.prototype.slice.call(document.querySelectorAll('.cta'));
  if (!buttons.length) return;

  var RADIUS = 90;
  var MAX_PULL = 18;
  var mouseX = null;
  var mouseY = null;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function loop() {
    if (mouseX !== null) {
      buttons.forEach(function (btn) {
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = mouseX - cx;
        var dy = mouseY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          var pull = (1 - dist / RADIUS) * MAX_PULL;
          var tx = (dx / (dist || 1)) * pull;
          var ty = (dy / (dist || 1)) * pull;
          btn.style.transition = 'transform 0.1s ease-out';
          btn.style.transform = 'translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px)';
          btn.dataset.magnetActive = '1';
        } else if (btn.dataset.magnetActive) {
          delete btn.dataset.magnetActive;
          btn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
          btn.style.transform = 'translate(0px, 0px)';
          btn.addEventListener('transitionend', function onEnd() {
            btn.removeEventListener('transitionend', onEnd);
            // Only clear the inline styles (handing control back to the
            // normal :active press-scale rule) if the cursor hasn't
            // re-entered the magnetic radius while this was settling.
            if (!btn.dataset.magnetActive) {
              btn.style.transform = '';
              btn.style.transition = '';
            }
          });
        }
      });
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

(function () {
  // Custom aggressive cursor: a small dot that lerps toward the pointer
  // almost instantly, and punches up to a large mix-blend-mode: difference
  // circle over interactive elements. Desktop/mouse only — not created at
  // all on mobile/touch, rather than merely hidden.
  var isMobile = window.matchMedia('(max-width: 720px)').matches;
  var noHover = window.matchMedia('(hover: none)').matches;
  if (isMobile || noHover) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cursor = document.getElementById('cursor');
  if (!cursor) return;

  document.body.classList.add('has-custom-cursor');

  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var curX = mouseX;
  var curY = mouseY;
  var LERP = 0.28;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function loop() {
    curX += (mouseX - curX) * LERP;
    curY += (mouseY - curY) * LERP;
    cursor.style.transform = 'translate3d(' + curX.toFixed(1) + 'px, ' + curY.toFixed(1) + 'px, 0)';
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  var INTERACTIVE_SELECTOR = 'a, button, .card, .case, .testimonial, .values__card';

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(INTERACTIVE_SELECTOR)) {
      cursor.classList.add('is-hovering');
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (!e.target.closest(INTERACTIVE_SELECTOR)) return;
    var enteringInteractive = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(INTERACTIVE_SELECTOR);
    if (!enteringInteractive) {
      cursor.classList.remove('is-hovering');
    }
  });
})();
