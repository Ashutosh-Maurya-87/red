import React, { useState } from 'react';
import { shape, func, number } from 'prop-types';
import moment from 'moment';

import {
  withStyles,
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
} from '@material-ui/core';
import {
  DeleteOutline as DeleteOutlineIcon,
  ArrowForward as ArrowForwardIcon,
} from '@material-ui/icons';

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import MomentUtils from '@date-io/moment';

import ListboxComponent from '../../../../../../components/CustomListBox';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
} from '../../../../../../configs/app';
import { PROCESS_MANAGER_MSG } from '../../../../../../configs/messages';
import { DATE_FORMAT } from '../../../configs';

import { convertStringToSQLColumn, getInputValue } from '../../../helper';

import { showErrorMsg } from '../../../../../../utils/notifications';
import { getFormattedNumberWithNegative } from '../../../../../../utils/helper/getFormattedNumber';
import getNumbersWithFirstCharSymbol from '../../../../../../utils/helper/getNumbersWithFirstCharSymbol';

import { styles } from './styles';

const filter = createFilterOptions();

function LoopupTableUpdateColumns({
  step,
  classes,
  stepNumber,
  updateStepData,
}) {
  const [isEditing, setEditing] = useState(false);
  if (!step.colsToUpdate) step.colsToUpdate = [{}];

  const setStepData = colsToUpdate => {
    step.colsToUpdate = colsToUpdate;

    updateStepData(stepNumber, step);
  };

  const addNewColumn = () => {
    if (step.colsToUpdate.length == 0) {
      step.colsToUpdate.push({});
    }

    step.colsToUpdate.push({});

    updateStepData(stepNumber, step);
  };

  const onChangeField = i => (evt, opt) => {
    const { colsToUpdate } = step;

    if (!opt) {
      colsToUpdate[i] = {};
      setStepData(colsToUpdate);
      return;
    }

    const { value, option, tableName, tableDisplayName } = opt || {};

    if (value === undefined) return;

    if (!colsToUpdate[i]) colsToUpdate.push({});

    colsToUpdate[i] = {
      ...colsToUpdate[i],
      ...option,
      tableName,
      tableDisplayName,
      target: {},
      default: '',
    };

    setStepData(colsToUpdate);
  };

  const onChangeUpdateField = i => (event, opt) => {
    const { colsToUpdate, targetTable } = step;
    if (!colsToUpdate[i]) colsToUpdate.push({});

    let isNewCol = false;
    let { value, label, tableName, tableDisplayName } = opt || {};
    const { inputValue } = opt || {};

    if (typeof opt == 'string') {
      value = convertStringToSQLColumn(opt);
      label = opt;
      isNewCol = true;
      tableName = targetTable.name;
      tableDisplayName = targetTable.display_name;
    }

    if (inputValue) {
      isNewCol = true;
      value = convertStringToSQLColumn(inputValue);
      label = inputValue;
      tableName = targetTable.name;
      tableDisplayName = targetTable.display_name;
    }

    if (isNewCol) {
      const duplicateCol = colsToUpdate.find(
        ({ target = {} }) => target.name && target.name == value
      );

      if (duplicateCol) {
        showErrorMsg(PROCESS_MANAGER_MSG.lookup_duplicate_col);
        return;
      }
    }

    colsToUpdate[i] = {
      ...colsToUpdate[i],
      default: '',
      target: {
        display_name: label,
        name: value,
        tableName,
        isNewCol,
        tableDisplayName,
      },
    };

    if (!opt) delete colsToUpdate[i].target;

    setStepData(colsToUpdate);
  };

  const onChangeTextValueDefault = (i, j) => ({ target }) => {
    const { value } = target;
    const { colsToUpdate } = step;

    if (!colsToUpdate[i]) colsToUpdate.push({});

    colsToUpdate[i] = {
      ...colsToUpdate[i],
      default: value,
    };

    setStepData(colsToUpdate);
  };

  /**
   * Disable Number formatting while user editing on Input
   */
  const onInputFocus = () => {
    setEditing(true);
  };

  /**
   * Enable Number formatting while user stop editing on Input
   */
  const onInputFocusOut = () => {
    setEditing(false);
  };

  const onChangeAmountValueDefault = (i, j) => ({ target }) => {
    const { value } = target;
    const { colsToUpdate } = step;

    if (!colsToUpdate[i]) colsToUpdate.push({});

    const validValue = String(getNumbersWithFirstCharSymbol(value, true) || '');

    colsToUpdate[i] = {
      ...colsToUpdate[i],
      default: validValue,
    };

    setStepData(colsToUpdate);
  };

  const onChangeDateValueDefault = i => date => {
    let validDate = moment(date);

    validDate = validDate.isValid() ? validDate.format(DATE_FORMAT) : '';

    const { colsToUpdate } = step;

    if (!colsToUpdate[i]) colsToUpdate.push({});

    colsToUpdate[i] = {
      ...colsToUpdate[i],
      default: validDate,
    };

    setStepData(colsToUpdate);
  };

  const onDeleteCol = i => () => {
    const { colsToUpdate } = step;

    colsToUpdate.splice(i, 1);

    setStepData(colsToUpdate);
  };

  const getTargetTableOptions = () => {
    const { targetTable = {} } = step;

    return (targetTable.columns || [])
      .filter(col => {
        const d = step.colsToUpdate.find(
          c => col.display_name == (c.target && c.target.display_name)
        );
        if (d) return false;

        return true;
      })
      .map(col => {
        return {
          label: col.display_name,
          value: col.name,
          option: col,
          tableDisplayName: targetTable.display_name,
          tableName: targetTable.name,
        };
      });
  };

  const getLookupTableOptions = () => {
    const columnOptions = [];
    const { lookupTables = [] } = step;

    lookupTables.forEach(table => {
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

  return (
    <div className={classes.root}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body1">Then Add/Update Column(s)</Typography>
      </Box>

      {step.colsToUpdate.map((col, i) => {
        const {
          display_name = '',
          data_type,
          target = {},
          tableDisplayName = '',
        } = col;

        return (
          <Grid direction="row" container key={i} alignItems="center">
            <Box mr={2} alignItems="center" display="flex">
              <Autocomplete
                label="Lookup Column"
                id={`lookup-table-update-column-${i}`}
                style={{ width: 300 }}
                value={{ label: getInputValue(tableDisplayName, display_name) }}
                openOnFocus
                selectOnFocus
                clearOnBlur
                freeSolo
                ListboxComponent={ListboxComponent}
                className={`small-select ${classes.formControl}`}
                handleHomeEndKeys
                groupBy={({ tableDisplayName = '' }) => tableDisplayName}
                options={getLookupTableOptions()}
                renderOption={option => option.label}
                getOptionDisabled={({ disabled }) => Boolean(disabled)}
                onChange={onChangeField(i)}
                getOptionLabel={({ label = '' }) => label}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Lookup Column"
                    variant="outlined"
                    error={step.isSubmit && !display_name}
                  />
                )}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);

                  return filtered;
                }}
              />
              <Box pr={1}>
                <ArrowForwardIcon fontSize="small" />
              </Box>
            </Box>
            <Box mr={2}>
              <Autocomplete
                id={`lookup-table-update-02-${i}`}
                style={{ width: 300 }}
                // value={{ label: target.display_name || '' }}
                value={{
                  label: getInputValue(
                    target.tableDisplayName,
                    target.display_name
                  ),
                }}
                selectOnFocus
                clearOnBlur
                freeSolo
                openOnFocus
                className={`small-select ${classes.formControl}`}
                handleHomeEndKeys
                ListboxComponent={ListboxComponent}
                options={getTargetTableOptions()}
                groupBy={({ tableDisplayName = '' }) => tableDisplayName}
                renderOption={({ label = '' }) => label}
                getOptionDisabled={({ option = {} }) =>
                  option.data_type && option.data_type != data_type
                }
                onChange={onChangeUpdateField(i)}
                getOptionLabel={option => {
                  // Add new option created dynamically
                  if (option.inputValue) {
                    return option.inputValue;
                  }

                  // Regular option
                  return option.label;
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Update Column"
                    variant="outlined"
                    error={step.isSubmit && !target.display_name}
                  />
                )}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);

                  // Suggest the creation of a new value
                  if (params.inputValue !== '') {
                    filtered.push({
                      inputValue: params.inputValue,
                      label: `Add "${params.inputValue}" Column`,
                    });
                  }

                  return filtered;
                }}
              />
            </Box>

            {target && target.isNewCol && (
              <Box pl={3}>
                {(data_type == COLUMN_DATA_TYPES_KEYS.alphanumeric ||
                  !data_type) && (
                  <TextField
                    className={`small-select ${classes.formControlXS}`}
                    name="default"
                    label={`Default${col.default ? '' : ' - Leave Blank'}`}
                    placeholder="Default - Leave Blank"
                    value={col.default || ''}
                    variant="outlined"
                    onChange={onChangeTextValueDefault(i)}
                    autoComplete="off"
                  />
                )}

                {data_type == COLUMN_DATA_TYPES_KEYS.amount && (
                  <TextField
                    className={`small-select ${classes.formControlXS}`}
                    name="default"
                    label={`Default${col.default ? '' : ' - Leave Blank'}`}
                    placeholder="Default - Leave Blank"
                    value={
                      !isEditing
                        ? String(
                            getFormattedNumberWithNegative({
                              value: col.default || '',
                              decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                            }) || ''
                          )
                        : String(col.default) || ''
                    }
                    variant="outlined"
                    onChange={onChangeAmountValueDefault(i)}
                    onFocus={onInputFocus}
                    onBlur={onInputFocusOut}
                    autoComplete="off"
                  />
                )}

                {data_type == COLUMN_DATA_TYPES_KEYS.date && (
                  <MuiPickersUtilsProvider utils={MomentUtils}>
                    <KeyboardDatePicker
                      className={`small-select ${classes.formControlXS}`}
                      autoOk
                      name="default"
                      id="start-date-picker"
                      variant="outlined"
                      inputVariant="outlined"
                      label={`Default${col.default ? '' : ' - Leave Blank'}`}
                      placeholder="Default - Leave Blank"
                      format={DATE_FORMAT}
                      value={(col.default && moment(col.default)) || null}
                      onChange={onChangeDateValueDefault(i)}
                      helperText=""
                      inputProps={{ disabled: true }}
                    />
                  </MuiPickersUtilsProvider>
                )}
              </Box>
            )}

            <Box>
              {step.colsToUpdate.length > 1 && (
                <IconButton onClick={onDeleteCol(i)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Grid>
        );
      })}

      <Button color="primary" onClick={addNewColumn}>
        Add / Update Column
      </Button>
    </div>
  );
}

LoopupTableUpdateColumns.propTypes = {
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(LoopupTableUpdateColumns);
