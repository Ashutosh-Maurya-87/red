import React from 'react';
import { func, bool, string, oneOfType, number } from 'prop-types';

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
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@material-ui/icons';

import { API_URLS } from '../../../../../configs/api';
import { ROLLUP_OPERATORS } from '../../configs';
import {
  DIMENSIONS_MSG,
  ERROR_MESSAGES,
} from '../../../../../configs/messages';

import { httpPost } from '../../../../../utils/http';
import { showSuccessMsg } from '../../../../../utils/notifications';
import validateString from '../../../../../utils/helper/validateString';

import './styles.scss';

function AddHierarchyModal({
  isOpen,
  handleClose,
  title,
  doneText,
  onHierarchyAdded,
  parentHierarchyId,
  hierarchyType,
  dimensionId,
}) {
  const [hierarchyName, setHierarchyName] = React.useState('');
  const [selectedOperator, setOperator] = React.useState(ROLLUP_OPERATORS[0]);
  const [isLoading, setLoading] = React.useState(false);
  const [isSubmit, setSubmit] = React.useState(false);
  const errHierarchyName =
    isSubmit && !validateString(hierarchyName) ? ERROR_MESSAGES.required : '';

  /**
   * Handle Input Change > Hierarchy Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, 50);
    setHierarchyName(validName);
  };

  /**
   * Handle Click > Add Hierarchy
   */
  const onClickAdd = async evt => {
    evt.preventDefault();
    setSubmit(true);

    if (!hierarchyName) return;

    try {
      setLoading(true);

      const formData = new FormData();
      let URL = '';
      URL = API_URLS.DIMENSION_ADD_HIERARCHY;

      if (hierarchyType == 'GLAccounts') {
        formData.append('rollup_op', selectedOperator);
      }

      if (hierarchyType == 'dimensions') {
        formData.append('dimension_id', dimensionId);
      }

      formData.append('name', hierarchyName);

      if (parentHierarchyId && parentHierarchyId != dimensionId) {
        formData.append('parent_folder_id', parentHierarchyId);
      }

      const { data } = await httpPost(URL, formData);

      showSuccessMsg(DIMENSIONS_MSG.hierarchy_added);
      onHierarchyAdded(data);
      setLoading(false);
      handleClose(false);
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
      <form noValidate onSubmit={onClickAdd}>
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
            name="hierarchyName"
            value={hierarchyName}
            onChange={onChangeName}
            required
            autoComplete="off"
            autoFocus
            fullWidth
            placeholder="Hierarchy Name"
            label="Name"
            error={Boolean(errHierarchyName)}
            helperText={errHierarchyName || ''}
          />
          {hierarchyType == 'GLAccounts' && (
            <Box pt={3}>
              <Typography variant="caption" component="p">
                Rollup Operator
              </Typography>
              <ToggleButtonGroup
                value={selectedOperator}
                exclusive
                size="small"
                className="hierarchy-toggle toggle-group"
                onChange={(evt, value) => {
                  if (!value) return;

                  setOperator(value);
                }}
                aria-label="text alignment"
              >
                {ROLLUP_OPERATORS.map((operator, index) => (
                  <ToggleButton value={operator} key={index}>
                    {operator === '+' && <AddIcon fontSize="small" />}
                    {operator === '-' && <RemoveIcon fontSize="small" />}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Box
            display="flex"
            justifyContent="end"
            alignItems="center"
            px={2}
            py={1}
          >
            <Box mr={1}>
              <Button color="primary" size="small" onClick={handleCloseModal}>
                Cancel
              </Button>
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="small"
              onClick={onClickAdd}
              disabled={isLoading}
            >
              {!isLoading && doneText}
              {isLoading && <CircularProgress size={24} />}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}

AddHierarchyModal.propTypes = {
  dimensionId: oneOfType([number, string]),
  doneText: string,
  handleClose: func.isRequired,
  hierarchyType: string.isRequired,
  isOpen: bool.isRequired,
  onHierarchyAdded: func.isRequired,
  parentHierarchyId: oneOfType([string, number]).isRequired,
  title: string,
};

AddHierarchyModal.defaultProps = {
  doneText: 'Add',
  title: 'Add Hierarchy',
};

export default AddHierarchyModal;
