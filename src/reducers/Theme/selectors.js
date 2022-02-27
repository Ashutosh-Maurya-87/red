import { createSelector } from 'reselect';

const ThemeReducer = () => state => state.get('theme');

/**
 * Get Selected Theme
 *
 * @return {String}
 */
export const getTheme = () =>
  createSelector(ThemeReducer(), state => state.get('theme'));
