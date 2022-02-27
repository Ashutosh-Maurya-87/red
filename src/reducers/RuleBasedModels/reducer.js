import { fromJS } from 'immutable';
import {
  CLEAR_DATA,
  SET_ACTIVE_TAB,
  SET_OVERVIEW_GRID_DATA,
  SET_OVERVIEW_GRID_HEADERS,
  SET_SINGLE_RBM_DATA,
  SET_FORECASTING_GRID_DATA,
  SET_FORECASTING_GRID_HEADERS,
  SET_FORECASTING_DATA,
  SET_DATE_RANGE,
  CLEAR_FORECASTING_DATA,
  SET_SELECTED_CALCULATION_RULES,
  SET_SELECTED_GROUP_INDEX,
} from './constants';

import {
  defaultEndDate,
  defaultStartDate,
} from '../../views/RuleBasedModels/EditRuleBasedModel/configs';

const initialState = fromJS({
  activeTab: '',
  activeCalculationGroupIndex: null,
  singleRBM: null,
  overViewGridData: [],
  overViewGridHeaders: [],
  forecastingGridData: [],
  forecastingGridHeaders: [],
  forecastingData: null,
  dateRange: { start: defaultStartDate, end: defaultEndDate },
  selectedCalculationRules: [],
});

const RuleBasedModelsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_ACTIVE_TAB:
      return state.set('activeTab', action.data);

    case SET_SELECTED_GROUP_INDEX:
      return state.set('activeCalculationGroupIndex', action.data);

    case SET_SINGLE_RBM_DATA:
      return state.set('singleRBM', action.data);

    case SET_SELECTED_CALCULATION_RULES:
      return state.set('selectedCalculationRules', fromJS(action.data));

    case SET_OVERVIEW_GRID_DATA:
      return state.set('overViewGridData', fromJS(action.data));

    case SET_OVERVIEW_GRID_HEADERS:
      return state.set('overViewGridHeaders', fromJS(action.data));

    case SET_FORECASTING_GRID_DATA:
      return state.set('forecastingGridData', fromJS(action.data));

    case SET_FORECASTING_GRID_HEADERS:
      return state.set('forecastingGridHeaders', fromJS(action.data));

    case SET_FORECASTING_DATA:
      return state.set('forecastingData', action.data);

    case SET_DATE_RANGE:
      return state.set('dateRange', action.data);

    case CLEAR_FORECASTING_DATA:
      return state
        .set('forecastingGridData', initialState.get('forecastingGridData'))
        .set(
          'forecastingGridHeaders',
          initialState.get('forecastingGridHeaders')
        )
        .set('forecastingData', initialState.get('forecastingData'))
        .set('dateRange', initialState.get('dateRange'));

    case CLEAR_DATA:
      return state
        .set('activeTab', initialState.get('activeTab'))
        .set(
          'activeCalculationGroupIndex',
          initialState.get('activeCalculationGroupIndex')
        )
        .set('singleRBM', initialState.get('singleRBM'))
        .set('overViewGridData', initialState.get('overViewGridData'))
        .set('overViewGridHeaders', initialState.get('overViewGridHeaders'))
        .set('forecastingGridData', initialState.get('forecastingGridData'))
        .set(
          'forecastingGridHeaders',
          initialState.get('forecastingGridHeaders')
        )
        .set('forecastingData', initialState.get('forecastingData'))
        .set('dateRange', initialState.get('dateRange'));

    default:
      return state;
  }
};

export default RuleBasedModelsReducer;
