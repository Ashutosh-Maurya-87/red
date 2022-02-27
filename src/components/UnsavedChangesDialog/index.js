import React from 'react';
import { func, string } from 'prop-types';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
} from '@material-ui/core';

function UnsavedChangesDialog({
  handleUnsavedConf,
  message,
  btnOneText,
  btnTwoText,
}) {
  return (
    <Dialog
      open
      onClose={handleUnsavedConf(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>Unsaved Changes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message
            ? message
            : `You have unsaved changes. Do you want to discard these changes and
          proceed?`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="end"
          px={2}
          py={1}
        >
          <Box mr={1}>
            <Button
              onClick={handleUnsavedConf(false)}
              color="primary"
              size="small"
            >
              {btnOneText ? btnOneText : 'Cancel'}
            </Button>
          </Box>
          <Button
            onClick={handleUnsavedConf(true)}
            color="primary"
            variant="contained"
            size="small"
          >
            {btnTwoText ? btnTwoText : 'Discard'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

UnsavedChangesDialog.propTypes = {
  btnOneText: string,
  btnTwoText: string,
  handleUnsavedConf: func.isRequired,
  message: string,
};

export default UnsavedChangesDialog;
