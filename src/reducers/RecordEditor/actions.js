import { SET_SELECTED_TABLE } from './constants';

/**
 * Set Selected Table
 *
 * @param {Object} table
 */
export const setSelectedTable = table => {
  return { type: SET_SELECTED_TABLE, data: table };
};
