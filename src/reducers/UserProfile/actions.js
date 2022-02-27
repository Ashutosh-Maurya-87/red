import LogRocket from 'logrocket';

import { SET_USER_PROFILE, IS_REQUESTING } from './constants';
import { DEFAULT_THEME } from '../Theme/constants';
import { setTheme } from '../Theme/actions';

import { API_URLS } from '../../configs/api';
import { httpGet } from '../../utils/http';

/**
 * Set User Profile
 *
 * @param {Object} data
 */
export const setUserProfile = data => {
  return { type: SET_USER_PROFILE, data };
};

/**
 * Set Is Requesting
 *
 * @param {Boolean} data
 */
export const setIsRequesting = data => {
  return { type: IS_REQUESTING, data };
};

/**
 * Fetch User Profile from API
 */
export const fetchUserProfile = callback => {
  return dispatch => {
    dispatch(setIsRequesting(true));

    httpGet(API_URLS.GET_PROFILE).then(
      res => {
        dispatch(setUserProfile(res));

        const { email_id = '', name = '', user_id = '' } = res || {};

        LogRocket.identify(user_id, {
          name,
          email: email_id,
        });

        const { theme_style = DEFAULT_THEME } = res;
        dispatch(setTheme(theme_style.toLowerCase()));

        if (callback) callback(res);
        dispatch(setIsRequesting(false));
      },
      err => {
        if (err == 'cancelled') return;
        dispatch(setIsRequesting(false));
      }
    );
  };
};
