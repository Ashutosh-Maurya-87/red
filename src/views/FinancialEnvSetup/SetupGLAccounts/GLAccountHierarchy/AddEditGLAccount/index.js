import React from 'react';
import { func, bool, string, shape, oneOfType, number } from 'prop-types';

import {
  Grid,
  Box,
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Add as AddIcon, Remove as RemoveIcon } from '@material-ui/icons';

import { API_URLS } from '../../../../../configs/api';
import {
  ROLLUP_OPERATORS,
  MATH_TYPE,
  // REVERSE_SIGN,
  // POSITIVE_VARIANCE,
} from '../../configs';
import {
  DIMENSIONS_MSG,
  ERROR_MESSAGES,
} from '../../../../../configs/messages';

import { httpPost } from '../../../../../utils/http';
import { showSuccessMsg } from '../../../../../utils/notifications';
import validateString from '../../../../../utils/helper/validateString';

import { getSelectedFolder } from '../../../../../reducers/GLAccountHierarchy/selectors';

import './styles.scss';

function AddEditGLAccountModal({
  isOpen,
  handleClose,
  isEditMode,
  title,
  doneText,
  onGLAccountAddEdit,
  selectedAccount,
  selectedFolder,
  inputValue = '',
}) {
  const {
    affa_h_key_name = '',
    identifier = '',
    rollup_op = '',
    // reverse_sign = '',
    // positive_variance = '',
    math_type = '',
    affa_record_id,
  } = selectedAccount || {};
  // const getReverseSign = () => {
  //   if (isEditMode) {
  //     return reverse_sign?.toLowerCase() == 'yes' ? 'yes' : 'no';
  //   }

  //   return REVERSE_SIGN[0].value;
  // };

  const [glAccountName, setGLAccountName] = React.useState(
    isEditMode ? affa_h_key_name : inputValue || ''
  );

  const [glAccountId, setGLAccountId] = React.useState(
    isEditMode ? identifier : ''
  );
  const [operator, setOperator] = React.useState(
    isEditMode ? rollup_op : ROLLUP_OPERATORS[0]
  );
  // const [sign, setSign] = React.useState(getReverseSign());
  const [mathType, setMathType] = React.useState(
    isEditMode ? math_type.toLowerCase() : MATH_TYPE[0].value
  );
  // const [variance, setVariance] = React.useState(
  //   isEditMode ? positive_variance.toLowerCase() : POSITIVE_VARIANCE[0].value
  // );
  const [isLoading, setLoading] = React.useState(false);
  const [isSubmit, setSubmit] = React.useState(false);
  const errGLAccountName =
    isSubmit && !validateString(glAccountName) ? ERROR_MESSAGES.required : '';
  const errGLAccountId =
    isSubmit && !validateString(glAccountId) ? ERROR_MESSAGES.required : '';

  /**
   * Handle Input Change > Hierarchy Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, 50);
    setGLAccountName(validName);
  };

  /**
   * Handle Input Change > Hierarchy Id
   *
   * @param {Object}
   */
  const onChangeId = ({ target: { value } }, i) => {
    const validId = value.substring(0, 20);
    setGLAccountId(validId);
  };

  /**
   * Handle Click > Add Hierarchy
   */
  const onClickAdd = async evt => {
    evt.preventDefault();
    setSubmit(true);

    if (!glAccountId) return;
    if (Boolean(errGLAccountName) || Boolean(errGLAccountId)) return;
    try {
      setLoading(true);

      let params = new FormData();

      const URL = isEditMode
        ? API_URLS.UPDATE_HIERARCHY
        : API_URLS.ADD_GL_ACCOUNT;

      if (isEditMode) {
        params = {
          id: affa_record_id,
          identifier: glAccountId,
          affa_h_key_name: glAccountName,
          rollup_op: operator,
          // positive_variance: variance,
          math_type: mathType,
          // reverse_sign: sign,
        };
      } else {
        if (selectedFolder) {
          params.append('parent_folder_id', selectedFolder);
        }
        params.append('identifier', glAccountId);
        params.append('gl_name', glAccountName);
        params.append('rollup_operator', operator);
        // params.append('positive_variance', variance);
        params.append('math_type', mathType);
        // params.append('reverse_sign', sign);
      }

      const { data } = await httpPost(URL, params);

      if (data) {
        showSuccessMsg(
          isEditMode
            ? DIMENSIONS_MSG.update_gl_account
            : DIMENSIONS_MSG.add_gl_account
        );
        onGLAccountAddEdit(data);
      }
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
          </Grid>
        </DialogTitle>

        <DialogContent>
          <Box mb={2}>
            <TextField
              name="glAccountId"
              value={glAccountId}
              onChange={onChangeId}
              required
              autoComplete="off"
              autoFocus
              fullWidth
              placeholder="GL Account ID"
              label="GL ID"
              error={Boolean(errGLAccountId)}
              helperText={errGLAccountId || ''}
            />
          </Box>
          <TextField
            name="glAccountName"
            value={glAccountName}
            onChange={onChangeName}
            required
            autoComplete="off"
            fullWidth
            placeholder="GL Account Name"
            label="GL Name"
            error={Boolean(errGLAccountName)}
            helperText={errGLAccountName || ''}
          />
          <Box display="flex">
            <Box pt={4} mr={10}>
              <Typography variant="caption" component="p" color="textSecondary">
                Rollup Operator
              </Typography>
              <ToggleButtonGroup
                value={operator}
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

            {/* <Box pt={4}>
              <Typography variant="caption" component="p" color="textSecondary">
                Reverse Sign
              </Typography>
              <ToggleButtonGroup
                value={sign}
                exclusive
                size="small"
                className="hierarchy-toggle toggle-group"
                onChange={(evt, value) => setSign(value)}
                aria-label="text alignment"
              >
                {REVERSE_SIGN.map(({ label, value }, index) => (
                  <ToggleButton value={value} key={index}>
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box> */}
            <Box pt={4} mr={10} width="88px">
              <Typography variant="caption" component="p" color="textSecondary">
                Math Type
              </Typography>
              <Select
                fullWidth
                id="data-type-select"
                label="Date Format"
                value={mathType}
                name="dateFormat"
                onChange={({ target: { name, value } }) => setMathType(value)}
                error={!mathType}
                defaultValue=""
              >
                {MATH_TYPE.map(opt => {
                  return (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </Box>
          </Box>
          <Box display="flex">
            {/* <Box pt={4}>
              <Typography variant="caption" component="p" color="textSecondary">
                Positive Variance
              </Typography>
              <ToggleButtonGroup
                value={variance}
                exclusive
                size="small"
                className="hierarchy-toggle toggle-group"
                onChange={(evt, value) => setVariance(value)}
                aria-label="text alignment"
              >
                {POSITIVE_VARIANCE.map(({ label, value }, index) => (
                  <ToggleButton value={value} key={index}>
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box> */}
          </Box>
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
              color="primary"
              variant="contained"
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

AddEditGLAccountModal.propTypes = {
  doneText: string,
  handleClose: func.isRequired,
  inputValue: string,
  isEditMode: bool,
  isOpen: bool.isRequired,
  onGLAccountAddEdit: func.isRequired,
  selectedAccount: shape({}),
  selectedFolder: oneOfType([number, string]),
  title: string,
};

AddEditGLAccountModal.defaultProps = {
  doneText: 'Add',
  isEditMode: false,
  title: 'GL Account',
  onGLAccountAddEdit: () => {},
  inputValue: '',
};

const mapStateToProps = createStructuredSelector({
  selectedFolder: getSelectedFolder(),
});

export default connect(mapStateToProps, {})(AddEditGLAccountModal);
