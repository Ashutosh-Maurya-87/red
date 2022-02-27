import React, { useState } from 'react';
import { arrayOf, bool, func, number, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import moment from 'moment';

import {
  Drawer,
  withStyles,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from '@material-ui/core';
import {
  Event as CalendarIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@material-ui/icons';

import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import Spinner from '../../../../../components/Spinner';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
  DEFAULT_DATE_FORMAT,
} from '../../../../../configs/app';
import { API_URLS } from '../../../../../configs/api';
import { ROW_ACTIONS, ROW_ACTIONS_KEYS } from '../../configs';
import {
  ERROR_MESSAGES,
  RULE_BASED_MODELS_MSG,
} from '../../../../../configs/messages';
import { ADD_EDIT_CALC_TABS } from '../../../configs';

import {
  getFormattedDimensionField,
  getInitialHeaders,
  getInitialState,
  isValidForm,
} from './helper';
import { MATCH_LOOKUP_COLUMN_FIELD_SUFFIX } from '../helper';
import DimensionDropdown from './inputFiled';

import { httpPost } from '../../../../../utils/http';
import { showSuccessMsg } from '../../../../../utils/notifications';
import { getFormattedNumberWithNegative } from '../../../../../utils/helper/getFormattedNumber';
import getNumbersWithFirstCharSymbol from '../../../../../utils/helper/getNumbersWithFirstCharSymbol';
import { getAllValuesFalseInArr } from '../../../../../utils/helper/getInitialEditState';

import { getSingleRBM } from '../../../../../reducers/RuleBasedModels/selectors';

import { styles } from '../../../RBMSetupWizard/Calculations/RulesListing/styles';

const AddEditRecord = ({
  isOpen,
  onClose,
  classes,
  headers: headersData,
  data,
  index,
  sourceId,
  handleUpdateRecord,
  singleRBM,
}) => {
  const { configuration: { entity = '' } = {} } = singleRBM || {};

  // states
  const [isSubmit, setSubmit] = useState(false);
  const [showLoader, setLoader] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [headers] = useState(
    getInitialHeaders({ headers: headersData, singleRBM })
  );

  const [record, setRecord] = useState(
    getInitialState({ headers, data, index })
  );

  const [recordEditing, setRecordEditing] = useState(
    getAllValuesFalseInArr({ data: headers })
  );

  // Current Mode
  const isEditMode = index != null && index > -1 ? true : false;

  /**
   * Handle change on input
   *
   * @param {String} param0 name
   * @param {String} param1 value
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
   * @param {String} param0 name
   * @param {String} param1 value
   */
  const handleChangeNumberInput = ({ target: { name, value } }) => {
    setRecord({
      ...record,
      [name]: String(getNumbersWithFirstCharSymbol(value, true)) || '',
    });
  };

  /**
   * On focus when user starts edit
   */
  const onInputFocus = name => () => {
    setRecordEditing({
      ...recordEditing,
      [name]: true,
    });
  };

  /**
   * On Focus out- when user click outside the input box
   */
  const onInputFocusOut = name => () => {
    setRecordEditing({
      ...recordEditing,
      [name]: false,
    });
  };

  /**
   * Selecting Dimension from the callBack
   * @param {Object} dimension
   */
  const handleOnChangeDimension = dimension => {
    const { name = '', fieldName = '', value = '' } = dimension || {};

    setRecord({
      ...record,
      [name]: value || '',
      [`${name}${MATCH_LOOKUP_COLUMN_FIELD_SUFFIX}`]: fieldName || '',
    });
  };

  /**
   * Handle date change
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
   */
  const handleAddEditRecord = async () => {
    try {
      setSubmit(true);

      const { recordId = '' } = isEditMode ? data[index][0] : {};
      if (isValidForm(headers, record)) return;

      setLoader(true);

      const recordParams = { ...record };

      Object.keys(recordParams).forEach(key => {
        if (key.includes(MATCH_LOOKUP_COLUMN_FIELD_SUFFIX)) {
          delete recordParams[key];
        }
      });

      //  Preparing data to send
      const apiData = {
        data: [
          {
            action: isEditMode
              ? ROW_ACTIONS.UPDATE_RECORD.action
              : ROW_ACTIONS_KEYS.ADD_RECORD,
            data: isEditMode
              ? [{ ...recordParams, affa_record_id: recordId }]
              : [recordParams],
          },
        ],
      };

      const url = API_URLS.REPLICATE_SOURCE_TABLE.replace(
        '#SOURCE_ID#',
        sourceId
      );

      const { data: apiResData = [] } = await httpPost(url, apiData);

      const [first] = apiResData || [];
      const { affa_record_id: addRecordId = '' } = first || {};

      handleUpdateRecord({
        record: { ...record, affa_record_id: recordId || addRecordId || '' },
        index,
      });

      showSuccessMsg(RULE_BASED_MODELS_MSG.rbm_overView_add_update_record);
      setLoader(false);
      onClose();
    } catch (error) {
      console.error(error);
      setLoader(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      disableBackdropClick
      className={classes.drawer}
      classes={{
        paper: classes.drawerPaper,
      }}
      open={isOpen}
      onClose={onClose}
    >
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" component="h5">
            {isEditMode ? 'Edit' : 'Add New'} Row
          </Typography>
        </Box>

        {/* Tabs */}
        <Box textAlign="center" mt={1} fontSize={24} mb={2}>
          <Tabs
            value={activeTab}
            indicatorColor="primary"
            className="select-table-tab"
            onChange={(evt, activeTab) => {
              setActiveTab(activeTab);
            }}
          >
            {Object.keys(ADD_EDIT_CALC_TABS).map((tabName, tabIndex) => {
              let { label = '' } = ADD_EDIT_CALC_TABS[tabName] || {};

              label =
                label == ADD_EDIT_CALC_TABS.attributes.label
                  ? label.replace('#type#', entity)
                  : label;

              return (
                <Tab
                  key={tabIndex}
                  label={label}
                  icon={
                    tabIndex == 0 &&
                    isSubmit &&
                    isValidForm(headers, record) ? (
                      <ErrorOutlineIcon color="error" />
                    ) : (
                      ''
                    )
                  }
                  className="reload-table-tabs"
                />
              );
            })}
          </Tabs>
        </Box>

        <Grid container spacing={2}>
          {showLoader && <Spinner />}

          {/* Add/Edit form starts */}
          {headers
            .filter(
              ({ name = '', type = '' }) =>
                name && type == Object.keys(ADD_EDIT_CALC_TABS)[activeTab]
            )
            .map((header, i) => {
              const {
                dataType = '',
                label = '',
                name = '',
                isUnique = false,
                dimension_mapping = {},
              } = header || {};

              const { name_col = '', dimension_id = '', name: fieldName = '' } =
                dimension_mapping || {};

              return (
                <Grid item xs={6} key={i}>
                  {/* Data type Alphanumeric  */}

                  {dimension_mapping == null &&
                    dataType == COLUMN_DATA_TYPES_KEYS.alphanumeric && (
                      <TextField
                        id={String(i)}
                        key={i}
                        name={name}
                        fullWidth
                        margin="dense"
                        value={record[name]}
                        label={label}
                        placeholder={label}
                        onChange={handleChangeInput}
                        variant="outlined"
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
                  {dimension_mapping == null &&
                    dataType == COLUMN_DATA_TYPES_KEYS.amount && (
                      <TextField
                        id={String(i)}
                        key={i}
                        name={name}
                        fullWidth
                        margin="dense"
                        value={
                          !recordEditing[name]
                            ? String(
                                getFormattedNumberWithNegative({
                                  value: record[name] || '',
                                  decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                                }) || ''
                              )
                            : String(record[name]) || ''
                        }
                        label={label}
                        placeholder={label}
                        onFocus={onInputFocus(name)}
                        onBlur={onInputFocusOut(name)}
                        onChange={handleChangeNumberInput}
                        variant="outlined"
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
                  {dimension_mapping == null &&
                    dataType == COLUMN_DATA_TYPES_KEYS.date && (
                      <MuiPickersUtilsProvider utils={MomentUtils}>
                        <DatePicker
                          autoOk
                          fullWidth
                          label={label}
                          name={name}
                          id={name}
                          size="small"
                          variant="inline"
                          inputVariant="outlined"
                          format={DEFAULT_DATE_FORMAT}
                          error={Boolean(isSubmit && isUnique && !record[name])}
                          helperText={
                            isSubmit &&
                            isUnique &&
                            !record[name] &&
                            ERROR_MESSAGES.required
                          }
                          value={(record[name] && moment(record[name])) || null}
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

                  {/* Auto complete if dimension map to field   */}
                  {dimension_mapping != null && dimension_id && (
                    <DimensionDropdown
                      key={i}
                      dimension={{
                        id: String(dimension_id),
                        identifierName: name_col,
                        fieldName,
                        dataType,
                      }}
                      autoCompleteProps={{
                        name,
                      }}
                      inputProps={{
                        label,
                        error: Boolean(isSubmit && isUnique && !record[name]),
                      }}
                      value={getFormattedDimensionField({
                        identifierName: name_col,
                        identifierCol: fieldName,
                        nameValue:
                          record[
                            `${name}${MATCH_LOOKUP_COLUMN_FIELD_SUFFIX}`
                          ] || '',
                        identifierValue: record[name] || '',
                      })}
                      onChange={handleOnChangeDimension}
                    />
                  )}
                </Grid>
              );
            })}
        </Grid>
      </Box>
      <Box
        display="flex"
        position="sticky"
        pb={3}
        pt={4}
        bgcolor="inherit"
        bottom="-20px"
        zIndex="1"
      >
        <Box mr={1}>
          <Button color="primary" onClick={() => onClose()}>
            Cancel
          </Button>
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleAddEditRecord}
        >
          {isEditMode ? 'Update' : 'Add'}
        </Button>
      </Box>
    </Drawer>
  );
};

// Props Validation
AddEditRecord.propTypes = {
  data: arrayOf(arrayOf(shape({}))).isRequired,
  handleUpdateRecord: func,
  headers: arrayOf(shape({})).isRequired,
  index: number,
  isOpen: bool.isRequired,
  onClose: func.isRequired,
  singleRBM: shape({}),
  sourceId: number.isRequired,
};

// Default props
AddEditRecord.defaultProps = {
  headers: [],
  handleUpdateRecord: () => {},
  data: [],
  index: null,
  sourceId: '',
  singleRBM: {},
};

// Map State to props
const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
});

export default connect(mapStateToProps, {})(withStyles(styles)(AddEditRecord));
