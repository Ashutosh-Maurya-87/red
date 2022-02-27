import { MODELS_API } from '../../../configs/api';
import { httpGet } from '../../../utils/http';
import getNumbers from '../../../utils/helper/getNumbers';

/**
 * Validate Model name is already exist or not
 *
 * @param {String} name
 */
export const validateModelName = async name => {
  const encodedTableName = encodeURIComponent(name);
  const url = MODELS_API.VALIDATE_NAME.replace('#NAME#', encodedTableName);

  if (url) return Promise.resolve({ is_exists: false });

  return httpGet(url);
};

/**
 * Get Params to Create Model
 *
 * @param {Object} state
 *
 * @return {Object}
 */
export const getParamsToCreateModel = state => {
  const {
    modelName,
    scenario,
    startingYear,
    forecastingFor,
    isDuplicate,
  } = state;

  const params = {
    name: modelName,
    scenario_id: scenario.id,
    start_year: startingYear,
    number_of_forecast_years: getNumbers(forecastingFor),
  };

  const formData = new FormData();

  Object.keys(params).forEach(key => {
    formData.append(key, params[key]);
  });

  return isDuplicate ? params : formData;
};
