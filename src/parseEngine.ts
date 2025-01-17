import { get} from "lodash";
import { findItemInContextData, removeFileExtension } from "./utils";
import { findKeyBy } from "./utils";
import type { EngineContext } from "./types";
import Component from "./component";
import { getUtilsHelper } from "./buildin-helper/utils";
import log from "./log";

const utilsHelper = getUtilsHelper();
class ParseEngine {
  private context: EngineContext;

  constructor(context: EngineContext) {
    this.context = context;
  }

  create() {
    return this.context.resultYamlString;
  }

  getOperations() {
    const composer = this.context.templateJson.main.Composer as Record<string, any>;
    const operations = [];
    let apis_mut = new Map<string, {Name: string; Type: string; BasePath: string}>();
    for (const [_key, value] of Object.entries(composer)) {
      const operation = value.Operation;
      let currentByApiId: { item: Component | undefined, key: string | undefined } = { item: undefined, key: "" };
      if (operation) {
        const apiId = get(operation.ApiId, 'Fn::GetAtt', [])[0] || "";
        currentByApiId = findItemInContextData(this.context.data, apiId);
        if (!apis_mut.has(currentByApiId.item.name)) {
          apis_mut.set(currentByApiId.item.name, {
            Name: currentByApiId.item.props.HttpApiName,
            Type: currentByApiId.item.props.Type,
            BasePath: currentByApiId.item.props.BasePath,
          });
        }
        const type = get(currentByApiId.item?.json, 'Properties.Type', '');
        const basePath = utilsHelper.GetOperationPath(operation, "value");

        const opt = {
          Name: operation.Name,
          Path: operation.Path,
          Scene: operation.Scene,
          Type: type,
          BasePath: basePath,
          Services: operation.Services.map(item => {
            const tempName = get(item, 'ServiceId.Fn::GetAtt', [])[0];
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
            return {
              Protocol: item.Protocol,
              Weight: item.Weight,
              Type: sourceType,
              Backend: backend,
            }
          }),
        }
        operations.push(opt);
      }
    }

    // 目前仅取一个
    const api = apis_mut.values().next().value;

    return {
      Operations: operations,
      Api: api,
    }
  }
}

export default ParseEngine;