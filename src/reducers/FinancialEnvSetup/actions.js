import {
  SET_IS_FETCHING,
  CLEAR_DATA,
  SET_ACTUAL_TABLE_INPUTS,
  SET_GL_ACCOUNTS,
  SET_GL_ACCOUNTS_META,
  SET_ACTUAL_TABLE,
  SET_ACTIVE_TAB,
} from './constants';

/**
 * Set isFetching
 *
 * @param {Boolean} isFetching
 */
export const setIsFetching = (isFetching = false) => {
  return { type: SET_IS_FETCHING, data: isFetching };
};

/**
 * Set Active Tab
 *
 * @param {String} isFetching
 */
export const setActiveTab = activeTab => {
  return { type: SET_ACTIVE_TAB, data: activeTab };
};

/**
 * Set Actual Table
 *
 * @param {Object} data
 */
export const setActualTable = data => {
  return { type: SET_ACTUAL_TABLE, data };
};

/**
 * Set Actual Table Inputs
 *
 * @param {Object} isFetching
 */
export const setActualTableInputs = data => {
  return { type: SET_ACTUAL_TABLE_INPUTS, data };
};

/**
 * Set GL Accounts
 *
 * @param {Array} data
 */
export const setGLAccounts = data => {
  return { type: SET_GL_ACCOUNTS, data };
};

/**
 * Set GL Accounts Meta Data
 *
 * @param {Array} data
 */
export const setGLAccountsMeta = data => {
  return { type: SET_GL_ACCOUNTS_META, data };
};

/**
 * Set data to initial
 */
export const clearData = () => {
  return { type: CLEAR_DATA };
};
