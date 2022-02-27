/**
 * Settings Context Menu > Action Keys
 */
export const SETTINGS_CONTEXT_MENU_ACTIONS_KEYS = {
  export: 'Export',
  assumptions: 'Assumptions',
  refresh: 'Refresh',
};

/**
 * Settings Context Menu Actions
 */
export const SETTINGS_CONTEXT_MENU_ACTIONS = Object.values(
  SETTINGS_CONTEXT_MENU_ACTIONS_KEYS
);

/**
 * Density Menu > Action Keys
 */
export const DENSITY_ACTIONS_KEYS = {
  default: 'Default',
  comfortable: 'Comfortable',
  compact: 'Compact',
};

/**
 * Density Sizes
 */
export const DENSITY_SIZES_KEYS = {
  default: 106,
  compact: 90,
  comfortable: 125,
};

/**
 * Density Sizes for Record Editor
 */
export const RECORD_DENSITY_SIZES_KEYS = {
  default: 90,
  compact: 76,
  comfortable: 104,
};

/**
 * Default Density
 */
export const DEFAULT_DENSITY = DENSITY_ACTIONS_KEYS.default;

/**
 * Default Density Width
 */
export const DEFAULT_DENSITY_WIDTH = DENSITY_SIZES_KEYS.default;
export const DEFAULT_DENSITY_WIDTH_RE = RECORD_DENSITY_SIZES_KEYS.default;

/**
 * Density Menu Actions
 */
export const DENSITY_ACTIONS = Object.values(DENSITY_ACTIONS_KEYS);
