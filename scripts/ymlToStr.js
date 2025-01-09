const fs = require('fs');


function watchFile(watchPath = 'msa/components', watch = true, build = false) {

  const files = fs.readdirSync(watchPath);
  fs.mkdirSync('src/buildin-components', { recursive: true });
  fs.mkdirSync('lib/buildin-components', { recursive: true });
  const j = {};

  for (const file of files) {
    const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
    const fileName = file.replace(/\.[^/.]+$/, '');
    j[fileName] = text;
  }

  fs.writeFileSync(`src/buildin-components/index.js`, `export default ${JSON.stringify(j)}`,);
  if (watch) {
    fs.watch(watchPath, { recursive: true }, (event, file) => {
      const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
      const fileName = file.replace(/\.[^/.]+$/, '');
      j[fileName] = text;
      fs.writeFileSync(`src/buildin-components/index.js`, `export default ${JSON.stringify(j)}`,);
    })
  }

}

module.exports = watchFile;