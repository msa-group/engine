import * as fs from "fs";
import Engine from "../src/index";


describe("Engine", () => {
  it("should be defined", () => {
    const text = fs.readFileSync("msa/Msa.yml", "utf8");
    const engine = new Engine();
    // engine.getServiceSpec(text);
    const specs = engine.getSpecs(text);

    console.log(specs, 'specs...')
    engine.parse(text, {
      Global: {
        Name: 'test',
        Region: 'zxc',
        EnvironmentId: 'ddw11d',
        GatewayId: 'ewe1132'
      },
      Parameters: {
      },
    }).then((parseEngine) => {
      console.log(parseEngine.create());
      expect(parseEngine).toBeDefined();
    });

  });
});