import moment from 'moment';
import { sum } from 'mathjs';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import { DEFAULT_CELL, HEADER_DATE_FORMAT } from '../AmountGrid/configs';
import { OPERATOR_TYPES } from './configs';
import getNumbersWithFirstCharSymbol from '../../../../utils/helper/getNumbersWithFirstCharSymbol';

/**
 * Get Empty Grid
 *
 * @return {Array}
 */
export const getEmptyGrid = () => {
  const emptyCol = { ...DEFAULT_CELL, value: '', readOnly: false };

  const emptyRow = Array.apply(0, Array(14)).map(() => emptyCol);
  emptyRow[0].readOnly = true;

  return [emptyRow];
};

/**
 * On Change Input Value
 *
 * @param {Object} field
 *
 * @return {String|Number|Object}
 */
export const getValidInputValue = ({ evt, field }) => {
  let value = '';

  switch (field.data_type) {
    case COLUMN_DATA_TYPES_KEYS.alphanumeric:
      ({ value } = evt.target);
      break;

    case COLUMN_DATA_TYPES_KEYS.amount:
      ({ value } = evt.target);
      value = getNumbersWithFirstCharSymbol(value, true);
      break;

    case COLUMN_DATA_TYPES_KEYS.date:
      value = moment(evt);
      value = value.isValid() ? value.format(field.date_format) : '';
      break;

    default:
      break;
  }

  return value;
};

/**
 * Get formatted Grid Data
 *
 * @param {Object}
 *
 * @return {Array}
 */
export const getFormattedGridData = ({
  data,
  headers,
  isAddNew,
  operator,
} = {}) => {
  const DEFAULT_API_CELL = { amount: '' };
  const amountData = data.amount_data || [];

  const isStartFromJan = headers[1].label == 'Jan';
  const startMonth = moment(headers[1].label, 'MMM').month() + 1;

  const { forecast_start_date: forecastStartDate } = data.scenario_meta || {};

  const min_max_data = data.min_max_data || {};
  const { min_date = '', max_date = '' } = min_max_data;

  const minDate = moment(min_date);
  const maxDate = moment(max_date, '');

  const minYear = minDate.year();
  const minMonth = minDate.month() + 1;

  let maxYear = maxDate.year();
  let maxMonth = maxDate.month() + 1;

  let forecastDateObj = null;
  if (forecastStartDate) {
    forecastDateObj = moment(forecastStartDate, 'MMMM YYYY');
    const forecastYear = forecastDateObj.year();
    const forecastMonth = forecastDateObj.month() + 1;

    if (forecastYear >= maxYear) {
      maxYear = forecastYear;
      maxDate.year(forecastYear);

      if (forecastMonth > maxMonth) {
        maxMonth = forecastMonth;
        maxDate.month(forecastMonth - 1);
      }
    }
  }

  const years = {};
  const yearsArray = [];

  for (let i = minYear; i <= maxYear; i++) yearsArray.push(i);

  if (!isStartFromJan) {
    if (minMonth < startMonth) yearsArray.unshift(yearsArray[0] - 1);
    if (maxMonth < startMonth) yearsArray.pop();
  }

  amountData.forEach(cell => {
    if (!cell.month) return;

    const [, y] = cell.month.split(' ');

    if (!years[y]) years[y] = [];

    const monthIndex = moment(cell.month).month() + 1;
    if (!years[y][monthIndex]) years[y][monthIndex] = {};

    years[y][monthIndex] = cell;
  });

  const gridData = yearsArray.map(y => {
    if (!years[y]) years[y] = [];

    const cells = [];

    return headers.map((header, headerIndex) => {
      // Data for First Column (Years Vertical Headers)
      if (headerIndex == 0) {
        return {
          ...DEFAULT_CELL,
          value: isStartFromJan ? y : `${y}-${String(y + 1).substring(0, 4)}`,
        };
      }

      // Make header key for retrieve data
      let headerKey = headerIndex;
      if (headerKey != headers.length - 1) {
        headerKey = moment(header.value, HEADER_DATE_FORMAT).month() + 1;
      }

      // Read Cell as per Year and Month
      let cell = { ...DEFAULT_API_CELL };
      let year = y;
      if (isStartFromJan) {
        cell = years[year][headerKey] || cell;
      } else if (headerKey < startMonth) {
        year++;
        const yearData = years[year] || [];
        cell = yearData[headerKey] || cell;
      } else {
        cell = years[year][headerKey] || cell;
      }

      let readOnly = false;
      let isForecast = false;

      // Apply forecast date condition for cell edition
      if (
        forecastDateObj &&
        forecastDateObj.isAfter(
          moment(`${header.value} ${year}`, `${HEADER_DATE_FORMAT} YYYY`)
        )
      ) {
        readOnly = true;
      } else if (forecastStartDate) {
        isForecast = true;
      }

      let value = isAddNew ? '' : cell.amount;

      cells.push(value || '');

      // Assign Fiscal Year Total (Last Column)
      if (!isAddNew && headerKey == headers.length - 1) {
        readOnly = true;

        // Prepare Fiscal Year Total
        value = getFiscalTotal(cells, operator);
      }

      // Assign Cell Value
      return {
        ...DEFAULT_CELL,
        value,
        readOnly,
        isForecast,
      };
    });
  });

  return gridData;
};

/**
 * Get Fiscal Total by it's operator
 *
 * @param {Array} values
 * @param {String} operator
 */
export const getFiscalTotal = (values, operator) => {
  switch (operator) {
    case OPERATOR_TYPES.sum:
      return sum(values);

    case OPERATOR_TYPES.avg:
      return sum(values) / 12 || 0;

    case OPERATOR_TYPES.eop:
      return values[values.length - 2] || 0;

    default:
      return 0;
  }
};

/**
 * Verify > Is user did changes in filters
 *
 * @param {Object} state
 * @param {Object}
 *
 * @return {Boolean}
 */
export const isFiltersUpdated = (
  state,
  { fieldName, searchInput, dateRange, amountRange }
) => {
  // const { search, selectedDateRange, selectedAmountRange } = state;
  const { selectedDateRange, selectedAmountRange } = state;

  // const existSearch = search[fieldName] || '';
  const existDateRange = selectedDateRange[fieldName] || { start: '', end: '' };
  const existAmountRange = selectedAmountRange[fieldName] || ['', ''];

  if (
    // existSearch == searchInput &&
    existDateRange &&
    dateRange &&
    existDateRange.start == dateRange.start &&
    existDateRange.end == dateRange.end &&
    existAmountRange &&
    amountRange &&
    existAmountRange[0] == amountRange[0] &&
    existAmountRange[1] == amountRange[1]
  ) {
    return false;
  }

  return true;
};

/**
 * Get formatted filters to get record
 *
 * @param {Object} state
 *
 * @return {String}
 */
export const getFormattedFilters = (state, selectedField) => {
  const {
    currentPage,
    sortBy,
    sortDirection,

    search,
    selectedDateRange,
    selectedAmountRange,

    colValuesList,
  } = state;

  const filters = [];

  const params = {
    page: currentPage,
    limit: 1,
  };

  // Add Sort
  if (sortBy) params.order_by_col = sortBy;
  if (sortDirection) params.order_by = sortDirection;

  // Add Search
  Object.keys(search && {}).forEach(key => {
    const value = search[key];
    let isRelated = false;

    if (!value) return;

    const field = selectedField.filter(field => field.name === key);

    if (field && field.length > 0) {
      const [first] = field;
      isRelated = first.is_related;
    }

    filters.push({ name: key, op: !isRelated ? 'like' : '=', value });
  });

  // Format Date Range Filter
  Object.keys(selectedDateRange).forEach(key => {
    const { start, end } = selectedDateRange[key];

    if (start) {
      filters.push({ name: key, op: 'gte', value: start });
    }

    if (end) {
      filters.push({ name: key, op: 'lte', value: end });
    }
  });

  // Format Amount Range Filter
  Object.keys(selectedAmountRange).forEach(key => {
    const [min, max] = selectedAmountRange[key];

    if (min) filters.push({ name: key, op: 'gte', value: Number(min) });

    if (max) filters.push({ name: key, op: 'lte', value: Number(max) });
  });

  Object.keys(colValuesList).forEach(key => {
    const valuesList = colValuesList[key] || { data: [] };

    const { field, selectedValues = {} } = valuesList;

    if (!field || !selectedValues || Object.keys(selectedValues).length == 0) {
      return;
    }

    const values = [];

    Object.keys(selectedValues).forEach(name => {
      const selectedValueObj = selectedValues[name];

      values.push(selectedValueObj.id);
    });

    filters.push({
      id: field.id,
      name: field.name,
      op: 'in',
      value: values,
    });
  });

  // Add Filters
  if (filters.length > 0) {
    params.q = btoa(JSON.stringify({ filters }));
    params.filtersQuery = JSON.stringify({ filters });
  }

  return params;
};

/**
 * Get formatted params to save record
 *
 * @param {Object} state
 * @param {Object} props
 *
 * @return {Object}
 */
export const getFormattedParamsToSaveRecord = (state, props) => {
  const API_DATE_FORMAT = 'YYYY-MM-DD';
  const { selectedFields } = props;
  const { inputs, data, originalInputs, isAddNew, headers } = state;

  const fields_data = [];
  let filters = [];
  let amount_data = [];

  const isStartFromJan = headers[1].label == 'Jan';
  const startMonth = moment(headers[1].label, 'MMM').month() + 1;

  selectedFields.forEach(f => {
    let value = inputs[`${f.user_table_id}-${f.name}`];
    let originalInputValue = originalInputs[`${f.user_table_id}-${f.name}`];

    if (f.data_type == COLUMN_DATA_TYPES_KEYS.date && value) {
      value = moment(value, f.date_format).format(API_DATE_FORMAT);

      if (originalInputValue) {
        originalInputValue = moment(originalInputValue, f.date_format).format(
          API_DATE_FORMAT
        );
      }
    }

    // Prepare Filters
    filters.push({
      table_id: f.user_table_id,
      id: f.id,
      value: isAddNew ? value : originalInputValue,
      is_editable: f.is_editable ? 1 : 0,
    });

    // Prepare Fields Data to Update
    fields_data.push({
      table_id: f.user_table_id,
      id: f.id,
      value,
      is_editable: f.is_editable ? 1 : 0,
    });
  });

  // Prepare Grid Data to Update
  data.forEach(row => {
    const [yearCol] = row;

    const date = moment(yearCol.value || undefined, 'YYYY');
    let isYearAdded = false;

    row.forEach((col, colIndex) => {
      if (colIndex == 0 || colIndex == row.length - 1) return;

      if (col.isUpdated) {
        const headerCell = headers[colIndex] || {};
        const month = date.set({ month: headerCell.value }).month() + 1;

        if (!isYearAdded && !isStartFromJan && month < startMonth) {
          date.add(1, 'y');
          isYearAdded = true;
        }

        const monthYear = date.month(headerCell.value).format('MMMM YYYY');
        amount_data.push({
          amount: col.value == '' ? null : col.value,
          month: monthYear,
        });
      }
    });
  });

  if (amount_data.length == 0) amount_data = undefined;
  if (filters.length == 0) filters = undefined;

  return {
    params: {
      data: { fields_data, amount_data },
      action: isAddNew ? 'create' : 'update',
      filters,
    },
  };
};
