import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import LogRocket from 'logrocket';
import thunk from 'redux-thunk';
import reducers from './index';

/**
 * Configure Dev tool
 */
const composeEnhancers = composeWithDevTools({
  name: 'ALterflo',
});

/**
 * Prepare the Redux Store
 */
const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(thunk, LogRocket.reduxMiddleware()))
);

export default store;
