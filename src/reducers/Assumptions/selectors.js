import { createSelector } from 'reselect';

const AssumptionsReducer = () => state => state.get('assumptions');

/**
 * Get selected Assumption
 *
 * @return {Array}
 */
export const getAssumption = () =>
  createSelector(AssumptionsReducer(), state => state.get('assumption').toJS());

/**
 * Get Assumptions Grid Table Headers [First Row]
 *
 * @return {Array}
 */
export const getGridHeaders = () =>
  createSelector(AssumptionsReducer(), state =>
    state.get('gridHeaders').toJS()
  );

/**
 * Get Assumptions Grid Table Data
 *
 * @return {Array} data
 */
export const getGridData = () =>
  createSelector(AssumptionsReducer(), state => state.get('gridData').toJS());
