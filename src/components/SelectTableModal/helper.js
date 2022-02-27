import { AI_MODULES_DISPLAY_NAME } from '../../configs/app';

/**
 * Global Tabs for - Source Table, Scenario, Import Table, Dimension
 */
export const TABS_ACTIONS_KEYS = {
  sourceTableTab: 'Source Tables',
  importTableTab: 'Import Table',
  dimensionTab: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
  scenarioTab: 'Scenarios',
  rbm: 'Rule Based Models',
};

/**
 * Local tabs for Record-Editor
 */
export const RE_TABS_ACTIONS_KEYS = {
  scenarioTab: 'Scenarios',
  sourceTableTab: 'Source Tables',
  dimensionTab: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
  rbm: 'Rule Based Models',
};

/**
 * Local tabs for Scenario-Editor
 */
export const SCENARIO_TABS_ACTIONS_KEYS = {
  sourceTableTab: 'Source Tables',
  importTableTab: 'Import Table',
};

/**
 * Local tabs for Dimension-Editor
 */
export const DIMENSION_TABS_ACTIONS_KEYS = {
  sourceTableTab: 'Source Tables',
  importTableTab: 'Import Table',
};

/**
 * Local tabs for RBM-Editor (Sync Scenario)
 */
export const SYNC_TABS_ACTIONS_KEYS = {
  scenarioTab: 'Scenarios',
};

/**
 * Tabs Actions
 */
export const TABS_ACTIONS = TABS_ACTIONS_KEYS =>
  Object.values(TABS_ACTIONS_KEYS);
