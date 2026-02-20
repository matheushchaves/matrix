// ===== SANDBOXED CODE EXECUTION =====

let sandboxFrame = null;
let pendingResolve = null;
let executionTimeout = null;

const SANDBOX_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script>
  // Override console to capture logs
  const __logs = [];
  const __apiCalls = [];
  const __origConsole = { log: console.log, warn: console.warn, error: console.error };

  console.log = function(...args) {
    __logs.push({ type: 'log', args: args.map(a => stringify(a)) });
  };
  console.warn = function(...args) {
    __logs.push({ type: 'warn', args: args.map(a => stringify(a)) });
  };
  console.error = function(...args) {
    __logs.push({ type: 'error', args: args.map(a => stringify(a)) });
  };

  function stringify(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'function') return val.toString();
    try {
      return JSON.stringify(val, null, 2);
    } catch(e) {
      return String(val);
    }
  }

  // Listen for execution messages
  window.addEventListener('message', function(e) {
    const msg = e.data;
    if (msg.type !== 'execute') return;

    __logs.length = 0;
    __apiCalls.length = 0;

    // Inject Matrix APIs
    if (msg.apis) {
      const Matrix = {};
      for (const [name, config] of Object.entries(msg.apis)) {
        Matrix[name] = function(...args) {
          __apiCalls.push({ name: name, args: args.map(a => stringify(a)) });
          // Execute the mock implementation
          try {
            const fn = new Function('args', config.impl);
            return fn(args);
          } catch(err) {
            return { error: err.message };
          }
        };
      }
      self.Matrix = Matrix;
    }

    try {
      const fn = new Function(msg.code);
      const result = fn();
      parent.postMessage({
        type: 'result',
        success: true,
        returnValue: stringify(result),
        logs: __logs.slice(),
        apiCalls: __apiCalls.slice(),
        error: null
      }, '*');
    } catch(err) {
      parent.postMessage({
        type: 'result',
        success: false,
        returnValue: null,
        logs: __logs.slice(),
        apiCalls: __apiCalls.slice(),
        error: { message: err.message, stack: err.stack }
      }, '*');
    }
  });

  // Signal ready
  parent.postMessage({ type: 'ready' }, '*');
<\/script>
</body>
</html>
`;

function createSandbox() {
  // Remove old sandbox if it exists
  if (sandboxFrame) {
    sandboxFrame.remove();
  }

  sandboxFrame = document.createElement('iframe');
  sandboxFrame.sandbox = 'allow-scripts';
  sandboxFrame.style.display = 'none';
  sandboxFrame.srcdoc = SANDBOX_HTML;
  document.body.appendChild(sandboxFrame);
}

function ensureSandbox() {
  if (!sandboxFrame || !sandboxFrame.parentNode) {
    createSandbox();
  }
}

// Build Matrix API implementations for the sandbox
export function buildAPIs(missionData, unlockedAPIs) {
  const apis = {};

  if (unlockedAPIs.includes('scan') && missionData.scanData) {
    apis.scan = {
      impl: `return ${JSON.stringify(missionData.scanData)};`
    };
  }

  if (unlockedAPIs.includes('trace') && missionData.traceData) {
    apis.trace = {
      impl: `
        const id = args[0];
        const data = ${JSON.stringify(missionData.traceData)};
        return data[id] || { error: 'Entidade nao encontrada: ' + id };
      `
    };
  }

  if (unlockedAPIs.includes('decrypt') && missionData.decryptData) {
    apis.decrypt = {
      impl: `
        const data = args[0] || ${JSON.stringify(missionData.decryptData || '')};
        const algorithm = args[1];
        if (typeof algorithm === 'function') {
          return data.split('').map(algorithm).join('');
        }
        return data;
      `
    };
  }

  if (unlockedAPIs.includes('bend')) {
    apis.bend = {
      impl: `
        const targetId = args[0];
        const props = args[1];
        return { modified: targetId, properties: props, success: true };
      `
    };
  }

  if (unlockedAPIs.includes('freeze')) {
    apis.freeze = {
      impl: `
        const duration = args[0] || 1000;
        return { frozen: true, duration: duration };
      `
    };
  }

  if (unlockedAPIs.includes('inject')) {
    apis.inject = {
      impl: `
        const targetId = args[0];
        const code = args[1];
        return { injected: targetId, codeLength: (code || '').length, success: true };
      `
    };
  }

  return apis;
}

export function executeCode(code, apis = {}) {
  return new Promise((resolve) => {
    ensureSandbox();

    // Set timeout
    if (executionTimeout) clearTimeout(executionTimeout);
    executionTimeout = setTimeout(() => {
      if (pendingResolve) {
        pendingResolve({
          success: false,
          returnValue: null,
          logs: [],
          apiCalls: [],
          error: { message: 'Execucao cancelada: tempo limite excedido (5s). Possivel loop infinito.' }
        });
        pendingResolve = null;
        // Recreate sandbox after timeout
        createSandbox();
      }
    }, 5000);

    pendingResolve = resolve;

    // Send code to sandbox
    const sendToSandbox = () => {
      if (sandboxFrame && sandboxFrame.contentWindow) {
        sandboxFrame.contentWindow.postMessage({
          type: 'execute',
          code: code,
          apis: apis
        }, '*');
      }
    };

    // If sandbox is already loaded, send immediately; otherwise wait
    if (sandboxFrame.contentWindow) {
      sendToSandbox();
    } else {
      sandboxFrame.onload = () => {
        sendToSandbox();
      };
    }
  });
}

// Listen for messages from sandbox
window.addEventListener('message', (e) => {
  const msg = e.data;
  if (msg.type === 'result' && pendingResolve) {
    if (executionTimeout) clearTimeout(executionTimeout);
    pendingResolve(msg);
    pendingResolve = null;
  }
});

// Initialize sandbox on module load
createSandbox();
