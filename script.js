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
  // testimonials, values). Visibility is driven purely by mouseenter/
  // mouseleave (never by mousemove), and the glow position is seeded the
  // instant the pointer enters so it never waits for a first move to show up.
  // mousemove only updates the position of an already-visible glow.
  function setGlowPosition(el, e) {
    var rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', (e.clientX - rect.left) + 'px');
    el.style.setProperty('--glow-y', (e.clientY - rect.top) + 'px');
  }

  document.querySelectorAll('.glow-card').forEach(function (el) {
    el.addEventListener('mouseenter', function (e) {
      setGlowPosition(el, e);
      el.classList.add('is-hover');
    });
    el.addEventListener('mousemove', function (e) {
      setGlowPosition(el, e);
    });
    el.addEventListener('mouseleave', function () {
      el.classList.remove('is-hover');
    });
  });
})();

(function () {
  var viewport = document.getElementById('values-viewport');
  var dotsContainer = document.getElementById('values-dots');
  var prevBtn = document.getElementById('values-prev');
  var nextBtn = document.getElementById('values-next');
  if (!viewport || !dotsContainer) return;

  var cards = Array.prototype.slice.call(viewport.querySelectorAll('.values__card'));
  if (!cards.length) return;

  var dots = cards.map(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'values__dot';
    dot.setAttribute('aria-label', 'Перейти к ценности ' + (i + 1));
    dot.addEventListener('click', function () {
      goToIndex(i);
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  var activeIndex = 0;
  var ticking = false;

  function centeredScrollLeft(i) {
    var card = cards[i];
    return card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
  }

  function updateActive() {
    var viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    var closestIndex = 0;
    var closestDistance = Infinity;

    cards.forEach(function (card, i) {
      var cardCenter = card.offsetLeft + card.offsetWidth / 2;
      var distance = Math.abs(cardCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    activeIndex = closestIndex;
    cards.forEach(function (card, i) {
      card.classList.toggle('is-active', i === activeIndex);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === activeIndex);
    });
  }

  function goToIndex(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    viewport.scrollTo({ left: centeredScrollLeft(i), behavior: 'smooth' });
  }

  // Land on the first card centered from the start, without relying on
  // scroll-snap to have already settled there (and without scrollIntoView,
  // which could also drag the outer page's vertical scroll along with it).
  viewport.scrollLeft = centeredScrollLeft(0);

  viewport.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateActive();
      ticking = false;
    });
  }, { passive: true });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      goToIndex(activeIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      goToIndex(activeIndex + 1);
    });
  }

  window.addEventListener('resize', updateActive);
  updateActive();
})();
