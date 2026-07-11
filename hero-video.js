// Hero background video: an optional layer that sits above the page-wide
// WebGL/canvas2D shader (see hero-shader.js) but behind the hero's text
// content, scoped to the hero section only. Nothing is created and the
// shader shows through exactly as before if no URL is configured below —
// this is pure additive infrastructure for when real footage exists.
(function () {
  // TODO: вставить ссылку на сгенерированное видео сюда
  var HERO_VIDEO_URL = '';
  // TODO: вставить ссылку на постер (кадр-заглушку на время загрузки) сюда
  var HERO_POSTER_URL = '';

  if (!HERO_VIDEO_URL) return;

  var sticky = document.querySelector('.hero__sticky');
  if (!sticky) return;

  var video = document.createElement('video');
  video.className = 'hero__video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  if (HERO_POSTER_URL) video.poster = HERO_POSTER_URL;
  video.src = HERO_VIDEO_URL;

  // Fades in only once it can actually play, so there's no hard pop-in
  // while it's still buffering — the poster (or the shader behind it)
  // shows in the meantime.
  video.addEventListener('canplay', function () {
    video.classList.add('is-ready');
  }, { once: true });

  sticky.insertBefore(video, sticky.firstChild);

  // Called explicitly rather than relying on the autoplay attribute alone,
  // since autoplay support/behavior is inconsistent across browsers.
  video.play().catch(function () {});
})();
