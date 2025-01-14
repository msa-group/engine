import Engine from "../lib/index";


// const $root = document.createElement('div');

window.onload = () => {
  init();
}

function init() {
  const $jsonViewer = document.getElementById('json-viewer');

  const $panelTitle = document.querySelectorAll('.panel-title');

  const $generateBtn = document.getElementById('generate-btn');

  const $errorDialog = document.getElementById('error-dialog');
  const $errorDialogContent = document.getElementById('error-dialog-content');
  const $errorDialogClose = document.getElementById('error-dialog-close');

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

  async function generate(text) {
    const engine = new Engine();


    engine.registerHelper({
      Log: (...arg) => {
        console.log(...arg);
        return arg;
      },
    })

    engine.parse(text).then((parseEngine) => {

      yamlViewer.setValue(parseEngine.create());

      const operationJson = parseEngine.getOperations();
      $jsonViewer.textContent = JSON.stringify(operationJson, null, 2);

      engine.parse(text).then((parseEngine) => {
        console.log(parseEngine.create())
      })
    }).catch(err => {
      $errorDialogContent.textContent = err.message;
      $errorDialog.showModal();
      console.error(err);
    });
  }

  $panelTitle.forEach(($title) => {
    $title.addEventListener('click', () => {
      $title.classList.toggle('active');
    })
  });

  $errorDialogClose.addEventListener('click', () => {
    $errorDialog.close();
  });



  yamlViewer.setSize('100%', '100%');

  yamlEditor.setSize('100%', '100%');

  $generateBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const content = yamlEditor.getValue();
    generate(content);
  })



  // 

  fetch("/api/msa?filePath=./msa/Msa.yml").then(res => res.json()).then(({ data }) => {
    if (data.content) {
      yamlEditor.setValue(data.content);
      generate(data.content);
    }
  })
  // fetch("https://api.devsapp.cn/v3/packages/static-website-oss/release/latest?package-name=static-website-oss").then(res => res.json()).then(({ body }) => {
  //   const { syaml } = body;
  //   if (syaml) {
  //     yamlEditor.setValue(syaml);
  //     generate(syaml);
  //   }
  //   console.log(syaml)

  // });
}




