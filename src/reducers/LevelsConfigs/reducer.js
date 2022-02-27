import { fromJS } from 'immutable';
import {
  CLEAR_DATA,
  SET_LEVELS_LISTING,
  VISIBLE_MODAL_LEVEL,
} from './constants';

const initialState = fromJS({
  levels: [],
  isVisibleLevel: false,
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function LevelsConfigsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_LEVELS_LISTING:
      return state.set('levels', fromJS(action.data));

    case CLEAR_DATA:
      return state.set('isVisibleLevel', false).set('levels', fromJS([]));

    case VISIBLE_MODAL_LEVEL:
      return state.set('isVisibleLevel', action.isVisible);

    default:
      return state;
  }
}

export default LevelsConfigsReducer;
