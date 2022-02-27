import React from 'react';
import { withRouter } from 'react-router-dom';
import { shape, func, bool } from 'prop-types';
import cx from 'classnames';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Drawer,
  List,
  CssBaseline,
  Typography,
  IconButton,
  ListItem,
  ListItemIcon,
  Grid,
  Tooltip,
  MenuItem,
  withStyles,
  Box,
  Popper,
  Paper,
  Grow,
  MenuList,
  ClickAwayListener,
  Divider,
} from '@material-ui/core';
import { ChevronLeft as ChevronLeftIcon } from '@material-ui/icons';

import { API_URLS } from '../../configs/api';
import {
  AI_MODULES_DISPLAY_NAME,
  DEFAULT_IMAGES,
  RBM_DISPLAY_NAME,
} from '../../configs/app';
import { APP_ROUTES } from '../../configs/routes';
import { httpPost } from '../../utils/http';
import { setUserSession } from '../../utils/localStorage';

import {
  setUserProfile,
  fetchUserProfile,
} from '../../reducers/UserProfile/actions';
import {
  getUserProfile,
  isRequesting as isFetchingProfile,
} from '../../reducers/UserProfile/selectors';

import AppLoader from '../AppLoader';

import { styles } from './styles';
import './styles.scss';
import { logAmplitudeEvent, setAmplitudeUserId } from '../../utils/amplitude';

const SIDE_BAR_MENUS = [
  {
    label: 'Source Tables',
    route: APP_ROUTES.SOURCE_TABLES,
    icon: 'source-table.svg',
    isVisible: true,
  },
  {
    label: 'Process Builder',
    route: APP_ROUTES.PROCESS_BUILDER,
    icon: 'process-builder.svg',
    isVisible: true,
  },
  // {
  //   label: 'Pivots',
  //   route: APP_ROUTES.PIVOTS,
  //   icon: 'pivots.svg',
  //   isVisible: true,
  // },
  // {
  //   label: 'Reports',
  //   route: APP_ROUTES.REPORTS,
  //   icon: 'reports.svg',
  //   isVisible: true,
  // },
  {
    label: 'Financial Environment Setup',
    route: APP_ROUTES.FINANCIAL_ENV_SETUP,
    icon: 'env.svg',
    isVisible: true,
  },
  {
    label: 'Scenarios',
    route: APP_ROUTES.SCENARIOS,
    icon: 'scenario.svg',
    isVisible: true,
  },
  {
    label: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
    route: APP_ROUTES.DIMENSIONS,
    icon: 'dimension.svg',
    isVisible: true,
  },
  {
    label: 'Record Editor',
    route: APP_ROUTES.RECORD_EDITORS,
    icon: 'record-editor.svg',
    isVisible: true,
  },
  {
    label: 'Modeling',
    route: APP_ROUTES.MODELS_LIST,
    icon: 'model.svg',
    isVisible: true,
    // isVisible: process.env.REACT_APP_ENV == 'development',
  },
  // Rule Based Modeling
  {
    label: RBM_DISPLAY_NAME.rbmSideBarLabel,
    route: APP_ROUTES.RULE_BASED_MODEL_LIST,
    // TODO: change icon here
    icon: 'rule-based-forecasting.svg',
    isVisible: true,
  },
];

/**
 * App Side Bar
 */
class AppSideBar extends React.PureComponent {
  /**
   * State
   */
  state = {
    isSideBarExpanded: false,
    showLoader: false,
    profileMenuEl: null,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { userProfile, fetchUserProfile } = this.props;

    if (Object.keys(userProfile).length == 0) fetchUserProfile();
  }

  /**
   * Expand | Collapse Side Bar
   */
  handleSideBarVisiblity = () => {
    this.setState({ isSideBarExpanded: !this.state.isSideBarExpanded });
  };

  /**
   * Handle Logout
   */
  onClickLogout = async () => {
    try {
      this.closeProfileMenu();
      if (this.state.showLoader) return;

      this.setState({ showLoader: true });
      await httpPost(API_URLS.LOGOUT);

      this.setState({ showLoader: false });
      setUserSession('');
      this.props.setUserProfile({});

      logAmplitudeEvent('Log out');
      setAmplitudeUserId(null);

      this.goToRoute(APP_ROUTES.LOGIN)();
    } catch (e) {
      this.setState({ showLoader: false });
      setUserSession('');
      this.props.setUserProfile({});

      this.goToRoute(APP_ROUTES.LOGIN)();
    }
  };

  /**
   * Go To Route
   */
  goToRoute = route => evt => {
    if (evt) evt.preventDefault();

    this.props.history.push(route);
  };

  openProfileMenu = event => {
    if (this.state.profileMenuEl) {
      this.setState({ profileMenuEl: null });
    } else {
      this.setState({ profileMenuEl: event.currentTarget });
    }
  };

  closeProfileMenu = () => {
    this.setState({ profileMenuEl: null });
  };

  /**
   * Render View
   */
  render() {
    const {
      classes,
      userProfile,
      isFetchingProfile,
      history: { location: { pathname = '' } = {} },
    } = this.props;

    const { profile_image_url = '', email_id = '', name = '' } =
      userProfile || {};

    const { isSideBarExpanded, profileMenuEl } = this.state;

    return (
      <div className={classes.root}>
        {isFetchingProfile && <AppLoader />}
        <CssBaseline />
        <Drawer
          variant="permanent"
          className={cx(classes.drawer, {
            [classes.drawerOpen]: isSideBarExpanded,
            [classes.drawerClose]: !isSideBarExpanded,
          })}
          classes={{
            paper: cx({
              [classes.drawerOpen]: isSideBarExpanded,
              [classes.drawerClose]: !isSideBarExpanded,
            }),
          }}
        >
          <div className="app-sidebar">
            {false && (
              <Grid
                className={classes.Grid}
                container
                direction="row"
                justify="space-between"
                alignItems="center"
              >
                <Typography variant="h6" onClick={this.handleSideBarVisiblity}>
                  TFS
                </Typography>
                {isSideBarExpanded && (
                  <IconButton
                    onClick={this.handleSideBarVisiblity}
                    color="inherit"
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                )}
              </Grid>
            )}

            <List>
              {SIDE_BAR_MENUS.map(({ label, icon, route, isVisible }) => {
                if (!isVisible) return null;

                return (
                  <ListItem className="menu-item" key={label}>
                    <ListItemIcon
                      className={`${
                        pathname.includes(route) ? 'selected-list-item' : ''
                      }`}
                    >
                      <Tooltip
                        title={isSideBarExpanded ? '' : label}
                        placement="right"
                        arrow={!isSideBarExpanded}
                        key={label}
                      >
                        <a
                          onClick={() => {
                            logAmplitudeEvent(`Go to sidebar ${label}`);
                            this.goToRoute(route);
                          }}
                          href={route}
                          className={`menu-link ${
                            pathname == route ? 'selected' : ''
                          }`}
                        >
                          <img
                            src={`/images/app-sidebar/${icon}`}
                            alt={label}
                          />
                        </a>
                      </Tooltip>
                    </ListItemIcon>
                  </ListItem>
                );
              })}
            </List>

            <Box className="sidebar-profile">
              <img
                aria-haspopup="true"
                alt=""
                src={profile_image_url || DEFAULT_IMAGES.PROFILE_AVATAR}
                onClick={this.openProfileMenu}
              />
            </Box>
          </div>
        </Drawer>

        <Popper
          open={Boolean(profileMenuEl)}
          anchorEl={profileMenuEl}
          role={undefined}
          transition
          placement="top-end"
          className={classes.popperMenu}
          onClose={this.closeProfileMenu}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              style={{ transformOrigin: 'left bottom' }}
            >
              <Paper>
                <ClickAwayListener onClickAway={this.closeProfileMenu}>
                  <MenuList id="menu-list-grow">
                    <Box px={2}>
                      <Typography>{name || ''}</Typography>
                      <Typography color="textSecondary" variant="caption">
                        {email_id || ''}
                      </Typography>
                    </Box>
                    {(name || email_id) && (
                      <Box pt={1}>
                        <Divider />
                      </Box>
                    )}
                    <MenuItem
                      onClick={this.goToRoute(APP_ROUTES.COMPLETE_SIGN_UP)}
                    >
                      My account
                    </MenuItem>
                    <MenuItem onClick={this.onClickLogout}>Logout</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    );
  }
}

AppSideBar.propTypes = {
  classes: shape({}).isRequired,
  fetchUserProfile: func.isRequired,
  isFetchingProfile: bool,
  setUserProfile: func.isRequired,
  userProfile: shape({}).isRequired,
};

const mapStateToProps = createStructuredSelector({
  userProfile: getUserProfile(),
  isFetchingProfile: isFetchingProfile(),
});

export default connect(mapStateToProps, { setUserProfile, fetchUserProfile })(
  withRouter(withStyles(styles)(AppSideBar))
);
