import { getComparionsHelper } from './comparison';
import { getUtilsHelper } from './utils';
import { getRosHelper } from './ros';


export const getBuildInHelper = () => {
  return {
    ...getComparionsHelper(),
    ...getUtilsHelper(),
    ...getRosHelper(),
  };
}
