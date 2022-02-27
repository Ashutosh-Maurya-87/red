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

import { AI_MODULES_DISPLAY_NAME } from '../../../configs/app';
import { ERROR_MESSAGES } from '../../../configs/messages';
import { MAX_DIMENSION_NAME } from '../EditDimension/configs';
import { showErrorMsg } from '../../../utils/notifications';
import { validateName } from '../../../utils/helper/validateName';

import './styles.scss';

function RenameDimensionModal({
  isOpen,
  handleClose,
  handleUpdatedName,
  name,
  showLoader,
  title,
  doneText,
}) {
  const [newName, setName] = React.useState(name);
  const [isLoading, setLoading] = React.useState(false);
  const isValidName = validateName(newName);

  /**
   * Handle Input Change > Dimension Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, MAX_DIMENSION_NAME);
    setName(validName);
  };

  /**
   * Handle Click > Update Name
   */
  const onClickUpdate = async evt => {
    evt.preventDefault();

    if (!isValidName) {
      showErrorMsg(
        !newName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
      );
      return;
    }

    try {
      const validNewName = newName.trim();

      if (name == validNewName) {
        handleUpdatedName(validNewName);
        return;
      }
      if (!isValidName) {
        showErrorMsg(ERROR_MESSAGES.invalid_name);
        setLoading(false);
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

  /**
   * Error showing on name validation
   *
   * @returns {string}
   */
  const validNameFunc = () => {
    if (!isValidName) {
      return !newName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name;
    }
    return '';
  };

  return (
    <Dialog
      className="customized-rename-dm-modal"
      maxWidth="xs"
      fullWidth
      onClose={handleCloseModal}
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
            name="newName"
            value={newName}
            onChange={onChangeName}
            required
            autoComplete="off"
            autoFocus
            fullWidth
            placeholder={`${AI_MODULES_DISPLAY_NAME.dimension} Name`}
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

RenameDimensionModal.propTypes = {
  doneText: string,
  handleClose: func.isRequired,
  handleUpdatedName: func.isRequired,
  isOpen: bool.isRequired,
  name: string.isRequired,
  showLoader: bool.isRequired,
  title: string,
};

RenameDimensionModal.defaultProps = {
  doneText: 'Update',
  title: `Rename ${AI_MODULES_DISPLAY_NAME.dimension}`,
};

export default RenameDimensionModal;
