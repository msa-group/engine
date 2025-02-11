const fs = require('fs');


function watchFile(watchPath = 'msa/components', watch = true, build = false) {

  const files = fs.readdirSync(watchPath);
  const specFiles = fs.readdirSync('msa/spec');
  fs.mkdirSync('src/buildin-components', { recursive: true });
  fs.mkdirSync('lib/buildin-components', { recursive: true });
  const j = {};
  const specs = {};

  for (const file of files) {
    const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
    const fileName = file.replace(/\.[^/.]+$/, '');
    j[fileName] = text;
  }

  for (const file of specFiles) {
    const text = fs.readFileSync(`msa/spec/${file}`, 'utf8');
    const fileName = file.replace(/\.spec\.[^/.]+$/, '');
    specs[fileName] = text;
  }

  fs.writeFileSync(`src/buildin-components/index.js`, `export default ${JSON.stringify(j)}`,);
  fs.writeFileSync(`src/buildin-spec/index.js`, `export default ${JSON.stringify(specs)}`,);
  if (watch) {
    fs.watch(watchPath, { recursive: true }, (event, file) => {
      const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
      const fileName = file.replace(/\.[^/.]+$/, '');
      j[fileName] = text;
      fs.writeFileSync(`src/buildin-components/index.js`, `export default ${JSON.stringify(j)}`,);
    });
    fs.watch('msa/spec', { recursive: true }, (event, file) => {
      const text = fs.readFileSync(`msa/spec/${file}`, 'utf8');
      const fileName = file.replace(/\.spec\.[^/.]+$/, '');
      specs[fileName] = text;
      fs.writeFileSync(`src/buildin-spec/index.js`, `export default ${JSON.stringify(specs)}`,);
    });
  }

}

module.exports = watchFile;