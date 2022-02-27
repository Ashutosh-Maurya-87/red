import { COLUMN_DATA_TYPES_KEYS, DEFAULT_DATATYPE } from '../../../configs/app';

export const NEW_FIELD = '<New Field>';
export const DATE_FORMAT = 'YYYY-MM-DD';

export const API_MENU_KEYS = {
  createTable: 'create-table',
  copyPaste: 'copy',
  translate: 'translate-table',
  lookup: 'lookup',
  singleFormulaBuider: 'single-formula-builder',
  multiFormulaBuider: 'multi-formula-builder',
  deleteClear: 'clear',
};

export const MENUS_ACTIONS = {
  createTable: 'Create New Table',
  copyPaste: 'Copy/Paste Append',
  translate: 'Translate Table',
  lookup: 'Single Table Lookup',
  multiLookup: 'Multi Table Lookup',
  singleFormulaBuider: 'Single Table Formula Builder',
  multiFormulaBuider: 'Multi Table Formula Builder',
  deleteClear: 'Delete/Clear Data',
};

export const MENUS = [
  {
    label: MENUS_ACTIONS.createTable,
    icon: 'create-new-table.svg',
    action: API_MENU_KEYS.createTable,
  },
  {
    label: MENUS_ACTIONS.copyPaste,
    icon: 'append.svg',
    action: API_MENU_KEYS.copyPaste,
  },
  {
    label: MENUS_ACTIONS.translate,
    icon: 'translate.svg',
    action: API_MENU_KEYS.translate,
  },
  {
    label: MENUS_ACTIONS.lookup,
    icon: 'lookup.svg',
    action: API_MENU_KEYS.lookup,
  },
  {
    label: MENUS_ACTIONS.multiLookup,
    icon: 'lookup.svg',
    action: API_MENU_KEYS.lookup,
  },
  {
    label: MENUS_ACTIONS.singleFormulaBuider,
    icon: 'single-table.svg',
    action: API_MENU_KEYS.singleFormulaBuider,
  },
  {
    label: MENUS_ACTIONS.multiFormulaBuider,
    icon: 'multi-table.svg',
    action: API_MENU_KEYS.multiFormulaBuider,
  },
  {
    label: MENUS_ACTIONS.deleteClear,
    icon: 'delete-data.svg',
    action: API_MENU_KEYS.deleteClear,
  },
];

export const COMPARE_FIELD_KEYS = {
  equalTo: '=',
  notEqualTo: '!=',
  contains: 'LIKE',
  notConatins: 'NOT LIKE',
  isNull: 'IS NULL',
  isNotNull: 'IS NOT NULL',
  between: 'BETWEEN',
  greaterThan: '>',
  lessThan: '<',
};

export const COMPARE_FIELDS = {
  [COLUMN_DATA_TYPES_KEYS.alphanumeric]: [
    {
      label: 'Is Equal To',
      value: COMPARE_FIELD_KEYS.equalTo,
    },
    {
      label: 'Is Not Equal To',
      value: COMPARE_FIELD_KEYS.notEqualTo,
    },
    {
      label: 'Contains',
      value: COMPARE_FIELD_KEYS.contains,
    },
    {
      label: "Doesn't Contain",
      value: COMPARE_FIELD_KEYS.notConatins,
    },
    {
      label: 'Is Empty',
      value: COMPARE_FIELD_KEYS.isNull,
    },
    {
      label: 'Is Not Empty',
      value: COMPARE_FIELD_KEYS.isNotNull,
    },
  ],
  [COLUMN_DATA_TYPES_KEYS.amount]: [
    {
      label: 'Is Equal To',
      value: COMPARE_FIELD_KEYS.equalTo,
    },
    {
      label: 'Is Not Equal To',
      value: COMPARE_FIELD_KEYS.notEqualTo,
    },
    {
      label: 'Between',
      value: COMPARE_FIELD_KEYS.between,
    },
    {
      label: 'Greater Than',
      value: COMPARE_FIELD_KEYS.greaterThan,
    },
    {
      label: 'Less Than',
      value: COMPARE_FIELD_KEYS.lessThan,
    },
    {
      label: 'Is Empty',
      value: COMPARE_FIELD_KEYS.isNull,
    },
    {
      label: 'Is Not Empty',
      value: COMPARE_FIELD_KEYS.isNotNull,
    },
  ],
  [COLUMN_DATA_TYPES_KEYS.date]: [
    {
      label: 'Is Equal To',
      value: COMPARE_FIELD_KEYS.equalTo,
    },
    {
      label: 'Is Not Equal To',
      value: COMPARE_FIELD_KEYS.notEqualTo,
    },
    {
      label: 'Between',
      value: COMPARE_FIELD_KEYS.between,
    },
    {
      label: 'Greater Than',
      value: COMPARE_FIELD_KEYS.greaterThan,
    },
    {
      label: 'Less Than',
      value: COMPARE_FIELD_KEYS.lessThan,
    },
    {
      label: 'Is Empty',
      value: COMPARE_FIELD_KEYS.isNull,
    },
    {
      label: 'Is Not Empty',
      value: COMPARE_FIELD_KEYS.isNotNull,
    },
  ],
};

function getCompareOperatorLabels() {
  const obj = {};

  Object.keys(COMPARE_FIELDS).forEach(dt => {
    COMPARE_FIELDS[dt].forEach(({ label, value }) => {
      obj[value] = label.toLowerCase();
    });
  });

  return obj;
}

export const COMPARE_OPERATOR_LABELS = getCompareOperatorLabels();

export const DELETE_TYPE_ACTION_KEYS = {
  clearAll: 'clear_all',
  clearSelected: 'selected',
  dropTable: 'drop_table',
  dropColumns: 'drop_column',
  clearColumns: 'clear_column',
};

export const DELETE_TYPE_ACTIONS = [
  {
    label: 'Delete All Rows',
    value: DELETE_TYPE_ACTION_KEYS.clearAll,
  },
  {
    label: 'Delete Selected Rows',
    value: DELETE_TYPE_ACTION_KEYS.clearSelected,
  },
  {
    label: 'Clear Columns',
    value: DELETE_TYPE_ACTION_KEYS.clearColumns,
  },
  {
    label: 'Delete Table',
    value: DELETE_TYPE_ACTION_KEYS.dropTable,
  },
  {
    label: 'Delete Columns',
    value: DELETE_TYPE_ACTION_KEYS.dropColumns,
  },
];

export const PROCESS_STATUS = {
  CREATED: 'CREATED',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const PROCESS_EXECUTION_TYPES = {
  oneByOne: 'one-by-one',
  all: 'execute-all',
};

export const DEFAULT_COPY_APPEND_ROW = {
  data_type: DEFAULT_DATATYPE,
  isNewRow: true,
  display_name: '',
  id: '',
  isMatched: false,
  isNewCol: true,
  is_primary: true,
  is_required: true,
  is_unique: false,
  name: '',
  tableDisplayName: '',
  tableName: '',
  targetField: '',
  targetFieldLabel: '',
  user_table_id: '',
  width: '100',
};
