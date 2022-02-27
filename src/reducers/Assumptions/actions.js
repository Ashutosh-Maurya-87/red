import {
  SET_ASSUMPTION,
  SET_GRID_HEADERS,
  SET_GRID_DATA,
  CLEAR_DATA,
} from './constants';

/**
 * Set Selected Assumption
 *
 * @param {Object} data
 */
export const setAssumption = data => {
  return { type: SET_ASSUMPTION, data };
};

/**
 * Set Assumptions Grid Table Headers [First Row]
 *
 * @param {Array} data
 */
export const setGridHeaders = data => {
  return { type: SET_GRID_HEADERS, data };
};

/**
 * Set Assumptions Grid Table Data
 *
 * @param {Array} data
 */
export const setGridData = data => {
  return { type: SET_GRID_DATA, data };
};

/**
 * Clear Assumption Grid Headers and Data
 *
 * @param {Any} data
 */
export const clearData = data => {
  return { type: CLEAR_DATA, data };
};
