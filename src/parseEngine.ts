import { get } from "lodash";
import { findItemInContextData, removeFileExtension, toNotEmptyArray } from "./utils";
import { findKeyBy } from "./utils";
import type { EngineContext } from "./types";
import Component from "./component";
import { getUtilsHelper } from "./buildin-helper/utils";
import log from "./log";

const utilsHelper = getUtilsHelper();
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

  getOperations() {
    const composer = this.context.templateJson.main.Composer as Record<string, any>;
    let operations = [];
    let apis_mut = new Map<string, { Name: string; Type: string; BasePath: string }>();
    for (const [key, value] of Object.entries(composer)) {
      const routes = value?.Parameters?.Routes;
      let currentByApiId: { item: Component | undefined, key: string | undefined } = { item: undefined, key: "" };
      if (routes) {
        const name = get(this.nameMapping[key], 'HttpApi', '') as string;

        const httpApiComponent = get(this.context.templateJson.dependencies[value.Component], `${name}`, {})



        // console.log(JSON.stringify(value, null, 2))
        // console.log()
        operations = routes.map(route => {
          // console.log(JSON.stringify(route.Services, null, 2))
          const item = {
            Name: route.Name,
            Path: route.Path,
            Scene: route.Sence,
            Type: httpApiComponent.Properties.Type,
            Services: toNotEmptyArray(route.Services).map(item => {
              console.log(item)
              return
              const tempName = get(item, 'ServiceId.Fn::GetAtt', [])[0];
              const name = get(this.nameMapping[tempName], 'HttpApi', '') as string;

        const httpApiComponent = get(this.context.templateJson.dependencies[value.Component], `${name}`, {})
              console.log(tempName)
              return;
              let current = findItemInContextData(this.context.data, tempName);

              if (!current?.item) {
                return {
                  Protocol: item.Protocol,
                  Weight: item.Weight,
                  Type: '-',
                };
              }
              const sourceType: string = get(current.item?.json, 'Properties.SourceType', '');
              if (sourceType === "") {
                log.warn(`SourceType is not found in ${current.key}.${current?.item.name}, Please check your template.`);
              }
              let backend = {};

              if (sourceType === "DNS") {
                const addresses = get(current.item, "json.Properties.Addresses.Fn::Sub", []);
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
                  const component = findItemInContextData(this.context.data, name);
                  componentName = removeFileExtension(component.item?.componentName || "");
                }
                backend = isAddressesUrl ? {
                  Type: "Url",
                  Url: address,
                } : {
                  Type: componentName
                };
              }
            })
          }
          return item
        });

        // console.log(JSON.stringify(operations, null, 2))
        break;
      }
      // if (operation && operation.ApiId) {
      //   const apiId = get(operation.ApiId, 'Fn::GetAtt', [])[0] || "";
      //   // console.log(operation,apiId)
      //   currentByApiId = findItemInContextData(this.context.data, apiId);
      //   if (!apis_mut.has(currentByApiId.item.name)) {
      //     apis_mut.set(currentByApiId.item.name, {
      //       Name: currentByApiId.item.props.HttpApiName,
      //       Type: currentByApiId.item.props.Type,
      //       BasePath: currentByApiId.item.props.BasePath,
      //     });
      //   }
      //   const type = get(currentByApiId.item?.json, 'Properties.Type', '');
      //   const basePath = utilsHelper.GetOperationPath(operation, "value");

      //   const opt = {
      //     Name: operation.Name,
      //     Path: operation.Path,
      //     Scene: operation.Scene,
      //     Type: type,
      //     BasePath: basePath,
      //     Services: toNotEmptyArray(operation.Services).map(item => {
      //       const tempName = get(item, 'ServiceId.Fn::GetAtt', [])[0];
      //       let current = findItemInContextData(this.context.data, tempName);

      //       if (!current?.item) {
      //         return {
      //           Protocol: item.Protocol,
      //           Weight: item.Weight,
      //           Type: '-',
      //         };
      //       }
      //       const sourceType: string = get(current.item?.json, 'Properties.SourceType', '');
      //       if (sourceType === "") {
      //         log.warn(`SourceType is not found in ${current.key}.${current?.item.name}, Please check your template.`);
      //       }
      //       let backend = {};

      //       if (sourceType === "DNS") {
      //         const addresses = get(current.item, "json.Properties.Addresses.Fn::Sub", []);
      //         let address = "";
      //         let componentName = "";
      //         const isAddressesUrl = addresses.some(item => {
      //           address = item.AddressesName;
      //           return typeof item.AddressesName === "string"
      //         });
      //         if (!isAddressesUrl) {
      //           let name = "";
      //           findKeyBy(addresses, 'Fn::GetAtt', (obj, key) => {
      //             name = get(obj[key], '0', '');
      //           });
      //           const component = findItemInContextData(this.context.data, name);
      //           componentName = removeFileExtension(component.item?.componentName || "");
      //         }
      //         backend = isAddressesUrl ? {
      //           Type: "Url",
      //           Url: address,
      //         } : {
      //           Type: componentName
      //         };
      //       }
      //       return {
      //         Protocol: item.Protocol,
      //         Weight: item.Weight,
      //         Type: sourceType,
      //         Backend: backend,
      //       }
      //     }),
      //   }
      //   operations.push(opt);
      // }
    }

    // 目前仅取一个
    // const api = apis_mut.values().next().value;

    return {
      Operations: operations,
      // Api: api,
    }
  }
}

export default ParseEngine;