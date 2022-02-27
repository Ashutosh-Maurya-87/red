/**
 * Amplitude keys as per ENV
 */
const BASE_KEYS = {
  development: '',
  qa: 'b60c17c6fbee9eb5efd249fc873a7e41',
  staging: '',
  production: '25d8493a3617cac028889be250c22c83',
};

/**
 * Store key as per ENV
 */
const AMPLITUDE_API_KEY = BASE_KEYS[process.env.REACT_APP_ENV];

export { AMPLITUDE_API_KEY };
