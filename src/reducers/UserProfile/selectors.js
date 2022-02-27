import { createSelector } from 'reselect';

const UserProfileReducer = () => state => state.get('userProfile');

/**
 * Get User Profile
 *
 * @return {Object}
 */
export const getUserProfile = () =>
  createSelector(UserProfileReducer(), state =>
    state.get('userProfile').toJS()
  );

/**
 * Get is requesting
 *
 * @return {Boolean}
 */
export const isRequesting = () =>
  createSelector(UserProfileReducer(), state => state.get('isRequesting'));
