import { createSelector } from 'reselect';

const ModelsReducer = () => state => state.get('models');

/**
 * Is Fetching
 *
 * @return {Boolean}
 */
export const isFetching = () =>
  createSelector(ModelsReducer(), state => state.get('isFetching'));

/**
 * Is View Only
 *
 * @return {Boolean}
 */
export const getIsViewMode = () =>
  createSelector(ModelsReducer(), state => state.get('isViewMode'));

/**
 * Get Workbook
 *
 * @return {Object}
 */
export const getWorkbook = () =>
  createSelector(ModelsReducer(), state => state.get('workbook').toJS());

/**
 * Get Worksheets
 *
 * @return {Array}
 */
export const getWorksheets = () =>
  createSelector(ModelsReducer(), state => state.get('worksheets').toJS());

/**
 * Get Active Worksheet
 *
 * @return {Object}
 */
export const getActiveWorksheet = () =>
  createSelector(ModelsReducer(), state => state.get('activeWorksheet').toJS());

/**
 * Get Shared Mappings
 *
 * @return {Array}
 */
export const getSharedMappings = () =>
  createSelector(ModelsReducer(), state => state.get('sharedMappings').toJS());

/**
 * Get Grid Headers
 *
 * @return {Array}
 */
export const getGridHeaders = () =>
  createSelector(ModelsReducer(), state => state.get('gridHeaders').toJS());

/**
 * Get Grid Data
 *
 * @return {Array}
 */
export const getGridData = () =>
  createSelector(ModelsReducer(), state => state.get('gridData').toJS());

/**
 * Get Grid Cell Formulas
 *
 * @return {Array}
 */
export const getGridCellFormulas = () =>
  createSelector(ModelsReducer(), state =>
    state.get('gridCellFormulas').toJS()
  );

/**
 * Get Grid Data Table
 *
 * @return {Object}
 */
export const getGridDataTable = () =>
  createSelector(ModelsReducer(), state => state.get('gridDataTable').toJS());

/**
 * Get Row Configs Data
 *
 * @return {Array}
 */
export const getRowConfigs = () =>
  createSelector(ModelsReducer(), state => state.get('rowConfigs').toJS());

/**
 * Get System Dimension List
 *
 * @return {Array}
 */
export const getSystemDimension = () =>
  createSelector(ModelsReducer(), state =>
    state.get('systemDimensions').toJS()
  );

/**
 * GET ASSUMPTION Listing
 *
 * @return {Array}
 */
export const getAssumptionListing = () =>
  createSelector(ModelsReducer(), state => state.get('assumptionLists').toJS());
