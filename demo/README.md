## Usage

```js
import MsaEngine from "msa-engine";
fetch("https://api.devsapp.cn/v3/packages/static-website-oss/release/latest?package-name=static-website-oss")
.then(res => res.json())
.then(({ body }) => {
  const { syaml } = body;
  const msaEngine = new MsaEngine();
  // You can register your own helper here
  // msaEngine.registerHelper({
  //   Log: (...arg) => {
  //     return arg;
  //   }
  // })

  msaEngine.parse(syaml, { Name: "nextchat-web-test" }).then((parseEngine) => {
    const rosYAML = parseEngine.create();
    const arcSpec = parseEngine.getOperations();
      console.log('rosYAML', rosYAML);
      console.log('arcSpec', arcSpec);
    }).catch(err => {
      console.error(err);
    });
});
```
