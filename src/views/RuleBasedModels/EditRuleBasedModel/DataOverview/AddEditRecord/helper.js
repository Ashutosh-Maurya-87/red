import moment from 'moment';
import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
} from '../../../../../configs/app';
import { MATCH_LOOKUP_COLUMN_FIELD_SUFFIX } from '../helper';

/**
 * Create default state of add/edit record
 *
 * @param {Object} data
 * @returns
 */
export const getInitialState = ({ headers, data, index }) => {
  const state = {};

  headers.forEach((header, headerIndex) => {
    if (headerIndex == 0) return;

    const { name = '', dataType = '', dimension_mapping = {} } = header || {};

    if (index != null && index > -1) {
      const { value = '', valueIdentifier = '' } =
        data[index][headerIndex] || {};

      if (dataType == COLUMN_DATA_TYPES_KEYS.date) {
        state[name] = value ? moment(value).format(DEFAULT_DATE_FORMAT) : '';
      } else {
        if (dimension_mapping && Object.keys(dimension_mapping).length > 0) {
          state[name] = valueIdentifier || '';
          state[`${name}${MATCH_LOOKUP_COLUMN_FIELD_SUFFIX}`] = value || '';

          return;
        }
        state[name] = value || '';
      }

      return;
    }

    state[name] = '';
  });

  return state;
};

/**
 * Create default header state of add/edit record
 *
 * @param {Object} data
 * @returns
 */
export const getInitialHeaders = ({ headers = [], singleRBM = {} }) => {
  const updatedHeaders = [];

  const { configuration: { rules = '', attributes = [] } = {} } =
    singleRBM || {};

  const fieldArrays = [...attributes, ...rules];

  headers.forEach((header, headerIndex) => {
    const { name = '' } = header || {};

    const index = fieldArrays.findIndex(
      ({ forecast_column = '', name: attName = '' }) =>
        name == forecast_column || name == attName
    );

    if (index > -1) {
      const { rule_uid = '', dimension_mapping = null } = fieldArrays[index];

      const type = rule_uid ? 'rules' : 'attributes';

      header = {
        ...header,
        dimension_mapping,
        type,
      };

      updatedHeaders.push(header);
    }
  });

  return updatedHeaders;
};

/**
 * Getting isUnique key
 *
 * @param {Array} headers
 * @returns
 */
export const isValidForm = (headers, record) => {
  const indexOfUniqueEle = headers.findIndex(
    ({ isUnique = false, name = '' }) => isUnique && !record[name]
  );

  return indexOfUniqueEle > -1;
};

/**
 * Get formatted dimension Field values
 */
export const getFormattedDimensionField = ({
  identifierName = '',
  identifierCol = '',
  nameValue = '',
  identifierValue = '',
}) => {
  if (!nameValue || !identifierValue) return '';

  const isMatched = identifierCol == identifierName;

  return !isMatched
    ? `${nameValue || ''} (${identifierValue})`
    : nameValue || '';
};
