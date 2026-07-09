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
  // CSS :hover already drives the glass-card highlight; this only reinforces
  // it for pointers that land on a card without generating a move event
  // (e.g. a card appearing/scrolling under an already-stationary cursor).
  var hoverTargets = document.querySelectorAll('.card, .case, .testimonial');
  hoverTargets.forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      el.classList.add('is-hover');
    });
    el.addEventListener('mouseleave', function () {
      el.classList.remove('is-hover');
    });
  });
})();

(function () {
  var stats = document.querySelector('.stats');
  if (!stats) return;

  var LIMIT = 40;
  var startX = 0;
  var startY = 0;
  var originX = 0;
  var originY = 0;
  var dragging = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setTransform(x, y) {
    stats.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  }

  function pointerPos(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onDragStart(e) {
    dragging = true;
    stats.classList.add('is-dragging');
    var pos = pointerPos(e);
    startX = pos.x;
    startY = pos.y;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    var pos = pointerPos(e);
    originX = clamp(pos.x - startX, -LIMIT, LIMIT);
    originY = clamp(pos.y - startY, -LIMIT, LIMIT);
    setTransform(originX, originY);
  }

  function onDragEnd() {
    dragging = false;
    stats.classList.remove('is-dragging');
    setTransform(0, 0);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
  }

  stats.addEventListener('mousedown', onDragStart);
  stats.addEventListener('touchstart', onDragStart, { passive: true });
})();
