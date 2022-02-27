import {
  DEFAULT_FIELD_TYPE,
  DEFAULT_ROUNDING_DIGIT,
  DEFAULT_ROUND_OFF,
} from './GridPanel/configs';

export const RETRY_SYNC_ROW = 3;
export const DEFAULT_COL_WIDTH = 150;
export const DEFAULT_LABEL_COL_WIDTH = 250;

/**
 * Sync Timeout
 *
 * Note: For 1 Second, use 1000 (One Thousand)
 */
export const SYNC_TIMEOUT = 2000;

/**
 * Max api count for sync
 */
export const MAX_API_COUNT_FOR_SYNC = 15;

/**
 * Model Grid > Header Date Format
 */
export const HEADER_DATE_FORMAT = 'MMM YYYY';

/**
 * Model Grid > Header Height
 */
export const HEADER_INDEX_ROW = 24;
export const HEADER_PERIOD_ROW = 90;

/**
 * Max allowed rows in workbook
 */
export const MAX_ROWS = 100;

/**
 * Default row height for model grid
 */
export const ROW_HEIGHT = 32;

/**
 * Row Types > Keys
 */
export const ROW_TYPES_KEYS = {
  freeform: 'FREEFORM',
  extract: 'EXTRACT',
  formula: 'FORMULA',
};

/**
 * Row Types > Array
 */
export const ROW_TYPES_ARRAY = [
  {
    label: 'Freeform',
    value: String(ROW_TYPES_KEYS.freeform),
    description: 'Type directly into the cells',
  },
  {
    label: 'Extract',
    value: String(ROW_TYPES_KEYS.extract),
    description:
      'Pull data from the database into this row by selecting from the options below',
  },
  {
    label: 'Formula',
    value: String(ROW_TYPES_KEYS.formula),
    description: `Use a formula to calculate this row's value`,
  },
];

/**
 * Get Row Types Object
 *
 * @return {Object}
 */
function getRowTypesObject() {
  const obj = {};

  ROW_TYPES_ARRAY.forEach(type => {
    obj[type.value] = { ...type };
  });

  return obj;
}

/**
 * Row Types > Object
 */
export const ROW_TYPES_OBJECT = getRowTypesObject();

/**
 * Default Row configs
 */
export const DEFAULT_ROW_CONFIG = {
  fieldType: DEFAULT_FIELD_TYPE,
  isRoundOff: DEFAULT_ROUND_OFF,
  roundingDigits: String(DEFAULT_ROUNDING_DIGIT),
  rowType: String(ROW_TYPES_KEYS.freeform),
  isPostingEnable: false,
  isRowUseAsHeading: false,
  readMappings: [],
  writeMappings: [],
  extractFormula: [],
  postingFormula: [],
};
