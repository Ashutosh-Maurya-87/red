export const FIXED_ROWS = 2;
export const FIXED_COLUMNS = 2;

/**
 * Header Context Menu > Action Keys
 */
export const HEADER_CONTEXT_MENU_ACTIONS_KEYS = {
  resizeAbove: 'Resize Column',
};

/**
 * Header Context Menu Actions
 */
export const HEADER_CONTEXT_MENU_ACTIONS = Object.values(
  HEADER_CONTEXT_MENU_ACTIONS_KEYS
);

/**
 * Row Context Menu > Action Keys
 */
export const ROW_CONTEXT_MENU_ACTIONS_KEYS = {
  insertAbove: 'Insert New Row Above',
  insertBelow: 'Insert New Row Below',
  moveAbove: 'Move Row Above',
  moveBelow: 'Move Row Below',
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
 * Cell Context Menu > Action Keys
 */
export const CELL_CONTEXT_MENU_ACTIONS_KEYS = {
  copyValue: 'Copy',
  copyReference: 'Copy Formula',
  cutValue: 'Cut',
  paste: 'Paste',
  resetStyles: 'Reset Styles',
};

/**
 * Cell Context Menu Actions
 */
export const CELL_CONTEXT_MENU_ACTIONS = Object.values(
  CELL_CONTEXT_MENU_ACTIONS_KEYS
);

/**
 * Round Digit Configs
 */
export const DEFAULT_ROUNDING_DIGIT = 0;
export const MIN_ROUNDING_DIGIT = 0;
export const MAX_ROUNDING_DIGIT = 8;

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
 * Default Field Type
 */
export const DEFAULT_FIELD_TYPE = String(FIELD_TYPE_KEYS.number);

/**
 * Default Round off
 */
export const DEFAULT_ROUND_OFF = true;

/**
 * Regx to Find cell indexs in grid
 */
export const REGX_TO_FIND_CELL_INDEXS_IN_GRID = /([A-Z]{1,3}[0-9]{1,5}|(?!^)(ASSUMPTION\(+)([a-zA-z0-9]*)(?:\)+))/g;

/**
 *  Default Error
 */
export const DEFAULT_ERROR_TEXT = 'ERROR';

/**
 * Assumption PreFix
 */
export const ASSUMPTION_PREFIX = 'ASSUMPTION';
