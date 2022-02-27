import {
  CLEAR_DATA,
  SET_LEVELS_LISTING,
  VISIBLE_MODAL_LEVEL,
} from './constants';

/**
 * Set Levels
 *
 * @param {Array} data
 */
export const setLevelsListing = data => {
  return { type: SET_LEVELS_LISTING, data };
};

/**
 * Set data to initial
 */
export const clearData = () => {
  return { type: CLEAR_DATA };
};

/**
 * Set Level active or Inactive
 */
export const setLevelsVisibilities = isVisible => {
  return { type: VISIBLE_MODAL_LEVEL, isVisible };
};
