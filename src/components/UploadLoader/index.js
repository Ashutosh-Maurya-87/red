import React from 'react';
import { bool, number, string } from 'prop-types';

import {
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  CircularProgress,
} from '@material-ui/core';

function UploadLoader({ isVisible, uploadPercentage, savingText }) {
  return (
    <Dialog fullWidth maxWidth="sm" open={isVisible}>
      <DialogTitle>Processing...</DialogTitle>
      <DialogContent>
        {uploadPercentage == 100 ? (
          <Box mb={4} mt={3} textAlign="center">
            <CircularProgress />
            <Box minWidth={35}>{savingText}</Box>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" mb={4} mt={3}>
            <Box width="100%" mr={1}>
              <LinearProgress variant="determinate" value={uploadPercentage} />
            </Box>
            <Box minWidth={35}>
              <Typography
                variant="body2"
                color="textSecondary"
              >{`${uploadPercentage}%`}</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

UploadLoader.propTypes = {
  isVisible: bool,
  savingText: string,
  uploadPercentage: number,
};

UploadLoader.defaultProps = {
  isVisible: false,
  uploadPercentage: 0,
  savingText: '',
};

export default UploadLoader;
