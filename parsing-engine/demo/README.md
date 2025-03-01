## Usage

```js
import MsaEngine from "msa-engine";
fetch("https://api.devsapp.cn/v3/packages/static-website-oss/release/latest?package-name=static-website-oss")
.then(res => res.json())
.then(({ body }) => {
  const { syaml } = body;
  const msaEngine = new MsaEngine();

  // 获取资源的 spec 以及 spec 对应的类型映射
  const { specs, specMapping } = msaEngine.getSpec(syaml);
  // You can register your own helper here
  // msaEngine.registerHelper({
  //   Log: (...arg) => {
  //     return arg;
  //   }
  // })

  msaEngine.parse(syaml, { 
    Global: {},
    Parameters: {},
   }).then((parseEngine) => {
    const rosYAML = parseEngine.create();
    const Architecture = parseEngine.getArchitecture();
      console.log('rosYAML: ', rosYAML);
      console.log('Architecture: ', Architecture);
    }).catch(err => {
      console.error(err);
    });
});
```
