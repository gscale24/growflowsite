// Hero background video: sits above the page-wide WebGL/canvas2D shader
// (see hero-shader.js) and the vignette overlay, but behind the hero's
// text content, scoped to the hero section only.
(function () {
  // Same montage footage used for the showreel section further down the
  // page — the loop cut at the seam is intentionally left as-is here (fast
  // scene-cut edits are part of the Kookie Kollective look this is going
  // for), so there's no crossfade masking to keep in sync with a second
  // usage of the same file.
  var HERO_VIDEO_URL = 'assets/videos/showreel.mp4';
  var HERO_POSTER_URL = 'assets/videos/showreel-poster.jpg';

  if (!HERO_VIDEO_URL) return;

  var stage = document.querySelector('.hero__stage');
  if (!stage) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 720px)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  // On a mobile + data-saver connection, don't fetch any video bytes at
  // all — just show the poster frame as a static image in the same slot.
  // Same treatment for reduced-motion, since this is purely decorative.
  if ((isMobile && saveData) || reduceMotion) {
    if (!HERO_POSTER_URL) return;
    var img = document.createElement('img');
    img.className = 'hero__video';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.addEventListener('load', function () {
      img.classList.add('is-ready');
    }, { once: true });
    img.src = HERO_POSTER_URL;
    stage.insertBefore(img, stage.firstChild);
    return;
  }

  var video = document.createElement('video');
  video.className = 'hero__video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  if (HERO_POSTER_URL) video.poster = HERO_POSTER_URL;

  // WebM/VP9 first (smaller at equal quality, and what most non-Safari
  // browsers prefer) with the MP4/H.264 constant above as the universal
  // fallback — same base name, sibling file, so swapping HERO_VIDEO_URL
  // to new footage still works with just that one line as long as a
  // same-named .webm sits next to it (falls straight through to the mp4
  // <source> if it doesn't).
  var webmUrl = HERO_VIDEO_URL.replace(/\.mp4$/i, '.webm');
  if (webmUrl !== HERO_VIDEO_URL) {
    var webmSource = document.createElement('source');
    webmSource.src = webmUrl;
    webmSource.type = 'video/webm';
    video.appendChild(webmSource);
  }
  var mp4Source = document.createElement('source');
  mp4Source.src = HERO_VIDEO_URL;
  mp4Source.type = 'video/mp4';
  video.appendChild(mp4Source);

  // Fades in only once it can actually play, so there's no hard pop-in
  // while it's still buffering — the poster (or the shader behind it)
  // shows in the meantime.
  video.addEventListener('canplay', function () {
    video.classList.add('is-ready');
  }, { once: true });

  stage.insertBefore(video, stage.firstChild);

  // Called explicitly rather than relying on the autoplay attribute alone,
  // since autoplay support/behavior is inconsistent across browsers.
  video.play().catch(function () {});
})();
