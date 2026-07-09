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
