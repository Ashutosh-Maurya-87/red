import { SET_IS_FETCHING, CLEAR_DATA } from './constants';

/**
 * Set isFetching
 *
 * @param {Boolean} isFetching
 */
export const setIsFetching = (isFetching = false) => {
  return { type: SET_IS_FETCHING, data: isFetching };
};

/**
 * Clear Process Builder data to initial
 */
export const clearData = () => {
  return { type: CLEAR_DATA };
};

/**
 * Fetch Process Data from API
 */
export const fetchProcess = () => {
  // To Do
};
