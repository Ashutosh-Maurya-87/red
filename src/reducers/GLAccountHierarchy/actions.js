import {
  CLEAR_DATA,
  SET_GL_ACCOUNT_LISTING,
  SET_GL_HIERARCHY_LISTING,
  SET_SELECTED_FOLDER,
  ADD_GL_ACCOUNT,
  SET_HEADERS,
} from './constants';

/**
 * Set GL Accounts
 *
 * @param {Array} data
 */
export const setGLAccountListing = data => {
  return { type: SET_GL_ACCOUNT_LISTING, data };
};

/**
 * Set Hierarchy Tree
 *
 * @param {Array} data
 */
export const setHierarchyListing = data => {
  return { type: SET_GL_HIERARCHY_LISTING, data };
};

/**
 * Set Selected Folder
 *
 * @param {Array} data
 */
export const setSelectedFolder = id => {
  return { type: SET_SELECTED_FOLDER, id };
};

/**
 * Add GL Account
 *
 * @param {Array} data
 */
export const addGLAccount = data => {
  return { type: ADD_GL_ACCOUNT, data };
};

/**
 * Set data to initial
 */
export const clearData = () => {
  return { type: CLEAR_DATA };
};

/**
 * Set Headers Meta
 */
export const setHeaders = data => {
  return { type: SET_HEADERS, data };
};
