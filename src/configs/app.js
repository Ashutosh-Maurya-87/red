import moment from 'moment';

export const TERMS_OF_SERVICE = 'terms-of-service';

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_COMPARE_FORMAT = 'YYYY-MM-DD';
export const FISCAL_YEAR_DATE_FORMAT = 'MMMM YYYY';
export const SCENARIO_START_DATE_FORMAT = 'MMMM YYYY';
export const RBM_FORECAST_DATE_FORMAT = 'MMM YYYY';

export const MAX_COLS_FOR_IMPORT = 300;
export const DEFAULT_COL_WIDTH = 150;
export const HIERARCHY_COL_WIDTH = 300;
export const MAX_SOURCE_TABLE_NAME = 50;
export const DEFAULT_MAX_CHARS_AFTER_DECIMAL = 8;
export const DEFAULT_MAX_CHARS_FOR_GRID_INPUT = 12;

// Predefined or System labels
export const PRE_DEFINED_LABELS = {
  actuals: { label: 'Actuals', value: 'actuals' },
  scenarios: { label: 'Scenarios', value: 'scenarios' },
};

export const COLUMN_DATA_TYPES_KEYS = {
  alphanumeric: 'alphanumeric',
  amount: 'amount',
  date: 'date',
};

export const COLUMN_DATA_TYPES = [
  {
    label: 'Alphanumeric',
    value: COLUMN_DATA_TYPES_KEYS.alphanumeric,
    disabled: false,
  },
  {
    label: 'Amount',
    value: COLUMN_DATA_TYPES_KEYS.amount,
    disabled: false,
  },
  {
    label: 'Date',
    value: COLUMN_DATA_TYPES_KEYS.date,
    disabled: false,
  },
];

/**
 * Generate number{999,999,999,999}(Without format)
 *
 * @returns {String}
 */
export const getMaxGridInputValue = () => {
  let number = '';

  for (let index = 0; index <= DEFAULT_MAX_CHARS_FOR_GRID_INPUT; index++) {
    number += '9';
  }

  return number;
};

function getDataTypesObj() {
  const obj = {};

  COLUMN_DATA_TYPES.forEach(dt => {
    obj[dt.value] = dt;
  });

  return obj;
}

export const COLUMN_DATA_TYPES_OBJ = getDataTypesObj();

export const INPUT_MASKS = {
  US_PHONE: [
    '(',
    /[1-9]/,
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
  ],
};

export const DEFAULT_IMAGES = {
  PROFILE_AVATAR: '/images/pie-logo.svg',
};

export const DATE_FORMATS_ARRAY = [
  'YYYY-MM-DD',
  'MMM YYYY',
  'MMMM YYYY',
  'MMMM, YYYY',
  'MMMM Do, YYYY',
  'dddd, MMMM DD, YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'MM/DD',
  'MM/DD/YY',
  'DD-MMM',
  'DD-MMM-YY',
  'MMM-DD',
  'MMMM-DD',
  'MMMM DD, YYYY',

  // Prev format
  // 'YYYY-MM-DD',
  // 'YY-MM-DD',
  // 'DD-MM-YY',
  // 'DD-MM-YYYY',
  // 'DD MMMM YYYY',
  // 'D MMM YY',
  // 'D MMM YYYY',
  // 'ddd D MMM YY',
  // 'dddd D MMM YY',
  // 'ddd D MMMM YYYY',
  // 'dddd D MMMM YYYY',
  // 'MM-DD',
  // 'MM-YY',
  // 'MM-YYYY',
  // 'YYYY',
  // 'MMMM',
  // 'MMM, YYYY',
];

export const getExcelDateFormatLabel = format => {
  return moment().endOf('Y').format(format);
};

export const EXCEL_DATE_FORMATS = DATE_FORMATS_ARRAY.map(format => ({
  label: getExcelDateFormatLabel(format),
  value: format,
  api: format,
}));

// Default Data-type
export const DEFAULT_DATATYPE = COLUMN_DATA_TYPES_KEYS.alphanumeric;

// Global name for Rule based
export const RBM_DISPLAY_NAME = {
  label: 'Rule-Based Model',
  rbmLabel: 'Rule-Based Models',
  value: 'rule-based-model',
  rbmHeaderLabel: 'Rule-Based Models',
  rbmBreadcrumb: 'Rule-Based Modeling',
  rbmSideBarLabel: 'Rule-Based Modeling',
};

// Tool-tip message on Setting Icon (View RBM screen)
export const CONFIGURE_RULES_AND_COLUMNS = 'Configure rules and columns';

// Tool-tip message on Pencil Icon (Edit RBM Forecast screen)
export const EDIT_REPORT_VIEW = 'Edit report view';

// Content loader colors
export const CONTENT_LOADER_COLORS = {
  dark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    foregroundColor: 'rgba(255,255,255,0.11)',
  },
  light: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    foregroundColor: 'rgba(0,0,0,0.11)',
  },
  yellow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    foregroundColor: 'rgba(255,255,255,0.11)',
  },
};

// Global name for Dimension
export const AI_MODULES_DISPLAY_NAME = {
  dimensions: 'Linked Lookups',
  dimension: 'Linked Lookup',
};

/**
 * Default place value for decimal
 */
export const DEFAULT_DECIMAL_PLACE = 2;
