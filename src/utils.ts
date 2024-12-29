export function toArray<T>(value: T): T[] {
  return Array.isArray(value) ? value : [value];
}

export function toNotEmptyArray<T>(value: T): T[] {
  return toArray(value).filter(Boolean);
}

export function sortByDependsOn(list: [string, any][]) {
  const result = [];
  const visited = new Set();

  function visit([key, item]: [string, any]) {
    if (visited.has(item)) return;
    const dependsOn = toNotEmptyArray(item.DependsOn);
    if (dependsOn.length > 0) {
      for (const dependency of dependsOn) {
        if (!dependency) continue;
        const [depName] = dependency.split('.');
        const depItem = list.find(([name]) => name === depName);
        if (depItem) {
          visit(depItem);
        }
      }
    }
    visited.add(item);
    result.push([key, item]);
  }

  for (const item of list) {
    visit(item);
  }

  return result;
}

export function findKeyBy<T>(obj: T, targetKey: string, callback?: (obj: T, key: string) => void): any[] {
  const results: any[] = [];

  function traverse(currentObj: T) {
    for (const key in currentObj) {
      if (currentObj.hasOwnProperty(key)) {
        // 如果匹配目标 key，执行回调并添加到结果数组中
        if (key === targetKey) {
          callback?.(currentObj, key);
          results.push(currentObj[key]);
        }

        // 如果当前值是对象或数组，继续递归查找
        if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
          traverse(currentObj[key] as T);
        }
      }
    }
  }

  traverse(obj);
  return results;
}

/**
 * 将源文件内的左单花括号用特定符号替换
 * 确保 handles 能正常解析
 * @description 换了方案，不再需要这个函数
 * @example
 * asd: '{"asd": {"zxc": {{xxx}}}}'
 * 转换为
 * asd: '!&&"asd": !&&"zxc": {{xxx}}&&!&&!'
 */
export function replaceSingleParentheses(str: string) {
  const stack = [];
  const matches = [];
  let doubleBraces = [];
  let insideDoublesBraces = false;
  let res = "";


  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];
    if (char === '{' && nextChar === '{') {
      doubleBraces.push(...[i, i + 1]);
      insideDoublesBraces = true;
      i++; // 跳过第二个花括号
    } else if (char === '}' && nextChar === '}' && doubleBraces.length > 0) {
      doubleBraces = [];
      i++;
      insideDoublesBraces = false;
    } else if (char === '{' && !insideDoublesBraces) {
      stack.push(i);
    } else if (char === '}' && !insideDoublesBraces) {
      if (stack.length === 0) {
        throw new Error('Unbalanced braces');
      }
      const start = stack.pop();
      const match = { start, end: i };
      matches.push(match);
    }
  }

  if (stack.length > 0) {
    throw new Error('Unbalanced braces');
  }

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const inLeft = matches.find(v => v.start === i);
    const inRight = matches.find(v => v.end === i)
    if (inLeft) {
      res += "!&&"
    } else if (inRight) {
      res += "&&!"
    } else {
      res += char;
    }
  }

  return res;

}

export function mergeName(...names: string[]) {
  return names.join('');
}

export const randomStringOrNumber = (function () {
  const dir = new Set();
  return (len: number): string => {
    const res = Math.random().toString(36).substring(2, len + 2);
    if (dir.has(res)) {
      return randomStringOrNumber(len);
    }
    dir.add(res);
    return res;
  }
})();


export function getLineNumber(str: string, index: number) {
  const substring = str.substring(0, index);
  const lineNumber = (substring.match(/\n/g) || []).length + 1;
  return lineNumber;
}

export function getIndent(str: string, index: number) {
  const lines = str.split('\n');
  const line = getLineNumber(str, index);
  const currentLineContext = lines[line - 1];
  return currentLineContext.length - currentLineContext.trimStart().length;
}

export function removePrefix(obj: Record<string, any>, prefix = 'copy__') {
  const newObj = {};

  for (const key in obj) {
    const newKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    newObj[newKey] = obj[key];
  }

  return newObj;
}

export function extractParametersBlock(text) {
  const regex = /\s*Parameters:\s*\n((?:\s{2,}\w+:\n(?:\s{4}.*\n)*\s{4}.*\n?)*)/;
  const match = text.match(regex);

  if (match) {
    return `Parameters:\n${match[1]}`;
  }

  return '';
}


export function findItemInContextData(data: Record<string, any>, id: string) {
  for (const [key, value] of Object.entries(data)) {
    const children = value.children;
    const item = children.find(child => child.mergedName === id);
    if (item) {
      return { item, key };
    }
  }

  return null;
}

export function removeFileExtension(fileName) {
  return fileName.replace(/\.[^/.]+$/, '');
}
