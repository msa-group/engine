import UtilsHelper from "./buildin-helper/utils";
import log from "./log";
import { getIndent } from "./utils";

export interface IParseRule {
  name?: string;
  replace: (str: string, context?: any, key?: string, nameMapping?: Record<string, Record<string, string | boolean>>, addIndent?: boolean) => string;
}

class ParserRules {
  preparsRules: Array<IParseRule>;
  postParseRules: Array<IParseRule>;
  rule: {
    templateWithAnnotationToHandlebars: IParseRule;
    parseDoubleCurliesAndEvalCall: IParseRule;
    ifLogic: IParseRule;
  }

  constructor() {
    this.preparsRules = [
      {
        name: "handlebars",
        replace(str: string) {
          const match = /{{([^}]+)}}/g;
          return str.replace(match, (_match, p1) => {
            if (/^(#if|else|\/if)/g.test(p1)) return `{{${p1}}}`;
            return `"#%%${p1.replace(/"/g, '\\"')}%%"`;
          })
        }
      },

    ]

    this.rule = {
      ifLogic: {
        replace(str: string, context: any, key?: string, nameMapping?) {
          // const match = /#['"]%%#if ([\s\S]*?)%%['"]/g;
          const match = /{{#if ([\s\S]*?)}}/g;
          const text = str.replace(match, (_match, p1, index) => {
            const innerMatch = /\b(\w+(?:\.\w+)*)\b|"[^"]*"|'[^']*'|\b\d+\b|\b(?:true|false)\b/g
            const t = p1.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(innerMatch, (match, p2) => {
              if (
                match.startsWith('"') && match.endsWith('"') ||
                match.startsWith("'") && match.endsWith("'") ||
                /^\d+$/.test(match) ||
                /^(true|false)$/.test(match)
              ) {
                return match;
              }
              if (p2 && p2.includes('.')) {
                const parts = p2.split('.');
                parts[0] = `context.${parts[0]}`;
                return parts.join('.');
              }
              const r = p2 ? `context.${match}` : match;
              // 兼容写法, 为了能让 template 被标记了 MsaResource 的资源能在外部直接以 [Key] 的形式直接使用
              // 而不需要通过 [Key][Name] 的形式使用
              // 例如: ChatgptWeb 被标记了 MsaResource, 那么在外部可以直接使用 ChatgptWeb 而不需要通过 ChatgptWeb.Function 的形式使用
              if (nameMapping) {
                if (nameMapping[match]) {
                  if (!nameMapping[match].__resource__) {
                    log.warn(`There is not a primary resource in ${match}, Please check you template`);
                    return undefined;
                  }
                  return `${r}.__resource__`;
                }
              }
              return r;
            });
            const res = eval(t);
            if (res === undefined) {
              log.warn(`${p1} is undefined in ${key}, Please check you Composer`);
            }
            return `{{#if ${Boolean(res)}}}`
          });
          return text;
        }
      },
      parseDoubleCurliesAndEvalCall: {
        replace(str: string, context: any, key?: string, nameMapping?, addIndent = false) {
          const match = /["']#%%([\s\S]*?)%%["']/g;
          let indent = 0;
          const text = str.replace(match, (_match, p1, index) => {
            const innerMatch = /\b(\w+(?:\.\w+)*)\b|"[^"]*"|'[^']*'|\b\d+\b|\b(?:true|false)\b/g
            const t = p1.replace(/\\"/g, '"').replace(/''/g, "'").replace(innerMatch, (match, p2) => {
              if (
                match.startsWith('"') && match.endsWith('"') ||
                match.startsWith("'") && match.endsWith("'") ||
                /^\d+$/.test(match) ||
                /^(true|false)$/.test(match)
              ) {
                return match;
              }
              if (p2 && p2.includes('.')) {
                const parts = p2.split('.');
                parts[0] = `context.${parts[0]}`;
                return parts.join('.');
              }
              const r = p2 ? `context.${match}` : match;
              // 兼容写法, 为了能让 template 被标记了 MsaResource 的资源能在外部直接以 [Key] 的形式直接使用
              // 而不需要通过 [Key][Name] 的形式使用
              // 例如: ChatgptWeb 被标记了 MsaResource, 那么在外部可以直接使用 ChatgptWeb 而不需要通过 ChatgptWeb.Function 的形式使用
              if (nameMapping) {
                if (nameMapping[match]) {
                  if (!nameMapping[match].__resource__) {
                    log.warn(`There is not a primary resource in ${match}, Please check you template`);
                    return undefined;
                  }
                  return `${r}.__resource__`;
                }
              }
              return r;
            });
            const res = eval(t);
            if (res === undefined) {
              log.warn(`${p1} is undefined in ${key}, Please check you Composer`);
            }
            if (typeof res === 'string' && addIndent) {
              indent = getIndent(str, index);
            }
            return UtilsHelper.JSONStringify(res, indent);
          });
          return text;
        }
      },
      /**
       * 将被转为注释的特定符号的模版再转回 {{}} 模版语法
       */
      templateWithAnnotationToHandlebars: {
        replace(str: string) {
          const match = /#%%(.*?)%%/g;
          return str.replace(match, (_match, p1) => {
            return `{{${p1.replace(/\\/g, '')}}}`;
          })
        }
      },

    }

  }
}

export default ParserRules;