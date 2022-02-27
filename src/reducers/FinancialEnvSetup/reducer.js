import { fromJS } from 'immutable';
import {
  SET_IS_FETCHING,
  CLEAR_DATA,
  SET_ACTUAL_TABLE_INPUTS,
  SET_GL_ACCOUNTS,
  SET_ACTUAL_TABLE,
  SET_ACTIVE_TAB,
  SET_GL_ACCOUNTS_META,
} from './constants';

const initialState = fromJS({
  isFetching: false,
  activeTab: '',

  actualTable: {},
  actualTableInputs: {},

  glAccounts: [],
  glAccountsMeta: [],
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function FinancialEnvSetupReducer(state = initialState, action) {
  switch (action.type) {
    case SET_IS_FETCHING:
      return state.set('isFetching', action.data);

    case SET_ACTIVE_TAB:
      return state.set('activeTab', action.data);

    case SET_ACTUAL_TABLE:
      return state.set('actualTable', fromJS(action.data));

    case SET_GL_ACCOUNTS:
      return state.set('glAccounts', fromJS(action.data));

    case SET_GL_ACCOUNTS_META:
      return state.set('glAccountsMeta', fromJS(action.data));

    case SET_ACTUAL_TABLE_INPUTS:
      return state.set('actualTableInputs', fromJS(action.data));

    case CLEAR_DATA:
      return state
        .set('isFetching', false)
        .set('activeTab', '')
        .set('actualTable', fromJS({}))
        .set('actualTableInputs', fromJS({}))
        .set('glAccountsMeta', fromJS([]))
        .set('glAccounts', fromJS([]));

    default:
      return state;
  }
}

export default FinancialEnvSetupReducer;
