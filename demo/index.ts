import Engine from "../src/index";


declare global {
  interface Window {
    CodeMirror: any;
  }
}

// const $root = document.createElement('div');

window.onload = () => {
  init();
}

function init() {
  const $jsonViewer = document.getElementById('json-viewer')!;

  const $panelTitle = document.querySelectorAll('.panel-title')!;

  const $generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;

  const yamlViewer = window.CodeMirror.fromTextArea(document.getElementById('yaml-viewer'), {
    mode: 'yaml',
    readOnly: true,
    theme: 'dracula',
    lineNumbers: true,
  });

  const yamlEditor = window.CodeMirror.fromTextArea(document.getElementById('yaml-viewer-editor'), {
    mode: 'yaml',
    theme: 'dracula',
    lineNumbers: true,
  });

  function generate(text) {
    const engine = new Engine();

    engine.parse(text).then((parseEngine) => {

      yamlViewer.setValue(parseEngine.create());

      const operationJson = parseEngine.getOperations();
      $jsonViewer.textContent = JSON.stringify(operationJson, null, 2);
    });
  }

  $panelTitle.forEach(($title) => {
    $title.addEventListener('click', () => {
      $title.classList.toggle('active');
    })
  });



  yamlViewer.setSize('100%', '100%');

  yamlEditor.setSize('100%', '100%');

  $generateBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const content = yamlEditor.getValue();
    generate(content);
  })




  fetch("/api/msa").then(res => res.json()).then(({ data }) => {
    yamlEditor.setValue(data.content);
    generate(data.content);
  });
}




