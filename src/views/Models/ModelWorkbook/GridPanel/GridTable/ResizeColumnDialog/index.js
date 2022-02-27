import React, { useEffect } from 'react';
import { number, func } from 'prop-types';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Grid,
  Typography,
  FormLabel,
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

import { DEFAULT_COL_WIDTH } from '../../../configs';
import { MODELS_MSG } from '../../../../../../configs/messages';
import getNumbers from '../../../../../../utils/helper/getNumbers';

function ResizeColumnDialog({
  width,
  handleCancel,
  updateWidth,
  tableWidth,
  minWidth,
  maxWidth,
}) {
  const [newWidth, setWidth] = React.useState(width);
  const [error, setError] = React.useState('');

  /**
   * Load Data on Load Component
   */
  useEffect(() => {
    setWidth(width);
  }, [width]);

  /**
   * Handle Input Change
   *
   * @param {Object}
   */
  const onChangeWidth = ({ target: { value } }, i) => {
    const validWidth = getNumbers(value);
    let errMsg = '';

    if (!validWidth || validWidth < minWidth) {
      errMsg = MODELS_MSG.min_col_width.replace('#WIDTH#', minWidth);
    } else if (!errMsg && validWidth > maxWidth) {
      errMsg = MODELS_MSG.max_col_width.replace('#WIDTH#', maxWidth);
    }

    setError(errMsg);
    setWidth(validWidth);
  };

  /**
   * Handle Done
   */
  const handleDone = evt => {
    evt.preventDefault();

    if (error) return;

    updateWidth(Number(newWidth));
  };

  return (
    <Dialog open fullWidth maxWidth="xs" onClose={handleCancel}>
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
          <Box>Resize column</Box>
          <Box mr={-1}>
            <IconButton onClick={handleCancel}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Grid>
      </DialogTitle>

      <DialogContent>
        <Box px={1}>
          <form noValidate onSubmit={handleDone}>
            <Box mb={2}>
              <Typography>
                Enter new column width in pixels. (Default: {DEFAULT_COL_WIDTH})
              </Typography>
            </Box>
            <TextField
              autoFocus
              size="small"
              id="rename"
              name="newWidth"
              variant="outlined"
              autoComplete="off"
              placeholder="Enter width..."
              value={newWidth}
              error={Boolean(error)}
              required
              onChange={onChangeWidth}
            />
            {error && (
              <Box display="block" mt={0.5} position="absolute">
                <FormLabel error style={{ fontSize: '12px' }}>
                  {error}
                </FormLabel>
              </Box>
            )}
          </form>
        </Box>
      </DialogContent>

      <DialogActions>
        <Box pr={2} py={1}>
          <Button type="submit" onClick={handleDone} color="primary">
            Update
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

ResizeColumnDialog.propTypes = {
  handleCancel: func.isRequired,
  maxWidth: number,
  minWidth: number,
  tableWidth: number,
  updateWidth: func.isRequired,
  width: number,
};

ResizeColumnDialog.defaultProps = {
  maxWidth: 700,
  minWidth: 100,
};

export default ResizeColumnDialog;
