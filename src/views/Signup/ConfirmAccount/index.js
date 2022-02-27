import React, { useState } from 'react';
import { useHistory, withRouter } from 'react-router-dom';
import { shape, string } from 'prop-types';

import {
  Grid,
  withStyles,
  Typography,
  Button,
  Container,
} from '@material-ui/core';
import { APP_ROUTES } from '../../../configs/routes';

import { styles } from './styles';
import { httpGet } from '../../../utils/http';
import { API_URLS } from '../../../configs/api';

function ConfrimAccount({ classes, email, match }) {
  const [showLoader, toggleLoader] = useState(true);
  const [isConfirmed, toggleConfirmed] = useState(null);
  const history = useHistory();

  const confirmAccount = async () => {
    try {
      if (isConfirmed != null) return;

      const { code } = match.params;
      toggleLoader(true);

      const url = API_URLS.CONFRIM_EMAIL.replace('#CODE#', code);

      await httpGet(url);

      toggleConfirmed(true);
      toggleLoader(false);
    } catch (e) {
      toggleConfirmed(false);
      toggleLoader(false);
    }
  };

  setTimeout(confirmAccount, 1000);

  /**
   * Go to Login Page
   */
  const goToLogin = () => {
    history.push(APP_ROUTES.LOGIN);
  };

  return (
    <Container component="main" maxWidth="md">
      <div className={classes.paper}>
        <Grid
          container
          alignItems="center"
          justify="center"
          className="login-signup-form"
        >
          <div className={classes.thanks}>
            <div className="thanks-msg login-signup-form">
              <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
              >
                {showLoader && (
                  <Typography variant="h5" gutterBottom>
                    Confirming...
                  </Typography>
                )}
                {!showLoader && (
                  <>
                    {isConfirmed && (
                      <Typography variant="h5" gutterBottom>
                        Thanks! Your email is confirmed.
                      </Typography>
                    )}
                    {!isConfirmed && (
                      <Typography variant="h5" gutterBottom>
                        Please verify your email again.
                      </Typography>
                    )}
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
                  </>
                )}
              </Grid>
            </div>
          </div>
        </Grid>
      </div>
    </Container>
  );
}

ConfrimAccount.propTypes = {
  classes: shape({}),
  email: string,
};

export default withStyles(styles)(withRouter(ConfrimAccount));
