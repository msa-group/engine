const fs = require('fs');


function watchFile(watchPath = 'demo/components') {

  const files = fs.readdirSync(watchPath);
  fs.mkdirSync('src/buildin-components', { recursive: true });

  for (const file of files) {
    const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
    const context = `export default \`${text}\``.replace(/\${/g, '\\${');
    const fileName = file.replace(/\.[^/.]+$/, '');
    fs.writeFileSync(`src/buildin-components/${fileName}.js`, context, );
  }


  fs.watch(watchPath, { recursive: true }, (event, filename) => {
    const text = fs.readFileSync(`${watchPath}/${filename}`, 'utf8');
    const context = `export default \`${text}\``.replace(/\${/g, '\\${');
    const fileName = filename.replace(/\.[^/.]+$/, '');
    fs.writeFileSync(`src/buildin-components/${fileName}.js`, context);
  })
}

module.exports = watchFile;