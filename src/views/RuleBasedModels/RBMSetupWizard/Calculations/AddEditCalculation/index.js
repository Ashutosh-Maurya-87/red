import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { arrayOf, bool, func, number, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import {
  Drawer,
  withStyles,
  FormControlLabel,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  Divider,
  FormControl,
  RadioGroup,
  Radio,
  InputAdornment,
  Tooltip,
  IconButton,
} from '@material-ui/core';
import { Event as CalendarIcon } from '@material-ui/icons';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import { v4 as uuidV4 } from 'uuid';

import {
  DEFAULT_DECIMAL_PLACE,
  DEFAULT_DATE_FORMAT,
  FISCAL_YEAR_DATE_FORMAT,
} from '../../../../../configs/app';
import { API_URLS } from '../../../../../configs/api';
import {
  RULES_TYPES,
  DATA_SOURCES,
  ADD_CALCULATION_SCHEDULE,
  ADD_CALCULATION_CAP,
  ADD_CALCULATION_START_FORECAST,
  ADD_CALCULATION_END_FORECAST,
  CALCULATION_MIN_MAX_VALUE,
  EDIT_CONFIRMATION_TITLE,
  EDIT_CONFIRMATION_MSG,
  EDIT_CONFIRMATION_UPDATE,
  EDIT_CONFIRMATION_SAVE_AS_NEW,
} from '../../../configs';

import { showErrorMsg } from '../../../../../utils/notifications';
import { httpGet } from '../../../../../utils/http';
import ListboxComponent from '../../../../../components/CustomListBox';
import { ERROR_MESSAGES } from '../../../../../configs/messages';
import Spinner from '../../../../../components/Spinner';
import ConfirmationModal from '../../../../../components/ConfirmationModal';

import {
  getDefaultStateRule,
  onCopyOrDuplicate,
  validateForm,
  validatingName,
  validatingNumber,
} from './helper';

import { getFormattedNumberWithNegative } from '../../../../../utils/helper/getFormattedNumber';
import getNumbersWithFirstCharSymbol from '../../../../../utils/helper/getNumbersWithFirstCharSymbol';
import { getAllValuesFalseInObj } from '../../../../../utils/helper/getInitialEditState';

import { setSingleRBM } from '../../../../../reducers/RuleBasedModels/actions';

import { styles } from '../RulesListing/styles';

const filter = createFilterOptions();

const commonFields = {
  name: '',
  glId: '',
  type: RULES_TYPES.DIRECT_INPUT.value,
  startForecast: ADD_CALCULATION_START_FORECAST.START_MONTH.value,
  startMonthDelay: 1,
  endForecast: ADD_CALCULATION_END_FORECAST.END_MONTH.value,
  endMonthDelay: '0',
};

const commonFieldsForPercentAndInput = {
  termsInMonths: 12,
  schedule: ADD_CALCULATION_SCHEDULE.EQUAL_MONTHLY.value,
  capTerm: ADD_CALCULATION_CAP.null.value,
  cap: 1,
  dataSource: DATA_SOURCES.columnInData.value,
  fixedValue: 1,
};

const typePercentage = {
  percentageOf: [],
  fixedValue: 1,
};

// Actions for Edit or Save as copy confirmation
const actions = {
  update: 'update',
  saveAsNew: 'saveAsNew',
};

const AddEditCalculation = ({
  isOpen,
  onClose,
  onDone,
  classes,
  rules,
  ruleIndex,
  selectedRule,
  selectedCalculationRules,
  activeGroup,
  singleRBM,
  onSetUnsavedChanges,
  isUpdateMapping,
  setSelectedCalculationRules,
  setSingleRBM,
}) => {
  // States
  const [isSubmit, setSubmit] = useState(false);
  const [glData, setGlAccountData] = useState([]);
  const [showLoader, setLoader] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false);

  const [singleRule, setSingleRule] = useState(
    getDefaultStateRule({
      commonFields,
      commonFieldsForPercentAndInput,
      typePercentage,
      rules,
      ruleIndex,
      selectedRule,
    })
  );

  const [ruleEditMode, setRuleEditMode] = useState(
    getAllValuesFalseInObj({ data: singleRule })
  );

  // Detecting is Edit Enable
  const isEditMode = ruleIndex != null && ruleIndex > -1 ? true : false;

  /**
   * Fetching GL Account data
   */
  const fetchGLAccounts = async () => {
    try {
      if (showLoader) return;

      setLoader(true);

      const url = API_URLS.LIST_GL_ACCOUNT;

      const { data } = await httpGet(url);
      setGlAccountData(data);

      if (data) setLoader(false);
    } catch (error) {
      console.error(error);
      setLoader(false);
    }
  };

  // Destructuring data
  const {
    name = '',
    type = '',
    fixedValue = null,
    termsInMonths = '12',
    percentageOf = [],
    schedule = {},
    capTerm = {},
    cap = null,
    startForecast = {},
    startMonthDelay = 1,
    endForecast = {},
    endMonthDelay = 0,
    dataSource = '',
    glId = '',
    id = '',
    ruleUid = '',
  } = singleRule || {};

  let tempGlID = glId;
  let tempGlLookup = glId;

  const glLookup = glData.filter(
    ({ affa_h_key_name = '' }) => affa_h_key_name == glId
  );

  if (glLookup.length > 0) {
    const [first] = glLookup || [];

    const { affa_h_key_name = '', identifier = '' } = first || {};

    tempGlID = identifier;
    tempGlLookup = affa_h_key_name;
  }

  const fixedVal =
    dataSource === DATA_SOURCES.columnInData.value ? null : fixedValue;

  const rule = {
    calc_method: type,
    cap: !capTerm ? null : cap,
    cap_term: capTerm,
    end_forecast: endForecast,
    end_forecast_delay:
      endForecast == ADD_CALCULATION_END_FORECAST.SPECIFIC_DATE.value
        ? endMonthDelay
        : Number(endMonthDelay),
    fixed_value: RULES_TYPES.COUNT.value == type ? fixedValue : fixedVal,
    forecast_column: name,
    forecast_label: name,
    gl_id: tempGlID,
    gl_id_lookup: tempGlLookup,
    id,
    percent_of: percentageOf.map(({ value = '' }) => value),
    rule_uid: !isEditMode ? uuidV4() : ruleUid,
    schedule,
    schedule_month: null,
    start_forecast: startForecast,
    start_forecast_delay: Number(startMonthDelay),
    terms_in_month: Number(termsInMonths),
  };

  /**
   * Call back to fetch GL account data
   */
  const callbackToGetGlAccount = useCallback(fetchGLAccounts, []);

  /**
   * Use effect hook to render gl account data using call back
   */
  useEffect(() => {
    callbackToGetGlAccount();
  }, [callbackToGetGlAccount]);

  /**
   * On focus when user starts edit
   */
  const onInputFocus = event => {
    const { target: { name = '' } = {} } = event || {};

    setRuleEditMode({
      ...ruleEditMode,
      [name]: true,
    });
  };

  /**
   * On Focus out- when user click outside the input box
   */
  const onInputFocusOut = event => {
    const { target: { name = '' } = {} } = event || {};

    setRuleEditMode({
      ...ruleEditMode,
      [name]: false,
    });
  };

  // Methods
  const handleChangeInput = ({ target: { name, value } }) => {
    const copyOfSingleRule = { ...singleRule };
    let newName = '';

    if (name == 'name' || name == 'dataSource') {
      newName = value;

      if (name == 'fixedValueRadio') {
        name = 'fixedValue';
      }
    } else {
      newName =
        String(
          getNumbersWithFirstCharSymbol(value.replaceAll(',', ''), true)
        ) || '';
    }

    copyOfSingleRule[name] = newName;

    setSingleRule(copyOfSingleRule);
  };

  const handleOnChangeSelect = name => (evt, valueObj) => {
    let copyOfSingleRule = { ...singleRule };

    const { value = '' } =
      typeof valueObj == 'object'
        ? valueObj || {}
        : { value: copyOfSingleRule[name] } || {};

    copyOfSingleRule[name] = value;

    // Rest field values in case of type field change
    if (name == 'type') {
      if (value == RULES_TYPES.DIRECT_INPUT.value)
        copyOfSingleRule = {
          ...copyOfSingleRule,
          ...typePercentage,
          ...commonFieldsForPercentAndInput,
        };

      if (value == RULES_TYPES.COUNT.value)
        copyOfSingleRule = {
          ...copyOfSingleRule,
          ...commonFieldsForPercentAndInput,
          ...typePercentage,
        };

      if (value == RULES_TYPES.PERCENT.value)
        copyOfSingleRule = {
          ...copyOfSingleRule,
          ...commonFieldsForPercentAndInput,
        };
    }

    if (name == 'endForecast') {
      if (value == ADD_CALCULATION_END_FORECAST.SPECIFIC_DATE.value)
        copyOfSingleRule = {
          ...copyOfSingleRule,
          endMonthDelay: moment().format(DEFAULT_DATE_FORMAT),
        };

      if (value != ADD_CALCULATION_END_FORECAST.SPECIFIC_DATE.value)
        copyOfSingleRule = {
          ...copyOfSingleRule,
          endMonthDelay: '0',
        };
    }

    setSingleRule({ ...copyOfSingleRule });
  };

  const handleOnChangeMultiSelect = name => (evt, option) => {
    const copyOfSingleRule = { ...singleRule };
    copyOfSingleRule[name] = option;

    setSingleRule(copyOfSingleRule);
  };

  /**
   * Handle Edit or Save as copy confirmation
   */
  const handleEditConfirmation = () => {
    const { forecast_label = '' } = selectedRule || {};

    setSubmit(true);

    if (validateForm(singleRule)) return;

    // Identify duplicate rule name
    const duplicateName = rules.filter(
      rule => rule.forecast_label.toLowerCase() == name.toLowerCase()
    );

    if (
      duplicateName.length > 0 &&
      forecast_label.toLowerCase() != name.toLowerCase()
    ) {
      showErrorMsg(ERROR_MESSAGES.rule_already_exist.replace('#NAME#', name));
      return;
    }

    setConfirmAction(true);

    // When Calculation is new
    if (!isEditMode) {
      setConfirmAction(false);
      handleAddToGroup();
    }

    // when calculation update is  true
    if (isEditMode) {
      confirmAction && handleAddToGroup();
    }
  };

  /**
   * Handle close Edit or Save as copy confirmation
   */
  const handleCloseConfirmation = action => {
    setConfirmAction(false);

    // When User hits Update button
    if (action == actions.update) {
      handleEditConfirmation();
    }

    // When user selects Save as New
    if (action == actions.saveAsNew) {
      onClose();
      onCopyOrDuplicate({
        index: ruleIndex,
        selectedCalculationRules,
        activeGroup,
        singleRBM,
        rule: { ...rule },
        onSetUnsavedChanges,
        isUpdateMapping,
        setSelectedCalculationRules,
        setSingleRBM,
      });
    }
  };

  /**
   * Storing data to add in calculation group
   */
  const handleAddToGroup = () => {
    setSubmit(true);

    if (validateForm(singleRule)) return;

    const isEditMode = ruleIndex != null && ruleIndex > -1 ? true : false;

    const { forecast_label = '' } = selectedRule || {};

    const result = glData.filter(
      ({ affa_h_key_name }) => affa_h_key_name == glId
    );

    if (result.length > 0) {
      const [first] = result || [];
      const { identifier = '', affa_h_key_name = '' } = first || {};
      rule.gl_id = identifier;
      rule.gl_id_lookup = affa_h_key_name;
    }

    // Identify duplicate rule name
    const duplicateName = rules.filter(
      rule => rule.forecast_label.toLowerCase() == name.toLowerCase()
    );

    if (
      duplicateName.length > 0 &&
      forecast_label.toLowerCase() != name.toLowerCase()
    ) {
      showErrorMsg(ERROR_MESSAGES.rule_already_exist.replace('#NAME#', name));
      return;
    }

    onDone(rule, isEditMode);
  };

  /**
   * Disabling selected option on percentage Of
   */
  const getSelectedOptionDisabled = option => {
    const { value: optValue = '' } = option || {};
    const { percentageOf = [] } = singleRule || {};

    return Boolean(percentageOf.find(({ value = '' }) => value == optValue));
  };

  const isTypeInput = RULES_TYPES.DIRECT_INPUT.value == type;
  const isTypePercentage = RULES_TYPES.PERCENT.value == type;
  const isTypeCount = RULES_TYPES.COUNT.value == type;

  const { forecast_label: ruleName = '' } = selectedRule || {};

  /**
   * Handle > On Change Fiscal Year
   *
   * @param {Object} momentObj
   */
  const handleOnChangeDate = momentObj => {
    const specificDate = momentObj.format('YYYY-MM-DD');

    let copyOfSingleRule = { ...singleRule };

    copyOfSingleRule = {
      ...copyOfSingleRule,
      endMonthDelay: specificDate,
    };

    setSingleRule(copyOfSingleRule);
  };

  const { fixedValue: isFixedValue = '', cap: isCap = '' } = ruleEditMode || {};

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
      {/* When Gl account data is getting loaded */}
      {showLoader && glData.length == 0 && <Spinner />}

      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" component="h5">
            {isEditMode ? 'Update' : 'Add'} Calculation
          </Typography>
        </Box>

        {/* Name field */}
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <TextField
              id="name"
              fullWidth
              value={name}
              name="name"
              onChange={handleChangeInput}
              margin="dense"
              label="Name"
              variant="outlined"
              error={isSubmit && Boolean(validatingName(name))}
              helperText={isSubmit && validatingName(name)}
              inputProps={{ maxLength: 50 }}
            />
          </Grid>

          {/* GL Id field */}
          <Grid item xs={4}>
            <Autocomplete
              id="gl_id"
              fullWidth
              openOnFocus
              selectOnFocus
              clearOnBlur
              freeSolo
              ListboxComponent={ListboxComponent}
              handleHomeEndKeys
              value={{ label: glId }}
              renderOption={({ label }) => label}
              onChange={handleOnChangeSelect('glId')}
              options={glData.map(
                ({ identifier = '', affa_h_key_name = '' }) => ({
                  label: `${affa_h_key_name} (${identifier})`,
                  value: affa_h_key_name,
                })
              )}
              filterOptions={(options, params) => {
                return filter(options, params);
              }}
              getOptionLabel={option => option.label || ''}
              renderInput={params => (
                <TextField
                  {...params}
                  InputLabelProps={{ shrink: true }}
                  label="GL ID"
                  variant="outlined"
                  margin="dense"
                  placeholder="Not Selected"
                />
              )}
            />
          </Grid>

          {/* Type field */}
          <Grid item xs={4}>
            <Autocomplete
              id="type"
              clearOnBlur
              fullWidth
              disableClearable
              filterOptions={(options, params) => {
                return filter(options, params);
              }}
              freeSolo
              handleHomeEndKeys
              ListboxComponent={ListboxComponent}
              onChange={handleOnChangeSelect('type')}
              openOnFocus
              value={RULES_TYPES[type]}
              options={Object.values(RULES_TYPES).map(({ label, value }) => ({
                label,
                value,
              }))}
              renderOption={({ label }) => label}
              selectOnFocus
              getOptionLabel={({ label = '' }) => label}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Type"
                  placeholder="Input Types"
                  variant="outlined"
                  margin="dense"
                />
              )}
            />
          </Grid>
          <Box my={2} width="100%">
            <Divider />
          </Box>

          {/* Percentage of */}
          {isTypePercentage && (
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="percentage_of"
                disableClearable
                disableListWrap
                clearOnBlur
                fullWidth
                filterOptions={(options, params) => {
                  return filter(options, params);
                }}
                freeSolo
                value={percentageOf}
                options={rules
                  .map(({ rule_uid, forecast_label }) => ({
                    label: forecast_label,
                    value: rule_uid,
                  }))
                  .filter(({ label }) => label != ruleName)}
                onChange={handleOnChangeMultiSelect('percentageOf')}
                filterSelectedOptions
                getOptionLabel={({ label = '' }) => label}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Select"
                    variant="outlined"
                    label="Percentage Of"
                    fullWidth
                    error={isSubmit && percentageOf.length < 1}
                    helperText={
                      isSubmit && percentageOf.length < 1
                        ? ERROR_MESSAGES.required
                        : ''
                    }
                  />
                )}
                getOptionDisabled={option => getSelectedOptionDisabled(option)}
              />
            </Grid>
          )}

          {/* Quantity on Count -> input type */}
          {isTypeCount && (
            <>
              <Grid item xs={4}>
                <TextField
                  label="Quantity"
                  variant="outlined"
                  margin="dense"
                  name="fixedValue"
                  onChange={handleChangeInput}
                  onFocus={onInputFocus}
                  onBlur={onInputFocusOut}
                  fullWidth
                  value={
                    !isFixedValue
                      ? getFormattedNumberWithNegative({
                          value: fixedValue,
                          decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                        })
                      : String(fixedValue)
                  }
                  error={
                    isSubmit &&
                    Boolean(
                      validatingNumber({
                        value: fixedValue,
                        min: CALCULATION_MIN_MAX_VALUE.fixedValue.min,
                        max: CALCULATION_MIN_MAX_VALUE.fixedValue.max,
                        name: 'Quantity',
                      })
                    )
                  }
                  helperText={
                    isSubmit &&
                    validatingNumber({
                      value: fixedValue,
                      min: CALCULATION_MIN_MAX_VALUE.fixedValue.min,
                      max: CALCULATION_MIN_MAX_VALUE.fixedValue.max,
                      name: 'Quantity',
                    })
                  }
                />
              </Grid>
              <Box my={2} width="100%">
                <Divider />
              </Box>
            </>
          )}

          {/* Percentage of -> Data Source */}

          {(isTypeInput || isTypePercentage) && (
            <>
              <Box display="flex" flexDirection="column" p={1}>
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Data Source
                  </Typography>

                  <>
                    <Typography variant="caption" color="textSecondary">
                      Where Will the
                    </Typography>

                    <Typography variant="caption" color="primary">
                      &nbsp;{name ? name : 'Name'}&nbsp;
                    </Typography>

                    <Typography variant="caption" color="textSecondary">
                      {`${isTypeInput ? '($)' : '(%)'} Come From?`}
                    </Typography>
                  </>
                </Box>

                <Box>
                  <FormControl component="fieldset">
                    <RadioGroup
                      defaultValue={DATA_SOURCES.columnInData.value}
                      value={dataSource}
                      aria-label="fixedValue"
                      name="dataSource"
                    >
                      {Object.values(DATA_SOURCES).map(
                        ({ label, value, title }, i) => (
                          <Tooltip
                            key={i}
                            title={title}
                            placement="bottom-start"
                          >
                            <FormControlLabel
                              key={label}
                              label={label}
                              control={
                                <>
                                  <Radio
                                    key={value}
                                    size="small"
                                    color="primary"
                                    name="dataSource"
                                    value={value}
                                    onChange={handleChangeInput}
                                  />
                                </>
                              }
                            />
                          </Tooltip>
                        )
                      )}
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Box>

              {/* Specify fixed value percentage */}
              <Box display="flex" alignItems="center">
                {dataSource == DATA_SOURCES.fixedValue.value && (
                  <TextField
                    id="percentage"
                    style={{ width: '150px' }}
                    value={
                      !isFixedValue
                        ? getFormattedNumberWithNegative({
                            value: fixedValue,
                            decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                          })
                        : String(fixedValue)
                    }
                    name="fixedValue"
                    onChange={handleChangeInput}
                    onFocus={onInputFocus}
                    onBlur={onInputFocusOut}
                    margin="dense"
                    variant="outlined"
                    InputProps={{
                      startAdornment: isTypeInput ? (
                        <InputAdornment position="start">$</InputAdornment>
                      ) : null,
                      endAdornment: isTypePercentage ? (
                        <InputAdornment position="start">%</InputAdornment>
                      ) : null,
                    }}
                    error={
                      isSubmit &&
                      Boolean(
                        validatingNumber({
                          value: fixedValue,
                          min: CALCULATION_MIN_MAX_VALUE.fixedValue.min,
                          max: CALCULATION_MIN_MAX_VALUE.fixedValue.max,
                          name: '',
                        })
                      )
                    }
                    helperText={
                      isSubmit &&
                      validatingNumber({
                        value: fixedValue,
                        min: CALCULATION_MIN_MAX_VALUE.fixedValue.min,
                        max: CALCULATION_MIN_MAX_VALUE.fixedValue.max,
                        name: '',
                      })
                    }
                  />
                )}
              </Box>

              <Box my={2} width="100%">
                <Divider />
              </Box>

              <Box display="flex" flexDirection="column" width="100%" p={1.5}>
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Distribution
                  </Typography>

                  <>
                    <Typography variant="caption" color="textSecondary">
                      How Do You Want to Distribute
                    </Typography>

                    <Typography variant="caption" color="primary">
                      &nbsp;{name ? name : 'Name'}&nbsp;
                    </Typography>

                    <Typography variant="caption" color="textSecondary">
                      ($) Over Time?
                    </Typography>
                  </>
                </Box>
              </Box>

              <Grid item xs={4}>
                <Tooltip
                  title="Do you need to adjust the term? The term is the number of months the amount is divided over, used to calculate the monthly amount."
                  placement="bottom"
                >
                  <TextField
                    id="Term (months)"
                    fullWidth
                    name="termsInMonths"
                    value={termsInMonths}
                    onChange={handleChangeInput}
                    margin="dense"
                    label="Term (months)"
                    variant="outlined"
                    error={
                      isSubmit &&
                      Boolean(
                        validatingNumber({
                          value: termsInMonths,
                          min: CALCULATION_MIN_MAX_VALUE.termsInMonths.min,
                          max: CALCULATION_MIN_MAX_VALUE.termsInMonths.max,
                          name: 'Term (months)',
                        })
                      )
                    }
                    helperText={
                      isSubmit &&
                      validatingNumber({
                        value: termsInMonths,
                        min: CALCULATION_MIN_MAX_VALUE.termsInMonths.min,
                        max: CALCULATION_MIN_MAX_VALUE.termsInMonths.max,
                        name: 'Term (months)',
                      })
                    }
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={8} />

              <Grid item xs={6}>
                <Tooltip
                  title="This determines how to record the monthly amount."
                  placement="bottom"
                >
                  <Autocomplete
                    id="Schedule"
                    clearOnBlur
                    fullWidth
                    disableClearable
                    filterOptions={(options, params) => {
                      return filter(options, params);
                    }}
                    freeSolo
                    handleHomeEndKeys
                    ListboxComponent={ListboxComponent}
                    onChange={handleOnChangeSelect('schedule')}
                    openOnFocus
                    value={ADD_CALCULATION_SCHEDULE[schedule]}
                    options={Object.values(ADD_CALCULATION_SCHEDULE).map(
                      ({ label, value }) => ({
                        label,
                        value,
                      })
                    )}
                    renderOption={({ label }) => label}
                    selectOnFocus
                    getOptionLabel={({ label = '' }) => label}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label={<span>Schedule</span>}
                        placeholder="Schedule"
                        variant="outlined"
                        margin="dense"
                      />
                    )}
                  />
                </Tooltip>
              </Grid>

              <Grid item xs={6}></Grid>
              {isTypePercentage && (
                <>
                  <Grid item xs={6}>
                    <Tooltip
                      title="This determines a maximum limit the amount is distributed over time. Once the cap is met, the distribution no longer applies."
                      placement="bottom"
                    >
                      <Autocomplete
                        id="Cap"
                        clearOnBlur
                        fullWidth
                        disableClearable
                        filterOptions={(options, params) => {
                          return filter(options, params);
                        }}
                        freeSolo
                        handleHomeEndKeys
                        ListboxComponent={ListboxComponent}
                        onChange={handleOnChangeSelect('capTerm')}
                        openOnFocus
                        value={ADD_CALCULATION_CAP[capTerm]}
                        options={Object.values(ADD_CALCULATION_CAP).map(
                          ({ label, value }) => ({
                            label,
                            value,
                          })
                        )}
                        renderOption={({ label }) => label}
                        selectOnFocus
                        getOptionLabel={({ label = '' }) => label}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label="Cap"
                            variant="outlined"
                            placeholder="Cap"
                            margin="dense"
                          />
                        )}
                      />
                    </Tooltip>
                  </Grid>

                  <Grid item xs={4}>
                    {capTerm != ADD_CALCULATION_CAP.null.value && (
                      <TextField
                        id="Cap Amount"
                        fullWidth
                        value={
                          !isCap
                            ? getFormattedNumberWithNegative({
                                value: cap,
                                decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                              })
                            : String(cap)
                        }
                        name="cap"
                        onChange={handleChangeInput}
                        onFocus={onInputFocus}
                        onBlur={onInputFocusOut}
                        label="Cap Amount"
                        variant="outlined"
                        margin="dense"
                        error={
                          isSubmit &&
                          Boolean(
                            validatingNumber({
                              value: cap,
                              min: CALCULATION_MIN_MAX_VALUE.cap.min,
                              max: CALCULATION_MIN_MAX_VALUE.cap.max,
                              name: 'Cap Amount',
                            })
                          )
                        }
                        helperText={
                          isSubmit &&
                          validatingNumber({
                            value: cap,
                            min: CALCULATION_MIN_MAX_VALUE.cap.min,
                            max: CALCULATION_MIN_MAX_VALUE.cap.max,
                            name: 'Cap Amount',
                          })
                        }
                      />
                    )}
                  </Grid>
                </>
              )}

              <Box my={2} width="100%">
                <Divider />
              </Box>
            </>
          )}

          <Box display="flex" flexDirection="column" width="100%" p={1.5}>
            <Box>
              <Typography variant="body1" gutterBottom>
                Timeframe
              </Typography>

              <>
                <Typography variant="caption" color="textSecondary">
                  When Should We Start/End
                </Typography>

                <Typography variant="caption" color="primary">
                  &nbsp;{name ? name : 'Name'}&nbsp;
                </Typography>

                <Typography variant="caption" color="textSecondary">
                  ($)
                </Typography>
              </>
            </Box>
          </Box>

          <Grid item xs={6}>
            <Autocomplete
              id="start_forecast"
              clearOnBlur
              fullWidth
              disableClearable
              filterOptions={(options, params) => {
                return filter(options, params);
              }}
              freeSolo
              handleHomeEndKeys
              ListboxComponent={ListboxComponent}
              onChange={handleOnChangeSelect('startForecast')}
              openOnFocus
              value={ADD_CALCULATION_START_FORECAST[startForecast]}
              options={Object.values(ADD_CALCULATION_START_FORECAST).map(
                ({ label, value }) => ({
                  label,
                  value,
                })
              )}
              renderOption={({ label }) => label}
              selectOnFocus
              getOptionLabel={({ label = '' }) => label}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Start Forecast"
                  placeholder="Start Forecast"
                  variant="outlined"
                  margin="dense"
                />
              )}
            />
          </Grid>

          <Grid item xs={4}>
            {startForecast === ADD_CALCULATION_START_FORECAST.DELAY.value && (
              <TextField
                label={'Start Month Delay'}
                id="start-month-delay"
                variant="outlined"
                margin="dense"
                name="startMonthDelay"
                fullWidth
                value={startMonthDelay}
                onChange={handleChangeInput}
                error={
                  isSubmit &&
                  Boolean(
                    validatingNumber({
                      value: startMonthDelay,
                      min: CALCULATION_MIN_MAX_VALUE.startForecastDelay.min,
                      max: CALCULATION_MIN_MAX_VALUE.startForecastDelay.max,
                      name: 'Start Month Delay',
                    })
                  )
                }
                helperText={
                  isSubmit &&
                  validatingNumber({
                    value: startMonthDelay,
                    min: CALCULATION_MIN_MAX_VALUE.startForecastDelay.min,
                    max: CALCULATION_MIN_MAX_VALUE.startForecastDelay.max,
                    name: 'Start Month Delay',
                  })
                }
              />
            )}
          </Grid>

          <Grid item xs={6}>
            <Autocomplete
              id="end_forecast"
              clearOnBlur
              fullWidth
              disableClearable
              filterOptions={(options, params) => {
                return filter(options, params);
              }}
              freeSolo
              handleHomeEndKeys
              ListboxComponent={ListboxComponent}
              onChange={handleOnChangeSelect('endForecast')}
              openOnFocus
              value={ADD_CALCULATION_END_FORECAST[endForecast]}
              options={Object.values(ADD_CALCULATION_END_FORECAST).map(
                ({ label, value }) => ({
                  label,
                  value,
                })
              )}
              renderOption={({ label }) => label}
              selectOnFocus
              getOptionLabel={({ label = '' }) => label}
              renderInput={params => (
                <TextField
                  {...params}
                  label="End Forecast"
                  placeholder="End Forecast"
                  variant="outlined"
                  margin="dense"
                />
              )}
            />
          </Grid>

          <Grid item xs={4}>
            {(endForecast === ADD_CALCULATION_END_FORECAST.DELAY.value ||
              endForecast === ADD_CALCULATION_END_FORECAST.BEFORE.value ||
              endForecast ===
                ADD_CALCULATION_END_FORECAST.MONTHS_AFTER_START_MONTH
                  .value) && (
              <TextField
                label={ADD_CALCULATION_END_FORECAST[endForecast].inputLabel}
                id="end-month-delay"
                variant="outlined"
                margin="dense"
                name="endMonthDelay"
                fullWidth
                value={endMonthDelay}
                onChange={handleChangeInput}
                error={
                  isSubmit &&
                  Boolean(
                    validatingNumber({
                      value: endMonthDelay,
                      min: CALCULATION_MIN_MAX_VALUE.endForecastDelay.min,
                      max: CALCULATION_MIN_MAX_VALUE.endForecastDelay.max,
                      name: 'End Month Delay',
                    })
                  )
                }
                helperText={
                  isSubmit &&
                  validatingNumber({
                    value: endMonthDelay,
                    min: CALCULATION_MIN_MAX_VALUE.endForecastDelay.min,
                    max: CALCULATION_MIN_MAX_VALUE.endForecastDelay.max,
                    name: 'End Month Delay',
                  })
                }
              />
            )}

            {endForecast ===
              ADD_CALCULATION_END_FORECAST.SPECIFIC_DATE.value && (
              <MuiPickersUtilsProvider utils={MomentUtils}>
                <DatePicker
                  autoOk
                  id="end-month-delay"
                  name="endMonthDelay"
                  margin="dense"
                  size="small"
                  variant="outlined"
                  inputVariant="outlined"
                  format={FISCAL_YEAR_DATE_FORMAT}
                  onChange={handleOnChangeDate}
                  value={moment(endMonthDelay)}
                  views={['year', 'month']}
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
          </Grid>
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
          onClick={handleEditConfirmation}
        >
          {isEditMode ? 'Update' : 'Add'}
        </Button>
      </Box>

      {/* Edit or save as copy  confirmation */}
      {isEditMode && confirmAction && (
        <ConfirmationModal
          showLoader={false}
          actionForCancel={String(actions.update)}
          action={String(actions.saveAsNew)}
          isOpen
          handleClose={handleCloseConfirmation}
          title={EDIT_CONFIRMATION_TITLE}
          msg={EDIT_CONFIRMATION_MSG}
          noText={EDIT_CONFIRMATION_UPDATE}
          yesText={EDIT_CONFIRMATION_SAVE_AS_NEW}
        />
      )}
    </Drawer>
  );
};

/**
 * props of component
 */
AddEditCalculation.propTypes = {
  activeGroup: number,
  isOpen: bool.isRequired,
  isUpdateMapping: bool,
  onClose: func.isRequired,
  onDone: func.isRequired,
  onSetUnsavedChanges: func.isRequired,
  ruleIndex: number,
  rules: arrayOf(shape({})),
  selectedCalculationRules: arrayOf(shape({})),
  selectedRule: shape({}),
  setSelectedCalculationRules: func.isRequired,
  setSingleRBM: func.isRequired,
  singleRBM: shape({}),
};

/**
 * defaultProps
 */
AddEditCalculation.defaultProps = {
  rules: [],
  isUpdateMapping: false,
  isOpen: false,
  onClose: () => {},
  onDone: () => {},
  selectedRule: null,
  ruleIndex: null,
  selectedCalculationRules: [],
  activeGroup: 0,
  singleRBM: {},
  onSetUnsavedChanges: () => {},
  setSingleRBM: () => {},
  setSelectedCalculationRules: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {
  setSingleRBM,
})(withStyles(styles)(AddEditCalculation));
