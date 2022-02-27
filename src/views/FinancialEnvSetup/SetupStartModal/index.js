import React from 'react';
import { func } from 'prop-types';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

const FinancialEnvSetupStartModal = ({ onSetup, onClose }) => {
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <span>Financial Environment Configuration</span>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          It seems that your financial environment as not been configured yet.
          It's easy and it enables very powerful functions for forecasting and
          budgeting.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSetup} color="primary">
          Setup Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FinancialEnvSetupStartModal.propTypes = {
  onClose: func,
  onSetup: func.isRequired,
};

FinancialEnvSetupStartModal.defaultProps = {
  onClose: () => {},
};

export default FinancialEnvSetupStartModal;
