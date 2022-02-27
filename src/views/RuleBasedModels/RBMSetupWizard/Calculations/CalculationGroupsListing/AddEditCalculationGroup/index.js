import React, { useState } from 'react';
import { func, bool, string, number } from 'prop-types';

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

import { validateName } from '../../../../../../utils/helper/validateName';
import { showErrorMsg } from '../../../../../../utils/notifications';
import { ERROR_MESSAGES } from '../../../../../../configs/messages';

function AddEditCalculationGroup({
  isOpen,
  handleClose,
  handleDone,
  selectedIndex,
  selectedGroupName,
}) {
  const [newName, setName] = useState(selectedGroupName);
  const [isLoading, setLoading] = useState(false);
  const [isSubmit, setSubmit] = useState(false);

  const isValidName = validateName(newName);

  /**
   * Handle Input Change > Calculation Group Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, 50);
    setName(validName);
  };

  /**
   * Handle Click > Create
   */
  const onClickCreate = evt => {
    evt.preventDefault();

    setSubmit(true);

    if (!isValidName) {
      showErrorMsg(
        !newName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
      );
      return;
    }

    const validNewName = newName.trim();

    if (isLoading) return;

    setLoading(true);

    handleDone({ name: validNewName, index: selectedIndex });

    setLoading(false);
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
      disableBackdropClick
    >
      <form noValidate onSubmit={onClickCreate}>
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
            <Box>{`${
              selectedIndex != null ? 'Edit' : 'Add'
            } Calculation Group`}</Box>
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
            placeholder="Calculation Group Name"
            error={isSubmit && Boolean(validNameFunc())}
            helperText={isSubmit && validNameFunc()}
          />
        </DialogContent>

        <DialogActions>
          <Box pr={2} pt={1}>
            <Button
              type="submit"
              onClick={onClickCreate}
              color="primary"
              disabled={isLoading}
            >
              {!isLoading && selectedIndex != null ? 'Update' : 'Create'}
              {isLoading && <CircularProgress size={24} />}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}

AddEditCalculationGroup.propTypes = {
  handleClose: func.isRequired,
  handleDone: func.isRequired,
  isOpen: bool.isRequired,
  selectedGroupName: string,
  selectedIndex: number,
};

export default AddEditCalculationGroup;
