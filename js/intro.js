// ===== INTRO MESSAGE =====

/**
 * Show the intro message modal before the first mission.
 * No TTS, no effects — just a narrative popup the player reads and confirms.
 * Resolves when the player clicks "Entrar na Matrix".
 */
export function playIntro() {
  return new Promise((resolve) => {
    const modal = document.getElementById('intro-modal');
    if (!modal) { resolve(); return; }

    modal.classList.remove('hidden');

    const btn = document.getElementById('intro-confirm');
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      resolve();
    }, { once: true });
  });
}
