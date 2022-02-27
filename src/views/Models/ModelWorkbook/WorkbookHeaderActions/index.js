import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { func, shape, bool, arrayOf } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Box,
  Button,
  MenuItem,
  Popover,
  Typography,
  Divider,
} from '@material-ui/core';
import { Settings as SettingsIcon } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';

import {
  setGridHeaders,
  setWorkbook,
} from '../../../../reducers/Models/actions';
import {
  getGridHeaders,
  getWorkbook,
} from '../../../../reducers/Models/selectors';

import { getHeadersWidth } from '../helper';

import {
  SETTINGS_CONTEXT_MENU_ACTIONS,
  SETTINGS_CONTEXT_MENU_ACTIONS_KEYS,
  DENSITY_ACTIONS,
  DENSITY_ACTIONS_KEYS,
  DEFAULT_DENSITY,
} from '../../../../configs/density';
import { APP_ROUTES } from '../../../../configs/routes';
import { MODELS_MSG } from '../../../../configs/messages';

import { getGridDensity, setGridDensity } from '../../../../utils/localStorage';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

const WorkbookHeaderActions = ({
  history,
  onSave,
  onRun,
  workbook,
  headers,
  isVisibleActions,
  onClickAssumptions,
  onClickExport,
  onClickRefresh,
  setGridHeaders,
  unsavedChanges,
  isButtonBlockDone,
}) => {
  const { statusClassName, statusIcon: StatusIcon, lastRunAt } = workbook;
  const [settingEle, setSettingEle] = useState(null);
  const [density, setDensity] = useState(getGridDensity() || DEFAULT_DENSITY);

  /**
   * On Click `Cancel` Button
   */
  const onCancel = () => {
    logAmplitudeEvent('Cancel model');
    history.push(APP_ROUTES.MODELS_LIST);
  };

  /**
   * Modify header width
   */
  const setHeadersWidth = () => {
    const modifiedHeaders = [...headers].map((header, index) => {
      if (index == 0 || index == 1) return header;

      header.width = getHeadersWidth();
      return header;
    });

    setGridHeaders([]);

    setTimeout(() => {
      setGridHeaders(modifiedHeaders);
    }, 1);
  };

  /**
   * Handle Context Menu Action
   *
   * @param {String} action
   */
  const handleContextMenuAction = action => () => {
    switch (action) {
      case SETTINGS_CONTEXT_MENU_ACTIONS_KEYS.assumptions:
        onClickAssumptions();
        break;

      case SETTINGS_CONTEXT_MENU_ACTIONS_KEYS.export:
        onClickExport();
        break;

      case SETTINGS_CONTEXT_MENU_ACTIONS_KEYS.refresh:
        onClickRefresh();
        break;

      case DENSITY_ACTIONS_KEYS.default:
      case DENSITY_ACTIONS_KEYS.comfortable:
      case DENSITY_ACTIONS_KEYS.compact:
        setDensity(action);
        setGridDensity(action);
        setHeadersWidth();
        break;

      default:
        break;
    }

    setSettingEle(null);
  };

  /**
   * Close Context Menu Settings
   */
  const closeContextMenuSettigs = () => {
    setSettingEle(null);
  };

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="end"
        className="model-header-alert"
      >
        {unsavedChanges && (
          <Box mr={2}>
            <Alert
              variant="outlined"
              severity={'error'}
              // onClose={toggleUnsavedChanges()}
            >
              {MODELS_MSG.unsaved_changes_message}
            </Alert>
          </Box>
        )}
        <Box display="flex" alignItems="center" justifyContent="end">
          {StatusIcon && lastRunAt && (
            <Typography
              display="block"
              variant="caption"
              noWrap
              color="textSecondary"
            >
              Last Run -&nbsp;
              {StatusIcon && (
                <span className={`last-executed-status ${statusClassName}`}>
                  <StatusIcon
                    fontSize="small"
                    style={{ marginTop: '-1px', marginBottom: '0' }}
                  />
                </span>
              )}
              {lastRunAt}
            </Typography>
          )}

          <Button
            variant="outlined"
            color="primary"
            className="title-button"
            onClick={onCancel}
          >
            Cancel
          </Button>

          {isVisibleActions && (
            <>
              <Button
                variant="contained"
                color="primary"
                className="title-button"
                onClick={onRun}
                disabled={isButtonBlockDone}
              >
                Save &amp; Run
              </Button>

              <Button
                variant="contained"
                color="primary"
                className="title-button"
                onClick={onSave}
                disabled={isButtonBlockDone}
              >
                Save
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={evt => setSettingEle(evt.currentTarget)}
                className="title-button"
              >
                <SettingsIcon />
              </Button>
            </>
          )}

          <Popover
            open={Boolean(settingEle)}
            anchorEl={settingEle}
            onClose={closeContextMenuSettigs}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{}}
          >
            <Box py={1} minWidth="150px">
              <Box p={1}>
                <Typography variant="button">Density</Typography>
              </Box>
              {DENSITY_ACTIONS.map(action => (
                <MenuItem
                  className={`${density == action ? 'active-density' : ''}`}
                  key={action}
                  onClick={handleContextMenuAction(action)}
                >
                  <Typography
                    variant="body2"
                    color={`${density == action ? 'primary' : 'inherit'}`}
                  >
                    {action}
                  </Typography>
                </MenuItem>
              ))}
              <Box py={1}>
                <Divider />
              </Box>
              <Box px={1}>
                <Typography variant="button">Actions</Typography>
              </Box>
              {SETTINGS_CONTEXT_MENU_ACTIONS.map(action => (
                <MenuItem
                  key={action}
                  onClick={handleContextMenuAction(action)}
                >
                  {action}
                </MenuItem>
              ))}
            </Box>
          </Popover>
        </Box>
      </Box>
    </Box>
  );
};

WorkbookHeaderActions.propTypes = {
  headers: arrayOf(shape({})).isRequired,
  isButtonBlockDone: bool,
  isVisibleActions: bool,
  onClickAssumptions: func.isRequired,
  onClickExport: func.isRequired,
  onClickRefresh: func.isRequired,
  onRun: func.isRequired,
  onSave: func.isRequired,
  setGridHeaders: func.isRequired,
  unsavedChanges: bool,
  workbook: shape({}).isRequired,
};

WorkbookHeaderActions.defaultProps = {
  isVisibleActions: true,
  isButtonBlockDone: false,
};

const mapStateToProps = createStructuredSelector({
  workbook: getWorkbook(),
  headers: getGridHeaders(),
});

export default connect(mapStateToProps, {
  setWorkbook,
  setGridHeaders,
})(withRouter(WorkbookHeaderActions));
