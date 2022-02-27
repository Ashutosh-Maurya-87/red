import {
  MENUS,
  MENUS_ACTIONS,
  API_MENU_KEYS,
  PROCESS_STATUS,
  PROCESS_EXECUTION_TYPES,
  DELETE_TYPE_ACTION_KEYS,
} from './configs';
import { DEFAULT_COL } from './StepCard/CreateTable/helper';
import { isExecutionMode, getStatusForSync } from './helper';

/**
 * Get steps array with filled data in edit mode
 *
 * @param {Object} data
 *
 * @return {Array}
 */
export const getFilledStepsDataForEditMode = data => {
  const {
    process_tasks = [],
    status: processStatus,
    queued_tasks = [],
    last_run_at,
  } = data;

  const steps = [];
  let lastCompleted;
  let status = '';

  const isStepByStep = data.execution_type == PROCESS_EXECUTION_TYPES.oneByOne;

  process_tasks.forEach((task, i) => {
    let step = null;

    switch (task.action_type) {
      case API_MENU_KEYS.createTable:
        step = getDataForCreateTable(task);
        break;

      case API_MENU_KEYS.translate:
        step = getDataForTranslateTable(task);
        break;

      case API_MENU_KEYS.deleteClear:
        step = getDataForDelete(task);
        break;

      case API_MENU_KEYS.copyPaste:
        step = getDataForCopyPaste(task);
        break;

      case API_MENU_KEYS.lookup:
        step = getDataForLookup(task);
        break;

      case API_MENU_KEYS.singleFormulaBuider:
        step = getDataForFormulaBuilder(
          task,
          MENUS_ACTIONS.singleFormulaBuider
        );
        break;

      case API_MENU_KEYS.multiFormulaBuider:
        step = getDataForFormulaBuilder(task, MENUS_ACTIONS.multiFormulaBuider);
        break;

      default:
        break;
    }

    if (step) {
      if (steps.length == 0 && !isExecutionMode(processStatus)) {
        step.isExpand = false;
      }

      step.isSelected = false;
      step.status = task.status;
      step.failed_reason = task.failed_reason;
      step.message = task.messages || '';

      step.labelKey = `${step.label} - ${Math.random()
        .toString(36)
        .substring(7)}`;

      steps.push(step);

      if (task.status == PROCESS_STATUS.COMPLETED) {
        lastCompleted = i;
      }

      if (status) return;
      status = getStatusForSync(task.status);
    }
  });

  // Mark Run Next
  if (
    isStepByStep &&
    lastCompleted != undefined &&
    !status &&
    lastCompleted != process_tasks.length - 1 &&
    queued_tasks.length > 0
  ) {
    steps[lastCompleted].runNext = true;
  }

  // Show Preview
  if (lastCompleted != undefined && !status) {
    steps[lastCompleted].showPreview = true;
  }

  if (lastCompleted != undefined && !status) {
    status = PROCESS_STATUS.COMPLETED;
  }

  return { steps, status: status || processStatus, last_run_at };
};

/**
 * Get selected steps
 *
 * @param {Array} steps
 *
 * @return {Array}
 */
export const getSelectedSteps = (steps = []) => {
  return steps.filter(({ isSelected }) => isSelected);
};

/**
 * Get filled step data for CreateTable Step
 *
 * @param {Object} task
 *
 * @return {Object}
 */
const getDataForCreateTable = task => {
  const menuAction = MENUS.find(
    ({ label }) => label == MENUS_ACTIONS.createTable
  );

  if (!menuAction) return null;

  const { meta = {} } = task;
  const {
    new_display_name = '',
    new_columns = [],
    table_data = [],
    create_new_table,
  } = meta;

  const headers = new_columns.map(h => ({
    ...DEFAULT_COL,
    dataType: h.data_type,
    dateFormat: h.dateFormat,
    label: h.display_name,
  }));
  headers.unshift({ ...DEFAULT_COL });

  const data = table_data.map(row => {
    row.unshift({ ...DEFAULT_COL });

    return row.map(col => {
      return {
        ...DEFAULT_COL,
        value: col.value || '',
      };
    });
  });

  const step = {
    ...menuAction,
    id: task.id || '',
    name: task.name || '',
    actionType: meta.action || '',
    isExpand: false,
    tableName: new_display_name,
    isNewTable: create_new_table != 0,
    headers,
    data,
  };

  return step;
};

/**
 * Get filled step data for Translate Table Step
 *
 * @param {Object} task
 *
 * @return {Object}
 */
const getDataForTranslateTable = task => {
  const menuAction = MENUS.find(
    ({ label }) => label == MENUS_ACTIONS.translate
  );

  if (!menuAction) return null;

  const { meta = {} } = task;
  const { translate_meta = {} } = meta;
  const {
    cols_for_mapping = {},
    cols_for_update = {},
    rules = [],
  } = translate_meta;

  const headersToCompare = Object.keys(cols_for_mapping).map(name => {
    return { ...DEFAULT_COL, name, display_name: cols_for_mapping[name] };
  });

  const headersToUpdate = Object.keys(cols_for_update).map(name => {
    return { ...DEFAULT_COL, name, display_name: cols_for_update[name] };
  });

  const data = [];

  let i = 0;
  const total = rules.length;

  while (i < total) {
    const ruleData = rules[i];

    const {
      name,
      cols_value_for_mapping = [],
      cols_value_for_update = [],
    } = ruleData;

    const row = [{ ...DEFAULT_COL, value: name }];

    cols_value_for_mapping.forEach(value => {
      row.push({ ...DEFAULT_COL, value });
    });

    cols_value_for_update.forEach(value => {
      if (typeof value == 'object' && value !== null) {
        row.push({
          ...DEFAULT_COL,
          value: value.value || '',
          formula: value.formula || [],
        });
      } else {
        row.push({ ...DEFAULT_COL, value });
      }
    });

    data.push(row);

    i++;
  }

  const step = {
    ...menuAction,
    id: task.id || '',
    name: task.name || '',
    actionType: meta.action || '',
    isExpand: false,
    targetTable: {
      id: String(meta.table_id || ''),
      columns: [],
      name: '',
      display_name: '',
    },
    headersToCompare,
    headersToUpdate,
    data,
  };

  return step;
};

/**
 * Get filled step data for Delete Step
 *
 * @param {Object} task
 *
 * @return {Object}
 */
const getDataForDelete = task => {
  const menuAction = MENUS.find(
    ({ label }) => label == MENUS_ACTIONS.deleteClear
  );

  if (!menuAction) return null;

  const { meta = {} } = task;
  const { query_meta = {}, query = '' } = meta;
  let dropColumns = [];

  if (
    query &&
    (meta.action === DELETE_TYPE_ACTION_KEYS.dropColumns ||
      meta.action === DELETE_TYPE_ACTION_KEYS.clearColumns)
  ) {
    dropColumns = query.replace(/`/g, '').split(',');
  }

  let colsToDelete = {
    data: [{}],
    relation: 'AND',
  };

  if (query_meta.data && query_meta.relation) {
    colsToDelete = query_meta;
  }

  const step = {
    ...menuAction,
    id: task.id || '',
    name: task.name || '',
    actionType: meta.action || '',
    isExpand: false,
    dropColumns,
    colsToDelete,
    targetTable: {
      id: String(meta.table_id || ''),
      columns: [],
      name: '',
      display_name: '',
    },
  };

  return step;
};

/**
 * Get filled step data for Copy/Paste Step
 *
 * @param {Object} task
 *
 * @return {Object}
 */
const getDataForCopyPaste = task => {
  const menuAction = MENUS.find(
    ({ label }) => label == MENUS_ACTIONS.copyPaste
  );

  if (!menuAction) return null;

  const { meta = {} } = task;
  const { new_table = {} } = meta;
  const { display_name, create_table } = new_table;

  const step = {
    ...menuAction,
    id: task.id,
    name: task.name,
    isExpand: false,
    data_mapping: meta.data_mapping || {},
    new_columns: meta.new_columns || [],
    newRows: meta.new_rows || [],
    isNewTable: create_table != 0,
    sourceTable: {
      id: String(meta.source_table_id || ''),
      columns: [],
      name: '',
      display_name: '',
    },
    targetTable: {
      id: String(meta.destination_table_id || 'NEW'),
      columns: [],
      name: display_name,
      display_name,
    },
  };

  return step;
};

/**
 * Get filled step data for Lookup Step
 *
 * @param {Object} task
 *
 * @return {Object}
 */
const getDataForLookup = task => {
  const menuAction = MENUS.find(({ label }) => label == MENUS_ACTIONS.lookup);

  if (!menuAction) return null;

  const { meta = {} } = task;
  const { query_meta = {} } = meta;

  const {
    lookupType,
    colsToCompare: colsToCompareMeta,
    colsToUpdate: colsToUpdateMeta,
    loolupTables: loolupTablesMeta,
    targetTable: targetTableId,
  } = query_meta;

  let lookupTables = [];
  if (Array.isArray(loolupTablesMeta)) {
    lookupTables = loolupTablesMeta.map(id => ({ id }));
  }

  const colsToCompare = colsToCompareMeta || {
    data: [{}],
    relation: 'AND',
  };

  const colsToUpdate = colsToUpdateMeta || [{}];

  const step = {
    lookupType: lookupType == 'single' ? 'single' : 'multi',
    ...menuAction,
    id: task.id || '',
    name: task.name || '',
    actionType: meta.action || '',
    isExpand: false,
    lookupTables,
    colsToCompare,
    colsToUpdate,
    targetTable: {
      id: String(targetTableId || ''),
      columns: [],
      name: '',
      display_name: '',
    },
  };

  return step;
};

/**
 * Get filled step data for Single|Multi Formula Builder
 *
 * @param {Object} task
 *
 * @return {Object}
 */
const getDataForFormulaBuilder = (task, action) => {
  const menuAction = MENUS.find(({ label }) => label == action);

  if (!menuAction) return null;

  const { meta = {} } = task;
  const { query_meta = {} } = meta;

  const {
    formulaType = 'single',
    colsToCompare: colsToCompareMeta,
    colsToUpdate: colsToUpdateMeta,
    relatedTables: relatedTablesMeta,
    targetTable: targetTableId,
  } = query_meta;

  const colsToCompare = colsToCompareMeta || {
    data: [{}],
    relation: 'AND',
  };

  const colsToUpdate = colsToUpdateMeta || [{}];

  let relatedTables = [];
  if (Array.isArray(relatedTablesMeta)) {
    relatedTables = relatedTablesMeta.map(id => {
      return {
        id,
        columns: [],
        name: '',
        display_name: '',
      };
    });
  }

  const step = {
    ...menuAction,
    id: task.id || '',
    name: task.name || '',
    actionType: meta.action || '',
    isExpand: false,
    colsToUpdate,
    colsToCompare,
    formulaType,
    relatedTables,
    targetTable: {
      id: String(targetTableId || ''),
      columns: [],
      name: '',
      display_name: '',
    },
  };

  return step;
};
