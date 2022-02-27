import { getGridTableByIndex } from '../../views/Models/ModelWorkbook/helper';
import {
  CLEAR_DATA,
  SET_IS_FETCHING,
  SET_IS_VIEW_ONLY,
  SET_WORKBOOK,
  SET_WORKSHEETS,
  SET_ACTIVE_WORKSHEET,
  SET_SHARED_MAPPINGS,
  SET_GRID_HEADERS,
  SET_GRID_DATA,
  SET_FORMULA_CELL_INDEX,
  DELETE_FORMULA_CELL_INDEX,
  SET_FORMULA_CELLS_INDEX,
  SET_ROW_CONFIGS,
  SET_SYSTEM_DIMENSION,
  SET_ASSUMPTION_LISTING,
} from './constants';

/**
 * Clear Data
 */
export const clearData = () => {
  return { type: CLEAR_DATA };
};

/**
 * Set > Is Fetching
 *
 * @param {Boolean} data
 */
export const setIsFetching = data => {
  return { type: SET_IS_FETCHING, data };
};

/**
 * Set > Is View Only Mode
 *
 * @param {Boolean} data
 */
export const setIsViewMode = data => {
  return { type: SET_IS_VIEW_ONLY, data };
};

/**
 * Set Workbook
 *
 * @param {Object} data
 */
export const setWorkbook = data => {
  return { type: SET_WORKBOOK, data };
};

/**
 * Set Worksheets
 *
 * @param {Array} data
 */
export const setWorksheets = data => {
  return { type: SET_WORKSHEETS, data };
};

/**
 * Set Active Worksheet
 *
 * @param {Object} data
 */
export const setActiveWorksheet = data => {
  return { type: SET_ACTIVE_WORKSHEET, data };
};

/**
 * Set Shared Mappings
 *
 * @param {Array} data
 */
export const setSharedMappings = data => {
  return { type: SET_SHARED_MAPPINGS, data };
};

/**
 * Set Grid Headers
 *
 * @param {Array} data
 */
export const setGridHeaders = data => {
  return { type: SET_GRID_HEADERS, data };
};

/**
 * Set Grid Data
 *
 * @param {Array} data
 */
export const setGridData = (data, scope = {}) => {
  return async (dispatch, getState) => {
    return new Promise(resolve => {
      const state = getState().toJS();
      const { headers, rowConfigs, assumptionLists } = state.models;
      const updatedScope =
        Object.keys(scope).length > 0
          ? scope
          : getGridTableByIndex(headers, rowConfigs, data, assumptionLists);

      dispatch({ type: SET_GRID_DATA, data, scope: updatedScope });
      resolve({ scope: updatedScope });
    });
  };
};

/**
 * Store Cell formula index
 *
 * @param {Array} data
 */
export const setFormulaCell = data => {
  return { type: SET_FORMULA_CELL_INDEX, data };
};

/**
 * Remove Formula cell
 *
 * @param {Array} data
 */
export const deleteFormulaCell = data => {
  return { type: DELETE_FORMULA_CELL_INDEX, data };
};

/**
 * Store Cells formula Array
 *
 * @param {Array} data
 */
export const setFormulaCells = data => {
  return { type: SET_FORMULA_CELLS_INDEX, data };
};

/**
 * Set Row Configs Data
 *
 * @param {Array} data
 */
export const setRowConfigs = data => {
  return { type: SET_ROW_CONFIGS, data };
};

/**
 * Set System Dimension List
 *
 * @param {Array} data
 */
export const setSystemDimensions = data => {
  return { type: SET_SYSTEM_DIMENSION, data };
};

/**
 * Set Assumption Listing
 *
 * @param {Array} data
 */

export const setAssumptionListing = data => {
  return { type: SET_ASSUMPTION_LISTING, data };
};
