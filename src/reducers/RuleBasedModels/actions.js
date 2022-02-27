import {
  SET_ACTIVE_TAB,
  CLEAR_DATA,
  SET_SINGLE_RBM_DATA,
  SET_OVERVIEW_GRID_DATA,
  SET_OVERVIEW_GRID_HEADERS,
  SET_FORECASTING_GRID_DATA,
  SET_FORECASTING_GRID_HEADERS,
  SET_FORECASTING_DATA,
  SET_DATE_RANGE,
  CLEAR_FORECASTING_DATA,
  SET_SELECTED_CALCULATION_RULES,
  SET_SELECTED_GROUP_INDEX,
} from './constants';

/**
 * Set Active Tab of RBM Side bar
 *
 * @param {String} activeTab
 * @returns
 */
export const setActiveTab = activeTab => {
  return { type: SET_ACTIVE_TAB, data: activeTab };
};

/**
 * Set Single Rule Based Model Data
 *
 * @param {object} Data
 *
 */
export const setSingleRBM = data => {
  return { type: SET_SINGLE_RBM_DATA, data };
};

/**
 * Set Data OverView Grid Data
 *
 * @param {object} Data
 *
 */
export const setOverViewGridData = data => {
  return { type: SET_OVERVIEW_GRID_DATA, data };
};

/**
 * Set Data OverView Grid Headers
 *
 * @param {object} Data
 *
 */
export const setOverViewGridHeaders = data => {
  return { type: SET_OVERVIEW_GRID_HEADERS, data };
};

/**
 * Set Data Forecasting Grid Data
 *
 * @param {object} Data
 *
 */
export const setForecastingGridData = data => {
  return { type: SET_FORECASTING_GRID_DATA, data };
};

/**
 * Set Data Forecasting Grid Headers
 *
 * @param {object} Data
 *
 */
export const setForecastingGridHeaders = data => {
  return { type: SET_FORECASTING_GRID_HEADERS, data };
};

/**
 * Set Data Forecasting Data(Headers and data)
 *
 * @param {object} Data
 *
 */
export const setForecastingData = data => {
  return { type: SET_FORECASTING_DATA, data };
};

/* Set Date Range
 *
 * @param {Object} data
 * @returns
 */
export const setDateRange = data => {
  return { type: SET_DATE_RANGE, data };
};

/**
 * To Cleat all data
 *
 * @param {Object} data
 * @returns
 */
export const setClearData = () => {
  return { type: CLEAR_DATA };
};

/**
 * To Cleat Forecasting data
 *
 * @param {Object} data
 * @returns
 */
export const setClearForecastingData = () => {
  return { type: CLEAR_FORECASTING_DATA };
};

/**
 * Set Selected calculation group index
 *
 * @param {String} activeTab
 * @returns
 */
export const setCalculationIndex = activeTab => {
  return { type: SET_SELECTED_GROUP_INDEX, data: activeTab };
};

/**
 * Set Selected Calculation Rules
 *
 * @param {object} Data
 *
 */
export const setSelectedCalculationRules = data => {
  return { type: SET_SELECTED_CALCULATION_RULES, data };
};
