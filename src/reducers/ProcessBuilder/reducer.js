import { fromJS } from 'immutable';
import { SET_IS_FETCHING, CLEAR_DATA } from './constants';

const initialState = fromJS({
  isFetching: false,
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function ProcessBuilderReducer(state = initialState, action) {
  switch (action.type) {
    case SET_IS_FETCHING:
      return state.set('isFetching', action.data);

    case CLEAR_DATA:
      return state.set('isFetching', false);

    default:
      return state;
  }
}

export default ProcessBuilderReducer;
