/**
 * Context menu
 */
export const RULE_BASED_MODEL_ACTIONS = {
  view: 'Open',
  rename: 'Rename',
  duplicate: 'Make a Copy',
  export: 'Export',
  reload: 'Reload',
  delete: 'Delete',
};

/**
 * Confirmation Actions on Click context menu
 */
export const RBM_CONFIRMATION_ACTIONS = {
  delete: 'DELETE',
};

/**
 *  Side Menu of Set up wizard
 */
export const RULE_BASED_MODEL_SETUP_MENU_KEYS = {
  calculations: 'Calculations',
  fieldConfigs: ' Field Configurations',
  importExport: 'Import/Export Data',
};

export const RULE_BASED_MODEL_SETUP_MENUS = [
  { label: RULE_BASED_MODEL_SETUP_MENU_KEYS.calculations },
  { label: RULE_BASED_MODEL_SETUP_MENU_KEYS.fieldConfigs },
  { label: RULE_BASED_MODEL_SETUP_MENU_KEYS.importExport },
];

/**
 * Sorting of RBM List by Name, Created at in ASC/DESC order
 */
export const SORT_OPTIONS = [
  {
    label: 'Name (Asc)',
    value: 'name - asc',
  },
  {
    label: 'Name (Desc)',
    value: 'name - desc',
  },
  {
    label: 'Created on (Asc)',
    value: 'created_at - asc',
  },
  {
    label: 'Created on (Desc)',
    value: 'created_at - desc',
  },
];

/**
 * RBM Listing Pagination
 */
export const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

/**
 * Filter operators ('is', 'not_is', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'bool', 'like', 'not_like', 'start_like', 'between', 'not_null', 'null')
 */
export const FILTER_OPERATORS = {
  between: 'between',
  like: 'like',
  notLike: 'not_like',
  is: 'is',
  notIs: 'not_is',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  in: 'in',
  not_in: 'not_in',
  bool: 'bool',
  startLike: 'start_like',
  notNull: 'not_null',
  null: 'null',
};

/**
 * Filter field names
 */
export const FILTER_FIELD_NAME = {
  forecastRange: 'forecast_range',
};

/**
 *
 * Add Calculation screen data
 *
 */

export const RULES_TYPES = {
  DIRECT_INPUT: { label: '$ Input', value: 'DIRECT_INPUT' },
  PERCENT: { label: 'Percentage (%)', value: 'PERCENT' },
  COUNT: { label: 'Count', value: 'COUNT' },
};

export const DATA_SOURCES = {
  fixedValue: {
    label: 'Specify Fixed Value Here',
    value: 'fixedValue',
    title: 'The input value will be the same for every row of data',
  },
  columnInData: {
    label: 'Load as Column from Data Set',
    value: 'columnInData',
    title:
      'The input value will be determined from the uploaded dataset and can vary per row of data',
  },
};

export const ADD_CALCULATION_SCHEDULE = {
  EQUAL_MONTHLY: { label: 'Equal Monthly', value: 'EQUAL_MONTHLY' },
  FIRST_MONTH_OF_QUARTER: {
    label: 'First Month Of Quarter',
    value: 'FIRST_MONTH_OF_QUARTER',
  },
  MIDDLE_MONTH_OF_QUARTER: {
    label: 'Middle Month Of Quarter',
    value: 'MIDDLE_MONTH_OF_QUARTER',
  },
  LAST_MONTH_OF_QUARTER: {
    label: 'Last Month Of Quarter',
    value: 'LAST_MONTH_OF_QUARTER',
  },
};

export const ADD_CALCULATION_CAP = {
  null: { label: 'No Cap', value: null },
  YEARLY: { label: 'Yearly', value: 'YEARLY' },
  MONTHLY: {
    label: 'Monthly',
    value: 'MONTHLY',
  },
};

export const ADD_CALCULATION_START_FORECAST = {
  DELAY: { label: 'Delay', value: 'DELAY' },
  START_MONTH: {
    label: 'Start Month',
    value: 'START_MONTH',
  },
};

export const ADD_CALCULATION_END_FORECAST = {
  DELAY: { label: 'Delay', value: 'DELAY', inputLabel: 'End Month Delay' },
  END_MONTH: {
    label: 'End Month',
    value: 'END_MONTH',
    inputLabel: '',
  },

  BEFORE: {
    label: 'Before',
    value: 'BEFORE',
    inputLabel: 'Months Before Ending Month',
  },

  MONTHS_AFTER_START_MONTH: {
    label: 'After',
    value: 'MONTHS_AFTER_START_MONTH',
    inputLabel: 'Months After Starting Month',
  },

  SPECIFIC_DATE: {
    label: 'Specific Date',
    value: 'SPECIFIC_DATE',
    inputLabel: '',
  },
};

/**
 * Min-max values of calculation data
 */
export const CALCULATION_MIN_MAX_VALUE = {
  startForecastDelay: { min: 1, max: 12 },
  endForecastDelay: { min: 0, max: 12 },
  termsInMonths: { min: 1, max: 60 },
  fixedValue: { min: -1000000000000, max: 1000000000000 },
  cap: { min: -1000000000000, max: 1000000000000 },
};

export const RULE_INFO_MODES = {
  primary: 'primary',
  secondary: 'secondary',
};

export const EDIT_CONFIRMATION_TITLE = 'Update Calculation';
export const START_END_DATE = {
  startDate: 'start_date',
  endDate: 'end_date',
};
export const EDIT_CONFIRMATION_MSG =
  'Do you want to update this calculation across all groups, or do you want to save this as a new calculation?';
export const EDIT_CONFIRMATION_UPDATE = 'UPDATE';
export const EDIT_CONFIRMATION_SAVE_AS_NEW = 'SAVE AS NEW';

export const DELETE_CONFIRMATION_TITLE = 'Remove Calculation';
export const DELETE_CONFIRMATION_MSG = `Do you want to remove the "#NAME#" calculation from "#this#" group or delete it from all groups?`;
export const DELETE_CONFIRMATION_ALL_GROUPS = 'All Groups';
export const DELETE_CONFIRMATION_THIS_GROUP = 'This Group';

export const ADD_EDIT_CALC_TABS = {
  attributes: {
    label: '#type# Details',
    value: 'attributes',
  },
  rules: {
    label: 'Calculations',
    value: 'rules',
  },
};

/**
 * Sync scenario split button options
 */
export const SYNC_OPTIONS = {
  removeSync: 'Remove Synced Data',
  changeScenario: 'Change Scenario',
};
/**
 * Sync scenario split button options with key/value
 */
export const SYNC_SCENARIO_OPTIONS = {
  removeSyncData: {
    label: SYNC_OPTIONS.removeSync,
    value: 'removeSyncData',
  },
  changeScenario: {
    label: SYNC_OPTIONS.changeScenario,
    value: 'changeScenario',
  },
};

/**
 * Confirmation Modal TEXT for Sync scenario
 */
export const SYNC_CONFIRMATION = {
  continueRollback: 'Yes',
  continue: 'No, keep Data',
  title: 'Confirmation',
  msg: 'Do you want to remove synched data from old scenario?',
};

/**
 * Tooltip message when no data and scenario is synced
 */
export const DISABLED_SYNC_MSG =
  'Use the Change Scenario option to sync the forecast to a scenario';
