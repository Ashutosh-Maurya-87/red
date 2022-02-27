import React, { useState } from 'react';
import { func, bool, string, number, oneOfType } from 'prop-types';

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

import { MAX_ASSUMPTION_NAME } from '../../configs';
import { httpPost } from '../../../../utils/http';
import { ASSUMPTIONS_API } from '../../../../configs/api';
import { getFormattedEmptyAssumptionParams } from '../../helper';
import { ERROR_MESSAGES } from '../../../../configs/messages';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

import { validateName } from '../../../../utils/helper/validateName';
import { showErrorMsg } from '../../../../utils/notifications';

function CreateAssumptionModal({
  isOpen,
  scope,
  modelId,
  handleClose,
  handleDone,
}) {
  const [newName, setName] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isSubmit, setSubmit] = useState(false);

  const isValidName = validateName(newName);

  /**
   * Handle Input Change > Dimension Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, MAX_ASSUMPTION_NAME);
    setName(validName);
  };

  /**
   * Handle Click > Create
   */
  const onClickCreate = async evt => {
    evt.preventDefault();

    setSubmit(true);

    if (!isValidName) {
      showErrorMsg(
        !newName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
      );
      return;
    }

    try {
      const validNewName = newName.trim();

      if (isLoading) return;

      setLoading(true);

      const url = ASSUMPTIONS_API.CREATE_ASSUMPTION;
      const params = getFormattedEmptyAssumptionParams(
        validNewName,
        scope,
        modelId
      );

      const { data = {} } = await httpPost(url, params);

      setLoading(false);
      handleDone(data);

      logAmplitudeEvent('New assumption created');
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  /**
   * Handle Close Modal without data
   */
  const handleCloseModal = () => {
    logAmplitudeEvent('Cancel create assumption');
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
            <Box>Create New Assumption</Box>
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
            placeholder="Assumption Name"
            error={isSubmit && validNameFunc()}
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
              {!isLoading && 'Create'}
              {isLoading && <CircularProgress size={24} />}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}

CreateAssumptionModal.propTypes = {
  handleClose: func.isRequired,
  handleDone: func.isRequired,
  isOpen: bool.isRequired,
  modelId: oneOfType([string, number]),
  scope: string.isRequired,
};
export default CreateAssumptionModal;
