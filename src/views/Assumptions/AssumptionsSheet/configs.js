export const HEADER_ROW_HEIGHT = 44;
export const ROW_HEIGHT = 32;
export const FIXED_ROWS = 2;
export const FIXED_COLUMNS = 2;

/**
 * Row Context Menu > Action Keys
 */
export const ROW_CONTEXT_MENU_ACTIONS_KEYS = {
  insertAbove: 'Insert New Row Above',
  insertBelow: 'Insert New Row Below',
  duplicate: 'Duplicate',
  delete: 'Delete',
};

/**
 * Row Context Menu Actions
 */
export const ROW_CONTEXT_MENU_ACTIONS = Object.values(
  ROW_CONTEXT_MENU_ACTIONS_KEYS
);

/**
 * Columns Context Menu > Action Keys
 */
export const COL_CONTEXT_MENU_ACTIONS_KEYS = {
  insertBefore: 'Insert New Column Before',
  insertAfter: 'Insert New Column After',
  duplicate: 'Duplicate',
  delete: 'Delete',
};

/**
 * Column Context Menu Actions
 */
export const COL_CONTEXT_MENU_ACTIONS = Object.values(
  COL_CONTEXT_MENU_ACTIONS_KEYS
);

/**
 * Field Type Keys
 */
export const FIELD_TYPE_KEYS = {
  number: 'NUMBER',
  currency: 'CURRENCY',
  percentage: 'PERCENTAGE',
};

/**
 * Row Field Types
 */
export const ROW_FIELD_TYPES = Object.values(FIELD_TYPE_KEYS).map(value => {
  switch (value) {
    case FIELD_TYPE_KEYS.number:
      return { value, symbol: '#' };

    case FIELD_TYPE_KEYS.currency:
      return { value, symbol: '$' };

    case FIELD_TYPE_KEYS.percentage:
      return { value, symbol: '%' };

    default:
      return {};
  }
});

/**
 * Default Column configs
 */
export const DEFAULT_COL_CONFIG = {
  fieldType: String(FIELD_TYPE_KEYS.number),
};

/**
 *  Regx to Identify Number in String
 */
export const regxToFindNumber = /[0-9 ]+/g;
