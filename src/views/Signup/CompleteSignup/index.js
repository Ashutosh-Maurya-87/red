import React from 'react';
import { shape, func, string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { debounce } from 'lodash';

import {
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  withStyles,
  Badge,
  Fab,
  MobileStepper,
  capitalize,
  FormHelperText,
  CircularProgress,
} from '@material-ui/core';

import { Edit as EditIcon, Close as CloseIcon } from '@material-ui/icons';
import USPhoneInput from '../../../components/USPhoneInput';
import Spinner from '../../../components/Spinner';

import { APP_ROUTES } from '../../../configs/routes';
import { API_URLS } from '../../../configs/api';
import { DEFAULT_IMAGES } from '../../../configs/app';
import { ERROR_MESSAGES } from '../../../configs/messages';

import { getUserSession } from '../../../utils/localStorage';
import validateUrl from '../../../utils/helper/validateUrl';
import scrollTo from '../../../utils/helper/scrollTo';
import getNumbers from '../../../utils/helper/getNumbers';
import { showErrorMsg } from '../../../utils/notifications';
import { httpPost, httpGet } from '../../../utils/http';
import { getFormattedProfileParams } from './helper';

import { APP_THEMES, DEFAULT_THEME } from '../../../reducers/Theme/constants';
import { setTheme } from '../../../reducers/Theme/actions';
import { getTheme } from '../../../reducers/Theme/selectors';
import { setUserProfile } from '../../../reducers/UserProfile/actions';
import { getUserProfile } from '../../../reducers/UserProfile/selectors';

import { styles } from './styles';
import './style.scss';

const STEPS = ['User Profile', 'Company Profile', 'Theme'];

class CompleteSignup extends React.Component {
  state = {
    activeStep: 1,
    theme: this.props.theme || DEFAULT_THEME,
    showLoader: false,
    isFetchingProfile: false,

    /* Profile Details */
    fullName: '',
    phoneNumber: '',
    country: '',
    profilePhoto: {
      file: '',
      url: '',
    },

    /* Company Details */
    companyName: '',
    companyWebsite: '',
    designation: '',
  };

  /**
   * When Component Did Mount
   */
  async componentDidMount() {
    try {
      if (!getUserSession()) return;

      const { userProfile, setUserProfile } = this.props;

      if (Object.keys(userProfile).length > 0) {
        this.fillUserData();
        return;
      }

      this.setState({ isFetchingProfile: true });
      const res = await httpGet(API_URLS.GET_PROFILE);

      setUserProfile(res);
      debounce(this.fillUserData, 400)();

      this.setState({ isFetchingProfile: false });
    } catch (e) {
      this.setState({ isFetchingProfile: false });
    }
  }

  /**
   * Fill User Data in state
   */
  fillUserData = () => {
    const { userProfile } = this.props;

    const data = {
      activeStep: 1,
      theme: userProfile.theme_style || DEFAULT_THEME,

      /* Profile Details */
      fullName: userProfile.name || '',
      phoneNumber: userProfile.phone_number || '',
      country: userProfile.country || '',
      profilePhoto: {
        file: '',
        url: userProfile.profile_image_url || '',
      },

      /* Company Details */
      companyName: userProfile.company || '',
      companyWebsite: userProfile.website_link || '',
      designation: userProfile.designation || '',
    };

    this.setState({ ...data });
  };

  /**
   * Handle > Go to previous step
   */
  handlePrev = () => {
    const { activeStep } = this.state;

    if (activeStep == 1) return;

    this.setState({ activeStep: activeStep - 1 });
  };

  /**
   * Handle > Go to next step
   */
  handleNext = () => {
    const { activeStep } = this.state;

    this.setState({ isSubmit: true }, () => {
      if (scrollTo('.complete-signup .Mui-error ')) return;

      if (activeStep == STEPS.length) {
        this.handleFinish();
        return;
      }

      this.setState({ activeStep: activeStep + 1 });
    });
  };

  /**
   * Handle > Finish Steps
   */
  handleFinish = async () => {
    try {
      const { showLoader, profilePhoto, theme } = this.state;

      if (showLoader) return;
      this.setState({ showLoader: true });

      const profilePhotoUrl = await this.uploadProfilePhoto();

      this.setState({
        profilePhoto: {
          ...profilePhoto,
          url: profilePhotoUrl,
        },
      });

      const params = getFormattedProfileParams(this.state);
      params.profile_image_url = profilePhotoUrl;

      const formData = new FormData();
      Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
      });

      const res = await httpPost(API_URLS.UPDATE_PROFILE, formData);

      this.setState({ showLoader: false });

      const { setTheme, setUserProfile, history } = this.props;

      setTheme(theme);
      setUserProfile(res);
      history.push(APP_ROUTES.DASHBOARD);
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Upload Profile Photo
   */
  uploadProfilePhoto = async () => {
    try {
      const {
        profilePhoto: { file, url = '' },
      } = this.state;

      if (!url || url.startsWith('http')) return url;

      const formData = new FormData();
      formData.append('file', file);

      const res = await httpPost(API_URLS.UPLOAD_IMAGE, formData);

      return res.url;
    } catch (e) {
      return '';
    }
  };

  /**
   * Handle Change Theme
   */
  onChangeTheme = theme => () => {
    this.setState({ theme });
  };

  /**
   * Verify Profile Photo Input
   *
   * @param {Object}
   */
  handleProfilePhotoInput = event => {
    const [file] = event.target.files || [];

    if (!file) return;

    /* Supported Formats */
    switch (file.type) {
      case 'image/png':
      case 'image/jpg':
      case 'image/jpeg':
        break;

      default:
        showErrorMsg(ERROR_MESSAGES.invalid_image_type);
        return;
    }

    /* Validate Max Size */
    const size = 2; // MB
    if (file.size > size * 1000000) {
      showErrorMsg(ERROR_MESSAGES.invalid_image_size.replace(/#SIZE#/g, size));
    }

    const profilePhoto = { file, url: URL.createObjectURL(file) };

    this.setState({ profilePhoto });
  };

  /**
   * On Change > Text Input
   */
  onChangeInput = evt => {
    const { name, value } = evt.target;

    switch (name) {
      case 'phoneNumber':
        const validNumber = getNumbers(value);

        if (this.state.phoneNumber == validNumber) break;
        if (validNumber.length > 10) break;

        this.setState({ [name]: value });
        break;

      case 'fullName':
      case 'country':
      case 'companyName':
      case 'designation':
        if (value.length > 250) break;
        this.setState({ [name]: value });
        break;

      case 'companyWebsite':
      default:
        this.setState({ [name]: value });
    }
  };

  /**
   * Get Validation Errors
   *
   * @return {Object}
   */
  getValidationErrors = () => {
    const {
      activeStep,
      isSubmit,

      /* Profile Details */
      fullName,
      phoneNumber,
      country,

      /* Company Details */
      companyWebsite,
    } = this.state;

    if (!isSubmit) return {};

    let errors = {};

    const validateRequiredString = field =>
      !String(field).trim() ? ERROR_MESSAGES.required : '';

    const validateRequiredUrl = field =>
      !validateUrl(field) ? ERROR_MESSAGES.invalid_website_url : '';
    const validateMinLength = field =>
      getNumbers(field).length < 10 ? ERROR_MESSAGES.invalid_phone_number : '';

    /* Profile Details */
    if (activeStep == 1) {
      const errFullName = validateRequiredString(fullName);
      const errPhoneNumber =
        validateRequiredString(phoneNumber) || validateMinLength(phoneNumber);
      const errCountry = validateRequiredString(country);
      // const errProfilePhoto = validateRequiredString(profilePhoto.url);

      errors = {
        ...errors,
        errFullName,
        errPhoneNumber,
        errCountry,
        // errProfilePhoto,
      };
    }

    /* Company Details */
    if (activeStep == 2) {
      // const errCompanyName = validateRequiredString(companyName);
      const errCompanyWebsite = companyWebsite
        ? validateRequiredUrl(companyWebsite)
        : '';
      // const errDesignation = validateRequiredString(designation);

      errors = {
        ...errors,
        // errCompanyName,
        errCompanyWebsite,
        // errDesignation,
      };
    }

    return errors;
  };

  goToRoute = route => () => {
    this.props.history.push(route);
  };

  /**
   * Render View
   */
  render() {
    const { classes } = this.props;
    const {
      showLoader,
      activeStep,
      theme,
      isFetchingProfile,

      /* Profile Details */
      fullName,
      phoneNumber,
      country,
      profilePhoto,

      /* Company Details */
      companyName,
      companyWebsite,
      designation,
    } = this.state;

    const stepsCount = STEPS.length;

    const {
      errFullName,
      errPhoneNumber,
      errCountry,
      errProfilePhoto,

      errCompanyName,
      errCompanyWebsite,
      errDesignation,
    } = this.getValidationErrors();

    return (
      <Container component="main" maxWidth="md" className="complete-signup">
        {isFetchingProfile && <Spinner />}
        <div className={classes.paper}>
          <Grid
            container
            alignItems="flex-start"
            justify="center"
            className="complete-signup-form"
          >
            <Grid item xs={12}>
              <Typography variant="h1" align="center" gutterBottom>
                Complete your profile ({activeStep}/{stepsCount})
                <CloseIcon
                  className="close-panel"
                  onClick={this.goToRoute(APP_ROUTES.DASHBOARD)}
                />
              </Typography>
              <MobileStepper
                variant="progress"
                steps={stepsCount + 1}
                position="static"
                activeStep={activeStep - 1}
                className={classes.stepper}
              />
            </Grid>
            {activeStep == 1 && (
              <>
                <Grid item xs={8}>
                  <form className={classes.form} noValidate>
                    <TextField
                      autoComplete="fullName"
                      name="fullName"
                      margin="normal"
                      variant="outlined"
                      id="fullName"
                      label="Full Name"
                      autoFocus
                      required
                      fullWidth
                      error={Boolean(errFullName)}
                      value={fullName}
                      onChange={this.onChangeInput}
                    />
                    {errFullName && (
                      <FormHelperText error>{errFullName}</FormHelperText>
                    )}
                    <TextField
                      variant="outlined"
                      margin="normal"
                      id="phoneNumber"
                      label="Phone Number"
                      name="phoneNumber"
                      required
                      fullWidth
                      error={Boolean(errPhoneNumber)}
                      value={phoneNumber}
                      onChange={this.onChangeInput}
                      InputProps={{
                        inputComponent: USPhoneInput,
                      }}
                    />
                    {errPhoneNumber && (
                      <FormHelperText error>{errPhoneNumber}</FormHelperText>
                    )}
                    <TextField
                      variant="outlined"
                      margin="normal"
                      name="country"
                      label="Country"
                      id="country"
                      required
                      fullWidth
                      error={Boolean(errCountry)}
                      value={country}
                      onChange={this.onChangeInput}
                    />
                    {errCountry && (
                      <FormHelperText error>{errCountry}</FormHelperText>
                    )}
                  </form>
                </Grid>
                <Grid item xs={4}>
                  <Box align="center">
                    <Badge
                      overlap="circle"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      badgeContent={
                        <div>
                          <input
                            accept="image/*"
                            className={classes.input}
                            id="icon-button-file"
                            type="file"
                            onChange={this.handleProfilePhotoInput}
                          />
                          <label htmlFor="icon-button-file">
                            <Fab
                              size="small"
                              className="avatar-badge"
                              variant="round"
                              color="primary"
                              component="span"
                            >
                              <EditIcon fontSize="small" />
                            </Fab>
                          </label>
                        </div>
                      }
                    >
                      <Box className="edit-profile-img">
                        <img
                          className={classes.profileImage}
                          alt=""
                          src={
                            profilePhoto.url || DEFAULT_IMAGES.PROFILE_AVATAR
                          }
                        />
                      </Box>
                    </Badge>
                    {errProfilePhoto && (
                      <FormHelperText error>{errProfilePhoto}</FormHelperText>
                    )}
                  </Box>
                </Grid>
              </>
            )}

            {activeStep == 2 && (
              <Grid item xs={12}>
                <form className={classes.form} noValidate>
                  <TextField
                    autoComplete="companyName"
                    name="companyName"
                    margin="normal"
                    variant="outlined"
                    id="companyName"
                    label="Company"
                    fullWidth
                    autoFocus
                    value={companyName}
                    error={Boolean(errCompanyName)}
                    onChange={this.onChangeInput}
                  />
                  {errCompanyName && (
                    <FormHelperText error>{errCompanyName}</FormHelperText>
                  )}
                  <TextField
                    variant="outlined"
                    margin="normal"
                    id="companyWebsite"
                    label="Website Link"
                    name="companyWebsite"
                    fullWidth
                    error={Boolean(errCompanyWebsite)}
                    value={companyWebsite}
                    onChange={this.onChangeInput}
                  />
                  {errCompanyWebsite && (
                    <FormHelperText error>{errCompanyWebsite}</FormHelperText>
                  )}
                  <Grid container>
                    <Grid xs={12} item>
                      <Box>
                        <TextField
                          variant="outlined"
                          margin="normal"
                          name="designation"
                          label="Designation"
                          id="designation"
                          fullWidth
                          error={Boolean(errDesignation)}
                          value={designation}
                          onChange={this.onChangeInput}
                        />
                        {errDesignation && (
                          <FormHelperText error>
                            {errDesignation}
                          </FormHelperText>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Grid>
            )}

            {activeStep == 3 && (
              <Grid container alignItems="center" justify="center">
                {APP_THEMES.map(themeName => {
                  return (
                    <Box display="block" key={themeName} mb={2}>
                      <Grid
                        container
                        justify="center"
                        alignItems="center"
                        className={`color-theme bg-${themeName} ${
                          themeName == theme ? 'active-theme' : ''
                        }`}
                        onClick={this.onChangeTheme(themeName)}
                      >
                        <Typography variant="h4">Heading</Typography>
                      </Grid>
                      <Typography
                        align="center"
                        variant="body1"
                        color={theme == themeName ? 'primary' : 'initial'}
                      >
                        {`${capitalize(themeName)} Theme ${
                          themeName == DEFAULT_THEME ? '(Default)' : ''
                        }`}
                      </Typography>
                    </Box>
                  );
                })}
              </Grid>
            )}

            <Grid
              container
              alignItems="center"
              justify="flex-end"
              className={classes.submit}
            >
              {!showLoader && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={activeStep == 1}
                    onClick={this.handlePrev}
                  >
                    Prev
                  </Button>
                  &nbsp; &nbsp;
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={this.handleNext}
                  >
                    {activeStep == 3 ? 'Finish' : 'Next'}
                  </Button>
                </>
              )}
              {showLoader && <CircularProgress size={36} />}
            </Grid>
          </Grid>
        </div>
      </Container>
    );
  }
}

CompleteSignup.propTypes = {
  classes: shape({}),
  setTheme: func.isRequired,
  setUserProfile: func.isRequired,
  theme: string.isRequired,
  userProfile: shape({}).isRequired,
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
  userProfile: getUserProfile(),
});

export default connect(mapStateToProps, { setTheme, setUserProfile })(
  withStyles(styles)(CompleteSignup)
);
