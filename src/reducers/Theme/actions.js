import { SET_THEME } from './constants';

/**
 * Set Theme
 *
 * @param {String} theme
 */
export const setTheme = theme => {
  return { type: SET_THEME, data: theme };
};
