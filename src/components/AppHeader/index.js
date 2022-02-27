import React from 'react';
import { withRouter } from 'react-router-dom';

import {
  func,
  string,
  oneOfType,
  shape,
  bool,
  number,
  arrayOf,
} from 'prop-types';

import {
  Typography,
  Breadcrumbs,
  Grid,
  Box,
  Button,
  Link,
  CircularProgress,
  Tooltip,
} from '@material-ui/core';
import { ArrowBackIos as ArrowBackIosIcon } from '@material-ui/icons';

import { APP_ROUTES_BREADCRUMBS } from '../../configs/routes';
import './styles.scss';
import getFormattedNumber from '../../utils/helper/getFormattedNumber';
import { logAmplitudeEvent } from '../../utils/amplitude';

function AppHeader({
  onCancel,
  onSave,
  onLevel,
  saveText,
  levelText,
  cancelText,
  clearText,
  onClear,
  header,
  match,
  history,
  showLoader,
  totalRecords,
  headerActions,
  cancelColor,
  showBreadcrumbs,
  breadcrumb,
  onBack,
  backText,
  readOnly,
  isBlockDone,
  isBetaEnabled,
  betaMsg,
}) {
  if (!breadcrumb) breadcrumb = APP_ROUTES_BREADCRUMBS[match.path] || [];

  const goToRoute = route => () => {
    logAmplitudeEvent(`Go to breadcrumb route ${route}`);
    if (route) history.push(route);
  };

  return (
    <div className="app-header">
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Box>
          {showBreadcrumbs && (
            <Breadcrumbs aria-label="breadcrumb">
              {breadcrumb.map(({ url, name }, key) => {
                if (url) {
                  return (
                    <Link color="inherit" key={key} onClick={goToRoute(url)}>
                      <span className="breadcrumbs linked-breadcrumbs cursor-pointer">
                        {name}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Typography color="textPrimary" key={key}>
                    <span className="breadcrumbs">{name}</span>
                  </Typography>
                );
              })}
            </Breadcrumbs>
          )}

          <Box my={1} display="flex" alignItems="center">
            <Typography variant="h2">
              {false && onBack && (
                <Box
                  component="span"
                  style={{ cursor: 'pointer' }}
                  onClick={onBack}
                >
                  <ArrowBackIosIcon />
                </Box>
              )}
              {typeof header == 'object' ? { ...header } : header}
            </Typography>

            {header && totalRecords > 0 && (
              <Typography>
                &nbsp;({getFormattedNumber(totalRecords, 0)})
              </Typography>
            )}

            {readOnly && (
              <Box
                bgcolor="primary.main"
                color="primary.contrastText"
                px={0.5}
                ml={0.5}
                borderRadius={3}
              >
                <Typography variant="caption">Read Only</Typography>
              </Box>
            )}

            {/* Beta version and Beta message */}
            {!showLoader && isBetaEnabled && (
              <Tooltip title={betaMsg} placement="bottom" arrow interactive>
                <Box
                  bgcolor="primary.main"
                  color="primary.contrastText"
                  px={1}
                  ml={0.5}
                  mt={0.1}
                  borderRadius={16}
                >
                  <Typography variant="caption">BETA</Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          {backText && onBack && (
            <Box className="cursor-pointer" mt={-1} onClick={onBack}>
              <Typography variant="body2" color="primary">
                {backText}
              </Typography>
            </Box>
          )}
        </Box>

        <Box>
          {headerActions && { ...headerActions }}

          {cancelText && (
            <Button
              variant="outlined"
              color={cancelColor}
              className="title-button"
              onClick={onCancel}
              disabled={showLoader}
            >
              {cancelText}
            </Button>
          )}

          {clearText && (
            <Button
              variant="outlined"
              color={cancelColor}
              className="title-button"
              disabled={showLoader}
              onClick={onClear}
            >
              {clearText}
            </Button>
          )}

          {levelText && (
            <Button
              variant="contained"
              color="primary"
              className="title-button"
              onClick={onLevel}
              disabled={showLoader}
            >
              {levelText}
              {showLoader && (
                <CircularProgress size={24} className="save-btn-loader" />
              )}
            </Button>
          )}

          {saveText && (
            <Button
              variant="contained"
              color="primary"
              className="title-button"
              onClick={onSave}
              disabled={showLoader || isBlockDone}
            >
              {saveText}
              {showLoader && (
                <CircularProgress size={24} className="save-btn-loader" />
              )}
            </Button>
          )}
        </Box>
      </Grid>
    </div>
  );
}

AppHeader.propTypes = {
  backText: string,
  betaMsg: string,
  breadcrumb: arrayOf(shape({})),
  cancelColor: string,
  cancelText: string,
  clearText: string,
  header: oneOfType([string, shape({})]),
  headerActions: oneOfType([string, shape({})]),
  isBetaEnabled: bool,
  isBlockDone: bool,
  levelText: string,
  onBack: func,
  onCancel: func,
  onClear: func,
  onLevel: func,
  onSave: func,
  readOnly: bool,
  saveText: string,
  showBreadcrumbs: bool,
  showLoader: bool,
  totalRecords: number,
};

AppHeader.defaultProps = {
  cancelColor: 'primary',
  clearText: '',
  cancelText: '',
  header: '',
  onCancel: () => {},
  onClear: () => {},
  onSave: () => {},
  onLevel: () => {},
  isBlockDone: false,
  saveText: '',
  levelText: '',
  showBreadcrumbs: true,
  showLoader: false,
  totalRecords: 0,
  headerActions: '',
  backText: '',
  readOnly: false,
  isBetaEnabled: false,
  betaMsg: '',
};

export default withRouter(AppHeader);
