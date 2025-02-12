import * as fs from "fs";
import Engine from "../src/index";
import jsYaml from "js-yaml";
import fs from "fs";
import paht from "path";

const debugConfigYaml = fs.readFileSync("./__test__/config.debug.yml");
const debugConfigJson = jsYaml.load(debugConfigYaml);

describe("Engine", () => {
  it("should be defined", () => {
    const text = fs.readFileSync("msa/Msa.yml", "utf8");
    const engine = new Engine();
    // engine.getServiceSpec(text);
    const specs = engine.getSpecs(text);

    const firstScenceParameters = debugConfigJson.ScenceConfigs[0].Parameters;
    // console.log(JSON.stringify(firstScenceParameters))
    

    // console.log(specs, 'specs...')
    engine.parse(text, {
      Global: debugConfigJson.Parameters,
      Parameters: firstScenceParameters,
    }).then((parseEngine) => {
      console.log(parseEngine.create());
      expect(parseEngine).toBeDefined();
    });

  });
});