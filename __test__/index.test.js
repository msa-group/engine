import * as fs from "fs";
import Engine from "../src/index";


describe("Engine", () => {
  it("should be defined", () => {
    const text = fs.readFileSync("msa/Msa.yml", "utf8");
    const engine = new Engine();

    engine.parse(text).then((parseEngine) => {
      console.log(parseEngine.create());
      expect(parseEngine).toBeDefined();
    });

  });
});