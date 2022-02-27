import React, { useCallback, useEffect, useState } from 'react';
import { bool, func, number, oneOfType, shape, string } from 'prop-types';

import moment from 'moment';
import MomentUtils from '@date-io/moment';
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import { Event as CalendarIcon } from '@material-ui/icons';

import { fetchDimension } from '../../services/Dimensions';

import getNumbersWithFirstCharSymbol from '../../utils/helper/getNumbersWithFirstCharSymbol';
import { httpPost } from '../../utils/http';
import { showSuccessMsg } from '../../utils/notifications';

import { API_URLS } from '../../configs/api';
import { COLUMN_DATA_TYPES_KEYS, DEFAULT_DATE_FORMAT } from '../../configs/app';
import { ERROR_MESSAGES } from '../../configs/messages';

import AddEditGLAccountModal from '../../views/FinancialEnvSetup/SetupGLAccounts/GLAccountHierarchy/AddEditGLAccount';

import { getInitialHeaders, isValidForm } from './helper';
import Spinner from '../Spinner';

const AddEditDimensionDialog = ({
  isOpen = true,
  handleClose = () => {},
  dimension = {},
  doneText = '',
  handleAddEditDimension = () => {},
}) => {
  // states
  const [isSubmit, setSubmit] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isVisibleAddGLAccountModal, setIsVisibleAddGLAccountModal] = useState(
    false
  );
  const [data, setData] = useState({});

  const [headers, setHeaders] = useState([]);

  const [record, setRecord] = useState({});

  const {
    dimensionId = '',
    dimensionAlias = '',
    inputValue = '',
    tempNameCol = '',
  } = dimension || {};

  /**
   * Fetch dimension Levels > API Call
   */
  const getDimensionAndColumns = async () => {
    try {
      if (isLoading) return;

      if (!dimensionId) handleClose(false);

      setLoading(true);

      if (dimensionAlias == 'gl_account') {
        setIsVisibleAddGLAccountModal(true);
      } else {
        const { data = {}, meta = [] } = await fetchDimension(dimensionId);
        setData(data);

        const headers = getInitialHeaders({ headers: meta, data });

        setHeaders(headers);

        const newRecord = {
          ...record,
          [tempNameCol]: inputValue,
        };

        setRecord(newRecord);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  /**
   * Callback > Get Dimension Levels
   */
  const getDimensionAndColumnsCallback = useCallback(
    getDimensionAndColumns,
    []
  );

  /**
   * Load Data on Component Load
   */
  useEffect(() => {
    getDimensionAndColumnsCallback();
  }, [getDimensionAndColumnsCallback]);

  /**
   * Handle change on input
   *
   * @param {String} name
   * @param {String} value
   */
  const handleChangeInput = ({ target: { name, value } }) => {
    setRecord({
      ...record,
      [name]: value,
    });
  };

  /**
   * Handle change on Number
   *
   * @param {String} name
   * @param {String} value
   */
  const handleChangeNumberInput = ({ target: { name, value } }) => {
    setRecord({
      ...record,
      [name]: getNumbersWithFirstCharSymbol(value),
    });
  };

  /**
   * Handle date change
   *
   * @param {String} fieldName
   * @param {Object} date
   */
  const handleChangeDate = fieldName => date => {
    // validating date
    let validDate = moment(date);
    validDate = validDate.isValid()
      ? validDate.format(DEFAULT_DATE_FORMAT)
      : '';

    // Setting  dates
    setRecord({
      ...record,
      [fieldName]: moment(validDate).format(DEFAULT_DATE_FORMAT),
    });
  };

  /**
   * Handle Edit / Add Record
   *
   * @param {object} evt
   */
  const handleAddEditRecord = async evt => {
    try {
      evt.preventDefault();
      setSubmit(true);

      if (isValidForm(headers, record)) return;

      setLoading(true);

      const recordParams = { ...record };

      let url = API_URLS.ADD_DIMENSION_RECORD;

      url = url.replace('#ID#', dimensionId);

      const { data = {}, message = '' } = await httpPost(url, recordParams);

      handleAddEditDimension(data);

      showSuccessMsg(message);
      setLoading(false);
      handleClose(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  /**
   * Handle Close Modal without data
   */
  const handleCloseDialog = () => {
    setIsVisibleAddGLAccountModal(false);

    handleClose(false);
  };

  return (
    <>
      {dimensionAlias != 'gl_account' && (
        <Dialog
          className="customized-rename-modal"
          disableBackdropClick
          maxWidth="xs"
          fullWidth
          onClose={() => handleClose(false)}
          aria-labelledby="customized-dialog-title"
          open={isOpen}
        >
          {isLoading && <Spinner />}
          <form noValidate onSubmit={handleAddEditRecord}>
            <DialogTitle
              id="customized-dialog-title"
              onClose={() => handleClose(false)}
              className="modal-title"
            >
              <Grid
                container
                direction="row"
                justify="space-between"
                alignItems="center"
              >
                <Box>{data.display_name}</Box>
              </Grid>
            </DialogTitle>

            <DialogContent>
              <Box mb={2}>
                {headers.map((header, i) => {
                  const {
                    dataType = '',
                    name = '',
                    label = '',
                    isUnique = false,
                  } = header || {};
                  return (
                    <Box key={i}>
                      {/* Data type Alphanumeric  */}
                      {dataType == COLUMN_DATA_TYPES_KEYS.alphanumeric && (
                        <TextField
                          id={String(i)}
                          name={name}
                          fullWidth
                          margin="dense"
                          value={record[name] || ''}
                          label={label}
                          placeholder={label}
                          onChange={handleChangeInput}
                          inputProps={{ maxLength: 50 }}
                          error={Boolean(isSubmit && isUnique && !record[name])}
                          helperText={
                            isSubmit &&
                            isUnique &&
                            !record[name] &&
                            ERROR_MESSAGES.required
                          }
                        />
                      )}

                      {/* Data type Amount */}
                      {dataType == COLUMN_DATA_TYPES_KEYS.amount && (
                        <TextField
                          id={String(i)}
                          name={name}
                          fullWidth
                          margin="dense"
                          value={record[name] || ''}
                          label={label}
                          placeholder={label}
                          onChange={handleChangeNumberInput}
                          inputProps={{ maxLength: 50 }}
                          error={Boolean(isSubmit && isUnique && !record[name])}
                          helperText={
                            isSubmit &&
                            isUnique &&
                            !record[name] &&
                            ERROR_MESSAGES.required
                          }
                        />
                      )}

                      {/* Start/End Date   */}
                      {dataType == COLUMN_DATA_TYPES_KEYS.date && (
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                          <DatePicker
                            autoOk
                            fullWidth
                            label={label}
                            name={name}
                            id={name}
                            margin="dense"
                            size="small"
                            variant="inline"
                            format={DEFAULT_DATE_FORMAT}
                            error={Boolean(
                              isSubmit && isUnique && !record[name]
                            )}
                            helperText={
                              isSubmit &&
                              isUnique &&
                              !record[name] &&
                              ERROR_MESSAGES.required
                            }
                            value={
                              (record[name] && moment(record[name])) || null
                            }
                            onChange={handleChangeDate(name)}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton size="small" edge="end">
                                    <CalendarIcon fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </MuiPickersUtilsProvider>
                      )}
                    </Box>
                  );
                })}
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
                  <Button
                    color="primary"
                    size="small"
                    onClick={() => handleClose(false)}
                  >
                    Cancel
                  </Button>
                </Box>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  size="small"
                  disabled={isLoading}
                >
                  {doneText}
                </Button>
              </Box>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {dimensionAlias == 'gl_account' && isVisibleAddGLAccountModal && (
        <AddEditGLAccountModal
          isOpen={isVisibleAddGLAccountModal}
          handleClose={handleCloseDialog}
          onGLAccountAddEdit={handleAddEditDimension}
          inputValue={inputValue}
          tempNameCol={inputValue}
        />
      )}
    </>
  );
};

/**
 * Prop Types of Add Edit Dimension Dialog
 */
AddEditDimensionDialog.propTypes = {
  dimension: shape({
    dimensionId: oneOfType([string, number]).isRequired,
    dimensionAlias: string.isRequired,
  }).isRequired,
  doneText: string,
  handleAddEditDimension: func.isRequired,
  handleClose: func.isRequired,
  isOpen: bool.isRequired,
};

/**
 * Default Prop Types of Add Edit Dimension Dialog
 */
AddEditDimensionDialog.defaultProps = {
  dimension: {
    dimensionId: '',
    dimensionAlias: '',
  },
  doneText: 'Add',
  isEditMode: false,
  title: 'Add Dimension Record',
  handleAddEditDimension: () => {},
  onGLAccountAddEdit: () => {},
};

export default AddEditDimensionDialog;
