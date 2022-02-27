import { createSelector } from 'reselect';

const SourceTablesReducer = () => state => state.get('sourceTables');

/**
 * Get Selected View Mode
 *
 * @return {String}
 */
export const getViewMode = () =>
  createSelector(SourceTablesReducer(), state => state.get('viewMode'));

/**
 * Get isFetching
 *
 * @return {Boolean}
 */
export const isFetching = () =>
  createSelector(SourceTablesReducer(), state => state.get('isFetching'));

/**
 * Get Source Tables List
 *
 * @return {Array}
 */
export const getTablesList = () =>
  createSelector(SourceTablesReducer(), state =>
    state.get('tablesList').toJS()
  );

/**
 * Get Source Table
 *
 * @return {Object}
 */
export const getSourceTable = () =>
  createSelector(SourceTablesReducer(), state =>
    state.get('sourceTable').toJS()
  );

/**
 * Get Reload Table
 *
 * @return {Object}
 */
export const getReloadTable = () =>
  createSelector(SourceTablesReducer(), state =>
    state.get('reloadTable').toJS()
  );
