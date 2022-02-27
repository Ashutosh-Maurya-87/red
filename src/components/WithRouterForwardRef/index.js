import React, { forwardRef } from 'react';
import { withRouter } from 'react-router-dom';

/**
 * HOC For withRoute and forward ref
 *
 * @param {Node} Component
 * @returns Node
 */
const withRouterForwardRef = Component => {
  const WithRouter = withRouter(({ forwardedRef, ...props }) => (
    <Component ref={forwardedRef} {...props} />
  ));

  return forwardRef((props, ref) => (
    <WithRouter {...props} forwardedRef={ref} />
  ));
};

export { withRouterForwardRef };
