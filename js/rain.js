// ===== MATRIX DIGITAL RAIN =====

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

let canvas, ctx;
let columns = [];
let fontSize = 14;
let speedMultiplier = 1;
let animFrameId = null;
let paused = false;

let resizeTimer = null;

function debouncedResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 200);
}

export function initRain() {
  canvas = document.getElementById('rain-canvas');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', debouncedResize);
  start();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const numCols = Math.floor(canvas.width / fontSize);
  // Preserve existing column positions, add new ones if needed
  while (columns.length < numCols) {
    columns.push(Math.random() * canvas.height / fontSize | 0);
  }
  columns.length = numCols;
}

function draw() {
  // Semi-transparent black overlay creates trail effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < columns.length; i++) {
    const char = CHARS[Math.random() * CHARS.length | 0];
    const x = i * fontSize;
    const y = columns[i] * fontSize;

    // Leading character is bright white-green
    if (Math.random() < 0.1) {
      ctx.fillStyle = '#FFFFFF';
    } else {
      ctx.fillStyle = '#00FF41';
    }

    ctx.fillText(char, x, y);

    // Dim glow for depth
    if (Math.random() < 0.02) {
      ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
      ctx.fillText(char, x, y);
    }

    // Reset column when it goes off screen (with randomness)
    if (y > canvas.height && Math.random() > 0.975) {
      columns[i] = 0;
    }
    columns[i] += speedMultiplier;
  }
}

function loop() {
  if (!paused) {
    draw();
  }
  animFrameId = requestAnimationFrame(loop);
}

export function start() {
  if (!animFrameId) {
    loop();
  }
}

export function stop() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

export function setSpeed(mult) {
  speedMultiplier = mult;
}

export function pause() {
  paused = true;
}

export function resume() {
  paused = false;
}

export function intensify(duration = 3000) {
  const origSpeed = speedMultiplier;
  speedMultiplier = 3;
  document.body.classList.add('rain-intensify');
  setTimeout(() => {
    speedMultiplier = origSpeed;
    document.body.classList.remove('rain-intensify');
  }, duration);
}

export function redMode(duration = 5000) {
  document.body.classList.add('rain-red');
  setTimeout(() => {
    document.body.classList.remove('rain-red');
  }, duration);
}
