const BASE_KEYS = {
  development: `znpsaf/alterflo-dev`,
  qa: `wvwjyp/alterflow-qa`,
  staging: `gosxny/alterflo-staging`,
  production: `hnfzyf/alterflo-prod`,
};

const LOGROCKET_BASE_KEY = BASE_KEYS[process.env.REACT_APP_ENV];

export { LOGROCKET_BASE_KEY };
