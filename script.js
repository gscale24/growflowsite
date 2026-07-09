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
  var hero = document.getElementById('hero');
  var canvas = document.getElementById('hero-canvas');
  if (!hero || !canvas || !canvas.getContext) return;

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

  // Scroll progress across the hero's own height (0 at top, 1 once scrolled past it).
  var targetProgress = 0;
  var currentProgress = 0;

  function updateTargetProgress() {
    if (isMobile) return;
    var rect = hero.getBoundingClientRect();
    var height = hero.offsetHeight || 1;
    targetProgress = Math.max(0, Math.min(1, -rect.top / height));
  }

  window.addEventListener('scroll', updateTargetProgress, { passive: true });
  updateTargetProgress();

  // Cursor parallax: mouse position within the hero, smoothed independently of scroll.
  var targetMouseX = 0.5;
  var targetMouseY = 0.5;
  var mouseX = 0.5;
  var mouseY = 0.5;

  if (!isMobile) {
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / rect.width;
      targetMouseY = (e.clientY - rect.top) / rect.height;
    });

    hero.addEventListener('mouseleave', function () {
      targetMouseX = 0.5;
      targetMouseY = 0.5;
    });
  }

  var visible = true;
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    });
    observer.observe(hero);
  }

  // Per-blob cursor-parallax strength: closer "layer" reacts more, farther one less.
  var PARALLAX = isMobile ? [0, 0, 0] : [0.05, 0.03, 0.02];

  function draw(progress, mx, my, t) {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    var cx = w / 2;
    var cy = h / 2;
    var offsetX = (mx - 0.5) * w;
    var offsetY = (my - 0.5) * h;

    var blobs = [
      {
        x: lerp(w * 0.62, cx - w * 0.06, progress) + Math.sin(t * 0.0006) * 18 + offsetX * PARALLAX[0],
        y: lerp(h * 0.1, cy, progress) + Math.cos(t * 0.0005) * 18 + offsetY * PARALLAX[0],
        r: lerp(w * 0.24, w * 0.17, progress),
        color: 'rgba(201, 122, 62, ' + (0.5 - progress * 0.15).toFixed(3) + ')'
      },
      {
        x: lerp(w * 0.85, cx + w * 0.07, progress) + Math.cos(t * 0.0007) * 22 + offsetX * PARALLAX[1],
        y: lerp(h * 0.55, cy + h * 0.05, progress) + Math.sin(t * 0.0006) * 22 + offsetY * PARALLAX[1],
        r: lerp(w * 0.19, w * 0.25, progress),
        color: 'rgba(79, 122, 74, ' + (0.45 + progress * 0.2).toFixed(3) + ')'
      }
    ];

    if (!isMobile) {
      blobs.push({
        x: lerp(w * 0.55, cx, progress) + Math.sin(t * 0.0004 + 2) * 14 + offsetX * PARALLAX[2],
        y: lerp(h * 0.85, cy + h * 0.14, progress) + Math.cos(t * 0.0004) * 14 + offsetY * PARALLAX[2],
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
      mouseX = lerp(mouseX, targetMouseX, 0.08);
      mouseY = lerp(mouseY, targetMouseY, 0.08);
      draw(currentProgress, mouseX, mouseY, t);
    }
    requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    draw(0.5, 0.5, 0.5, 0);
  } else {
    requestAnimationFrame(loop);
  }
})();
