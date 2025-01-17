import jsYaml from "js-yaml";
import Handlebars from "handlebars";
import { get, isEmpty } from "lodash";
import { pipe } from "lodash/fp";
import ParseEngine from "./parseEngine";
import ParserRules from "./parserRules";
import type { Composor, EngineContext, GlobalData, IGlobalDefaultParameters, ParseOptions } from "./types";
import { extractParametersBlock, mergeName, sortByDependsOn } from "./utils";
import { getBuildInHelper } from './buildin-helper';
import log from "./log";
import Composer from "./composer";
import Component from "./component";
import buildinComponents from './buildin-components';

class Engine {

  private rules: ParserRules;
  private context: EngineContext;
  private buildinHelpers: Record<string, any> = {};
  private registeredHelper: Record<string, any> = {};
  private globalData: GlobalData = { Parameters: {} };
  private nameMapping: Record<string, Record<string, string | boolean>> = {};
  private deletedMergedName: Set<string> = new Set();
  private mergedNames: Set<string> = new Set();

  constructor() {
    this.rules = new ParserRules();
    this.init();
  }

  private init() {
    this.nameMapping = {};
    this.deletedMergedName = new Set();
    this.mergedNames = new Set();
    this.context = {
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
    return new Promise(async (resolve, reject) => {
      try {
        await this.#preparse(str, { parameters, isComposer: true });
        // 将特殊处理后的模版交给 js-yaml load 解析出 json 格式数据
        this.#parseAsYaml();
        this.#createContextData();
        this.#parseAsHandlebars();
        this.#createContextData(false);
        const parseEngine = new ParseEngine(this.context);
        resolve(parseEngine);
      } catch (error) {
        reject(error);
      }
    });
  }

  async #preparse(text: string, config: { isComposer: boolean, parameters: Record<string, any> }) {
    let preparedText = text;
    for (const rule of this.rules.preparsRules) {
      preparedText = rule.replace(preparedText);
    }
    if (config.isComposer) {
      const contextData = {
        Parameters: {
          ...this.#mergedGlobalData(
            get(
              jsYaml.load(extractParametersBlock(preparedText)), 'Parameters', {}) as IGlobalDefaultParameters
          ),
          ...config.parameters,
        },
        ...this.buildinHelpers,
      }
      this.context.data = {
        ...this.context.data,
        ...contextData,
      }

      // 先由 handlebars 解析出 Composer 文本中的 if 表达式逻辑
      const parsedText = pipe(
        (text) => this.rules.rule.ifLogic.replace(text, contextData),
        (text) => Handlebars.compile(text, { noEscape: true }),
      )(preparedText)(contextData);
      this.#analyzeTemplate(parsedText);
      this.context.templateText.main = parsedText;
      await this.#parseSubTemplate(config);
    }
    return preparedText;
  }

  #mergedGlobalData(defaultParameters: IGlobalDefaultParameters) {
    const mergedParameters = {};
    for (const [key, value] of Object.entries(defaultParameters)) {
      mergedParameters[key] = value.Default;
    }
    return mergedParameters;
  }

  #analyzeTemplate(text: string) {
    const yamlJson = jsYaml.load(text) as Composor;
    const composer = yamlJson.Composer
    for (const [key, value] of Object.entries(composer)) {
      this.context.templateText.dependencies[key] = value.Component;
    }
    return this.context.templateText.dependencies;
  }

  async #parseSubTemplate(config: { parameters: Record<string, any>, isComposer: boolean }) {
    const dependencies = this.context.templateText.dependencies;
    for (const [key, value] of Object.entries(dependencies)) {
      const template = buildinComponents[value];
      this.context.templateText.dependencies[key] = await this.#preparse(template, { ...config, isComposer: false });
    }
  }

  #parseAsYaml() {
    try {
      const mainText = this.context.templateText.main;
      const mainYamlToJson = jsYaml.load(mainText);
      this.globalData.Parameters = {
        ...this.#mergedGlobalData(mainYamlToJson.Parameters || {}),
        ...this.context.data.Parameters,
      };
      this.context.templateJson.main = mainYamlToJson;
      this.#parseSubYamlTemplate();
    } catch (error) {
      log.error('Error parsing yaml template:', error);
      throw error;
    }
  }

  #parseSubYamlTemplate() {
    const dependencies = this.context.templateText.dependencies;
    for (const [key, text] of Object.entries(dependencies)) {
      const data = this.context.templateJson.main.Composer[key];
      const t = pipe(
        (text) => this.rules.rule.ifLogic.replace(text, {
          Parameters: {
            ...this.globalData.Parameters,
            ...data.Parameters,
          },
          ...this.buildinHelpers,
        }),
        (text) => Handlebars.compile(text, { noEscape: true }),
      )(text)({});
      const yamlToJson = jsYaml.load(t);
      this.context.templateJson.dependencies[key] = yamlToJson;
      this.context.templateText.dependencies[key] = t;
    }
  }

  #createContextData(init = true) {
    this.context.data = {};
    const sortedByDependsOn = sortByDependsOn(Object.entries(this.context.templateJson.main?.Composer || {}));
    for (const [key, value] of sortedByDependsOn) {
      const inContextData = this.context.data[key];
      const data = {
        name: key,
        parameters: value.Parameters,
        props: inContextData ? inContextData.props : value.Properties,
        dependsOn: value.DependsOn,
        operation: inContextData ? inContextData.operation : value.Operation,
        componentName: value.Component,
      }
      const composerInstance = new Composer(data, this.globalData);
      const dependencies = this.context.templateJson.dependencies;
      const currentDependencies = dependencies[key];
      if (!currentDependencies) continue;
      const sortedDependencies = sortByDependsOn(Object.entries(currentDependencies));
      for (const [key, value] of sortedDependencies) {
        const tempData = {
          name: key,
          parent: composerInstance,
          json: value,
          parameters: composerInstance.parameters,
          props: composerInstance.props?.[key] || {},
          dependsOn: value.DependsOn,
          localJson: currentDependencies,
          nameMapping: this.nameMapping,
          deletedMergedName: this.deletedMergedName,
          mergedNames: this.mergedNames,
          operation: composerInstance.operation,
          componentName: composerInstance.componentName,
        }
        const componentInstance = new Component(tempData);
        if (this.context.data[composerInstance.name]) {
          this.context.data[composerInstance.name].children.push(componentInstance);
        } else {
          this.context.data[composerInstance.name] = {
            ...composerInstance,
            children: [
              componentInstance,
            ],
          }
        }
        if (init) {
          if (this.nameMapping[composerInstance.name]) {
            this.nameMapping[composerInstance.name][componentInstance.name] = componentInstance.mergedName;
            if (componentInstance.isResource) {
              this.nameMapping[composerInstance.name]['__resource__'] = componentInstance.mergedName;
            }
          } else {
            this.nameMapping[composerInstance.name] = {
              [componentInstance.name]: componentInstance.mergedName,
            }
            if (componentInstance.isResource) {

              this.nameMapping[composerInstance.name]['__resource__'] = componentInstance.mergedName;
            }
          }
          this.mergedNames.add(mergeName(composerInstance.name, componentInstance.name));

        } else {
          const yamlText = componentInstance.toYaml()[componentInstance.mergedName];
          const indentedYamlText = yamlText
            .split('\n')
            .map((line, index) => index === 0 ? line : `  ${line}`)
            .join('\n');
          this.context.resultYamlString += `\n  ${indentedYamlText}\n`;
        }
      }

    }
  }

  #createOperationContext(operation: Record<string, any>) {
    if (!operation || isEmpty(operation)) return operation;
    const [pathType, pathValue] = (operation.Path || "").split(" ");
    const temp = {
      PathType: pathType,
      PathValue: pathValue,
      ...operation,
    }
    return temp;
  }

  #parseAsHandlebars() {
    this.context.templateJson.dependencies = [];
    const resultWithoutParseParametersList: ([string, string])[] = [];
    const mainYamlText = this.rules.rule.parseDoubleCurliesAndEvalCall.replace(
      this.context.templateText.main,
      {
        Parameters: this.globalData.Parameters,
        ...this.buildinHelpers,
        ...this.nameMapping,
      },
      'Composer',
      this.nameMapping,
    );


    const mainYamlToJson = jsYaml.load(mainYamlText);
    this.context.templateJson.main = mainYamlToJson;
    this.context.templateText.main = mainYamlText;
    const sortedByDependsOn = sortByDependsOn(Object.entries(this.context.templateJson.main?.Composer || {}));

    for (const [key, value] of sortedByDependsOn) {

      const props = value.Properties
      const operation = value.Operation || {};
      const data = {
        name: key,
        parameters: value.Parameters,
        props: props,
        dependsOn: value.DependsOn,
        operation: this.#createOperationContext(operation),
        componentName: value.Component,
      }
      const composerInstance = new Composer(data, this.globalData);
      if (this.context.data[key]) {
        this.context.data[key] = {
          ...this.context.data[key],
          ...composerInstance,
        }
        this.context.templateJson.main
      } else {
        this.context.data[key] = composerInstance;
      }
    }


    for (const [key, value] of Object.entries(this.context.templateText.dependencies)) {
      const currentData = this.context.data[key];
      if (!currentData) {
        continue;
      }

      if (!currentData.children) continue;
      const local = currentData.children.reduce((acc, child) => {
        acc[child.name] = child.json;
        return acc;
      }, {});


      const replaceContext = {
        Parameters: currentData.parameters,
        Operation: currentData.operation,
        Local: local,
        ...this.buildinHelpers,
        ...this.nameMapping,
      }

      const text = this.rules.rule.parseDoubleCurliesAndEvalCall.replace(
        value, replaceContext, key, this.nameMapping, true,
      );

      const parsedText = pipe(
        this.rules.rule.templateWithAnnotationToHandlebars.replace,
        (text) => this.rules.rule.parseDoubleCurliesAndEvalCall.replace(text, replaceContext),
      )(text);

      // 根据新生成的模版重新生成 nameMapping
      resultWithoutParseParametersList.push([key, parsedText]);
      this.context.templateJson.dependencies[key] = jsYaml.load(parsedText);
    }

    for (const [key, value] of Object.entries(this.context.templateJson.dependencies)) {
      const newTemplateNames = Object.keys(value);

      for (const [name] of Object.entries(this.nameMapping[key])) {
        if (!newTemplateNames.includes(name)) {
          this.deletedMergedName.add(mergeName(key, name));
          // throw new ParserError(`${name} 在 ${key} 中不存在`);
          this.nameMapping[key][name] = false
        }
      }
    }
  }

}

export default Engine;