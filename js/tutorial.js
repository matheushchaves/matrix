// ===== INTERACTIVE TUTORIAL =====

const STEPS = [
  {
    target: '#terminal-panel',
    text: 'Este e o <strong>Terminal</strong>. Aqui voce recebe instrucoes dos personagens e acompanha o progresso da missao.',
    position: 'right',
  },
  {
    target: '#terminal-input-area',
    text: 'Use esta <strong>linha de comando</strong> para conversar com os personagens, pedir dicas, ou digitar comandos como <code>help</code>, <code>status</code>, e <code>clear</code>.',
    position: 'top',
  },
  {
    target: '#editor-panel',
    text: 'Este e o <strong>Editor de Codigo</strong>. Escreva seu codigo JavaScript aqui para completar as missoes.',
    position: 'left',
  },
  {
    target: '#btn-run',
    text: 'Clique em <strong>EXECUTAR</strong> ou pressione <kbd>Ctrl+Enter</kbd> para rodar seu codigo. A IA avaliara sua solucao.',
    position: 'bottom',
  },
  {
    target: '#api-reference',
    text: 'Aqui ficam as <strong>APIs da Matrix</strong>. Novas APIs sao desbloqueadas conforme voce avanca nas missoes.',
    position: 'left',
  },
  {
    target: '#mission-bar',
    text: 'A <strong>barra de missao</strong> mostra o objetivo atual. Fique atento as instrucoes!',
    position: 'top',
  },
  {
    target: '#editor-container',
    text: 'Mini-desafio! Escreva <code>return "hello"</code> no editor e clique EXECUTAR para testar.',
    position: 'left',
    challenge: true,
  },
];

let currentStep = 0;
let resolvePromise = null;

export function runTutorial() {
  return new Promise((resolve) => {
    resolvePromise = resolve;
    currentStep = 0;

    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) { resolve(); return; }

    overlay.classList.remove('hidden');
    overlay.classList.add('active');

    // Button handlers
    document.getElementById('tutorial-next')?.addEventListener('click', nextStep);
    document.getElementById('tutorial-skip')?.addEventListener('click', endTutorial);

    showStep(currentStep);
  });
}

function showStep(index) {
  if (index >= STEPS.length) {
    endTutorial();
    return;
  }

  const step = STEPS[index];
  const target = document.querySelector(step.target);
  if (!target) {
    currentStep++;
    showStep(currentStep);
    return;
  }

  // Remove previous highlights
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight');
  });

  // Highlight target
  target.classList.add('tutorial-highlight');

  // On mobile, auto-scroll to editor panel if target is inside it
  if (window.innerWidth <= 768) {
    const mainContent = document.getElementById('main-content');
    const editorPanel = document.getElementById('editor-panel');
    if (mainContent && editorPanel && editorPanel.contains(target)) {
      mainContent.scrollTo({ left: mainContent.offsetWidth, behavior: 'smooth' });
    } else if (mainContent) {
      mainContent.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }

  // Position spotlight
  const rect = target.getBoundingClientRect();
  const spotlight = document.getElementById('tutorial-spotlight');
  if (spotlight) {
    spotlight.style.top = `${rect.top - 6}px`;
    spotlight.style.left = `${rect.left - 6}px`;
    spotlight.style.width = `${rect.width + 12}px`;
    spotlight.style.height = `${rect.height + 12}px`;
    spotlight.style.borderRadius = '4px';
  }

  // Update tooltip text
  const stepIndicator = document.getElementById('tutorial-step-indicator');
  const textEl = document.getElementById('tutorial-text');
  if (stepIndicator) stepIndicator.textContent = `Passo ${index + 1} de ${STEPS.length}`;
  if (textEl) textEl.innerHTML = step.text;

  // Position tooltip
  const tooltip = document.getElementById('tutorial-tooltip');
  if (tooltip) {
    positionTooltip(tooltip, rect, step.position);
  }

  // Update button text for last step
  const nextBtn = document.getElementById('tutorial-next');
  if (nextBtn) {
    nextBtn.textContent = index === STEPS.length - 1 ? 'Concluir' : 'Proximo';
  }
}

function positionTooltip(tooltip, targetRect, position) {
  const vw = window.innerWidth;

  // On mobile, CSS handles positioning (pinned to bottom)
  if (vw <= 768) return;

  const gap = 16;
  const margin = 10;
  const tooltipWidth = 340;  // max-width from CSS
  const vh = window.innerHeight;

  tooltip.style.top = '';
  tooltip.style.left = '';
  tooltip.style.right = '';
  tooltip.style.bottom = '';

  let top, left;

  switch (position) {
    case 'right':
      top = targetRect.top + 20;
      left = targetRect.right + gap;
      break;
    case 'left':
      top = targetRect.top + 20;
      left = targetRect.left - tooltipWidth - gap;
      break;
    case 'top':
      top = targetRect.top - 140;
      left = targetRect.left;
      break;
    case 'bottom':
      top = targetRect.bottom + gap;
      left = targetRect.left;
      break;
  }

  // Clamp horizontally: keep tooltip fully within viewport
  left = Math.max(margin, Math.min(left, vw - tooltipWidth - margin));

  // Clamp vertically
  top = Math.max(margin, Math.min(top, vh - 160));

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function nextStep() {
  currentStep++;
  showStep(currentStep);
}

function endTutorial() {
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.classList.remove('active');
  }

  // Remove highlights
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight');
  });

  if (resolvePromise) {
    resolvePromise();
    resolvePromise = null;
  }
}
