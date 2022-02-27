import {
  DEFAULT_FILTER_CONFIG,
  DEFAULT_FILTER_TYPE,
  DEFAULT_SORT_CONFIG,
  FILTER_TYPES,
} from '../configs';
import { getFormattedPayload } from '../helper';
import { MATCH_LOOKUP_COLUMN_FIELD_SUFFIX } from '../DataOverview/helper';

/**
 * Formatted Horizontal Headers (API Headers)
 *
 * @param {Object} { headersApi, options }
 *
 * @return {Array}
 */
export const getFormattedGridHeaders = ({
  forecastMetadata = [],
  metaData = [],
  customMetaData = [],
}) => {
  // Enable Filtering only on attribute fields
  metaData = metaData.map(data => {
    return {
      ...data,
      isFilterEnable: true,
    };
  });

  // Enable Filtering only on Custom fields
  customMetaData = customMetaData.map(data => {
    return {
      ...data,
      isFilterEnable: true,
    };
  });

  const combineHeaders = [...metaData, ...customMetaData, ...forecastMetadata];

  let headers = ['', ...combineHeaders].map(
    (
      {
        display_name,
        isSelected = true,
        name = '',
        data_type = '',
        date_format = '',
        isFilterEnable = false, // default filtering false to all fields
        isSortingEnable = false, // default Sorting false to all fields
        id = '',
        filterType = DEFAULT_FILTER_TYPE, // default filter type is online for all fields
      },
      i
    ) => {
      return {
        label: display_name || '',
        value: display_name || '',
        name: name || '',
        dataType: data_type || '',
        dateFormat: date_format || '',
        isSelected,
        isFilterEnable,
        isSortingEnable,
        filter: DEFAULT_FILTER_CONFIG,
        filterType,
        sort: DEFAULT_SORT_CONFIG,
        id,
      };
    }
  );

  headers = headers.filter(header => header.isSelected);

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
  data = [],
  forecastMetadata = [],
  metaData = [],
  customMetaData = [],
}) => {
  const combineHeaders = [...metaData, ...customMetaData, ...forecastMetadata];
  const gridData = [];

  if (data && data.length === 0) return gridData;

  data.forEach(row => {
    const rowData = [];
    ['', ...combineHeaders].forEach(({ name, isSelected = true }) => {
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
      };

      if (isSelected) {
        rowData.push(cell);
      }
    });

    gridData.push(rowData);
  });

  return gridData;
};

/**
 * Get formatted Grid Data
 *
 * @param {Object}
 *
 * @return {Object} {Data}
 */
export const applyOfflineFiltering = ({
  data = [],
  pagination = {},
  headers = [],
  forecastDateRange = [],
}) => {
  // Params with filters
  const { params = {} } = getFormattedPayload({
    pagination,
    headers,
    forecastDateRange,
    filterType: FILTER_TYPES.offline,
  });

  const { filters = [] } = params || {};

  if (!filters || filters.length == 0) return { filteredData: data };

  filters.pop(); // Remove last element of array

  const filteredData = data.filter(
    row =>
      filters.filter(item =>
        row[item.field_name]?.toLowerCase().includes(item.values?.toLowerCase())
      ).length === filters.length
  );

  return { filteredData };
};
