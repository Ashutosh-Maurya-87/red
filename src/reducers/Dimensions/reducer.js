import { fromJS } from 'immutable';
import { CREATE_DIMENSION_MODAL, SET_SELECTED_TABLE } from './constants';

const initialState = fromJS({
  isCreateDimensionModal: false,
  selectedTable: {},
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function DimensionsReducer(state = initialState, action) {
  switch (action.type) {
    case CREATE_DIMENSION_MODAL:
      return state.set('isCreateDimensionModal', action.data);

    case SET_SELECTED_TABLE:
      return state.set('selectedTable', fromJS(action.data));

    default:
      return state;
  }
}

export default DimensionsReducer;
