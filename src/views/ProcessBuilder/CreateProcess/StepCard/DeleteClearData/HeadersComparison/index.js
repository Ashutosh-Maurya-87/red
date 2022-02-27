/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { shape, func } from 'prop-types';
import moment from 'moment';
import { get, set } from 'lodash';

import {
  withStyles,
  Box,
  Grid,
  IconButton,
  TextField,
  Button,
} from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { DeleteOutline as DeleteOutlineIcon } from '@material-ui/icons';

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

import MomentUtils from '@date-io/moment';

import SingleSelect from '../../SingleSelect';

import {
  DATE_FORMAT,
  COMPARE_FIELDS,
  COMPARE_FIELD_KEYS,
} from '../../../configs';
import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
} from '../../../../../../configs/app';

import { getFormattedNumberWithNegative } from '../../../../../../utils/helper/getFormattedNumber';
import getNumbersWithFirstCharSymbol from '../../../../../../utils/helper/getNumbersWithFirstCharSymbol';

import { styles } from './styles';

const getReadKey = (i, j) => {
  return `data.${i}${j != undefined ? `.data.${j}` : ''}`;
};
function HeadersComparison({ step, stepNumber, updateStepData, classes }) {
  const [isMinValue, setMinValue] = useState(false);
  const [isMax, setMax] = useState(false);

  const headers = step.targetTable.columns || [];

  const setStepData = colsToDelete => {
    step.colsToDelete = colsToDelete;

    updateStepData(stepNumber, step);
  };

  const onChangeField = (i, j) => (name, value, column) => {
    const { colsToDelete } = step;

    const readKey = getReadKey(i, j);

    const colToDelete = {
      ...get(colsToDelete, readKey),
      ...column,
      value: '',
      operator: '',
    };

    set(colsToDelete, readKey, colToDelete);
    setStepData(colsToDelete);
  };

  const onChangeOperator = (i, j) => (name, value) => {
    const { colsToDelete } = step;

    const readKey = getReadKey(i, j);
    const colToDelete = get(colsToDelete, readKey);

    colToDelete[name] = value;

    if (value == COMPARE_FIELD_KEYS.between) {
      colToDelete.value = [];
    } else if (value == COMPARE_FIELD_KEYS.isNull) {
      colToDelete.value = true;
    } else {
      colToDelete.value = '';
    }

    set(colsToDelete, readKey, colToDelete);
    setStepData(colsToDelete);
  };

  const onChangeTextValue = (i, j) => ({ target }) => {
    const { colsToDelete } = step;
    const { name, value } = target;

    const readKey = getReadKey(i, j);
    set(colsToDelete, `${readKey}.${name}`, value);

    setStepData(colsToDelete);
  };

  /**
   * On focus when user starts edit
   */
  const onInputFocus = ({ target = {} }) => {
    const { name = '' } = target || {};

    if (name == 'value' || name == 'min') setMinValue(true);
    if (name == 'max') setMax(true);
  };

  /**
   * On Focus out- when user click outside the input box
   */
  const onInputFocusOut = ({ target = {} }) => {
    const { name = '' } = target || {};

    if (name == 'value' || name == 'min') setMinValue(false);
    if (name == 'max') setMax(false);
  };

  const onChangeAmountValue = (i, j) => ({ target }) => {
    const { colsToDelete } = step;
    const { name, value = '' } = target;
    const validValue = String(getNumbersWithFirstCharSymbol(value, true)) || '';

    const readKey = getReadKey(i, j);
    set(colsToDelete, `${readKey}.${name}`, validValue);

    setStepData(colsToDelete);
  };

  const onChangeAmountRange = (i, j) => ({ target }) => {
    const { colsToDelete } = step;
    const { name, value = '' } = target;

    const validValue = String(getNumbersWithFirstCharSymbol(value, true)) || '';

    let index = 0;
    if (name == 'max') index = 1;

    const readKey = getReadKey(i, j);
    set(colsToDelete, `${readKey}.value.${index}`, validValue);

    setStepData(colsToDelete);
  };

  const onChangeDateValue = (i, j, range) => date => {
    let validDate = moment(date);

    validDate = validDate.isValid() ? validDate.format(DATE_FORMAT) : '';

    const { colsToDelete } = step;

    let index = 0;
    if (range == 'max') index = 1;

    const readKey = getReadKey(i, j);
    const colToDelete = get(colsToDelete, readKey);

    if (!colToDelete.value) colToDelete.value = [];

    colToDelete.value[index] = validDate;

    set(colsToDelete, readKey, colToDelete);
    setStepData(colsToDelete);
  };

  const onDeleteCol = (i, j) => () => {
    const { colsToDelete } = step;

    if (j == undefined) {
      colsToDelete.data.splice(i, 1);
    } else {
      colsToDelete.data[i].data.splice(j, 1);

      if (colsToDelete.data[i].data.length == 0) {
        colsToDelete.data.splice(i, 1);
      }
    }

    setStepData(colsToDelete);
  };

  const addNewCondition = (i, j, relation) => () => {
    const { colsToDelete } = step;

    if (j == undefined) {
      colsToDelete.data.push({});
    } else {
      colsToDelete.data[i].data.push({});
    }

    setStepData(colsToDelete);
  };

  const addNewGroup = () => () => {
    const { colsToDelete } = step;

    const group = { data: [{}], relation: 'AND' };

    colsToDelete.data.push(group);

    setStepData(colsToDelete);
  };

  const getFieldNameOptions = col => {
    // .filter(header => {
    //   if (col.name == header.name) return true;

    //   const d = step.colsToDelete.find(c => c.name == header.name);
    //   if (d) return false;

    //   return true;
    // })

    return headers.map(header => {
      return {
        label: header.display_name,
        value: header.name,
        option: header,
      };
    });
  };

  const handleRelation = (relation, i, j, isDisabled) => () => {
    if (isDisabled) return;

    const { colsToDelete } = step;

    if (j == undefined) {
      colsToDelete.relation = relation;
    } else {
      colsToDelete.data[i].relation = relation;
    }

    setStepData(colsToDelete);
  };

  const getConditionRow = ({ col, i, j, group = [], relation }) => {
    const { name = '', operator = '', value = '' || [], data_type } = col;
    const fieldValue = typeof value == 'boolean' ? [] : value;

    const [minValue = '', maxValue = ''] = fieldValue || [];

    return (
      <Grid
        direction="row"
        container
        alignItems="center"
        key={`${i} - ${j}`}
        className={j != undefined && group.length > 1 ? 'relation-border' : ''}
      >
        <Box>
          <SingleSelect
            id="delete-clear-target-table-action"
            label=""
            value={(headers.length && name) || ''}
            name="name"
            options={getFieldNameOptions(col)}
            onChange={onChangeField(i, j)}
            error={step.isSubmit && !name}
            displayEmpty
            defaultValue=""
          />
        </Box>
        <Box
          mr={2}
          borderRadius={5}
          bgcolor="secondary.processTable"
          className="form-control-bg"
        >
          <SingleSelect
            id="delete-clear-target-table-action"
            value={operator}
            name="operator"
            disabled={!data_type}
            options={COMPARE_FIELDS[data_type] || []}
            onChange={onChangeOperator(i, j)}
            error={step.isSubmit && !operator}
            displayEmpty
            defaultValue=""
          />
        </Box>
        <Box>
          {operator == COMPARE_FIELD_KEYS.isNull ||
          operator == COMPARE_FIELD_KEYS.isNotNull ? (
            <div />
          ) : (
            <>
              {(data_type == COLUMN_DATA_TYPES_KEYS.alphanumeric ||
                !data_type) && (
                <TextField
                  className={`small-select ${classes.formControlXS}`}
                  name="value"
                  placeholder="Value"
                  value={value}
                  variant="outlined"
                  onChange={onChangeTextValue(i, j)}
                  error={step.isSubmit && !value}
                  autoComplete="off"
                />
              )}

              {data_type == COLUMN_DATA_TYPES_KEYS.amount && (
                <>
                  {operator == COMPARE_FIELD_KEYS.between ? (
                    <>
                      <TextField
                        className={`small-select ${classes.formControlXS}`}
                        name="min"
                        variant="outlined"
                        placeholder="Min"
                        value={
                          !isMinValue
                            ? getFormattedNumberWithNegative({
                                value: minValue,
                                decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                              }) || ''
                            : minValue || ''
                        }
                        onChange={onChangeAmountRange(i, j)}
                        onFocus={onInputFocus}
                        onBlur={onInputFocusOut}
                        style={{ width: '40%' }}
                        error={step.isSubmit && !minValue}
                        autoComplete="off"
                      />

                      <TextField
                        className={`small-select ${classes.formControlXS}`}
                        name="max"
                        variant="outlined"
                        placeholder="Max"
                        value={
                          !isMax
                            ? getFormattedNumberWithNegative({
                                value: maxValue,
                                decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                              }) || ''
                            : maxValue || ''
                        }
                        onChange={onChangeAmountRange(i, j)}
                        onFocus={onInputFocus}
                        onBlur={onInputFocusOut}
                        style={{ width: '40%' }}
                        error={step.isSubmit && !maxValue}
                        autoComplete="off"
                      />
                    </>
                  ) : (
                    <TextField
                      className={`small-select ${classes.formControlXS}`}
                      name="value"
                      placeholder="Value"
                      variant="outlined"
                      value={
                        !isMinValue
                          ? String(
                              getFormattedNumberWithNegative({
                                value,
                                decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                              })
                            ) || ''
                          : String(value) || ''
                      }
                      onChange={onChangeAmountValue(i, j)}
                      onFocus={onInputFocus}
                      onBlur={onInputFocusOut}
                      error={step.isSubmit && !value}
                      autoComplete="off"
                    />
                  )}
                </>
              )}

              {data_type == COLUMN_DATA_TYPES_KEYS.date && (
                <>
                  <MuiPickersUtilsProvider utils={MomentUtils}>
                    <KeyboardDatePicker
                      className={`small-select ${classes.formControlXS}`}
                      autoOk
                      name="min"
                      id="start-date-picker"
                      variant="outlined"
                      inputVariant="outlined"
                      format={DATE_FORMAT}
                      value={(value[0] && moment(value[0])) || null}
                      onChange={onChangeDateValue(i, j, 'min')}
                      helperText=""
                      inputProps={{ disabled: true }}
                      error={step.isSubmit && !value[0]}
                      placeholder={
                        operator == COMPARE_FIELD_KEYS.between ? 'From' : 'Date'
                      }
                    />
                  </MuiPickersUtilsProvider>

                  {operator == COMPARE_FIELD_KEYS.between && (
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                      <KeyboardDatePicker
                        className={`small-select ${classes.formControlXS}`}
                        autoOk
                        name="max"
                        id="end-date-picker"
                        variant="outlined"
                        inputVariant="outlined"
                        format={DATE_FORMAT}
                        value={(value[1] && moment(value[1])) || null}
                        onChange={onChangeDateValue(i, j, 'max')}
                        helperText=""
                        inputProps={{ disabled: true }}
                        error={step.isSubmit && !value[1]}
                        placeholder="To"
                      />
                    </MuiPickersUtilsProvider>
                  )}
                </>
              )}
            </>
          )}
        </Box>

        {i >= 0 && (j == undefined || (j >= 0 && j < group.length - 1)) && (
          <Box>
            {getRelationActions({
              i,
              j,
              relation,
            })}
          </Box>
        )}

        <Box>
          {(step.colsToDelete.data.length > 1 || group.length > 1) && (
            <IconButton onClick={onDeleteCol(i, j)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Grid>
    );
  };

  const getGroup = ({ group, i }) => {
    const { data = [], relation = 'AND' } = group || {};

    return (
      <Box className="group-box" rounded={5} py={1} px={2} my={1}>
        <Box ml={2}>
          {data.map((col, j) => {
            return getConditionRow({ col, i, j, group: data, relation });
          })}
        </Box>

        <Box display="inline" ml={2}>
          <Button color="primary" onClick={addNewCondition(i, 0, relation)}>
            Add Condition
          </Button>
        </Box>
      </Box>
    );
  };

  const getRelationActions = ({ i, j, relation }) => {
    const isDisabled = i >= step.colsToDelete.data.length - 1 && j == undefined;

    if (isDisabled) return null;

    return (
      <Box mr={1}>
        <ToggleButtonGroup size="small" className="toggle-group">
          <ToggleButton
            value="left"
            aria-label="left aligned"
            onClick={handleRelation('AND', i, j, isDisabled)}
            selected={!isDisabled && relation == 'AND'}
          >
            And
          </ToggleButton>
          <ToggleButton
            value="center"
            aria-label="centered"
            onClick={handleRelation('OR', i, j, isDisabled)}
            selected={!isDisabled && relation == 'OR'}
          >
            Or
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    );
  };

  const { relation = 'AND' } = step.colsToDelete;

  return (
    <Box>
      <Box>
        {step.colsToDelete.data.map((group, i) => {
          return (
            <Box
              key={`group-${i}`}
              className={`group-row-wrapper ${
                step.colsToDelete.data.length > 1 ? 'relation-border' : ''
              }`}
            >
              {Array.isArray(group.data) ? (
                <Box className="group-wrapper">
                  <Box display="flex" alignItems="flex-end">
                    {getGroup({ group, i })}
                    <Box ml={2} mb={1}>
                      {getRelationActions({ i, relation })}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box className="row-wrapper">
                  {getConditionRow({ col: group, i, relation })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box mt={1}>
        <Box display="inline">
          <Button
            color="primary"
            onClick={addNewCondition(0, undefined, relation)}
          >
            Add Condition
          </Button>
        </Box>
        <Box ml={2} display="inline">
          <Button color="primary" onClick={addNewGroup(0, 0)}>
            Add Group
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

HeadersComparison.propTypes = {
  step: shape({}).isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(HeadersComparison);
