import {
  SET_IS_FETCHING,
  SET_VIEW_MODE,
  SET_TABLES_LIST,
  SET_RELOAD_TABLE,
  DEFAULT_VIEW_MODE,
  CLEAR_DATA,
  SET_SOURCE_TABLE,
} from './constants';

/**
 * Set viewMode
 *
 * @param {Boolean} isFetching
 */
export const setViewMode = (viewMode = DEFAULT_VIEW_MODE) => {
  return { type: SET_VIEW_MODE, data: viewMode };
};

/**
 * Set isFetching
 *
 * @param {Boolean} isFetching
 */
export const setIsFetching = (isFetching = false) => {
  return { type: SET_IS_FETCHING, data: isFetching };
};

/**
 * Clear Source Tables data to initial
 */
export const clearData = () => {
  return { type: CLEAR_DATA };
};

/**
 * Set Tables List
 *
 * @param {Array} list
 */
export const setTablesList = (list = []) => {
  return { type: SET_TABLES_LIST, data: list };
};

/**
 * Set Source Table Data
 *
 * @param {Object} data
 */
export const setSourceTable = (data = {}) => {
  return { type: SET_SOURCE_TABLE, data };
};

/**
 * Set Reload Table Data
 *
 * @param {Object} data
 */
export const setReloadTable = (data = {}) => {
  return { type: SET_RELOAD_TABLE, data };
};
