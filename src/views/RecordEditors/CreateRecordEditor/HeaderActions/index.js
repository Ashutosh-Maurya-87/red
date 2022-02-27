import React from 'react';
import { bool, func } from 'prop-types';
import { Box, Button, MenuItem, Popover, Typography } from '@material-ui/core';
import { Settings as SettingsIcon } from '@material-ui/icons';

import {
  DEFAULT_DENSITY,
  DENSITY_ACTIONS,
  DENSITY_ACTIONS_KEYS,
} from '../../../../configs/density';
import { getGridDensity, setGridDensity } from '../../../../utils/localStorage';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function HeaderActionsCreateRecordEditor({
  isUpdateRecordMode,
  onAddNewRecord,
  onDensityChange,
  onCancel,
  onSave,
  isAddNew,
  isButtonBlockDone,
}) {
  const [density, setDensity] = React.useState(
    getGridDensity() || DEFAULT_DENSITY
  );
  const [settingElement, setSettingElement] = React.useState(null);

  /**
   * Handle Context Menu of Density
   *
   * @param {Object} e
   * @param {String} action
   */
  const handleContextMenuAction = (e, action) => {
    e.preventDefault();
    switch (action) {
      case DENSITY_ACTIONS_KEYS.default:
      case DENSITY_ACTIONS_KEYS.comfortable:
      case DENSITY_ACTIONS_KEYS.compact:
        setGridDensity(action);
        setDensity(action);
        onDensityChange(action);
        break;

      default:
        break;
    }
    setSettingElement(null);
  };

  /**
   * close density menu
   */
  const closeContextMenuSettigs = () => {
    setSettingElement(null);
  };

  return (
    <Box display="flex" alignItems="center">
      <Button
        color="primary"
        variant="outlined"
        className="title-button"
        onClick={() => {
          logAmplitudeEvent('Cancel record editor creation');
          onCancel();
        }}
      >
        Exit
      </Button>

      {!isUpdateRecordMode && (
        <Button
          variant="contained"
          color="primary"
          className="title-button"
          onClick={() => {
            logAmplitudeEvent('Save record editor');
            onSave();
          }}
        >
          Save and View Form
        </Button>
      )}

      {isUpdateRecordMode && !isAddNew && (
        <Button
          color="primary"
          variant="contained"
          className="title-button"
          onClick={() => {
            logAmplitudeEvent('Adding new record to record editor');
            onAddNewRecord();
          }}
          disabled={isButtonBlockDone}
        >
          Add New Record
        </Button>
      )}

      {/*
       *---Density of Record editor--
       */}
      <Button
        variant="contained"
        color="primary"
        onClick={evt => setSettingElement(evt.currentTarget)}
        className="title-button"
      >
        <SettingsIcon />
      </Button>

      <Popover
        open={Boolean(settingElement)}
        anchorEl={settingElement}
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
              onClick={e => handleContextMenuAction(e, action)}
            >
              <Typography
                variant="body2"
                color={`${density == action ? 'primary' : 'inherit'}`}
              >
                {action}
              </Typography>
            </MenuItem>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}

HeaderActionsCreateRecordEditor.propTypes = {
  isAddNew: bool,
  isButtonBlockDone: bool,
  isUpdateRecordMode: bool.isRequired,
  onAddNewRecord: func.isRequired,
  onCancel: func.isRequired,
  onDensityChange: func.isRequired,
  onSave: func.isRequired,
};

export default HeaderActionsCreateRecordEditor;
