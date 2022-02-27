import { COLUMN_DATA_TYPES_KEYS } from '../../../configs/app';
import { API_URLS } from '../../../configs/api';
import { PROCESS_MANAGER_MSG } from '../../../configs/messages';
import {
  MENUS_ACTIONS,
  PROCESS_EXECUTION_TYPES,
  PROCESS_STATUS,
} from './configs';

import { httpGet } from '../../../utils/http';
import { getDataForDeleteStep } from './StepCard/DeleteClearData/helper';
import { getDataForCopyPasteStep } from './StepCard/CopyAppendData/helper';
import { getDataForLookupStep } from './StepCard/LookupTable/helper';
import { getDataForFormulaBuilder } from './StepCard/TableFormulaBuilder/helper';
import { getDataForCreateTable } from './StepCard/CreateTable/helper';
import { getDataForTranslateTable } from './StepCard/TranslateTable/helper';

/**
 * Get Input Value for Multi Table Columns Selector
 * EX: [Table Name] [Column Name]
 *
 * @param {String} table
 * @param {String} field
 *
 * @return {String}
 */
export const getInputValue = (table, field) => {
  if (!field) return '';

  if (!table) return field;

  return `${field} [${table}]`;
};

/**
 * Filter header in translate which is not present
 *
 * @param {Object} step
 * @returns {Array}
 */
export const filterTranslateHeader = (step = {}) => {
  const { headersToCompareNotFound = [], headersToUpdateNotFound = [] } =
    step || {};

  const allHeaders = [...headersToCompareNotFound, ...headersToUpdateNotFound];
  const uniq = [...new Set(allHeaders.map(({ name }) => name))].map(e =>
    allHeaders.find(({ name }) => name == e)
  );

  return uniq;
};

/**
 * Validate translate step
 *
 * @param {Object} step
 * @returns {String}
 */
export const isTranslateHaveError = (step = {}) => {
  if (step.label != MENUS_ACTIONS.translate) return '';

  const headersToCompare = filterTranslateHeader(step);
  if (headersToCompare.length > 0) return 'column-delete-error';

  return '';
};

/**
 * Get SQL column name from a string
 *
 * @param {String} str
 *
 * @return {String}
 */
export const convertStringToSQLColumn = (str = '') => {
  if (!str) return '';

  return String(str)
    .trim()
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Get Columns of Selected Table
 *
 * @param {Number} id
 *
 * @param {Object}
 */
export const getColumnsOfSourceTable = async id => {
  try {
    if (id == 'NEW') return { columns: [], tableData: {} };

    const url = API_URLS.GET_COLUMNS_OF_SOURCE_TABLE.replace('#ID#', id);

    const { data = {} } = await httpGet(url);
    const { columns, ...tableData } = data;

    const validColumns = columns.map(col => ({
      ...col,
      id: String(col.id),
      data_type: col.data_type || COLUMN_DATA_TYPES_KEYS.alphanumeric,
      tableName: tableData.name,
      tableDisplayName: tableData.display_name,
    }));

    return { columns: validColumns, tableData };
  } catch (e) {
    return { columns: [], tableData: {} };
  }
};

/**
 * Get selected Tables with Columns
 *
 * @param {Array} ids
 *
 * @param {Array}
 */
export const getColumnsOfSourceTables = async ids => {
  try {
    if (!ids || ids.length == 0) return [];

    let url = API_URLS.GET_COLUMNS_OF_SOURCE_TABLES;
    url += `?ids=${ids.toString()}`;
    url += `&start=1`;
    url += `&limit=${ids.length}`;
    url += `&sort=display_name`;
    url += `&order=asc`;

    const { data = {} } = await httpGet(url);

    return data.data || [];
  } catch (e) {
    return [];
  }
};

/**
 * Get formatted params to run process
 *
 * @param {Object} steps
 * @param {Boolean} isSelectionEnable
 * @param {Event|Boolean} isStepByStep
 *
 * @return {Object}
 */
export const getParamsToRunProcess = (
  steps,
  { isSelectionEnable, isStepByStep }
) => {
  let tasks = [];

  if (isSelectionEnable) {
    tasks = steps
      .filter(
        ({ isSelected, status }) =>
          isSelected && status != PROCESS_STATUS.COMPLETED
      )
      .map(({ id }) => id);
  } else {
    tasks = steps
      .filter(({ status }) => status != PROCESS_STATUS.COMPLETED)
      .map(({ id }) => id);
  }

  let execution_type = PROCESS_EXECUTION_TYPES.all;
  let queued_tasks;

  if (isStepByStep === true) {
    execution_type = PROCESS_EXECUTION_TYPES.oneByOne;
    queued_tasks = tasks.filter((_, i) => i > 0);
    tasks = [tasks[0]];
  }

  const params = {
    execution_type,
    is_selective: isSelectionEnable,
    tasks,
    queued_tasks,
  };

  return params;
};

/**
 * Insert task id into steps array
 *
 * @param {Array} steps
 * @param {Array} processTasks
 *
 * @return {Array}
 */
export const insertTaskIdIntoSteps = (steps, processTasks) => {
  return steps.map((step, index) => {
    step.id = (processTasks[index] && processTasks[index].id) || '';

    return step;
  });
};

/**
 * Get formatted params to save process
 *
 * @param {Object} state
 * @param {Object} props
 * @param {Object}
 *
 * @return {Object}
 */
export const getParamsToSaveProcess = (
  state,
  steps,
  { isSaveAs = false } = {}
) => {
  if (steps.length == 0) {
    return PROCESS_MANAGER_MSG.one_step_required;
  }

  let error = '';
  const setError = err => {
    if (!error) error = err;
  };

  const tasks = steps
    .map((step, i) => {
      step.isSaveAs = isSaveAs;

      if (!String(step.name || '').trim() && !error) {
        setError(
          PROCESS_MANAGER_MSG.step_name_required.replace('#STEP#', i + 1)
        );
        return null;
      }

      switch (step.label) {
        case MENUS_ACTIONS.createTable:
          return getDataForCreateTable({ step, i, setError });

        case MENUS_ACTIONS.translate:
          delete step.headersToCompareNotFound;
          delete step.headersToUpdateNotFound;
          return getDataForTranslateTable(step, i, setError);

        case MENUS_ACTIONS.deleteClear:
          return getDataForDeleteStep(step, i, setError);

        case MENUS_ACTIONS.copyPaste:
          return getDataForCopyPasteStep(step, i, setError);

        case MENUS_ACTIONS.lookup:
        case MENUS_ACTIONS.multiLookup:
          return getDataForLookupStep(step, i, setError);

        case MENUS_ACTIONS.singleFormulaBuider:
        case MENUS_ACTIONS.multiFormulaBuider:
          return getDataForFormulaBuilder(step, i, setError);

        default:
          return null;
      }
    })
    .filter(Boolean);

  const params = {
    name: state.name,
    tasks,
  };

  if (error) return error;

  return params;
};

/**
 * Check > Process is under Execution Mode
 *
 * @param {String} status
 *
 * @param {Booelan}
 */
export function isExecutionMode(status) {
  switch (status) {
    case PROCESS_STATUS.QUEUED:
    case PROCESS_STATUS.FAILED:
    case PROCESS_STATUS.RUNNING:
    case PROCESS_STATUS.COMPLETED:
    case PROCESS_STATUS.CANCELLED:
      return true;

    case PROCESS_STATUS.CREATED:
    default:
      return false;
  }
}

/**
 * Sync and return non-success status Only
 *
 * @param {String} status
 *
 * @param {String}
 */
export function getStatusForSync(status) {
  switch (status) {
    case PROCESS_STATUS.QUEUED:
    case PROCESS_STATUS.RUNNING:
    case PROCESS_STATUS.FAILED:
    case PROCESS_STATUS.CANCELLED:
      return status;

    default:
      return '';
  }
}

/**
 * Validate process name is already exist or not
 *
 * @param {String} processName
 */
export const validateProcessName = async processName => {
  const url = API_URLS.VALIDATE_PROCESS_NAME.replace(
    '#PROCESS_NAME#',
    processName
  );
  return httpGet(url);
};
