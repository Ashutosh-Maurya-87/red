export const MAX_TABS_LENGTH_TO_ADD = 10;

export const TAB_ACTIONS = {
  rename: 'Rename',
  remove: 'Remove',
};

export const TABS_ACTIONS_ARRAY = Object.values(TAB_ACTIONS);

/**
 * Identify the duplicate tab name
 *
 * @param {Array} tabs
 * @param {String} name
 */
export const isDuplicateTabExist = (tabs, name) => {
  const result = tabs.filter(tab => tab.name === name);

  return result.length > 0 ? true : false;
};

/**
 * Generate new tab
 *
 * @param {Array} tabs
 * @param {Number} Count
 *
 * @return {Object}
 */
export const genrateTab = (tabs, count) => {
  const id = count + 1;
  const name = `Model ${id}`;

  if (isDuplicateTabExist(tabs, name)) {
    return genrateTab(tabs, id);
  }

  return { id, name };
};
