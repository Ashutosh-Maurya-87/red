import { ROW_TYPES_ARRAY } from '../configs';

/**
 * Model > Setup Row Drawer > Tabs Keys
 */
export const SETUP_ROW_TAB_KEYS = {
  rowType: 'row_type',
  posting: 'posting',
};

/**
 * Model > Setup Row Drawer > Tabs Array
 */
export const SETUP_ROW_TABS = [
  {
    label: 'Setup Row',
    value: String(SETUP_ROW_TAB_KEYS.rowType),
    isEnable: true,
    isOptionsEnable: true,
    options: [...ROW_TYPES_ARRAY],
  },
  {
    label: 'Posting',
    value: String(SETUP_ROW_TAB_KEYS.posting),
    isEnable: false,
    isOptionsEnable: false,
    options: [],
  },
];
