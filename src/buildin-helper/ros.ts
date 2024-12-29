import { toArray, toNotEmptyArray } from "../utils";

const Ros = {
  RosOutput: (...params: any[]) => {
    const temp = {
      ['Fn::GetAtt']: toNotEmptyArray(params),
    };
    return temp;
  },
  RosOutputHostName: (...params: any[]) => {
    const temp = {
      ['Fn::Select']: [
        '1',
        {
          ['Fn::Split']: ['://', Ros.RosOutput(...params)],
        },
      ],
    };
    return temp;
  },
  RosRouterServices: (service: any[], scene?: string) => {
    const services = toArray(service);
    const serviceIds = services.map((_item, i) => `ServiceId${i + 1}`);
    const json = !scene ?
      (
        services.map((item, i) => ({
          ...item,
          ServiceId: `\${${serviceIds[i]}}`,
        }))
      ) :
      (
        {
          Services: services.map((item, i) => ({
            ...item,
            ServiceId: `\${${serviceIds[i]}}`,
          })),
          Scene: scene,
        }
      );
    const serviceJSONString = JSON.stringify(json);
    const serviceObject = services.reduce((acc, item, i) => {
      return {
        ...acc,
        [serviceIds[i]]: item?.['ServiceId'],
      }
    }, {});

    const temp = {
      ["Fn::Sub"]: [
        serviceJSONString,
        serviceObject,
      ]
    }
    return temp;
  },
  RosArray: (arr: any[]) => {
    const arrStr = arr.map((_item, i) => `\${item${i + 1}}`);
    const res = arr.reduce((acc, item, i) => {
      return {
        ...acc,
        [`item${i + 1}`]: item,
      }
    }, {});
    const temp = {
      ["Fn::Sub"]: [
        JSON.stringify(arrStr),
        res,
      ]
    }
    return temp;
  }
}

export default Ros;