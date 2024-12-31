import { isEmpty } from "radash";
import { randomStringOrNumber } from "../utils";
import log from "../log";

const Utils = {
  /**
   * 判断是否为 Https， 参数有可能为 Object
   * @param url
   * @returns
   */
  IsTls: (url: unknown) => {
    const urlString = typeof url === "object" ? JSON.stringify(url) : String(url);
    if (/:443/.test(urlString)) {
      return true;
    } else {
      return false;
    }
  },
  /**
   * 将参数转为 JSON 字符串
   * 参数有可能为 Object、Array、String、Number、Function
   * 如果是 Object 类型，则需要将单花括号替换为特定字符，以避免 handles 解析错误
   * 详见 templateWithLTToHandlebars 规则
   */
  JSONStringify: (value, indent = 0) => {
    if (value === undefined || value === null) return value;
    if (typeof value === "string") {
      // 处理多行字符串， 并且保持正确缩进
      if (value.includes("\n")) {
        let s = '| \n';
        const lines = value.split('\n');
        for (let i = 0; i < lines.length; i++) {
          s += `${' '.repeat(indent + 2)}${lines[i]}\n`;
        }
        return s;
      }
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "function" ||
      typeof value === "boolean"
    ) return value;
    return JSON.stringify(value);
  },

  SubfixRandom: (str: string, len: number = 4, symbol: string = '-') => {
    return `${str}${symbol}${randomStringOrNumber(len)}`;
  },

  Subfix: (function () {
    let suffix = '';
    return (str: string, len: number = 4, symbol: string = '-') => {
      if (suffix) return `${str}${symbol}${suffix}`;
      suffix = randomStringOrNumber(len);
      return `${str}${symbol}${suffix}`;
    }
  })(),

  Join: (arr: string[], symbol: string = '') => {
    return arr.join(symbol);
  },

  Default: <T, B>(value: T, defaultValue: B) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return value;
  },

  GetOperationPath: (operation: { Path: string }, type: "type" | "value") => {
    if (!operation || isEmpty(operation)) {
      log.warn('operation is undefined');
      return "";
    };
    const [pathType, pathValue] = (operation.Path || "").split(" ");
    if (type === "type") {
      return pathType;
    } else if (type === "value") {
      return pathValue;
    }
  },

  IsEmpty: (value: unknown) => {
    return value === undefined || value === null || value === '';
  },

  isNotEmpty: (value: unknown) => {
    return !Utils.IsEmpty(value);
  },

}

export default Utils;
