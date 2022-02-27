import Axios from 'axios';
import moment from 'moment';
import { RULE_BASED_MODELS_API } from '../../../configs/api';

import { COLUMN_DATA_TYPES_KEYS } from '../../../configs/app';
import { RULE_BASED_MODELS_MSG } from '../../../configs/messages';
import { httpGet } from '../../../utils/http';
import { FILTER_FIELD_NAME, FILTER_OPERATORS } from '../configs';
import { DEFAULT_FILTER_TYPE, INITIAL_PAGINATION } from './configs';

/**
 * Validating Forecasting Date filter
 *
 * @param {String} dateRange
 */
export const validateForecastingDateRange = dateRange => {
  const { start = '', end = '' } = dateRange || {};

  if (!start) {
    return RULE_BASED_MODELS_MSG.start_date;
  }

  if (!end) {
    return RULE_BASED_MODELS_MSG.end_date;
  }

  if (!moment(start).isBefore(end)) {
    return RULE_BASED_MODELS_MSG.end_greater_than_start;
  }

  return '';
};

/**
 * Formatting payload o Params
 *
 * @param {Object} pagination, header, forecastDateRange
 *
 * @returns {Object} params
 */
export const getFormattedPayload = ({
  pagination = {},
  headers = [],
  forecastDateRange = {},
  filterType = DEFAULT_FILTER_TYPE,
}) => {
  const { page = INITIAL_PAGINATION.page, limit = INITIAL_PAGINATION.limit } =
    pagination || {};
  const { start: foreCastStartDate = '', end: foreCastEndDate = '' } =
    forecastDateRange || {};

  // Variables
  let params = {};

  const filters = [];
  const sort = {};

  // Get Filtered records after applying filters
  headers.forEach(header => {
    const {
      filter,
      name,
      dataType,
      sort: { sortBy = '', sortDirection = '' },
      filterType: headerFilterType = '',
    } = header || {};
    const { searchInput = '', dateRange = {}, rangeValue = [] } = filter || {};

    // Add Sort by ASC/DESC
    if (filterType == headerFilterType && sortBy && sortDirection) {
      sort[sortBy] = sortDirection;
    }

    // Add Search by Input
    if (
      filterType == headerFilterType &&
      dataType == COLUMN_DATA_TYPES_KEYS.alphanumeric &&
      searchInput
    ) {
      filters.push({
        field_name: name,
        operator: FILTER_OPERATORS.like,
        values: searchInput,
      });
    }

    // Date Range
    const { start, end } = dateRange || {};

    if (
      filterType == headerFilterType &&
      dataType == COLUMN_DATA_TYPES_KEYS.date &&
      start &&
      end
    ) {
      filters.push({
        field_name: name,
        operator: FILTER_OPERATORS.between,
        values: [start, end],
      });
    }

    // Add Number Range Filter
    if (
      filterType == headerFilterType &&
      dataType == COLUMN_DATA_TYPES_KEYS.amount &&
      rangeValue &&
      rangeValue.length > 1
    ) {
      const [min, max] = rangeValue || [];

      filters.push({
        field_name: name,
        operator: FILTER_OPERATORS.between,
        values: [min, max],
      });
    }
  });

  // Forecast Date range
  if (forecastDateRange && foreCastStartDate && foreCastEndDate) {
    filters.push({
      field_name: FILTER_FIELD_NAME.forecastRange,
      operator: FILTER_OPERATORS.between,
      values: [foreCastStartDate, foreCastEndDate],
    });
  }

  // Preparing params to send API
  params = {
    ...params,
    limit,
    page: page == 1 ? 1 : page,
    filters,
    order_by: sort,
  };

  return { params };
};

/**
 *
 * Get Amount Range for single Header
 * @param {String} sourceTableID,
 * @param {String} fieldId,
 *
 * @returns {Object}
 */
export const getAmountRangeForSingleHeader = async ({
  sourceTableID = '',
  fieldId = '',
}) => {
  try {
    const url = RULE_BASED_MODELS_API.GET_MIN_MAX_RANGE.replace(
      '#SOURCE_ID#',
      sourceTableID
    ).replace('#FIELD_ID#', fieldId);

    const {
      data: { range: { min_value = '', max_value = '' } = {} } = {},
    } = await httpGet(url);

    const rangeData = {
      min_range: min_value,
      max_range: max_value,
    };
    return rangeData;
  } catch (error) {
    return error;
  }
};

/**
 *
 * Get Amount Range for Headers
 * @param {Array} formattedHeaders,
 * @param {String} sourceTableID,
 *
 * @returns {Array}
 */
export const getAmountRangeForHeaders = async ({
  formattedHeaders = [],
  sourceTableID = '',
}) => {
  try {
    const amountColumns = formattedHeaders.filter(
      ({ dataType = '', isFilterEnable = '' }) =>
        dataType == COLUMN_DATA_TYPES_KEYS.amount && isFilterEnable
    );

    // getting amount range for amount columns
    const rangeAmountData = amountColumns.map(({ id = '' }) => {
      const rangeData = getAmountRangeForSingleHeader({
        sourceTableID,
        fieldId: id,
      });

      return rangeData;
    });

    const result = await Axios.all(rangeAmountData);

    // add rangeData key in header object
    amountColumns.forEach((col, index) => {
      col.rangeData = { [col.name]: result[index] };
    });
  } catch (error) {
    console.error(error);
  }
  return formattedHeaders;
};
