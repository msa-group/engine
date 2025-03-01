


export const getComparionsHelper = () => {
  const Comparions = {
    and: (...args: unknown[]) => {
      return args.every(arg => arg);
    },
    or: (...args: unknown[]) => {
      return args.some(arg => arg);
    },
    not: (a: unknown) => {
      return !a;
    },
    eq: (a: unknown, b: unknown) => {
      if (typeof a === "object") {
        a = JSON.stringify(a);
      }
      if (typeof b === "object") {
        b = JSON.stringify(b);
      }
      return a === b;
    },
    ne: (a: unknown, b: unknown) => {
      return !Comparions.eq(a, b);
    },
    gt: (a: unknown, b: unknown) => {
      if (typeof a === "object") {
        a = JSON.stringify(a);
      }
      if (typeof b === "object") {
        b = JSON.stringify(b);
      }
      return a > b;
    },
    gte: (a: unknown, b: unknown) => {
      if (typeof a === "object") {
        a = JSON.stringify(a);
      }
      if (typeof b === "object") {
        b = JSON.stringify(b);
      }
      return a >= b;
    },
    lt: (a: unknown, b: unknown) => {
      if (typeof a === "object") {
        a = JSON.stringify(a);
      }
      if (typeof b === "object") {
        b = JSON.stringify(b);
      }
      return a < b;
    },
    lte: (a: unknown, b: unknown) => {
      if (typeof a === "object") {
        a = JSON.stringify(a);
      }
      if (typeof b === "object") {
        b = JSON.stringify(b);
      }
      return a <= b;
    },
  };
  return Comparions;
}

const ComparionsHelper = getComparionsHelper();

export default ComparionsHelper;