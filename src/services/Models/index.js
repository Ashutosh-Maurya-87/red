import { ASSUMPTIONS_API } from '../../configs/api';
import { httpGet } from '../../utils/http';

export const getAssumptionData = async id => {
  const getAssumptionDataUrl = ASSUMPTIONS_API.GET_ASSUMPTION_Listing.replace(
    '#ID#',
    id
  );
  const { data } = await httpGet(getAssumptionDataUrl, { hideError: true });
  return data;
};
