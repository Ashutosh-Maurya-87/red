import { createSelector } from 'reselect';

const RuleBasedModelsSetup = () => state => state.get('RuleBasedModels');

/**
 * Get Active tab
 *
 * @returns {String}
 */
export const getActiveTab = () =>
  createSelector(RuleBasedModelsSetup(), state => state.get('activeTab'));

/**
 * Get Single Rule Based Model State
 *
 * @returns {object}
 */
export const getSingleRBM = () =>
  createSelector(RuleBasedModelsSetup(), state => state.get('singleRBM'));

/**
 * Get Data OverView Grid Data
 *
 * @returns {object}
 */
export const getOverViewGridData = () =>
  createSelector(RuleBasedModelsSetup(), state =>
    state.get('overViewGridData').toJS()
  );

/**
 * Get Data OverView Grid Headers
 *
 * @returns {object}
 */
export const getOverViewGridHeaders = () =>
  createSelector(RuleBasedModelsSetup(), state =>
    state.get('overViewGridHeaders').toJS()
  );

/**
 * Get Data Forecasting Grid Data
 *
 * @returns {object}
 */
export const getForecastingGridData = () =>
  createSelector(RuleBasedModelsSetup(), state =>
    state.get('forecastingGridData').toJS()
  );

/**
 * Get Data Forecasting Grid Headers
 *
 * @returns {object}
 */
export const getForecastingGridHeaders = () =>
  createSelector(RuleBasedModelsSetup(), state =>
    state.get('forecastingGridHeaders').toJS()
  );

/**
 * Get Data Forecasting Headers
 *
 * @returns {object}
 */
export const getForecastingData = () =>
  createSelector(RuleBasedModelsSetup(), state => state.get('forecastingData'));

/**
 * Get date range
 *
 * @returns {Object}
 */
export const getDateRange = () =>
  createSelector(RuleBasedModelsSetup(), state => state.get('dateRange'));

/**
 * Get  Selected Calculation Rules
 *
 * @returns {object}
 */
export const getSelectedCalculationRules = () =>
  createSelector(RuleBasedModelsSetup(), state =>
    state.get('selectedCalculationRules').toJS()
  );

/**
 * Get Selected Calculation Index
 *
 * @returns {String}
 */
export const getSelectedCalculationIndex = () =>
  createSelector(RuleBasedModelsSetup(), state =>
    state.get('activeCalculationGroupIndex')
  );
