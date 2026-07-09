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
  var section = document.getElementById('scroll-canvas');
  var canvas = document.getElementById('scroll-canvas-el');
  if (!section || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var isMobile = window.matchMedia('(max-width: 720px)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  var targetProgress = 0;
  var currentProgress = 0;

  function updateTargetProgress() {
    if (isMobile) return;
    var rect = section.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) {
      targetProgress = 0;
      return;
    }
    targetProgress = Math.max(0, Math.min(1, -rect.top / total));
  }

  window.addEventListener('scroll', updateTargetProgress, { passive: true });
  updateTargetProgress();

  var visible = true;
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    });
    observer.observe(section);
  }

  function draw(progress, t) {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    var cx = w / 2;
    var cy = h / 2;

    var blobs = [
      {
        x: lerp(w * 0.24, cx - w * 0.06, progress) + Math.sin(t * 0.0006) * 18,
        y: lerp(h * 0.28, cy, progress) + Math.cos(t * 0.0005) * 18,
        r: lerp(w * 0.24, w * 0.17, progress),
        color: 'rgba(201, 122, 62, ' + (0.5 - progress * 0.15).toFixed(3) + ')'
      },
      {
        x: lerp(w * 0.78, cx + w * 0.07, progress) + Math.cos(t * 0.0007) * 22,
        y: lerp(h * 0.68, cy + h * 0.05, progress) + Math.sin(t * 0.0006) * 22,
        r: lerp(w * 0.19, w * 0.25, progress),
        color: 'rgba(79, 122, 74, ' + (0.45 + progress * 0.2).toFixed(3) + ')'
      }
    ];

    if (!isMobile) {
      blobs.push({
        x: lerp(w * 0.5, cx, progress) + Math.sin(t * 0.0004 + 2) * 14,
        y: lerp(h * 0.88, cy + h * 0.14, progress) + Math.cos(t * 0.0004) * 14,
        r: lerp(w * 0.13, w * 0.1, progress),
        color: 'rgba(201, 122, 62, ' + (0.3 + progress * 0.1).toFixed(3) + ')'
      });
    }

    ctx.filter = isMobile ? 'blur(40px)' : 'blur(60px)';
    blobs.forEach(function (b) {
      if (b.r <= 0) return;
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.filter = 'none';
  }

  function loop(t) {
    if (visible) {
      if (isMobile) {
        targetProgress = (Math.sin(t * 0.00025) + 1) / 2;
      }
      currentProgress = lerp(currentProgress, targetProgress, 0.08);
      draw(currentProgress, t);
    }
    requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    draw(0.5, 0);
  } else {
    requestAnimationFrame(loop);
  }
})();
