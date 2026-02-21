// ===== SHARED AUDIO CONTEXT =====
// Single AudioContext shared by all audio modules (SFX, music, TTS).
// Handles mobile unlock: iOS Safari and Chrome Android require AudioContext
// to be resumed during a user gesture (touch/click). We set up listeners
// early so the first interaction unlocks audio for the entire session.

let audioContext = null;
let unlocked = false;

export function getSharedAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export function unlockAudioContext() {
  if (unlocked) return;

  const ctx = getSharedAudioContext();

  const unlock = () => {
    if (unlocked) return;

    ctx.resume().then(() => {
      // Play a silent buffer to fully warm up on iOS
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      if (ctx.state === 'running') {
        unlocked = true;
        document.removeEventListener('touchstart', unlock, true);
        document.removeEventListener('touchend', unlock, true);
        document.removeEventListener('click', unlock, true);
        document.removeEventListener('keydown', unlock, true);
      }
    });
  };

  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('touchend', unlock, true);
  document.addEventListener('click', unlock, true);
  document.addEventListener('keydown', unlock, true);

  // Try immediately in case already in a gesture context
  unlock();
}
