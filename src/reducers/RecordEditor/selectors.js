import { createSelector } from 'reselect';

const RecordEditorReducer = () => state => state.get('recordEditor');

/**
 * Get Selected Table
 *
 * @return {Object}
 */
export const getSelectedTable = () =>
  createSelector(RecordEditorReducer(), state =>
    state.get('selectedTable').toJS()
  );
