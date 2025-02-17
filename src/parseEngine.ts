import { get } from "lodash";
import { toNotEmptyArray } from "./utils";
import { findKeyBy } from "./utils";
import type { EngineContext } from "./types";
import jsYaml from "js-yaml";

class ParseEngine {
  private context: EngineContext;
  private nameMapping: Record<string, Record<string, string | boolean>> = {};

  constructor(context: EngineContext, nameMapping: Record<string, Record<string, string | boolean>> = {}) {
    this.context = context;
    this.nameMapping = nameMapping;
  }

  create() {
    return this.context.resultYamlString;
  }

  getRoutesStruct() {
    const composer = this.context.templateJson.main.Composer as Record<string, any>;
    let apiRoutes = [];
    const fullJson = jsYaml.load(this.context.resultYamlString).Resources as Record<string, any>;
    let api = { Name: "", Type: "", BasePath: "" };
    for (const [_, value] of Object.entries(fullJson)) {
      if (value.Type === "ALIYUN::APIG::HttpApi") {
        api.Name = value.Properties.HttpApiName;
        api.Type = value.Properties.Type;
        api.BasePath = value.Properties.BasePath || "/";
      }
    }
    for (const [key, value] of Object.entries(composer)) {
      const routes = value?.Parameters?.Routes;

      if (routes) {
        const name = get(this.nameMapping[key], 'HttpApi', '') as string;
        const httpApiComponent = get(this.context.templateJson.dependencies[value.Component], `${name}`, {})
        apiRoutes = routes.map(route => {
          const item = {
            Name: route.Name,
            Path: route.Path,
            Scene: route.Sence,
            Type: httpApiComponent.Properties.Type,
            Services: toNotEmptyArray(route.Services).map(item => {
              const tempName = get(item, 'ServiceId.Fn::GetAtt', [])[0];
              const serviceComponent = fullJson[tempName];

              const sourceType: string = get(serviceComponent, 'Properties.SourceType', '');
              let backend = {};

              if (sourceType === "DNS") {
                const addresses = get(serviceComponent, "Properties.Addresses.Fn::Sub", []);
                let address = "";
                let componentName = "";
                const isAddressesUrl = addresses.some(item => {
                  address = item.AddressesName;
                  return typeof item.AddressesName === "string"
                });
                if (!isAddressesUrl) {
                  let name = "";
                  findKeyBy(addresses, 'Fn::GetAtt', (obj, key) => {
                    name = get(obj[key], '0', '');
                  });
                  const component = fullJson[name];
                  if (component?.Type?.includes("FC3")) {
                    componentName = 'fc3';
                  }
                }
                backend = isAddressesUrl ? {
                  Type: "Url",
                  Url: address,
                } : {
                  Type: componentName
                };
              }
              return {
                Protocol: item.Protocol,
                Weight: item.Weight,
                Type: sourceType,
                Backend: backend,
              }
            })
          }
          return item
        });

        break;
      }
    }

    // 目前仅取一个
    // const api = apis_mut.values().next().value;

    return {
      Routes: apiRoutes,
      Api: api,
    }
  }
}

export default ParseEngine;