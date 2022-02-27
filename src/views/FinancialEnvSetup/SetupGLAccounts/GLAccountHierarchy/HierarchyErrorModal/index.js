import React from 'react';

import { bool } from 'prop-types';
import {
  Grid,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
} from '@material-ui/core';

import ReportProblemOutlinedIcon from '@material-ui/icons/ReportProblemOutlined';

function HierarchyErrorModal({ isOpen }) {
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Dialog
      className="customized-rename-modal"
      maxWidth="xs"
      fullWidth
      disableBackdropClick
      aria-labelledby="customized-dialog-title"
      open={isOpen}
    >
      <DialogTitle id="customized-dialog-title" className="modal-title">
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Box display="flex" alignItems="center" color="#ff9800">
            <Box display="flex" mr={1}>
              <ReportProblemOutlinedIcon />
            </Box>
            Oops!
          </Box>
        </Grid>
      </DialogTitle>

      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2">
            The selected items can’t be moved the mentioned location. The system
            will now refresh hierarchies to previous state
          </Typography>
        </Box>
        <Box mb={1} textAlign="center">
          <Button
            type="submit"
            color="primary"
            variant="contained"
            size="small"
            onClick={refreshPage}
            disabled={false}
          >
            Reload Page
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

HierarchyErrorModal.propTypes = {
  isOpen: bool.isRequired,
};

HierarchyErrorModal.defaultProps = {
  doneText: 'Update',
  title: 'Rename Levels',
};

export default HierarchyErrorModal;
