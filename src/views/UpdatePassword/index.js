import React from 'react';
import { shape } from 'prop-types';

import {
  withStyles,
  Button,
  Grid,
  Typography,
  Box,
  Container,
  InputAdornment,
  IconButton,
  InputLabel,
  FormControl,
  OutlinedInput,
  FormHelperText,
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import { APP_ROUTES } from '../../configs/routes';
import { API_URLS } from '../../configs/api';
import { AUTH_MSG, ERROR_MESSAGES } from '../../configs/messages';

import { httpPost } from '../../utils/http';
import { showSuccessMsg } from '../../utils/notifications';
import scrollTo from '../../utils/helper/scrollTo';
import getNumbers from '../../utils/helper/getNumbers';

import { styles } from './styles';
import './styles.scss';

class UpdatePassword extends React.Component {
  /**
   * State
   */
  state = {
    isSubmit: false,
    isRequesting: false,

    password: '',
    newPassword: '',
    confirmPassword: '',

    showPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  };

  /**
   * Toggle > Show Passowrd
   *
   * @param {String} field
   */
  toggleShowPassword = field => () => {
    const value = this.state[field];
    this.setState({ [field]: !value });
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
      if (scrollTo('.update-password .Mui-error ')) return;

      this.updatePassword();
    });
  };

  /**
   * Update Password
   */
  updatePassword = async () => {
    try {
      const {
        match: {
          params: { code },
        },
      } = this.props;

      const { password, newPassword } = this.state;

      this.setState({ isRequesting: true });

      // Update Password
      let url = API_URLS.UPDATE_PASSWORD;
      let formData = new FormData();
      formData.append('password', password);
      formData.append('new_password', newPassword);

      // Reset Password using link via Forget Password
      if (code) {
        url = API_URLS.RESET_PASSWORD.replace('#CODE#', code);
        formData = new FormData();
        formData.append('password', newPassword);
      }

      await httpPost(url, formData);

      this.setState({ isRequesting: false });
      showSuccessMsg(AUTH_MSG.password_updated);
      this.props.history.push(APP_ROUTES.LOGIN);
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
    const { isSubmit, password, newPassword, confirmPassword } = this.state;

    if (!isSubmit) return {};

    const validateRequiredString = field =>
      !String(field).trim() ? ERROR_MESSAGES.required : '';

    const errPassword = validateRequiredString(password);
    const errConfirmPassword = validateRequiredString(confirmPassword);

    const errNotSamePassword =
      !errConfirmPassword && newPassword != confirmPassword
        ? 'New Password and Confirm Password must be same.'
        : '';

    let errNewPassword = validateRequiredString(newPassword);

    if (!errNewPassword) {
      const numbers = getNumbers(newPassword);

      if (newPassword.length < 6) {
        errNewPassword = 'Password must contains minimum 6 characters.';
      } else if (!numbers) {
        errNewPassword = 'Please use one numeric in password.';
      } else if (numbers.length == newPassword.length) {
        errNewPassword = 'Please use one alphabet in password.';
      }
    }

    return {
      errPassword,
      errNewPassword,
      errConfirmPassword,
      errNotSamePassword,
    };
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
    const {
      classes,
      match: {
        params: { code },
      },
    } = this.props;

    const {
      isRequesting,
      password,
      newPassword,
      confirmPassword,
      showPassword,
      showNewPassword,
      showConfirmPassword,
    } = this.state;

    const {
      errPassword,
      errNewPassword,
      errConfirmPassword,
      errNotSamePassword,
    } = this.getValidationErrors();

    return (
      <Container component="main" maxWidth="md">
        <div className={classes.paper}>
          <Grid
            container
            alignItems="center"
            justify="center"
            className="update-password"
          >
            <Grid item xs={5}></Grid>
            <Grid item xs={7}>
              <form
                className={classes.form}
                noValidate
                onSubmit={this.handleSubmit}
              >
                {!code && (
                  <FormControl variant="outlined" margin="normal" fullWidth>
                    <InputLabel htmlFor="password" error={Boolean(errPassword)}>
                      Password
                    </InputLabel>
                    <OutlinedInput
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      label="Password"
                      id="password"
                      autoComplete="none"
                      value={password}
                      error={Boolean(errPassword)}
                      onChange={this.handleChangeInput}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={this.toggleShowPassword('showPassword')}
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                    {errPassword && (
                      <FormHelperText error>{errPassword}</FormHelperText>
                    )}
                  </FormControl>
                )}
                <FormControl variant="outlined" margin="normal" fullWidth>
                  <InputLabel
                    htmlFor="newPassword"
                    error={Boolean(errNewPassword)}
                  >
                    New Password
                  </InputLabel>
                  <OutlinedInput
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    label="New Password"
                    id="newPassword"
                    autoComplete="none"
                    value={newPassword}
                    error={Boolean(errNewPassword)}
                    onChange={this.handleChangeInput}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={this.toggleShowPassword('showNewPassword')}
                        >
                          {showNewPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errNewPassword && (
                    <FormHelperText error>{errNewPassword}</FormHelperText>
                  )}
                </FormControl>
                <FormControl variant="outlined" margin="normal" fullWidth>
                  <InputLabel
                    htmlFor="confirmPassword"
                    error={
                      Boolean(errConfirmPassword) || Boolean(errNotSamePassword)
                    }
                  >
                    Confirm Password
                  </InputLabel>
                  <OutlinedInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    label="Confirm Password"
                    id="confirmPassword"
                    autoComplete="none"
                    value={confirmPassword}
                    error={
                      Boolean(errConfirmPassword) || Boolean(errNotSamePassword)
                    }
                    onChange={this.handleChangeInput}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={this.toggleShowPassword(
                            'showConfirmPassword'
                          )}
                        >
                          {showConfirmPassword ? (
                            <Visibility />
                          ) : (
                            <VisibilityOff />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errNotSamePassword && (
                    <FormHelperText error>{errNotSamePassword}</FormHelperText>
                  )}
                </FormControl>
                <Grid container alignItems="center" className={classes.submit}>
                  <Grid>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      onClick={this.handleSubmit}
                    >
                      {isRequesting ? 'Requesting...' : 'Update'}
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

UpdatePassword.propTypes = {
  classes: shape({}),
};

export default withStyles(styles)(UpdatePassword);
