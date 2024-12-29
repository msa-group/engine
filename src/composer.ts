import type { ComposerData, ParseOptions } from "./types";

class Composer {
  name: string;
  props: Record<string, any>;
  dependsOn: string[];
  parameters: Record<string, any>;
  operation: Record<string, any>;
  componentName: string;

  constructor(data: ComposerData, global: ParseOptions['globalData']) {
    this.name = data.name;
    this.props = data.props || {};
    this.operation = data.operation;
    this.dependsOn = data.dependsOn || [];
    this.parameters = {
      ...global.Parameters,
      ...data.parameters,
    }
    this.componentName = data.componentName;
  }
}

export default Composer;
