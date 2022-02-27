import { API_URLS } from '../../../configs/api';
import { httpGet } from '../../../utils/http';

/**
 * Validate Dimension name is already exist or not
 *
 * @param {String} name
 */
export const validateDimensionName = async name => {
  const encodedTableName = encodeURIComponent(name);
  const url = API_URLS.VALIDATE_DIMENSION_NAME.replace(
    '#NAME#',
    encodedTableName
  );

  return httpGet(url);
};
