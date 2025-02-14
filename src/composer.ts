import type { ComposerData, GlobalData } from "./types";
import { get } from "lodash";

class Composer {
  name: string;
  props: Record<string, any>;
  dependsOn: string[];
  parameters: Record<string, any>;
  operation?: Record<string, any>;
  componentName: string;

  constructor(data: ComposerData, global: GlobalData, specs?: Record<string, { spec: string, type: string }>) {
    const localParameters = get(global, `Parameters.${data.name}`, {});
    this.name = data.name;
    this.props = data.props || {};
    this.operation = data.operation;
    this.dependsOn = data.dependsOn || [];
    this.parameters = {
      ...global.Parameters,
      ...data.parameters,
      ...localParameters,
    }
    this.componentName = data.componentName;
  }
}

export default Composer;
