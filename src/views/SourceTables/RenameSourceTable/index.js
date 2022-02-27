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
import { showErrorMsg } from '../../../utils/notifications';
import { ERROR_MESSAGES } from '../../../configs/messages';

import { MAX_SOURCE_TABLE_NAME } from '../../../configs/app';
import { validateName } from '../../../utils/helper/validateName';

import './styles.scss';
import { validateTableName } from '../ProcessImportedTable/helper';

function RenameSourceTable({
  isOpen,
  handleClose,
  handleUpdatedName,
  tableName,
  tableId = '',
  showLoader,
}) {
  const [newTableName, setTableName] = React.useState(tableName);
  const [isLoading, setLoading] = React.useState(false);
  const validName = validateName(newTableName.trim());

  /**
   * Handle Input Change > Table Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, MAX_SOURCE_TABLE_NAME);
    setTableName(validName);
  };

  /**
   * Handle Click > Update Name
   */
  const onClickUpdate = async evt => {
    evt.preventDefault();

    if (!validName) {
      showErrorMsg(
        !newTableName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
      );
      setLoading(false);
      return;
    }

    try {
      const validNewName = newTableName.trim();

      if (validName && tableName == validNewName) {
        handleUpdatedName(validNewName);
        return;
      }

      setLoading(true);
      const { is_exists, message = '' } = await validateTableName(
        validNewName,
        tableId
      );

      if (is_exists) {
        showErrorMsg(message);
        setLoading(false);
        return;
      }

      setLoading(false);
      handleUpdatedName(validNewName);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  /**
   * Error showing on name validation
   *
   * @returns {string}
   */
  const validNameFunc = () => {
    if (!validName) {
      return !newTableName
        ? ERROR_MESSAGES.required
        : ERROR_MESSAGES.invalid_name;
    }
    return '';
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
            <Box>Rename Table</Box>
            <Box mr={-1}>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <TextField
            name="newTableName"
            value={newTableName}
            onChange={onChangeName}
            required
            autoComplete="off"
            autoFocus
            fullWidth
            placeholder="Table Name"
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
            {!isLoading && !showLoader && 'Update'}
            {(isLoading || showLoader) && <CircularProgress size={24} />}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

RenameSourceTable.propTypes = {
  handleClose: func.isRequired,
  handleUpdatedName: func.isRequired,
  isOpen: bool.isRequired,
  showLoader: bool.isRequired,
  tableId: string,
  tableName: string.isRequired,
};

export default RenameSourceTable;
