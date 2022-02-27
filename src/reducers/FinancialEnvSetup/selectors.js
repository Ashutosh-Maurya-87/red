import { createSelector } from 'reselect';

const FinancialEnvSetup = () => state => state.get('financialEnvSetup');

/**
 * Get isFetching
 *
 * @return {Boolean}
 */
export const isFetching = () =>
  createSelector(FinancialEnvSetup(), state => state.get('isFetching'));

/**
 * Get Active Tab
 *
 * @return {String}
 */
export const getActiveTab = () =>
  createSelector(FinancialEnvSetup(), state => state.get('activeTab'));

/**
 * Get Actula Tbale with Data
 *
 * @return {Object}
 */
export const getActualTable = () =>
  createSelector(FinancialEnvSetup(), state => state.get('actualTable').toJS());

/**
 * Get GL Accounts
 *
 * @return {Array}
 */
export const getGLAccounts = () =>
  createSelector(FinancialEnvSetup(), state => state.get('glAccounts').toJS());

/**
 * Get GL Accounts Meta
 *
 * @return {Array}
 */
export const getGLAccountsMeta = () =>
  createSelector(FinancialEnvSetup(), state =>
    state.get('glAccountsMeta').toJS()
  );

/**
 * Get Actual Table Inputs
 *
 * @return {Object}
 */
export const getActualTableInputs = () =>
  createSelector(FinancialEnvSetup(), state =>
    state.get('actualTableInputs').toJS()
  );
