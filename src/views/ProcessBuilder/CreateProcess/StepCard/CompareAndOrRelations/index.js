/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { shape, func, arrayOf } from 'prop-types';
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

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import SingleSelect from '../SingleSelect';
import ListboxComponent from '../../../../../components/CustomListBox';

import { DATE_FORMAT, COMPARE_FIELDS, COMPARE_FIELD_KEYS } from '../../configs';
import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
} from '../../../../../configs/app';

import { getInputValue } from '../../helper';

import { getFormattedNumberWithNegative } from '../../../../../utils/helper/getFormattedNumber';
import getNumbersWithFirstCharSymbol from '../../../../../utils/helper/getNumbersWithFirstCharSymbol';

import { styles } from './styles';

const getReadKey = (i, j) => {
  return `data.${i}${j != undefined ? `.data.${j}` : ''}`;
};

const filter = createFilterOptions();
const COMPARE_TARGET_TYPES = ['Value', 'Column'];

function CompareAndOrRelations({
  step,
  stepNumber,
  updateStepData,
  classes,
  relatedTables,
}) {
  // States
  const [isMinValue, setMinValue] = useState(false);
  const [isMax, setMax] = useState(false);

  const setStepData = colsToCompare => {
    step.colsToCompare = colsToCompare;

    updateStepData(stepNumber, step);
  };

  const onChangeField = (i, j) => (evt, opt) => {
    const { value, option, tableName, tableDisplayName } = opt || {};
    if (value === undefined) return;

    const { colsToCompare } = step;

    const readKey = getReadKey(i, j);

    const colToDelete = {
      ...get(colsToCompare, readKey),
      ...option,
      tableName,
      tableDisplayName,
      value: '',
      operator: '',
      compareType: String(COMPARE_TARGET_TYPES[0]),
      compareField: {},
    };

    step.isChangeField = true;
    set(colsToCompare, readKey, colToDelete);
    setStepData(colsToCompare);
  };

  const onChangeOperator = (i, j) => (name, value) => {
    const { colsToCompare } = step;

    const readKey = getReadKey(i, j);
    const colToDelete = get(colsToCompare, readKey);

    colToDelete[name] = value;
    colToDelete.compareType = String(COMPARE_TARGET_TYPES[0]);
    colToDelete.compareField = {};

    if (value == COMPARE_FIELD_KEYS.between) {
      colToDelete.value = [];
    } else if (value == COMPARE_FIELD_KEYS.isNull) {
      colToDelete.value = true;
    } else {
      colToDelete.value = '';
    }

    step.isChangeOperator = true;
    set(colsToCompare, readKey, colToDelete);
    setStepData(colsToCompare);
  };

  const onChangeCompareField = (i, j) => (evt, opt) => {
    const { value, tableName, tableDisplayName, option = {} } = opt || {};
    const { colsToCompare } = step;

    let compareType = COMPARE_TARGET_TYPES[1];
    let compareField = {};
    const compareValue = (evt.target && evt.target.value) || '';
    const targetName = (evt.target && evt.target.name) || '';

    if (
      targetName === 'compareFieldValue' &&
      findValueFromDropList(compareValue)
    )
      return;

    if (!opt) {
      compareType = COMPARE_TARGET_TYPES[0];
    } else if (value === undefined) {
      return;
    } else {
      compareField = {
        ...option,
        tableName,
        tableDisplayName,
      };
    }

    const readKey = getReadKey(i, j);

    const colToDelete = {
      ...get(colsToCompare, readKey),
      compareType,
      compareField,
      value: compareValue || '',
    };

    step.isChangeCompareField = true;
    set(colsToCompare, readKey, colToDelete);
    setStepData(colsToCompare);
  };

  const findValueFromDropList = value => {
    const columnOptions = getTableOptions();
    const filteredValue = columnOptions.filter(
      col => getInputValue(col.tableDisplayName, col.label) == value
    );

    if (filteredValue && filteredValue.length > 0) return true;

    return false;
  };

  const onChangeTextValue = (i, j) => ({ target }) => {
    const { colsToCompare } = step;
    const { name, value } = target;

    const readKey = getReadKey(i, j);

    set(colsToCompare, `${readKey}.${name}`, value);
    setStepData(colsToCompare);
  };

  const onChangeAmountValue = (i, j) => ({ target }) => {
    const { colsToCompare } = step;
    const { name, value } = target;

    const validValue = String(getNumbersWithFirstCharSymbol(value, true) || '');

    const readKey = getReadKey(i, j);
    set(colsToCompare, `${readKey}.${name}`, validValue);

    setStepData(colsToCompare);
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

  const onChangeAmountRange = (i, j) => ({ target }) => {
    const { colsToCompare } = step;
    const { name, value } = target;

    const validValue = String(getNumbersWithFirstCharSymbol(value, true)) || '';

    let index = 0;
    if (name == 'max') index = 1;

    const readKey = getReadKey(i, j);
    set(colsToCompare, `${readKey}.value.${index}`, validValue);

    setStepData(colsToCompare);
  };

  const onChangeDateValue = (i, j, range) => date => {
    let validDate = moment(date);

    validDate = validDate.isValid() ? validDate.format(DATE_FORMAT) : '';

    const { colsToCompare } = step;

    let index = 0;
    if (range == 'max') index = 1;

    const readKey = getReadKey(i, j);
    const colToDelete = get(colsToCompare, readKey);

    if (!colToDelete.value) colToDelete.value = [];

    colToDelete.value[index] = validDate;

    set(colsToCompare, readKey, colToDelete);
    setStepData(colsToCompare);
  };

  const onDeleteCol = (i, j) => () => {
    const { colsToCompare } = step;

    if (j == undefined) {
      colsToCompare.data.splice(i, 1);
    } else {
      colsToCompare.data[i].data.splice(j, 1);

      if (colsToCompare.data[i].data.length == 0) {
        colsToCompare.data.splice(i, 1);
      }
    }

    step.isChangeField = true;
    setStepData(colsToCompare);
  };

  const addNewCondition = (i, j, relation) => () => {
    const { colsToCompare } = step;

    if (j == undefined) {
      colsToCompare.data.push({});
    } else {
      colsToCompare.data[i].data.push({});
    }

    setStepData(colsToCompare);
  };

  const addNewGroup = () => () => {
    const { colsToCompare } = step;

    const group = { data: [{}], relation: 'AND' };

    colsToCompare.data.push(group);

    setStepData(colsToCompare);
  };

  const handleRelation = (relation, i, j) => () => {
    const { colsToCompare } = step;

    if (j == undefined) {
      colsToCompare.relation = relation;
    } else {
      colsToCompare.data[i].relation = relation;
    }

    setStepData(colsToCompare);
  };

  const getTableOptions = (forTarget = false) => {
    const columnOptions = [];
    const { targetTable = {} } = step;

    const tables = forTarget
      ? [targetTable, ...relatedTables]
      : [...relatedTables, targetTable];

    tables.forEach(table => {
      (table.columns || []).forEach(col => {
        columnOptions.push({
          label: col.display_name,
          value: col.name,
          option: col,
          tableDisplayName: table.display_name,
          tableName: table.name,
        });
      });
    });

    return columnOptions;
  };

  const getConditionRow = ({ col, i, j, group = [], relation }) => {
    const {
      name = '',
      display_name = '',
      operator = '',
      data_type = '',
      value = '',
      compareField = {},
      compareType = '',
      tableName = '',
      tableDisplayName = '',
    } = col;

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
          <Autocomplete
            disableClearable
            openOnFocus
            id={`lookup-table-compare-field-${i}-${j}`}
            value={{ label: getInputValue(tableDisplayName, display_name) }}
            selectOnFocus
            clearOnBlur
            freeSolo
            ListboxComponent={ListboxComponent}
            className={`small-select ${classes.formControl}`}
            name="name"
            handleHomeEndKeys
            groupBy={({ tableDisplayName = '' }) => tableDisplayName}
            options={getTableOptions()}
            renderOption={option => option.label}
            onChange={onChangeField(i, j)}
            getOptionLabel={({ label = '' }) => label}
            renderInput={params => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select"
                error={step.isSubmit && !name}
              />
            )}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              return filtered;
            }}
          />
        </Box>
        <Box
          mr={2}
          borderRadius={5}
          bgcolor="secondary.processTable"
          className="form-control-bg"
        >
          <SingleSelect
            id={`lookup-table-compare-operator-${i}-${j}`}
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

        {operator !== COMPARE_FIELD_KEYS.equalTo && (
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
                    id={`lookup-table-compare-value-${i}-${j}`}
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
                          id={`lookup-table-compare-value-1-${i}-${j}`}
                          className={`small-select ${classes.formControlXS}`}
                          name="min"
                          variant="outlined"
                          placeholder="Min"
                          value={
                            !isMinValue
                              ? String(
                                  getFormattedNumberWithNegative({
                                    value: minValue || '',
                                    decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                                  }) || ''
                                )
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
                          id={`lookup-table-compare-value-2-${i}-${j}`}
                          className={`small-select ${classes.formControlXS}`}
                          name="max"
                          variant="outlined"
                          placeholder="Max"
                          value={
                            !isMax
                              ? String(
                                  getFormattedNumberWithNegative({
                                    value: maxValue || '',
                                    decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                                  }) || ''
                                )
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
                        id={`lookup-table-compare-value-${i}-${j}`}
                        className={`small-select ${classes.formControlXS}`}
                        name="value"
                        placeholder="Value"
                        value={
                          !isMinValue
                            ? String(
                                getFormattedNumberWithNegative({
                                  value,
                                  decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                                }) || ''
                              )
                            : String(value) || ''
                        }
                        onFocus={onInputFocus}
                        onBlur={onInputFocusOut}
                        variant="outlined"
                        onChange={onChangeAmountValue(i, j)}
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
                        id={`lookup-table-compare-value-1-${i}-${j}`}
                        variant="outlined"
                        inputVariant="outlined"
                        format={DATE_FORMAT}
                        value={(value[0] && moment(value[0])) || null}
                        onChange={onChangeDateValue(i, j, 'min')}
                        helperText=""
                        inputProps={{ disabled: true }}
                        error={step.isSubmit && !value[0]}
                        placeholder={
                          operator == COMPARE_FIELD_KEYS.between
                            ? 'From'
                            : 'Date'
                        }
                      />
                    </MuiPickersUtilsProvider>

                    {operator == COMPARE_FIELD_KEYS.between && (
                      <MuiPickersUtilsProvider utils={MomentUtils}>
                        <KeyboardDatePicker
                          className={`small-select ${classes.formControlXS}`}
                          autoOk
                          name="max"
                          id={`lookup-table-compare-value-2-${i}-${j}`}
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
        )}

        {operator == COMPARE_FIELD_KEYS.equalTo && (
          <Box>
            <Autocomplete
              value={{
                label:
                  compareType == COMPARE_TARGET_TYPES[0]
                    ? value
                    : getInputValue(
                        compareField.tableDisplayName,
                        compareField.display_name
                      ),
              }}
              openOnFocus
              disableClearable
              selectOnFocus
              clearOnBlur
              freeSolo
              id={`lookup-table-compare-value-type-2-${i}-${j}`}
              className={`small-select ${classes.formControl}`}
              name="compareField"
              handleHomeEndKeys
              ListboxComponent={ListboxComponent}
              groupBy={({ tableDisplayName = '' }) => tableDisplayName}
              options={getTableOptions(true)}
              renderOption={option => option.label}
              onChange={onChangeCompareField(i, j)}
              getOptionLabel={({ label = '' }) => label}
              getOptionDisabled={({
                option = {},
                tableName: tableNameOpt = '',
              }) => {
                return (
                  (option.data_type && option.data_type != data_type) ||
                  (tableName == tableNameOpt && name == option.name)
                );
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Value"
                  name="compareFieldValue"
                  onBlur={onChangeCompareField(i, j)}
                  error={step.isSubmit && !compareField.name && !value}
                />
              )}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                return filtered;
              }}
            />
          </Box>
        )}

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
          {(step.colsToCompare.data.length > 1 || group.length > 1) && (
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
    if (i >= step.colsToCompare.data.length - 1 && j == undefined) return null;

    return (
      <Box mr={1}>
        <ToggleButtonGroup size="small" className="toggle-group">
          <ToggleButton
            value="left"
            aria-label="left aligned"
            onClick={handleRelation('AND', i, j)}
            selected={relation == 'AND'}
          >
            And
          </ToggleButton>
          <ToggleButton
            value="center"
            aria-label="centered"
            onClick={handleRelation('OR', i, j)}
            selected={relation == 'OR'}
          >
            Or
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    );
  };

  const { relation = 'AND' } = step.colsToCompare;

  return (
    <Box>
      <Box>
        {step.colsToCompare.data.map((group, i) => {
          return (
            <Box
              key={`group-${i}`}
              className={`group-row-wrapper ${
                step.colsToCompare.data.length > 1 ? 'relation-border' : ''
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

CompareAndOrRelations.propTypes = {
  relatedTables: arrayOf(shape({})).isRequired,
  step: shape({}).isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(CompareAndOrRelations);
