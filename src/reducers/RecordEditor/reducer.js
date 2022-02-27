import { fromJS } from 'immutable';
import { SET_SELECTED_TABLE } from './constants';

const initialState = fromJS({
  selectedTable: {},
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function RecordEditorReducer(state = initialState, action) {
  switch (action.type) {
    case SET_SELECTED_TABLE:
      return state.set('selectedTable', fromJS(action.data));

    default:
      return state;
  }
}

export default RecordEditorReducer;
