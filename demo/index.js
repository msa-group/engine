import Engine from "../lib/index";

window.onload = () => {
  init();
}

function getParamsFromUrl(url, key) {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  const paramsObj = {};
  params.forEach((value, key) => {
    paramsObj[key] = value;
  });
  return paramsObj[key];
}

function init() {

  const currentScenceProfile = getParamsFromUrl(window.location.href, 'scenceProfile');

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

  function generate(text, globalParams, scenceConfig) {
    const engine = new Engine();
    engine.parse(text, { Global: globalParams, Parameters: scenceConfig.Parameters })
      .then((parseEngine) => {
        yamlViewer.setValue(parseEngine.create());
        const routes = parseEngine.getArchitecture();
        $jsonViewer.textContent = JSON.stringify(routes, null, 2);
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




  fetch("/api/config").then(res => res.json()).then(({ data }) => {
    let globalConfig = jsyaml.load(data.debugConfigContent);
    const scenceProfiles = globalConfig.SceneProfiles;

    const $selectEnv = document.getElementById('select-env');
    $selectEnv.innerHTML = scenceProfiles.map(item => `<option value="${item.Template}">${item.DisplayName['zh-cn']}</option>`).join('');

    $selectEnv.addEventListener('change', (event) => {
      const filePath = event.target.value;
      const url = window.location.pathname;
      window.history.replaceState({}, '', url + '?scenceProfile=' + filePath);
      fetch("/api/msa?filePath=" + filePath).then(res => res.json()).then(({ data }) => {
        if (data.content) {
          const currentScenceProfile = scenceProfiles.find(item => item.Template === filePath);
          yamlEditor.setValue(data.content);
          generate(data.content, globalConfig.Parameters, currentScenceProfile);
        }
      });
    });

    const scenceProfile = currentScenceProfile ? scenceProfiles.find(item => item.Template === currentScenceProfile) : scenceProfiles[0];
    fetch("/api/msa?filePath=" + scenceProfile.Template).then(res => res.json()).then(({ data }) => {
      if (data.content) {
        yamlEditor.setValue(data.content);
        generate(data.content, globalConfig.Parameters, scenceProfile);
      }
    })
  })
}

