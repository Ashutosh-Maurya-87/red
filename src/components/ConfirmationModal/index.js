import React from 'react';
import { func, bool, string, node } from 'prop-types';

import {
  Grid,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  Typography,
  CircularProgress,
} from '@material-ui/core';

import { Close as CloseIcon } from '@material-ui/icons';

function ConfirmationModal({
  handleClose,
  children,
  isOpen,
  action,
  msg,
  noText,
  title,
  yesText,
  showLoader,
  maxWidth,
  className,
  hideClose,
  actionForCancel,
}) {
  const handleYes = () => {
    handleClose(action);
  };

  const handleNo = () => {
    handleClose(actionForCancel ? actionForCancel : false);
  };

  const handleCancel = () => {
    handleClose();
  };

  return (
    <Dialog
      disableBackdropClick
      className="customized-conf-modal"
      maxWidth={maxWidth}
      fullWidth
      onClose={handleCancel}
      aria-labelledby="customized-dialog-title"
      open={isOpen}
    >
      <DialogTitle
        id="customized-dialog-title"
        onClose={handleCancel}
        className="modal-title"
      >
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Box>{title}</Box>
          <Box mr={-1}>
            {!hideClose && (
              <IconButton onClick={() => handleClose(false)}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Grid>
      </DialogTitle>

      <Box className={className} textAlign="center" pt={4} pb={5} px={3}>
        <Typography>
          <span dangerouslySetInnerHTML={{ __html: msg }} />
        </Typography>
        {children ? children : ''}
      </Box>

      <DialogActions>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="end"
          pt={1}
          pb={2}
          px={3}
        >
          {noText && (
            <Button onClick={handleNo} color="primary" size="small">
              {noText}
            </Button>
          )}

          {showLoader && <CircularProgress size={24} />}

          {!showLoader && (
            <Box ml={1}>
              <Button
                variant="contained"
                onClick={handleYes}
                color="primary"
                size="small"
              >
                {yesText}
              </Button>
            </Box>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

ConfirmationModal.propTypes = {
  action: string.isRequired,
  actionForCancel: string,
  children: node,
  className: string,
  handleClose: func.isRequired,
  hideClose: bool,
  isOpen: bool.isRequired,
  maxWidth: string,
  msg: string,
  noText: string,
  showLoader: bool.isRequired,
  title: string,
  yesText: string,
};

ConfirmationModal.defaultProps = {
  actionForCancel: null,
  msg: 'Are you sure?',
  noText: 'No',
  maxWidth: 'xs',
  title: 'Confirmation',
  showLoader: false,
  yesText: 'Yes',
  hideClose: false,
};

export default ConfirmationModal;
