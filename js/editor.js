// ===== CODEMIRROR EDITOR SETUP =====

let editor = null;

export function initEditor(onRun) {
  const textarea = document.getElementById('code-editor');
  if (!textarea) return;

  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'javascript',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    placeholder: '// Escreva seu codigo aqui...',
    extraKeys: {
      'Ctrl-Enter': () => onRun && onRun(),
      'Cmd-Enter': () => onRun && onRun(),
    }
  });

  editor.setSize('100%', '100%');

  // Run button
  const btnRun = document.getElementById('btn-run');
  if (btnRun) {
    btnRun.addEventListener('click', () => onRun && onRun());
  }

  return editor;
}

export function getCode() {
  return editor ? editor.getValue() : '';
}

export function setCode(code) {
  if (editor) {
    editor.setValue(code);
  }
}

export function clearEditor() {
  if (editor) {
    editor.setValue('');
  }
}

export function setEditorReadonly(readonly) {
  if (editor) {
    editor.setOption('readOnly', readonly);
  }
}

export function focusEditor() {
  if (editor) {
    editor.focus();
  }
}

export function getEditor() {
  return editor;
}
