import { fromJS } from 'immutable';

import {
  SET_IS_FETCHING,
  SET_VIEW_MODE,
  SET_TABLES_LIST,
  SET_RELOAD_TABLE,
  DEFAULT_VIEW_MODE,
  CLEAR_DATA,
  SET_SOURCE_TABLE,
} from './constants';

const initialState = fromJS({
  viewMode: DEFAULT_VIEW_MODE,
  isFetching: false,
  reloadTable: {},
  tablesList: [],
  sourceTable: {},
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function SourceTablesReducer(state = initialState, action) {
  switch (action.type) {
    case SET_VIEW_MODE:
      return state.set('viewMode', action.data);

    case SET_IS_FETCHING:
      return state.set('isFetching', action.data);

    case SET_TABLES_LIST:
      return state.set('tablesList', fromJS(action.data));

    case SET_SOURCE_TABLE:
      return state.set('sourceTable', fromJS(action.data));

    case SET_RELOAD_TABLE:
      return state.set('reloadTable', fromJS(action.data));

    case CLEAR_DATA:
      return state
        .set('isFetching', false)
        .set('tablesList', initialState.get('tablesList'));

    default:
      return state;
  }
}

export default SourceTablesReducer;
