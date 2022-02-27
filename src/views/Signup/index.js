import React from 'react';
import { shape } from 'prop-types';

import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Box,
  Typography,
  Container,
  withStyles,
  FormHelperText,
  InputAdornment,
  IconButton,
  InputLabel,
  CircularProgress,
  FormControl,
  OutlinedInput,
  Link,
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import { APP_ROUTES } from '../../configs/routes';
import { TERMS_OF_SERVICE } from '../../configs/app';
import { API_URLS } from '../../configs/api';

import scrollTo from '../../utils/helper/scrollTo';
import validateEmail from '../../utils/helper/validateEmail';
import getNumbers from '../../utils/helper/getNumbers';
import { httpPost } from '../../utils/http';

import ThanksPage from './ThanksPage';

import { styles } from './styles';
import { ERROR_MESSAGES } from '../../configs/messages';

class Signup extends React.Component {
  /**
   * State
   */
  state = {
    isRequesting: false,
    username: '',
    email: '',
    password: '',
    agreeTerms: false,
    showThanks: false,
    showPassword: false,
  };

  /**
   * Handle > Change Input Value
   *
   * @param {Object}
   */
  handleChangeInput = ({ target: { name, value } }) => {
    this.setState({ [name]: value.trim() });
  };

  /**
   * Handle > Accept Terms Toggle
   */
  handleAcceptTerms = () => {
    this.setState({ agreeTerms: !this.state.agreeTerms });
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
      // this.setState({ showThanks: true });
      this.doSignUp();
    });
  };

  /**
   * Get Validation Errors
   *
   * @return {Object}
   */
  getValidationErrors = () => {
    const { username, email, password, isSubmit } = this.state;

    if (!isSubmit) return {};

    const validateRequiredString = field =>
      !String(field).trim() ? ERROR_MESSAGES.required : '';

    const validateRequiredEmail = field =>
      !validateEmail(field) ? 'Invalid' : '';

    const errUsername = validateRequiredString(username);

    const errEmail =
      validateRequiredString(email) || validateRequiredEmail(email);

    let errPassword = validateRequiredString(password);

    if (!errPassword) {
      const numbers = getNumbers(password);

      if (password.length < 6) {
        errPassword = 'Password must contains minimum 6 characters.';
      } else if (!numbers) {
        errPassword = 'Please use one numeric in password.';
      } else if (numbers.length == password.length) {
        errPassword = 'Please use one alphabet in password.';
      }
    }

    return { errUsername, errEmail, errPassword };
  };

  /**
   * Doing Sign Up
   */
  doSignUp = async () => {
    try {
      const { isRequesting, username, email, password } = this.state;

      if (isRequesting) return;
      this.setState({ isRequesting: true });

      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);

      await httpPost(API_URLS.SIGN_UP, formData);

      this.setState({
        showThanks: true,
        isRequesting: false,
      });
    } catch (e) {
      this.setState({ isRequesting: false });
    }
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

    const {
      username,
      email,
      password,
      agreeTerms,
      isSubmit,
      showThanks,
      showPassword,
      isRequesting,
    } = this.state;

    const { errUsername, errEmail, errPassword } = this.getValidationErrors();

    return (
      <Container component="main" maxWidth="md">
        <div className={classes.paper}>
          {showThanks && <ThanksPage email={email} />}
          {!showThanks && (
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
                    autoComplete="username"
                    name="username"
                    margin="normal"
                    variant="outlined"
                    required
                    fullWidth
                    id="username"
                    label="User ID"
                    autoFocus
                    value={username}
                    error={Boolean(errUsername)}
                    onChange={this.handleChangeInput}
                  />
                  <TextField
                    variant="outlined"
                    required
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    error={Boolean(errEmail)}
                    onChange={this.handleChangeInput}
                  />
                  <FormControl
                    variant="outlined"
                    margin="normal"
                    style={{ width: '100%' }}
                  >
                    <InputLabel
                      htmlFor="password"
                      required
                      error={Boolean(errPassword)}
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
                    {errPassword && (
                      <FormHelperText error>{errPassword}</FormHelperText>
                    )}
                  </FormControl>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreeTerms}
                          color="primary"
                          onChange={this.handleAcceptTerms}
                        />
                      }
                      label={
                        <>
                          I have read and agree to the&nbsp;
                          <Link href={TERMS_OF_SERVICE} target="__blank">
                            terms of service.
                          </Link>
                        </>
                      }
                    />
                    {isSubmit && !agreeTerms && (
                      <FormHelperText error>
                        Please accept terms of service.
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid
                    container
                    alignItems="center"
                    className={classes.submit}
                  >
                    <Grid>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={isRequesting}
                        className={classes.submit}
                        type="submit"
                        onClick={this.handleSubmit}
                      >
                        Sign Up
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
          )}
        </div>
      </Container>
    );
  }
}

Signup.propTypes = {
  classes: shape({}),
};

export default withStyles(styles)(Signup);
