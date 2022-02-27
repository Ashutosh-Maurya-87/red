import React from 'react';
import { func, bool, string } from 'prop-types';

import {
  Grid,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

import { ERROR_MESSAGES } from '../../../configs/messages';
import { showErrorMsg } from '../../../utils/notifications';
import { validateName } from '../../../utils/helper/validateName';

import './styles.scss';

function RenameProcessModal({
  isOpen,
  handleClose,
  handleUpdatedName,
  processName,
  showLoader,
  title,
  doneText,
}) {
  const [newProcessName, setProcessName] = React.useState(processName);
  const [isLoading, setLoading] = React.useState(false);
  const isValidName = validateName(newProcessName);

  /**
   * Handle Input Change > Process Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, 50);
    setProcessName(validName);
  };

  /**
   * Error showing on name validation
   *
   * @returns {string}
   */
  const validNameFunc = () => {
    if (!isValidName) {
      return !newProcessName
        ? ERROR_MESSAGES.required
        : ERROR_MESSAGES.invalid_name;
    }
    return '';
  };

  /**
   * Handle Click > Update Name
   */
  const onClickUpdate = async evt => {
    evt.preventDefault();

    if (!isValidName) {
      showErrorMsg(
        !newProcessName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
      );
      return;
    }

    try {
      const validNewName = newProcessName.trim();

      if (processName == validNewName) {
        handleUpdatedName(validNewName);
        return;
      }

      handleUpdatedName(validNewName);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  /**
   * Handle Close Modal without data
   */
  const handleCloseModal = () => {
    handleClose(false);
  };

  return (
    <Dialog
      className="customized-rename-modal"
      maxWidth="xs"
      fullWidth
      onClose={handleCloseModal}
      aria-labelledby="customized-dialog-title"
      open={isOpen}
    >
      <form noValidate onSubmit={onClickUpdate}>
        <DialogTitle
          id="customized-dialog-title"
          onClose={handleCloseModal}
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
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <TextField
            name="newProcessName"
            value={newProcessName}
            onChange={onChangeName}
            required
            autoComplete="off"
            autoFocus
            fullWidth
            placeholder="Process Name"
            error={validNameFunc()}
            helperText={validNameFunc()}
          />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            onClick={onClickUpdate}
            color="primary"
            disabled={showLoader}
          >
            {!isLoading && !showLoader && doneText}
            {(isLoading || showLoader) && <CircularProgress size={24} />}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

RenameProcessModal.propTypes = {
  doneText: string,
  handleClose: func.isRequired,
  handleUpdatedName: func.isRequired,
  isOpen: bool.isRequired,
  processName: string.isRequired,
  showLoader: bool.isRequired,
  title: string,
};

RenameProcessModal.defaultProps = {
  doneText: 'Update',
  title: 'Rename Process',
};

export default RenameProcessModal;
