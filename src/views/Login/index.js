import React from 'react';
import { shape, func } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Typography,
  Box,
  Container,
  withStyles,
  InputAdornment,
  IconButton,
  InputLabel,
  FormControl,
  OutlinedInput,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import { APP_ROUTES } from '../../configs/routes';
import { API_URLS } from '../../configs/api';

import { setUserSession } from '../../utils/localStorage';
import scrollTo from '../../utils/helper/scrollTo';
import validateEmail from '../../utils/helper/validateEmail';
import { httpPost, httpGet } from '../../utils/http';

import { setUserProfile } from '../../reducers/UserProfile/actions';
import { setTheme } from '../../reducers/Theme/actions';
import { DEFAULT_THEME } from '../../reducers/Theme/constants';

import { ERROR_MESSAGES } from '../../configs/messages';
import { logAmplitudeEvent, setAmplitudeUserId } from '../../utils/amplitude';

import { styles } from './styles';
import './style.scss';

class Login extends React.Component {
  /**
   * State
   */
  state = {
    isRequesting: false,
    username: '',
    password: '',
    remember: false,
    isSubmit: false,
    showPassword: false,
    isVisibleTerms: false,
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
   * Handle > Remember Me Toggle
   */
  handleRememberMe = () => {
    this.setState({ remember: !this.state.remember });
  };

  /**
   * Toggle > Show Password
   */
  toggleShowPassword = () => {
    this.setState({ showPassword: !this.state.showPassword });
  };

  /**
   * Handle > Submit Form
   */
  handleSubmit = evt => {
    evt.preventDefault();

    this.setState({ isSubmit: true }, () => {
      if (scrollTo('.login-signup-form .Mui-error ')) return;

      this.doLogin();
    });
  };

  /**
   * Doing Login
   */
  doLogin = async () => {
    try {
      const { isRequesting, username, password, remember } = this.state;

      if (isRequesting) return;
      this.setState({ isRequesting: true });

      const formData = new FormData();
      if (validateEmail(username)) {
        formData.append('email', username);
      } else {
        formData.append('username', username);
      }
      formData.append('password', password);
      formData.append('remember_me', remember ? 1 : 0);

      const res = await httpPost(API_URLS.LOGIN, formData);

      const user = {
        name: '',
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      };

      setUserSession({ ...user });

      setAmplitudeUserId(username);
      logAmplitudeEvent('Log in');

      const userProfile = await httpGet(API_URLS.GET_PROFILE);
      this.props.setUserProfile(userProfile);
      const { theme_style = DEFAULT_THEME } = userProfile;
      this.props.setTheme(theme_style.toLowerCase());

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
    const { username, password, isSubmit } = this.state;

    if (!isSubmit) return {};

    const validateRequiredString = field =>
      !String(field).trim() ? ERROR_MESSAGES.required : '';

    const errUsername = validateRequiredString(username);
    const errPassword = validateRequiredString(password);

    return { errUsername, errPassword };
  };

  /**
   * Go to Signup Page
   */
  goToSignup = () => {
    this.props.history.push(APP_ROUTES.SIGN_UP);
  };

  /**
   * Go to Forget Password Page
   */
  goToForgetPassword = () => {
    this.props.history.push(APP_ROUTES.FORGET_PASSOWRD);
  };

  /**
   * Handle opening of Terms & Condition
   */
  handleTermAndCondition = () => {
    this.setState({ isVisibleTerms: true });
  };

  /**
   * Handle Closing Term and Condition
   */
  handleCloseTermAndCondition = () => {
    this.setState({ isVisibleTerms: false });
  };

  /**
   * Render View
   */
  render() {
    const { classes } = this.props;
    const {
      isRequesting,
      username,
      password,
      remember,
      showPassword,
      isVisibleTerms,
    } = this.state;

    const { errUsername, errPassword } = this.getValidationErrors();

    return (
      <Container component="main" maxWidth="md">
        <div className={classes.paper}>
          <Grid
            container
            alignItems="center"
            justify="center"
            className="login-signup-form"
          >
            <Grid item xs={5}>
              <img className="login-img" src="/images/login.svg" alt="" />
            </Grid>
            <Grid item xs={7}>
              <form
                className={classes.form}
                noValidate
                onSubmit={this.handleSubmit}
              >
                <TextField
                  variant="outlined"
                  required
                  margin="normal"
                  error={Boolean(errUsername)}
                  fullWidth
                  label="Email / User ID"
                  name="username"
                  id="username"
                  autoComplete="none"
                  autoFocus
                  value={username}
                  onChange={this.handleChangeInput}
                />
                <FormControl
                  variant="outlined"
                  margin="normal"
                  style={{ width: '100%' }}
                >
                  <InputLabel
                    htmlFor="password"
                    error={Boolean(errPassword)}
                    required
                  >
                    Password
                  </InputLabel>
                  <OutlinedInput
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    label="Password *"
                    id="password"
                    autoComplete="none"
                    value={password}
                    error={Boolean(errPassword)}
                    onChange={this.handleChangeInput}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={this.toggleShowPassword}
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={remember}
                      onChange={this.handleRememberMe}
                    />
                  }
                  label="Remember me"
                />
                <Grid container alignItems="center" className={classes.submit}>
                  <Grid>
                    <Box py={1}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={isRequesting}
                        type="submit"
                        onClick={this.handleSubmit}
                      >
                        Sign In
                        {isRequesting && (
                          <CircularProgress
                            size={24}
                            className={classes.buttonProgress}
                          />
                        )}
                      </Button>
                    </Box>
                  </Grid>
                  {false && (
                    <>
                      <Grid>
                        <Box m={2}>
                          <Typography variant="body2">or</Typography>
                        </Box>
                      </Grid>
                      <Grid>
                        <Button onClick={this.goToSignup}>Sign Up</Button>
                      </Grid>
                    </>
                  )}
                </Grid>
                <Link
                  variant="subtitle2"
                  className="cursor-pointer"
                  onClick={this.goToForgetPassword}
                >
                  Forgot password?
                </Link>
                {/* Terms & Service Link  */}
                <Box mt={2}>
                  <Typography variant="body2">
                    By signing in, you agree to our&nbsp;
                    <Link
                      variant="body2"
                      className="cursor-pointer"
                      onClick={this.handleTermAndCondition}
                    >
                      terms of services
                    </Link>
                  </Typography>
                </Box>
                {/* Terms of Service Open */}
                <Dialog
                  open={Boolean(isVisibleTerms)}
                  onClose={this.handleCloseTermAndCondition}
                  className="terms-modal"
                  fullWidth
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogTitle id="alert-dialog-title">
                    {/* TODO: Change color class to theme variable */}
                    <Box className="dialogTitleLogin">
                      <Typography variant="h4">Terms of Service</Typography>
                    </Box>
                  </DialogTitle>
                  <iframe
                    src="https://dev-alterflo-uploads.s3.amazonaws.com/uploaded-files/Terms+of+Service.pdf#toolbar=0&navpanes=0&scrollbar=0"
                    frameborder="0"
                    title="Terms of Service"
                    style={{ height: '100vh' }}
                  />
                  <DialogActions>
                    <Button
                      variant="contained"
                      onClick={this.handleCloseTermAndCondition}
                      color="primary"
                    >
                      OK
                    </Button>
                  </DialogActions>
                </Dialog>
              </form>
            </Grid>
          </Grid>
        </div>
      </Container>
    );
  }
}

Login.propTypes = {
  classes: shape({}),
  setTheme: func.isRequired,
  setUserProfile: func.isRequired,
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, { setTheme, setUserProfile })(
  withStyles(styles)(Login)
);
