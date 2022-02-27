import { getColumnNameFromId } from 'jexcel';
import {
  DEFAULT_COL_WIDTH,
  COLUMN_DATA_TYPES_KEYS,
} from '../../../../../configs/app';
import {
  PROCESS_MANAGER_MSG,
  SOURCE_TABLES_MSG,
} from '../../../../../configs/messages';
import { convertStringToSQLColumn } from '../../helper';
import { validateName } from '../../../../../utils/helper/validateName';

export const DEFAULT_COL = {
  label: '', // For Header Cell
  value: '', // For Data Cell
  width: DEFAULT_COL_WIDTH,
  dataType: COLUMN_DATA_TYPES_KEYS.alphanumeric,
};

const INITIAL_COLS = 6;
const INITIAL_ROWS = 10;

/**
 * Get Initial Headers to create Source Table
 *
 * @return {Array}
 */
export function getInitialHeaders() {
  const headers = [];

  for (let i = 0; i < INITIAL_COLS; i++) {
    headers.push({ ...DEFAULT_COL, label: `Column ${i}` });
  }

  return headers;
}

/**
 * Get Initial Rows to create Source Table
 *
 * @return {Array}
 */
export function getInitialData() {
  const data = [];

  for (let i = 0; i < INITIAL_ROWS; i++) {
    if (!data[i]) data.push([]);

    for (let j = 0; j < INITIAL_COLS; j++) {
      data[i].push({ ...DEFAULT_COL });
    }
  }

  return data;
}

/**
 * Get Formatted params to create Source Table
 *
 * @param {Object} step
 * @param {Number} i
 * @param {Function} setError
 *
 * @return {Object}
 */
export const getDataForCreateTable = ({ step, i, setError, isStep = true }) => {
  let error = '';
  const { tableName, isNewTable } = step;

  if (!tableName) {
    if (isStep) {
      error = SOURCE_TABLES_MSG.table_name_required_process.replace(
        '#STEP_NAME#',
        step.name
      );
    } else {
      error = SOURCE_TABLES_MSG.table_name_required;
    }
  }

  if (tableName && !validateName(tableName)) {
    error = PROCESS_MANAGER_MSG.create_table_invalid_name.replace(
      '#STEP#',
      step.name
    );
  }

  if (error) {
    setError(error);
    return null;
  }

  const { newColumns, err: newColError } = getNewColumns(step);
  if (newColError) {
    setError(newColError);
    return null;
  }

  const columnsData = getColumnsData(step);

  return {
    id: (!step.isSaveAs && step.id) || null,
    sequence: i + 1,
    type: step.action, // Menu Action
    action: step.action,
    name: step.name,
    query: null,
    query_meta: null,
    new_table_name: tableName,
    new_display_name: tableName,
    new_table: isNewTable ? 1 : 0,
    file_format: 'xls',
    new_columns: newColumns,
    table_data: columnsData,
  };
};

/**
 * Get Array of Headers of new Table
 *
 * @param {Object} step
 *
 * @return {Object}
 */
function getNewColumns(step) {
  const { headers = [] } = step;
  const newColumns = [];
  let err = '';

  headers.forEach((header, i) => {
    if (i > 0) {
      if (!header.label) {
        err = SOURCE_TABLES_MSG.header_required_in_create_table.replace(
          '#COLUMN#',
          i
        );
      }

      newColumns.push({
        name: convertStringToSQLColumn(header.label),
        display_name: header.label,
        data_type: header.dataType,
        width: header.width,
        date_format: header.dateFormat || '',
      });
    }
  });

  return { newColumns, err };
}

/**
 * Get Array of Data for new Table
 *
 * @param {Object} step
 *
 * @return {Array}
 */
function getColumnsData(step) {
  const { data = [] } = step;
  const cellData = [];

  data.forEach((row, i) => {
    if (!cellData[i]) cellData[i] = [];

    row.forEach(({ value, realValue }, j) => {
      if (j > 0) {
        const { label = '' } = step.headers[j] || {};

        cellData[i].push({
          key: convertStringToSQLColumn(label),
          cell_address: getColumnNameFromId([j - 1, i]),
          value,
        });
      }
    });
  });

  return cellData;
}
