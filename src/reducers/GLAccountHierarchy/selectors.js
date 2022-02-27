import { createSelector } from 'reselect';

const GLAccountHierarchy = () => state => state.get('GLAccountHierarchy');

/**
 * Get GL Account listing for table view
 *
 * @return {Array}
 */
export const getGLAccountListing = () =>
  createSelector(GLAccountHierarchy(), state =>
    state.get('GLAccountListing').toJS()
  );

/**
 * Get Hierarchy Listing for Tree view
 *
 * @return {Object}
 */
export const getHierarchyListing = () =>
  createSelector(GLAccountHierarchy(), state =>
    state.get('hierarchyList').toJS()
  );

/**
 * Get Hierarchy Hedaers Array
 *
 * @return {Array}
 */
export const getHierarchyHeaders = () =>
  createSelector(GLAccountHierarchy(), state =>
    state.get('hierarchyHeaders').toJS()
  );

/**
 * Get Selected Folder
 *
 * @return {Object}
 */
export const getSelectedFolder = () =>
  createSelector(
    GLAccountHierarchy(),
    state => state.get('selectedFolder') || ''
  );
