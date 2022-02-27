import moment from 'moment';
import { get, orderBy } from 'lodash';

import { MODELS_MSG } from '../../../configs/messages';
import {
  DEFAULT_COL_WIDTH,
  DEFAULT_LABEL_COL_WIDTH,
  DEFAULT_ROW_CONFIG,
  HEADER_DATE_FORMAT,
  MAX_ROWS,
  ROW_TYPES_KEYS,
} from './configs';

import { FIELD_TYPE_KEYS } from './GridPanel/configs';
import { validateFormula } from './FormulaBuilder/helper';
import getNumbers from '../../../utils/helper/getNumbers';
import { showErrorMsg } from '../../../utils/notifications';
import { getGridDensity } from '../../../utils/localStorage';

import { DEFAULT_DENSITY, DENSITY_SIZES_KEYS } from '../../../configs/density';
import { doCalculations } from '../../../utils/helper/mathCalculation';

/**
 * Horizontal Headers
 *
 * @param {String} fiscalMonth
 *
 * @return {Array}
 */
export const getInitialGridHeaders = fiscalMonth => {
  let month = 0;
  if (fiscalMonth) month = moment(fiscalMonth, 'MMM YYYY').month();

  const headers = [
    '',
    '',
    ...Array.apply(0, Array(60)).map((_, i) => {
      return moment()
        .month(month + i)
        .format(HEADER_DATE_FORMAT);
    }),
  ].map((month, i) => {
    let width = DEFAULT_COL_WIDTH;

    if (i == 0) width = 50;
    if (i == 1) width = DEFAULT_LABEL_COL_WIDTH;

    return { value: month, width };
  });

  return headers;
};

/**
 * Formatted Horizontal Headers (API Headers)
 *
 * @param {Object} { tableHeadersApi, forecastStartDate }
 *
 * @return {Array}
 */
export const getFormattedGridHeaders = ({
  tableHeadersApi,
  forecastStartDate,
  options = {},
}) => {
  // Sort Headers Date Array (Asc)
  const sortedHeaders = orderBy(
    tableHeadersApi,
    ({ label }) => moment(label).format('YYYYMMDD'),
    ['asc']
  );

  let isSetFirstForecast = false;
  let firstForecastIndex = -1;

  const headers = ['', '', ...sortedHeaders].map((header, i) => {
    let width = 0;
    if (i == 0) width = 50;
    if (i == 1)
      width =
        options && options.length > 0 && options[i].width
          ? options[i].width
          : 250;

    if (i > 1)
      width =
        options && options.length > 0 && options[i].width
          ? options[i].width
          : getHeadersWidth();

    const isForecast = isForecastCell(forecastStartDate, header);

    if (isForecast && !isSetFirstForecast) {
      isSetFirstForecast = true;
      firstForecastIndex = i;
    }

    return {
      label: header.label || '',
      value: header.key || '',
      width,
      isForecast,
    };
  });

  if (firstForecastIndex == -1) {
    headers[headers.length - 1] = {
      ...headers[headers.length - 1],
      isLastActual: true,
    };
  }

  if (firstForecastIndex > -1) {
    headers[firstForecastIndex] = {
      ...headers[firstForecastIndex],
      isFirstForecast: true,
    };
  }

  if (firstForecastIndex > -1 && headers[firstForecastIndex - 1]) {
    headers[firstForecastIndex - 1] = {
      ...headers[firstForecastIndex - 1],
      isLastActual: true,
    };
  }

  return headers;
};

/**
 * Get Header column width
 */
export const getHeadersWidth = () => {
  let density = getGridDensity();

  if (!density) {
    density = DEFAULT_DENSITY;
  }

  return DENSITY_SIZES_KEYS[density?.toLocaleLowerCase()];
};

/**
 * Get formatted Grid Data with Row Configs
 *
 * @param {Object}
 *
 * @return {Object} { gridData, rowConfigs }
 */
export const getFormattedGridData = ({ rows, headers, forecastStartDate }) => {
  const gridData = [];
  const rowConfigs = [];
  const formulaCells = [];

  rows.forEach((row, rowIndex) => {
    const rowConfig = {
      id: row.id,
      row_id: row.row_id,
      workbookId: row.workbook_id,
      worksheetId: row.workbook_sheet_id,
      displayOrder: row.display_order,

      fieldType: row.data_type,
      rowType: row.type,

      isRoundOff: row.round_off == 1,
      roundingDigits: row.round_off_digits,

      isRowUseAsHeading: row.is_heading == 1,
      isPostingEnable: row.is_posting_enabled == 1,
      isSameExtractPostMappings: row.is_same_extract_post_mappings,

      readMappings: formatReadWriteMappingsParam(row.read_mappings),
      writeMappings: formatReadWriteMappingsParam(row.write_mappings),

      extractFormula: row.extract_formula?.tokens || [],
      postingFormula: row.posting_formula?.tokens || [],
      error: row?.error_message || '',
    };

    const indexCell = {};
    const labelCell = { value: row.title || '' };

    // Bind style for label cell
    if (row.cells && row.cells.length > 1) {
      labelCell.styles = row.row_options.styles || {};
    }

    const duplicate = rows.find(
      ({ title, id }) => id != row.id && title == row.title
    );
    if (duplicate) labelCell.error = MODELS_MSG.duplicate_row_label;

    const rowData = [indexCell, labelCell];

    (row.cells || []).forEach((cell, index) => {
      const cellIndex = index + 2;

      const styles = get(cell, 'options.styles', {});
      const expr = get(cell, 'options.formula', '');

      let isForecast = false;
      if (forecastStartDate && headers && headers[cellIndex]) {
        isForecast = isForecastCell(forecastStartDate, headers[cellIndex]);
      }

      let validValue = cell.value
        ? getNumbers(cell.value, true).toString()
        : '';

      // If row fiels type is percentage then multiplicate real value by 100
      validValue = getPercentageFieldValue(
        rowConfig.fieldType,
        validValue,
        true
      );

      if (expr) {
        formulaCells.push({
          cellIndex: `${getAlphabetColumnName(cellIndex - 1)}${rowIndex + 1}`,
          row: rowIndex,
          col: cellIndex,
        });
      }

      rowData.push({ value: validValue, isForecast, styles, expr });
    });

    gridData.push(rowData);
    rowConfigs.push(rowConfig);
  });

  // Add empty row at end
  if (rows.length < MAX_ROWS) {
    gridData.push(getEmptyGridRow(headers.length, { headers }));
    rowConfigs.push(getEmptyRowConfigs(1)[0]);
  }

  return { gridData, rowConfigs, formulaCells };
};

/**
 * Convert/Format percentage field value
 *
 * @param {String} fieldType
 * @param {Number || String} value
 * @param {Boolean} isMultiplecation
 * @returns {Number || String}
 */
export const getPercentageFieldValue = (
  fieldType,
  value,
  isMultiplecation = false
) => {
  if (
    fieldType == FIELD_TYPE_KEYS.percentage &&
    value != '' &&
    value != null &&
    value != undefined &&
    value != 0
  ) {
    return isMultiplecation
      ? doCalculations(value * 100)
      : doCalculations(value / 100);
  }

  return value;
};

/**
 * Get formatted params to display Read|Wrire Mappings for Row
 *
 * @param {Array} mappings
 *
 * @return {Array}
 */
export const formatReadWriteMappingsParam = mappings => {
  let formattedMappings = [];

  formattedMappings = mappings.map(item => {
    const { dimension_id, dimension_name, mappings = [] } = item || {};

    const mapping = {
      dimension: {
        id: dimension_id,
        display_name: dimension_name,
      },
    };

    const formattedHierarchies = mappings.map(hierarchy => {
      const { member_id, member_name, member_type } = hierarchy || {};

      return {
        affa_record_id: member_id,
        affa_h_key_name: member_name,
        affa_record_type: member_type == 'folder' ? member_type : null,
      };
    });

    mapping.selectedHierarchies = formattedHierarchies;
    return mapping;
  });

  return formattedMappings;
};

/**
 * Check > Is Forcast Cell
 *
 * @param {Object} forecastStartDate
 * @param {Object} header
 *
 * @return {Boolean}
 */
export const isForecastCell = (forecastStartDate, header) => {
  return (
    forecastStartDate &&
    header.label &&
    moment(header.label).isSameOrAfter(forecastStartDate)
  );
};

/**
 * Get Forecast Start Date
 *
 * @param {Object} workbook
 *
 * @return {Object|Null}
 */
export const getForcastStartDate = workbook => {
  let forecastStartDate = get(
    workbook,
    'scenario.scenario_meta.forecast_start_date'
  );

  // For old scenarios
  if (!forecastStartDate) {
    forecastStartDate = get(
      workbook,
      'scenario.scenario_meta.fiscal_year_beginning'
    );
  }

  if (forecastStartDate) {
    return moment(forecastStartDate);
  }

  return null;
};

/**
 * Get Empty Grid Row
 *
 * @param {Number} colsCount `Count of Columns in Row`
 *
 * @return {Array}
 */
export const getEmptyGridRow = (
  colsCount,
  { forecastStartDate, headers = [] } = {}
) => {
  const row = [...Array.apply(0, Array(colsCount))].map((_, i) => {
    let isForecast = false;

    if (forecastStartDate && headers && headers[i]) {
      isForecast = isForecastCell(forecastStartDate, headers[i]);
    }

    // Set Row Label
    if (i == 1) return { value: '', isForecast, expr: '' };

    return { value: '', isForecast, expr: '' };
  });

  return row;
};

/**
 * Get Empty Row Configs
 *
 * @param {Number} rowsCount `Count of Rows`
 *
 * @return {Array}
 */
export const getEmptyRowConfigs = rowsCount => {
  const row = [...Array.apply(0, Array(rowsCount))].map((_, i) => {
    if (i == 1) {
      return {
        ...DEFAULT_ROW_CONFIG,
        rowType: String(ROW_TYPES_KEYS.extract),
      };
    }

    if (i == 2) {
      return {
        ...DEFAULT_ROW_CONFIG,
        rowType: String(ROW_TYPES_KEYS.formula),
      };
    }

    return { ...DEFAULT_ROW_CONFIG };
  });

  return row;
};

/**
 * Validate group of formula tokens
 *
 * @param {Array} formula
 */
export const validateFormulaAPI = formula => {
  const { error } = validateFormula(formula);

  if (error) {
    showErrorMsg(error);
    return false;
  }

  return true;
};

/**
 * Convert excel column name
 *
 * @param {Number} number
 * @returns {String}
 */
export const getAlphabetColumnName = number => {
  let ret = '';
  for (let a = 1, b = 26; (number -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(Number((number % b) / a) + 65) + ret;
  }

  return `${ret}`;
};

/**
 * Convert excel column name to Number
 *
 * @param {String} letter
 * @returns {Number}
 */
export const getColumnNumberFromAlphabet = letter => {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, letter.length - i - 1);
  }

  return Number(column + 1);
};

/**
 * Get path of column
 *
 * @param {Object} data
 * @returns {Array}
 */
export const getColumnAbsolutePath = ({ letter, row, col }) => {
  if (!letter) return {};

  const column = letter.match(/([A-Z]+)|([0-9]+)/g);

  const [first = '', second = ''] = column || [];

  return {
    cellIndex: letter,
    x: row - (Number(second) - 1),
    y: col - getColumnNumberFromAlphabet(first),
  };
};

/**
 * Get address of cell
 *
 * @param {Object} data
 * @returns {Array}
 */
export const getCellPath = ({ letter }) => {
  if (!letter) return {};

  const column = letter.match(/([A-Z]+)|([0-9]+)/g);

  const [first = '', second = ''] = column || [];

  return {
    cellIndex: letter,
    x: Number(second) - 1,
    y: getColumnNumberFromAlphabet(first),
  };
};

/**
 * Get address of cell and update according to add/subtraction
 *
 * @param {Object} data
 * @returns {Array}
 */
export const getUpdatedCellPath = ({ letter, addSubtractValue }) => {
  if (!letter) return {};

  const column = letter.match(/([A-Z]+)|([0-9]+)/g);

  const [first = '', second = ''] = column || [];

  return {
    cellIndex: `${first}${Number(second) + addSubtractValue}`,
    x: Number(second) - 1 + addSubtractValue,
    y: getColumnNumberFromAlphabet(first),
  };
};

/**
 * Get table for formula cell
 *
 * @param {Array} headers Headers
 * @param {Array} rowConfigs Row Configs values
 * @param {Array} gridData Grid values
 *
 * @return {Object}
 */
export const getGridTableByIndex = (
  headers,
  rowConfigs,
  gridData,
  assumptionsDataListing = []
) => {
  const gridTable = {};

  gridData.forEach((rowData, rowIndex) => {
    const { fieldType = '' } = rowConfigs[rowIndex] || {};

    if (rowIndex < gridData.length - 1) {
      rowData.forEach((cell, cellIndex) => {
        if (cellIndex > 1) {
          const { value = '' } = cell || {};
          let cellVal = value ? value : '';

          if (cellVal && fieldType === FIELD_TYPE_KEYS.percentage) {
            cellVal /= 100;
          }

          gridTable[
            `${getAlphabetColumnName(cellIndex - 1)}${rowIndex + 1}`
          ] = {
            expr: cell.expr ? cell.expr : '',
            value: cellVal,
          };
        }
      });

      // Add assumptions in grid table
      assumptionsDataListing.forEach(({ assumptions_set = '', value = '' }) => {
        if (assumptions_set) {
          gridTable[assumptions_set.toUpperCase()] = value;
        }
      });
    }
  });

  return gridTable;
};
