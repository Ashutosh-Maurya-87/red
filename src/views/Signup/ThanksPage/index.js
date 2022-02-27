import React from 'react';
import { useHistory } from 'react-router-dom';
import { shape, string } from 'prop-types';

import {
  Grid,
  withStyles,
  Typography,
  Link,
  Button,
  Box,
} from '@material-ui/core';
import { APP_ROUTES } from '../../../configs/routes';

import { styles } from './styles';

function ThanksPage({ classes, email }) {
  const history = useHistory();

  /**
   * Go to Login Page
   */
  const goToLogin = () => {
    history.push(APP_ROUTES.LOGIN);
  };

  return (
    <Grid
      container
      alignItems="center"
      justify="center"
      className="login-signup-form"
    >
      <div className={classes.thanks}>
        <div className="thanks-msg login-signup-form">
          <Grid container direction="row" justify="center" alignItems="center">
            <Box mb={2}>
              <img src="/images/signup-thanks-email.svg" alt="" width="auto" />
            </Box>
            <Typography variant="h5" gutterBottom>
              Thanks! Now check your email.
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              We sent an email to&nbsp;
              <Link color="primary">{email}</Link>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              to verify your account
            </Typography>
            <div className="btn-option">
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={goToLogin}
              >
                Go To Login Page
              </Button>
            </div>
          </Grid>
        </div>
      </div>
    </Grid>
  );
}

ThanksPage.propTypes = {
  classes: shape({}),
  email: string,
};

export default withStyles(styles)(ThanksPage);
