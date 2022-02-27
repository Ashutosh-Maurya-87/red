import { createSelector } from 'reselect';

const ProcessBuilder = () => state => state.get('processBuilder');

/**
 * Get isFetching
 *
 * @return {Boolean}
 */
export const isFetching = () =>
  createSelector(ProcessBuilder(), state => state.get('isFetching'));
