import { CREATE_DIMENSION_MODAL, SET_SELECTED_TABLE } from './constants';

/**
 * Set Create Dimension Modal Visibility
 *
 * @param {Boolean} data
 */
export const setCreateDimensionModal = data => {
  return { type: CREATE_DIMENSION_MODAL, data };
};

/**
 * Set Selected Table
 *
 * @param {Object} data
 */
export const setSelectedTable = data => {
  return { type: SET_SELECTED_TABLE, data };
};
