import { get } from 'lodash';
import moment from 'moment';

/**
 * Get Formatted Rule Based Models List
 *
 * @param {Array} data
 *
 * @param {Array}
 */
export const getFormattedRuleBasedModelList = data => {
  return data.map(item => ({
    ...item,
    ...getFormattedDates(item),
    ...getSrcDetails(item),
  }));
};

/**
 * Get Formatted Dates
 *
 * @param {Object}
 */
export const getFormattedDates = ({ created_at, updated_at } = {}) => {
  let createdAt = '';
  let updatedAt = '';

  if (created_at) createdAt = moment.utc(created_at).local().calendar();

  if (updated_at) updatedAt = moment.utc(updated_at).local().calendar();

  return { createdAt, updatedAt };
};

/**
 * Get Source details for Rule Based Model
 *
 * @param {Object} ruleBasedModel
 *
 * @param {Object}
 */
export const getSrcDetails = ruleBasedModels => {
  const srcType = 'Scenario';
  const srcIcon = 'scenario.svg';
  const srcName =
    get(ruleBasedModels, 'scenario.scenario_meta.dataset_name') || '';

  return { srcType, srcIcon, srcName };
};
