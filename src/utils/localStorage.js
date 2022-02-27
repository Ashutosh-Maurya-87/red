import store from 'store';

const USER_SESSION = 'user_session';
const GRID_DENSITY = 'grid_density';

/**
 * Save a piece of data to local storage
 *
 * @param {String} name
 * @param {Any} value
 */
function setLocalStorage(name, value) {
  store.set(name, value);
}

/**
 * Retrieve a piece of data from local storage
 *
 * @param {String} name
 */
function getLocalStorage(name) {
  return store.get(name);
}

/**
 * Remove local storage
 *
 * @param {String} name
 */
function removeLocalStorageItem(name) {
  return store.remove(name);
}

/**
 * Set User Session
 *
 * @param {Object} data
 */
function setUserSession(data) {
  setLocalStorage(USER_SESSION, data);
}

/**
 * Get User Session
 *
 * @return {Object}
 */
function getUserSession() {
  return getLocalStorage(USER_SESSION);
}

/**
 * Clear User Session
 */
function clearUserSession() {
  setLocalStorage(USER_SESSION, {});
}

/**
 * Set Model Screen Density
 *
 * @param {string} density
 */
function setGridDensity(density) {
  setLocalStorage(GRID_DENSITY, density);
}

/**
 * Get Model Screen Density
 *
 * @return {string}
 */
function getGridDensity() {
  return getLocalStorage(GRID_DENSITY);
}

/**
 * Clear Model Screen Density
 */
function clearModelDensity() {
  removeLocalStorageItem(GRID_DENSITY);
}

export {
  setLocalStorage,
  getLocalStorage,
  setUserSession,
  getUserSession,
  clearUserSession,
  setGridDensity,
  getGridDensity,
  clearModelDensity,
};
