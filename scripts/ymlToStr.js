const fs = require('fs');


function watchFile(watchPath = 'msa/components', watch = true, build = false) {

  const files = fs.readdirSync(watchPath);
  fs.mkdirSync('src/buildin-components', { recursive: true });
  fs.mkdirSync('lib/buildin-components', { recursive: true });

  for (const file of files) {
    const text = fs.readFileSync(`${watchPath}/${file}`, 'utf8');
    const context = `export default \`${text}\``.replace(/\${/g, '\\${');
    const fileName = file.replace(/\.[^/.]+$/, '');
    if (build) {
      fs.writeFileSync(`lib/buildin-components/${fileName}.js`, context,);
    } else {
      fs.writeFileSync(`src/buildin-components/${fileName}.js`, context,);
    }
  }

  if (watch) {
    fs.watch(watchPath, { recursive: true }, (event, filename) => {
      const text = fs.readFileSync(`${watchPath}/${filename}`, 'utf8');
      const context = `export default \`${text}\``.replace(/\${/g, '\\${');
      const fileName = filename.replace(/\.[^/.]+$/, '');
      fs.writeFileSync(`src/buildin-components/${fileName}.js`, context);
    })
  }

}

module.exports = watchFile;