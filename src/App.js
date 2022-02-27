import React from 'react';
import LogRocket from 'logrocket';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';

import { LOGROCKET_BASE_KEY } from './configs/logRocket';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './AppRoutes';
import reducersStore from './reducers/store';

// Import Custom prototype functions
import './utils/prototype';

/**
 * App Component
 */
function App() {
  return (
    <Provider store={reducersStore}>
      <ErrorBoundary>
        <Router>
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </Provider>
  );
}

LogRocket.init(LOGROCKET_BASE_KEY);

export default App;
