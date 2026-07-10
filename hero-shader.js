// Page background: WebGL fractal-noise "liquid" shader with a canvas2D
// fallback for browsers/devices without WebGL. Runs as one continuous,
// fixed full-viewport layer behind the entire page (not just the hero),
// so scrolling never "restarts" the background — see fix commits for the
// canvas2D blob implementation this replaced, and for the hero-only
// version this itself replaced.
(function () {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var isMobile = window.matchMedia('(max-width: 720px)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lowPower = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  var cheap = isMobile || lowPower;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Paused only when the tab itself isn't visible — the canvas is now a
  // permanent page background, not something that scrolls in/out of view.
  var visible = !document.hidden;
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
  });

  // Progress across the WHOLE page's scroll range (0 at top, 1 at the very
  // bottom), shared by both the WebGL and fallback paths and used to drift
  // the background's tone slightly darker toward the footer.
  var targetProgress = 0;
  // A small pan offset derived from raw scroll position — this is what
  // gives the fixed background layer its own slow "parallax" drift
  // (layer 1, ~0.2x scroll speed) without ever translating the element.
  var targetScrollPan = 0;

  function updateScrollState() {
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    targetProgress = Math.max(0, Math.min(1, window.scrollY / max));
    targetScrollPan = window.scrollY * 0.00035;
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false }) ||
      canvas.getContext('experimental-webgl', { antialias: false, alpha: false });
  } catch (e) {
    gl = null;
  }

  if (gl && runWebGL(gl)) {
    // WebGL path started successfully.
  } else {
    runFallback2D();
  }

  // ---------------------------------------------------------------------
  // WebGL noise-flow background
  // ---------------------------------------------------------------------
  function runWebGL(gl) {
    var VERT_SRC = [
      'attribute vec2 aPosition;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = aPosition * 0.5 + 0.5;',
      '  gl_Position = vec4(aPosition, 0.0, 1.0);',
      '}'
    ].join('\n');

    // 2D simplex noise (Ashima Arts webgl-noise, MIT-style license) plus a
    // small fractal Brownian motion wrapper with a uniform octave count so
    // it can be cheapened on lower-powered devices.
    var FRAG_SRC = [
      cheap ? 'precision mediump float;' : 'precision highp float;',
      'uniform vec2 uResolution;',
      'uniform float uTime;',
      'uniform vec2 uMouse;',
      'uniform float uMouseActive;',
      'uniform float uProgress;',
      'uniform float uScrollPan;',
      'uniform int uOctaves;',
      'varying vec2 vUv;',
      '',
      'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
      'vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
      'vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }',
      '',
      'float snoise(vec2 v) {',
      '  const vec4 C = vec4(0.211324865405187, 0.366025403784439,',
      '                      -0.577350269189626, 0.024390243902439);',
      '  vec2 i  = floor(v + dot(v, C.yy));',
      '  vec2 x0 = v - i + dot(i, C.xx);',
      '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
      '  vec4 x12 = x0.xyxy + C.xxzz;',
      '  x12.xy -= i1;',
      '  i = mod289(i);',
      '  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
      '  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);',
      '  m = m * m;',
      '  m = m * m;',
      '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
      '  vec3 h = abs(x) - 0.5;',
      '  vec3 ox = floor(x + 0.5);',
      '  vec3 a0 = x - ox;',
      '  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);',
      '  vec3 g;',
      '  g.x = a0.x * x0.x + h.x * x0.y;',
      '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
      '  return 130.0 * dot(m, g);',
      '}',
      '',
      'float fbm(vec2 p) {',
      '  float value = 0.0;',
      '  float amplitude = 0.55;',
      '  float frequency = 1.0;',
      '  for (int i = 0; i < 4; i++) {',
      '    if (i >= uOctaves) break;',
      '    value += amplitude * snoise(p * frequency);',
      '    frequency *= 2.02;',
      '    amplitude *= 0.55;',
      '  }',
      '  return value;',
      '}',
      '',
      'void main() {',
      '  vec2 uv = vUv;',
      '  float aspect = uResolution.x / uResolution.y;',
      '  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 3.2 + 0.5;',
      '',
      '  vec2 flow = vec2(uTime * 0.025, uTime * 0.018 + uScrollPan) * (1.0 + uProgress * 0.4);',
      '',
      '  vec2 uvAspect = (uv - uMouse) * vec2(aspect, 1.0);',
      '  float distToMouse = length(uvAspect);',
      '  float mouseFalloff = uMouseActive * smoothstep(0.4, 0.0, distToMouse);',
      '  vec2 mouseWarp = mouseFalloff * 0.5 * vec2(',
      '    sin(uTime * 0.6 + distToMouse * 8.0),',
      '    cos(uTime * 0.5 + distToMouse * 8.0)',
      '  );',
      '',
      '  vec2 samplePos = p + flow + mouseWarp;',
      '  float n = fbm(samplePos);',
      '  n = n * 0.5 + 0.5;',
      '',
      '  vec3 colorBase = vec3(0.0588, 0.1686, 0.1176);',
      '  vec3 colorMid  = vec3(0.1137, 0.2275, 0.1647);',
      '  vec3 colorHi   = vec3(0.7882, 0.4784, 0.2431);',
      '  vec3 colorDeep = vec3(0.0314, 0.0863, 0.0588);',
      '',
      '  vec3 color = mix(colorBase, colorMid, smoothstep(0.25, 0.65, n));',
      '',
      '  float hiMask = smoothstep(0.78, 0.94, n);',
      '  hiMask = clamp(hiMask + mouseFalloff * 0.12, 0.0, 1.0);',
      '  color = mix(color, colorHi, hiMask);',
      '',
      '  color = mix(color, colorMid, smoothstep(0.0, 0.5, uProgress) * 0.12);',
      '  color = mix(color, colorDeep, smoothstep(0.5, 1.0, uProgress) * 0.4);',
      '',
      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vertShader = compile(gl.VERTEX_SHADER, VERT_SRC);
    var fragShader = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vertShader || !fragShader) return false;

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

    gl.useProgram(program);

    var quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var uResolution = gl.getUniformLocation(program, 'uResolution');
    var uTime = gl.getUniformLocation(program, 'uTime');
    var uMouse = gl.getUniformLocation(program, 'uMouse');
    var uMouseActive = gl.getUniformLocation(program, 'uMouseActive');
    var uProgress = gl.getUniformLocation(program, 'uProgress');
    var uScrollPan = gl.getUniformLocation(program, 'uScrollPan');
    var uOctaves = gl.getUniformLocation(program, 'uOctaves');

    var dpr = Math.min(window.devicePixelRatio || 1, cheap ? 1.25 : 2);
    var octaves = cheap ? 2 : 4;

    function resize() {
      var w = Math.max(1, Math.round(window.innerWidth * dpr));
      var h = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    resize();
    window.addEventListener('resize', resize);

    var currentProgress = 0;
    var currentScrollPan = 0;
    var targetMouseX = 0.5;
    var targetMouseY = 0.5;
    var mouseX = 0.5;
    var mouseY = 0.5;
    var targetMouseActive = 0;
    var mouseActive = 0;

    if (!isMobile) {
      window.addEventListener('mousemove', function (e) {
        targetMouseX = e.clientX / window.innerWidth;
        targetMouseY = 1 - e.clientY / window.innerHeight;
        targetMouseActive = 1;
      });

      document.addEventListener('mouseleave', function () {
        targetMouseActive = 0;
      });
    }

    function draw(time, progress, pan, mx, my, active) {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uMouseActive, active);
      gl.uniform1f(uProgress, progress);
      gl.uniform1f(uScrollPan, pan);
      gl.uniform1i(uOctaves, octaves);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function render(t) {
      if (visible) {
        currentProgress = lerp(currentProgress, targetProgress, 0.06);
        currentScrollPan = lerp(currentScrollPan, targetScrollPan, 0.06);
        mouseX = lerp(mouseX, targetMouseX, 0.12);
        mouseY = lerp(mouseY, targetMouseY, 0.12);
        mouseActive = lerp(mouseActive, targetMouseActive, 0.1);
        draw(t * 0.001, currentProgress, currentScrollPan, mouseX, mouseY, mouseActive);
      }
      requestAnimationFrame(render);
    }

    if (reduceMotion) {
      draw(0, 0, 0, 0.5, 0.5, 0);
    } else {
      requestAnimationFrame(render);
    }

    return true;
  }

  // ---------------------------------------------------------------------
  // Canvas2D fallback (no WebGL available): same blob + cursor-spotlight
  // approach used before the shader, kept as a safety net.
  // ---------------------------------------------------------------------
  function runFallback2D() {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    var currentProgress = 0;
    var currentScrollPan = 0;
    var targetMouseX = 0.5;
    var targetMouseY = 0.5;
    var mouseX = 0.5;
    var mouseY = 0.5;
    var spotX = 0.5;
    var spotY = 0.5;
    var targetSpotOpacity = 0;
    var spotOpacity = 0;

    if (!isMobile) {
      window.addEventListener('mousemove', function (e) {
        targetMouseX = e.clientX / window.innerWidth;
        targetMouseY = e.clientY / window.innerHeight;
        targetSpotOpacity = 1;
      });

      document.addEventListener('mouseleave', function () {
        targetMouseX = 0.5;
        targetMouseY = 0.5;
        targetSpotOpacity = 0;
      });
    }

    var PARALLAX = isMobile ? [0, 0, 0] : [0.05, 0.03, 0.02];

    function draw(progress, pan, mx, my, sx, sy, spotAlpha, t) {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      var safeX = w * 0.5;
      var cx = w * 0.58;
      var cy = h / 2 + pan * h;
      var offsetX = (mx - 0.5) * w;
      var offsetY = (my - 0.5) * h;

      var blobs = [
        {
          x: lerp(w * 0.62, cx - w * 0.02, progress) + Math.sin(t * 0.0006) * 18 + offsetX * PARALLAX[0],
          y: lerp(h * 0.1, cy, progress) + Math.cos(t * 0.0005) * 18 + offsetY * PARALLAX[0],
          r: lerp(w * 0.24, w * 0.17, progress),
          color: 'rgba(201, 122, 62, ' + (0.5 - progress * 0.15).toFixed(3) + ')'
        },
        {
          x: lerp(w * 0.85, cx + w * 0.1, progress) + Math.cos(t * 0.0007) * 22 + offsetX * PARALLAX[1],
          y: lerp(h * 0.55, cy + h * 0.05, progress) + Math.sin(t * 0.0006) * 22 + offsetY * PARALLAX[1],
          r: lerp(w * 0.19, w * 0.25, progress),
          color: 'rgba(79, 122, 74, ' + (0.45 + progress * 0.2).toFixed(3) + ')'
        }
      ];

      if (!isMobile) {
        blobs.push({
          x: lerp(w * 0.68, cx + w * 0.02, progress) + Math.sin(t * 0.0004 + 2) * 14 + offsetX * PARALLAX[2],
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
        ctx.arc(Math.max(b.x, safeX), b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.filter = 'none';

      if (!isMobile && spotAlpha > 0.01) {
        ctx.filter = 'blur(45px)';
        ctx.beginPath();
        ctx.fillStyle = 'rgba(201, 122, 62, ' + (0.85 * spotAlpha).toFixed(3) + ')';
        ctx.arc(sx * w, sy * h, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
      }

      // Same darkening-toward-the-footer drift as the WebGL path's colorDeep
      // mix, done here as a flat overlay since canvas2D has no shader mix.
      var deepAlpha = Math.max(0, progress - 0.5) * 0.8;
      if (deepAlpha > 0.01) {
        ctx.fillStyle = 'rgba(4, 12, 8, ' + deepAlpha.toFixed(3) + ')';
        ctx.fillRect(0, 0, w, h);
      }
    }

    function loop(t) {
      if (visible) {
        var progress = targetProgress;
        if (isMobile) {
          progress = (Math.sin(t * 0.00025) + 1) / 2;
        }
        currentProgress = lerp(currentProgress, progress, 0.08);
        currentScrollPan = lerp(currentScrollPan, targetScrollPan, 0.08);
        mouseX = lerp(mouseX, targetMouseX, 0.08);
        mouseY = lerp(mouseY, targetMouseY, 0.08);
        spotX = lerp(spotX, targetMouseX, 0.18);
        spotY = lerp(spotY, targetMouseY, 0.18);
        spotOpacity = lerp(spotOpacity, targetSpotOpacity, 0.15);
        draw(currentProgress, currentScrollPan, mouseX, mouseY, spotX, spotY, spotOpacity, t);
      }
      requestAnimationFrame(loop);
    }

    if (reduceMotion) {
      draw(0.5, 0, 0.5, 0.5, 0.5, 0.5, 0, 0);
    } else {
      requestAnimationFrame(loop);
    }
  }
})();
