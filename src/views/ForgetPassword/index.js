import React from 'react';
import { shape } from 'prop-types';

import {
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Container,
  withStyles,
  CircularProgress,
} from '@material-ui/core';

import { APP_ROUTES } from '../../configs/routes';
import { API_URLS } from '../../configs/api';

import { httpPost } from '../../utils/http';
import { showSuccessMsg } from '../../utils/notifications';
import scrollTo from '../../utils/helper/scrollTo';
import validateEmail from '../../utils/helper/validateEmail';

import { styles } from './styles';
import './styles.scss';
import { ERROR_MESSAGES } from '../../configs/messages';

class ForgetPassword extends React.Component {
  /**
   * State
   */
  state = {
    email: '',
    isSubmit: false,
    isRequesting: false,
  };

  /**
   * Handle > Change Input Value
   *
   * @param {Object}
   */
  handleChangeInput = ({ target: { name, value } }) => {
    this.setState({ [name]: value });
  };

  /**
   * Handle > Submit Form
   */
  handleSubmit = evt => {
    evt.preventDefault();

    this.setState({ isSubmit: true }, () => {
      if (scrollTo('.login-signup-form .Mui-error ')) return;

      this.sendPasswordResetEmail();
    });
  };

  /**
   * Send Email > Reset Password
   */
  sendPasswordResetEmail = async () => {
    try {
      this.setState({ isRequesting: true });

      const formData = new FormData();
      formData.append('email', this.state.email);

      const { message } = await httpPost(API_URLS.FORGET_PASSWORD, formData);

      showSuccessMsg(message);
      this.setState({ isRequesting: false });

      this.props.history.push(APP_ROUTES.DASHBOARD);
    } catch (e) {
      this.setState({ isRequesting: false });
    }
  };

  /**
   * Get Validation Errors
   *
   * @return {Object}
   */
  getValidationErrors = () => {
    const { email, isSubmit } = this.state;

    if (!isSubmit) return {};

    const validateRequiredString = field =>
      !String(field).trim() ? ERROR_MESSAGES.required : '';

    const validateRequiredEmail = field =>
      !validateEmail(field) ? 'Invalid' : '';

    const errEmail =
      validateRequiredString(email) || validateRequiredEmail(email);

    return { errEmail };
  };

  /**
   * Go to Login Page
   */
  goToLogin = () => {
    this.props.history.push(APP_ROUTES.LOGIN);
  };

  /**
   * Render View
   */
  render() {
    const { classes } = this.props;
    const { isRequesting, email } = this.state;

    const { errEmail } = this.getValidationErrors();

    return (
      <Container component="main" maxWidth="md">
        <div className={classes.paper}>
          <Grid
            container
            alignItems="center"
            justify="center"
            className="login-signup-form"
          >
            <Grid item xs={5} className="fp-img-container">
              <img
                className="forgot-password-img"
                src="/images/forgot-password.svg"
                alt=""
              />
            </Grid>
            <Grid item xs={7}>
              <form
                className={classes.form}
                noValidate
                onSubmit={this.handleSubmit}
              >
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  error={Boolean(errEmail)}
                  fullWidth
                  label="Email"
                  name="email"
                  id="email"
                  autoComplete="none"
                  autoFocus
                  value={email}
                  onChange={this.handleChangeInput}
                />
                <Grid container alignItems="center" className={classes.submit}>
                  <Grid>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={isRequesting}
                      onClick={this.handleSubmit}
                    >
                      Get Link
                      {isRequesting && (
                        <CircularProgress
                          size={24}
                          className={classes.buttonProgress}
                        />
                      )}
                    </Button>
                  </Grid>
                  <Grid>
                    <Box m={2}>
                      <Typography variant="body2">or</Typography>
                    </Box>
                  </Grid>
                  <Grid>
                    <Button onClick={this.goToLogin}>Sign In</Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
        </div>
      </Container>
    );
  }
}

ForgetPassword.propTypes = {
  classes: shape({}),
};

export default withStyles(styles)(ForgetPassword);
