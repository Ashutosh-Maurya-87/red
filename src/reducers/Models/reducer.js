import { fromJS } from 'immutable';
import {
  CLEAR_DATA,
  SET_IS_FETCHING,
  SET_IS_VIEW_ONLY,
  SET_WORKBOOK,
  SET_WORKSHEETS,
  SET_ACTIVE_WORKSHEET,
  SET_SHARED_MAPPINGS,
  SET_GRID_HEADERS,
  SET_GRID_DATA,
  SET_FORMULA_CELL_INDEX,
  DELETE_FORMULA_CELL_INDEX,
  SET_FORMULA_CELLS_INDEX,
  SET_ROW_CONFIGS,
  SET_SYSTEM_DIMENSION,
  SET_ASSUMPTION_LISTING,
} from './constants';

const initialState = fromJS({
  isFetching: false,
  isViewMode: false,

  workbook: {},
  worksheets: [],
  activeWorksheet: {},

  sharedMappings: [],
  gridHeaders: [],
  gridData: [],
  gridCellFormulas: [],
  gridDataTable: {},
  rowConfigs: [],
  systemDimensions: [],
  assumptionLists: [],
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function ModelsReducer(state = initialState, action) {
  const cellIndexes = state.get('gridCellFormulas').toJS();

  switch (action.type) {
    case CLEAR_DATA:
      return state
        .set('isFetching', initialState.get('isFetching'))
        .set('isViewMode', initialState.get('isViewMode'))
        .set('workbook', initialState.get('workbook'))
        .set('worksheets', initialState.get('worksheets'))
        .set('activeWorksheet', initialState.get('activeWorksheet'))
        .set('sharedMappings', initialState.get('sharedMappings'))
        .set('gridHeaders', initialState.get('gridHeaders'))
        .set('gridData', initialState.get('gridData'))
        .set('rowConfigs', initialState.get('rowConfigs'))
        .set('gridDataTable', initialState.get('gridDataTable'))
        .set('gridCellFormulas', initialState.get('gridCellFormulas'));

    case SET_IS_FETCHING:
      return state.set('isFetching', action.data);

    case SET_IS_VIEW_ONLY:
      return state.set('isViewMode', action.data);

    case SET_WORKBOOK:
      return state.set('workbook', fromJS(action.data));

    case SET_WORKSHEETS:
      return state.set('worksheets', fromJS(action.data));

    case SET_ACTIVE_WORKSHEET:
      return state.set('activeWorksheet', fromJS(action.data));

    case SET_SHARED_MAPPINGS:
      return state.set('sharedMappings', fromJS(action.data));

    case SET_GRID_HEADERS:
      return state.set('gridHeaders', fromJS(action.data));

    case SET_GRID_DATA:
      return state
        .set('gridData', fromJS(action.data))
        .set('gridDataTable', fromJS(action.scope || {}));

    case DELETE_FORMULA_CELL_INDEX:
      const filtered = cellIndexes.filter(
        ({ cellIndex }) => cellIndex != action.data
      );

      return state.set('gridCellFormulas', fromJS(filtered));

    case SET_FORMULA_CELL_INDEX:
      if (
        cellIndexes
          .map(({ cellIndex }) => cellIndex)
          .indexOf(action.data.cellIndex) === -1
      )
        cellIndexes.push(action.data);

      return state.set('gridCellFormulas', fromJS(cellIndexes));

    case SET_FORMULA_CELLS_INDEX:
      return state.set('gridCellFormulas', fromJS(action.data));

    case SET_SYSTEM_DIMENSION:
      return state.set('systemDimensions', fromJS(action.data));

    case SET_ROW_CONFIGS:
      return state.set('rowConfigs', fromJS(action.data));

    case SET_ASSUMPTION_LISTING:
      return state.set('assumptionLists', fromJS(action.data));

    default:
      return state;
  }
}

export default ModelsReducer;
