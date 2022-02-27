export const MAX_ASSUMPTION_NAME = 50;

/**
 * API keys for Assumption Scopes
 */
export const ASSUMPTION_SCOPES_KEYS = {
  global: 'GLOBAL',
  local: 'LOCAL',
};

/**
 * Assumptions Scopes Array
 */
export const ASSUMPTION_SCOPES = [
  {
    label: 'Global',
    value: String(ASSUMPTION_SCOPES_KEYS.local),
  },
  {
    label: 'Local',
    value: String(ASSUMPTION_SCOPES_KEYS.global),
  },
];

/**
 * Assumptions Scopes Object with keys
 */
export const ASSUMPTION_SCOPES_OBJ = {};
ASSUMPTION_SCOPES.forEach(item => {
  ASSUMPTION_SCOPES_OBJ[item.value] = item;
});
