import { createSelector } from 'reselect';

const levels = () => state => state.get('levels');

/**
 * Get levels for listing view
 *
 * @return {Array}
 */
export const getLevelsListing = () =>
  createSelector(levels(), state => state.get('levels').toJS());

/**
 * Show/Hide Dimension Level Modal
 *
 * @return {Boolean}
 */
export const getLevelsVisibilities = () =>
  createSelector(levels(), state => state.get('isVisibleLevel'));
