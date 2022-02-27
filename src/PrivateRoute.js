import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { func, string, oneOfType, shape, bool } from 'prop-types';
import { APP_ROUTES } from './configs/routes';

function PrivateRoute({
  component: Component,
  isAuthenticated,
  path,
  ...rest
}) {
  return (
    <Route
      render={props => {
        if (isAuthenticated) {
          switch (path) {
            case APP_ROUTES.LOGIN:
            case APP_ROUTES.SIGN_UP:
            case APP_ROUTES.FORGET_PASSOWRD:
            case APP_ROUTES.CONFIRM_ACCOUNT:
            case APP_ROUTES.RESET_PASSWORD:
            case APP_ROUTES.TERMS_OF_SERVICE:
            case APP_ROUTES.UPDATE_PASSWORD:
              // case APP_ROUTES.COMPLETE_SIGN_UP:
              return <Redirect to={APP_ROUTES.DASHBOARD} />;

            default:
              return <Component {...props} />;
          }
        }

        if (!isAuthenticated) {
          switch (path) {
            case APP_ROUTES.LOGIN:
            case APP_ROUTES.SIGN_UP:
            case APP_ROUTES.FORGET_PASSOWRD:
            case APP_ROUTES.CONFIRM_ACCOUNT:
            case APP_ROUTES.RESET_PASSWORD:
            case APP_ROUTES.TERMS_OF_SERVICE:
            case APP_ROUTES.UPDATE_PASSWORD:
              // case APP_ROUTES.COMPLETE_SIGN_UP:
              return <Component {...props} />;

            default:
              return <Redirect to={APP_ROUTES.LOGIN} />;
          }
        }

        return <Component {...props} />;
      }}
      {...rest}
    />
  );
}

PrivateRoute.propTypes = {
  component: oneOfType([func, shape({})]),
  isAuthenticated: bool,
  path: string,
};

export default PrivateRoute;
