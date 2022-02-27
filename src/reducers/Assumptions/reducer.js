import { fromJS } from 'immutable';
import {
  SET_ASSUMPTION,
  SET_GRID_HEADERS,
  SET_GRID_DATA,
  CLEAR_DATA,
} from './constants';

const initialState = fromJS({
  assumption: {},
  gridHeaders: [],
  gridData: [],
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function AssumptionsReducer(state = initialState, action) {
  switch (action.type) {
    case CLEAR_DATA:
      return state
        .set('assumption', initialState.get('assumption'))
        .set('gridHeaders', initialState.get('gridHeaders'))
        .set('gridData', initialState.get('gridData'));

    case SET_ASSUMPTION:
      return state.set('assumption', fromJS(action.data));

    case SET_GRID_HEADERS:
      return state.set('gridHeaders', fromJS(action.data));

    case SET_GRID_DATA:
      return state.set('gridData', fromJS(action.data));

    default:
      return state;
  }
}

export default AssumptionsReducer;
