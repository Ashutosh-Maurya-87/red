import { orderBy } from 'lodash';
import moment from 'moment';

import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import {
  DEFAULT_FILTER_CONFIG,
  DEFAULT_FILTER_TYPE,
  DEFAULT_SORT_CONFIG,
} from '../configs';

// Match cell value for overview/forecast if field is mapped with dimension
export const MATCH_LOOKUP_COLUMN_FIELD_SUFFIX = '_lookup';

/**
 * Formatted Horizontal Headers (API Headers)
 *
 * @param {Object} { headersApi, options }
 *
 * @return {Array}
 */
export const getFormattedGridHeaders = ({ headersApi, options = {} }) => {
  // Sort Headers Date Array (Asc)
  const sortedHeaders = orderBy(
    headersApi,
    ({ label }) => moment(label).format('YYYYMMDD'),
    ['asc']
  );

  const headers = ['', ...sortedHeaders].map(header => {
    const {
      display_name = '',
      name = '',
      data_type = '',
      date_format = '',
      id = '',
      filterType = DEFAULT_FILTER_TYPE, // default filter type is online for all fields
      is_unique = false,
    } = header || {};

    return {
      label: display_name || '',
      value: display_name || '',
      name: name || '',
      dataType: data_type || '',
      dateFormat: date_format || '',
      isFilterEnable: true,
      isSortingEnable: true,
      filter: DEFAULT_FILTER_CONFIG,
      filterType,
      sort: DEFAULT_SORT_CONFIG,
      id,
      isUnique: is_unique,
    };
  });

  return headers;
};

/**
 * Get formatted Grid Data
 *
 * @param {Object}
 *
 * @return {Object} { gridData }
 */
export const getFormattedGridData = ({
  data,
  headers,
  affa_record_id: recordId = '',
}) => {
  const gridData = [];

  if (data && data.length === 0) return gridData;

  data.forEach((row, rowIndex) => {
    const rowData = [];
    const { affa_record_id = '' } = row || {};

    ['', ...headers].forEach(({ name }) => {
      let value = '';

      // In case of Cell having value
      if (row[name] != null) {
        value = String(row[name]) || '';
      }

      // In case of mapped dimension field
      if (row[`${name}${MATCH_LOOKUP_COLUMN_FIELD_SUFFIX}`]) {
        value = String(row[`${name}${MATCH_LOOKUP_COLUMN_FIELD_SUFFIX}`]) || '';
      }

      const cell = {
        value,
        valueIdentifier: row[name] || '',
        recordId: affa_record_id || recordId || '',
      };

      rowData.push(cell);
    });

    gridData.push(rowData);
  });

  return gridData;
};

/**
 * Identify to hide/show Filter Icon
 */
export const isHideFilter = (column = {}) => {
  const {
    dataType = '',
    filter: { searchInput = '', dateRange = {}, rangeValue = [] } = {},
  } = column || {};

  const [min, max] = rangeValue || [];
  const { start = '', end = '' } = dateRange || {};

  if (dataType == COLUMN_DATA_TYPES_KEYS.alphanumeric && searchInput) {
    return false;
  }

  if (dataType == COLUMN_DATA_TYPES_KEYS.date && (start != '' || end != '')) {
    return false;
  }

  if (dataType == COLUMN_DATA_TYPES_KEYS.amount && (min > 0 || max < 100000)) {
    return false;
  }

  return true;
};
