import jsYaml from "js-yaml";
import Handlebars from "handlebars";
import { get } from "lodash";
import { pipe } from "lodash/fp";
import ParseEngine from "./parseEngine";
import ParserRules, { addContextPrefix } from "./parserRules";
import { getOuterEachBlockPosition, mergeName, removeNullValues, removeOuterEachBlock, sortByDependsOn } from "./utils";
import { getBuildInHelper } from './buildin-helper';
import Composer from "./composer";
import Component from "./component";
import buildinComponents from './buildin-components';
import plugins from "./plugins";
import buildinSpec from './buildin-spec';
import { specMapping } from "./buildin-spec/mapping";


import type { Composor, EngineContext, GlobalData, ParseOptions } from "./types";

class Engine {

  private rules: ParserRules;
  private context: EngineContext;
  private buildinHelpers: Record<string, any> = {};
  private registeredHelper: Record<string, any> = {};
  private globalData: GlobalData = { Parameters: {} };
  private nameMapping: Record<string, Record<string, string | boolean>> = {};
  private deletedMergedName: Set<string> = new Set();
  private mergedNames: Set<string> = new Set();
  // @ts-ignore
  private specs: Record<string, { spec: string, type: string }> = {};

  constructor() {
    this.rules = new ParserRules();
    this.init();
  }

  private init() {
    this.nameMapping = {};
    this.deletedMergedName = new Set();
    this.mergedNames = new Set();
    this.context = {
      fullComponent: {},
      templateText: {
        // 主模板 Composer 的内容
        main: "",
        // 子模板 每个 Template 的模板
        dependencies: {},
      },
      // 模版被 js-yaml 解析后的 JSON 格式数据
      templateJson: {
        // 主模板 Composer 的内容
        main: {},
        // 子模板 每个 Template 的内容
        dependencies: {},
      },
      // js-yaml 转为 JSON 后解析出来的全局数据
      data: {},
      // 最终输出的 yaml 字符串
      resultYamlString: `ROSTemplateFormatVersion: '2015-09-01'
Resources:`,

      serviceJson: {},
    }
  }

  registerHelper<T>(helpers: { [key: string]: T }) {
    // this.buildinHelpers = { ...this.buildinHelpers, ...helpers };
    this.registeredHelper = helpers;
  }

  parse(str: string, parameters: Record<string, any> = {}, options: ParseOptions = {})
    : Promise<ParseEngine> {
    this.init();
    const buildinHelpersInst = getBuildInHelper();
    this.buildinHelpers = { ...buildinHelpersInst, ...this.registeredHelper }
    return new Promise(async (resolve) => {
      try {
        await this.#parserNameMapping(str, { parameters });
        this.#parserMainYaml(str, { parameters });
        const parseEngine = new ParseEngine(this.context, this.nameMapping);
        resolve(parseEngine);
        // console.log()
        // resolve(this.context.resultYamlString)
      } catch (error) {
        console.log(error)
      }
    });
  }

  async #parserNameMapping(text: string, config: { parameters: Record<string, any> }) {

    const globalParameters = get(config, 'parameters.Global', {});
    const inLocalParameters = get(config, 'parameters.Parameters', {});
    const contextData = {
      Parameters: {
        ...globalParameters,
        ...inLocalParameters,
      },
      ...this.buildinHelpers,
    }
    this.context.data = {
      ...this.context.data,
      ...contextData,
    }

    const a = this.rules.preparsRules[0].replace(text);
    const b = jsYaml.load(a).Composer || {};
    const keys = Object.keys(b);

    let preparedText = this.rules.rule.C.replace(text, contextData, undefined, undefined, undefined, keys);
    for (const rule of this.rules.preparsRules) {
      preparedText = rule.replace(preparedText);
    }
    const composerJson = jsYaml.load(preparedText);
    // this.context.templateText.main = preparedText;
    this.#analyzeTemplate(composerJson);
    this.#parseSubTemplate(composerJson);

  }


  async #parserMainYaml(str, parameters: any) {
    const params = {
      ...get(parameters, 'Global', {}),
    }
    Object.assign(this.context.data.Parameters, params);
    const composerYaml = this.rules.rule.B.replace(str, { ...this.context.data, ...this.nameMapping }, "Composer", this.nameMapping);
    const composerJson = jsYaml.load(composerYaml);
    this.context.templateJson.main = composerJson;
    const sortedByDependsOn = sortByDependsOn(Object.entries(composerJson.Composer || {}));
    for (const [composerKey, composerContent] of sortedByDependsOn) {
      const composerData = {
        name: composerKey,
        parameters: {
          ...composerContent.Parameters,
          ...get(parameters, `Parameters.${composerKey}`, {}),
        },
        props: composerContent.Properties,
        dependsOn: composerContent.DependsOn,
        componentName: composerContent.Component,
      }
      const composerInstance = new Composer(composerData, this.context.data);
      this.#parserComponentYaml(composerInstance, composerContent.Component);
    }
  }

  #parserComponentYaml(composerInstance: Composer, component: string) {
    const componentText = buildinComponents[component] as string;

    if (composerInstance.parameters?.PluginClassName && !composerInstance.parameters?.PluginClassId) {
      const plugin = plugins.find(
        v => v.name === composerInstance.parameters.PluginClassName ||
          v.alias === composerInstance.parameters.PluginClassName
      );
      if (plugin) {
        composerInstance.parameters.PluginClassId = plugin.id;
      }
    }

    const contextData = { ...this.context.data, Parameters: { ...this.context.data.Parameters, ...composerInstance.parameters }, ...this.nameMapping };
    let self = this;
    function hasEachBlock(text) {
      const positions = getOuterEachBlockPosition(text);
      return positions.length > 0;
    }
    function parseEach(text, context, depth = 0) {
      const positions = getOuterEachBlockPosition(text);
      let t = '';
      if (positions.length) {
        for (let i = positions.length - 1; i >= 0; i--) {
          const pos = positions[i];
          const eachBlock = text.slice(pos.start, pos.end) as string;
          const lines = eachBlock.split('\n');
          const startEach = lines[0];
          const content = lines.slice(1, lines.length - 1).join('\n');
          const match = /{{#each ([\s\S]*?)}}/g;
          const exp = startEach.replace(match, (m, p) => {
            return addContextPrefix(p)
          });

          const arr = eval(exp);
          if (Array.isArray(arr)) {
            arr.forEach((item, index) => {
              const c = self.rules.preparsRules[0].replace(content);
              if (item?.PluginClassName && !item?.PluginClassId) {
                const plugin = plugins.find(
                  v => v.name === item.PluginClassName ||
                    v.alias === item.PluginClassName
                );
                if (plugin) {
                  item.PluginClassId = plugin.id;
                }
              }
              const contextData = { ...context, item: { ...item, parent: context.parent || {} }, index };
              const d = self.rules.rule.ifLogic.replace(c, contextData, undefined, self.nameMapping);
              const e = Handlebars.compile(d)(contextData);
              const f = self.rules.rule.D.replace(e);
              const g = removeOuterEachBlock(f);
              const h = self.rules.rule.parseDoubleCurliesAndEvalCall.replace(g, contextData, undefined, self.nameMapping, true);
              const fjson = jsYaml.load(h);
              const removedNullValues = removeNullValues(fjson);
              for (const [key, value] of Object.entries(removedNullValues)) {
                t = t + jsYaml.dump({ [key]: value });
              }
              let i = hasEachBlock(content);
              if (i) {
                const [c] = parseEach(content, { ...contextData, parent: { ...contextData.item, index } }, depth + 1);
                t = t + c;
              }
            });
          }
        }
        return [t, true, positions];
      }
      return [text, false, positions];
    }
    let [t, isEach, positions] = parseEach(componentText, contextData);
    if (isEach) {
      positions.forEach(pos => {
        const matchText = componentText.slice(pos.start, pos.end);
        t = componentText.replace(matchText, t);
      })
    }
    const c = this.rules.preparsRules[0].replace(t);
    const b = this.rules.rule.ifLogic.replace(c, contextData, undefined, this.nameMapping);
    const e = Handlebars.compile(b)(contextData);
    const f = this.rules.rule.parseDoubleCurliesAndEvalCall.replace(e, contextData, undefined, this.nameMapping);
    let r = f;

    let h = '';
    const a = jsYaml.load(f) as Record<string, any>;
    const z = removeNullValues(a);
    for (const [name, value] of Object.entries(z)) {
      self.nameMapping[composerInstance.name][name] = `${composerInstance.name}${name}`
      const data = {
        name,
        parent: composerInstance,
        json: value,
        parameters: composerInstance.parameters,
        props: composerInstance.props,
        dependsOn: value.DependsOn,
        localJson: {},
        nameMapping: self.nameMapping,
        deletedMergedName: self.deletedMergedName,
        mergedNames: self.mergedNames,
      }
      const componentInstance = new Component(data);
      this.context.fullComponent[componentInstance.mergedName] = componentInstance;
      h = h + componentInstance.toYaml()[componentInstance.mergedName]
    }
    r = h;

    const k = jsYaml.load(r);
    this.context.templateJson.dependencies[composerInstance.componentName] = k;
    const g = jsYaml.dump(k);

    const indentedYamlText = g
      .split('\n')
      .map((line, index) => index === 0 ? line : `  ${line}`)
      .join('\n');
    this.context.resultYamlString += `\n  ${indentedYamlText}\n`;
  }

  #analyzeTemplate(composerJson) {
    const composer = composerJson.Composer as Composor
    if (!composer) return {};
    for (const [key, value] of Object.entries(composer)) {
      this.context.templateText.dependencies[key] = value.Component;
    }
    return this.context.templateText.dependencies;
  }

  async #parseSubTemplate(composerJson: any) {
    const dependencies = this.context.templateText.dependencies;
    for (const [key, value] of Object.entries(dependencies)) {
      const msa = composerJson.Composer[key];
      const data = {
        name: key,
        parameters: msa.Parameters,
        props: msa.Properties,
        dependsOn: msa.DependsOn,
        componentName: msa.Component,
      }
      const composerInstance = new Composer(data, this.globalData);

      const template = buildinComponents[value] as string;
      let t = removeOuterEachBlock(template);

      for (const rule of this.rules.preparsRules) {
        t = rule.replace(t);
      }

      const contextData = { ...this.context.data, Parameters: { ...this.context.data.Parameter, ...composerInstance.parameters } }

      const parsedText = pipe(
        (text) => this.rules.rule.ifLogic.replace(text, contextData),
        (text) => Handlebars.compile(text, { noEscape: true }),
      )(t)(contextData);

      const componentJson = jsYaml.load(parsedText) as Record<string, any>;

      for (const [componentKey, value] of Object.entries(componentJson)) {

        const component = {
          name: componentKey,
          mergedName: mergeName(key, componentKey),
          isResource: value.MsaResource,
        }

        if (this.nameMapping[composerInstance.name]) {
          this.nameMapping[composerInstance.name][component.name] = component.mergedName;
          if (component.isResource) {
            // __resource__ 标记该资源为主资源
            this.nameMapping[composerInstance.name]['__resource__'] = component.mergedName;
          }
        } else {
          this.nameMapping[composerInstance.name] = {
            [component.name]: component.mergedName,
          }
          if (component.isResource) {

            this.nameMapping[composerInstance.name]['__resource__'] = component.mergedName;
          }
        }
        this.mergedNames.add(mergeName(composerInstance.name, component.name));
      }
    }

  }

  getSpecs(str: string) {
    let preparedText = str;
    for (const rule of this.rules.preparsRules) {
      preparedText = rule.replace(preparedText);
    }

    const json = jsYaml.load(preparedText);
    const composer = get(json, 'Composer', {}) as Composer;
    const specs = {} as Record<string, { spec: string, type: string }>;
    for (const [key, value] of Object.entries(composer)) {
      const spec = buildinSpec[value.Component];
      if (spec !== undefined) {
        specs[key] = {
          type: specMapping[value.Component] || value.Component,
          spec
        };
      }
    }
    this.specs = specs;
    return {
      specMapping,
      specs
    };
  }

}



export default Engine;