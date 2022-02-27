import { createSelector } from 'reselect';

const DimensionsReducer = () => state => state.get('dimensions');

/**
 * Is Create Dimension Modal Visible
 *
 * @return {Boolean}
 */
export const isCreateDimensionModal = () =>
  createSelector(DimensionsReducer(), state =>
    state.get('isCreateDimensionModal')
  );

/**
 * Get Selected Table
 *
 * @return {Object}
 */
export const getSelectedTable = () =>
  createSelector(DimensionsReducer(), state =>
    state.get('selectedTable').toJS()
  );
