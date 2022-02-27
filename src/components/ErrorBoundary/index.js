import React from 'react';
import { element } from 'prop-types';
import HttpError from '../HttpError';

class ErrorBoundary extends React.Component {
  /**
   * State
   */
  state = {
    hasError: false,
  };

  /**
   * Get derived state from error
   *
   * @param {Any} error
   *
   * @return {Object}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * When Component Did Catch
   *
   * @param {Any} error
   * @param {Any} errorInfo
   */
  componentDidCatch = (error, errorInfo) => {
    if (process.env.BUILD_ENV !== 'production') {
      console.error(error, errorInfo);
    }
  };

  /**
   * Render View
   *
   * @returns
   */
  render() {
    if (this.state.hasError) return <HttpError />;

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: element,
};

export default ErrorBoundary;
