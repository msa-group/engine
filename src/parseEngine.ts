import { get } from "lodash";
import { findKeyBy } from "./utils";
import type { EngineContext } from "./types";
import { specMapping } from "./buildin-spec/mapping";

class ParseEngine {
  private context: EngineContext;

  constructor(context: EngineContext) {
    this.context = context;
  }

  create() {
    return this.context.resultYamlString;
  }

  getArchitecture() {
    const composer = this.context.templateJson.main.Composer as Record<string, any>;
    const res: any = {}
    for (const [key, value] of Object.entries(composer)) {

      const Component = value.Component;
      const type = specMapping[Component];
      if (type === 'gateway') {
        const routes = get(value, 'Parameters.Routes', []);

        const routesWithService = routes.map(route => {
          const services = get(route, 'Services', []).map((serivce) => {
            const serviceName = get(serivce, 'ServiceId.Fn::GetAtt', [])[0];
            const composerName = this.context.fullComponent[serviceName].composerName;
            return {
              ...serivce,
              Ref: composerName
            }
          })
          return {
            ...route,
            Services: services,
          }
        });
        
        res[key] = {
          ...value,
          Parameters: {
            ...value.Parameters,
            Routes: routesWithService,
          }
        }
      } else if (type === "service") {
        let address: any;
        let backend = "";
        findKeyBy(value, 'AddressesName', (obj, key) => {
          address = obj[key];
        });
        findKeyBy(address, 'Fn::GetAtt', (obj, key) => {
          if (obj[key]?.[0]) {
            backend = obj[key][0];
          }
        });
        const backendComponent = get(this.context.fullComponent, backend, {});
        res[key] = {
          ...value,
          Ref: backendComponent.composerName
        }
      } else if (type === 'backend') {
        res[key] = {
          ...value,
        }
      }
    }

    return res;
  }
}

export default ParseEngine;