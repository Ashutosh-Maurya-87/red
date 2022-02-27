import React, { useState } from 'react';
import { shape, func, number } from 'prop-types';
import { get } from 'lodash';

import {
  withStyles,
  FormControlLabel,
  Checkbox,
  Box,
  Grid,
  Divider,
  Typography,
  IconButton,
  TextField,
  Button,
} from '@material-ui/core';

import {
  DeleteOutline as DeleteOutlineIcon,
  ArrowRightAlt as ArrowRightAltIcon,
  DragIndicator as DragIndicatorIcon,
} from '@material-ui/icons';

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import EnglishQueryViewer from '../EnglishQueryViewer';
import ListboxComponent from '../../../../../components/CustomListBox';
import Spinner from '../../../../../components/Spinner';
import TableSelector from '../TableSelector';
import StepCardFooter from '../StepCardFooter';
import SingleSelect from '../SingleSelect';

import {
  COLUMN_DATA_TYPES,
  COLUMN_DATA_TYPES_KEYS,
} from '../../../../../configs/app';
import {
  ERROR_MESSAGES,
  PROCESS_MANAGER_MSG,
} from '../../../../../configs/messages';
import { DEFAULT_COPY_APPEND_ROW, NEW_FIELD } from '../../configs';

import { showErrorMsg } from '../../../../../utils/notifications';
import { validateName } from '../../../../../utils/helper/validateName';
import {
  convertStringToSQLColumn,
  getColumnsOfSourceTable,
} from '../../helper';

import { styles } from './styles';
import './styles.scss';

const filter = createFilterOptions();

function CopyAppendData({ step, classes, stepNumber, updateStepData }) {
  const [isFetchingCols, toggleFetchingCols] = useState(false);

  const sourceTableId = step.sourceTable.id || '';
  const targetTableId = step.targetTable.id || '';
  const targetTableName = step.targetTable.display_name || '';

  const setStepData = data => {
    updateStepData(stepNumber, data);
  };

  /**
   * Handle Input Change > Dimension Name
   *
   * @param {Object}
   */
  const handleInput = ({ target: { value } }, i) => {
    step.sourceTable.columns[i].display_name = value;
    step.sourceTable.columns[i].name = value;

    setStepData(step);
  };

  const handleSourceTable = (name, value, table) => {
    fetchColumns(table, name);
  };

  const handleTargetTable = (name, value, table) => {
    if (table && table.isCreateTable) {
      step[name] = {
        ...(step[name] || {}),
        id: table.id,
        name: value,
        display_name: value,
        columns: [],
      };

      cloneSourceColToDesCol(step, [], 'targetTable');
      return;
    }

    setTimeout(() => {
      fetchColumns(table, name);
    }, 100);
  };

  const cloneSourceColToDesCol = (step, columns, field) => {
    const modifiedSoureTableCol = step.sourceTable.columns.map(opt => {
      delete opt.isNewCol;

      const isBothMatched = columns.find(
        item =>
          (item.name == opt.name || item.name == opt.targetField) &&
          (item.data_type == opt.data_type || item.data_type == opt.newDataType)
      );

      if (isBothMatched == undefined) {
        opt.isNewCol = true;
        opt.isMatched = false;

        if (!opt.targetFieldLabel) {
          opt.targetFieldLabel = opt.display_name;
        }
      }

      if (!opt.targetField || !opt.targetFieldLabel) {
        opt.targetField = opt.name;
        opt.targetFieldLabel = opt.display_name;
        opt.isNewCol = true;
      }

      return opt;
    });

    if (modifiedSoureTableCol && modifiedSoureTableCol.length > 0) {
      step.sourceTable.columns = [...modifiedSoureTableCol];
    }

    if (step.newRows != null && step.newRows.length > 0) {
      mergeNewRow();
    }

    setStepData(step);
  };

  const fetchColumns = async (table, field) => {
    if (step[field] && table == step[field].id) return;

    toggleFetchingCols(true);

    const { columns = [], tableData = {} } = await getColumnsOfSourceTable(
      table.id
    );

    toggleFetchingCols(false);

    if (!columns.length) {
      if (table.isEditMode) {
        step[field] = {};
        setStepData(step);
      }
      return;
    }

    const data = step;
    data[field] = {
      ...(step[field] || {}),
      ...table,
      ...tableData,
      columns,
    };

    const isBothSelected = ['sourceTable', 'targetTable'].filter(name => {
      return (get(data, `${name}.columns`) || []).length > 0;
    });

    if (isBothSelected.length == 2) {
      const sourceCols = getMappedColumns(
        data.sourceTable.columns,
        data.targetTable.columns,
        { isEditMode: table.isEditMode }
      );

      data.sourceTable.columns =
        sourceCols.length > 0 ? sourceCols : data.sourceTable.columns;

      if (table.isEditMode) {
        delete data.new_columns;
        delete data.data_mapping;
      }
    }

    cloneSourceColToDesCol(data, columns, field);
  };

  const getMappedColumns = (
    sourceColumns,
    targetColumns,
    { isEditMode = false } = {}
  ) => {
    const from = [];

    sourceColumns.forEach(col => {
      if (!isEditMode) {
        const mappingDisplayName = String(col.display_name || '')
          .trim()
          .toLowerCase();

        const targetObj = targetColumns.find(
          ({ display_name = '' }) =>
            display_name.trim().toLowerCase() == mappingDisplayName
        );

        col.targetField = (targetObj && targetObj.name) || '';
        col.targetFieldLabel = (targetObj && targetObj.display_name) || '';
        col.isMatched = Boolean(targetObj);

        from.push(col);
      }

      if (isEditMode) {
        const { data_mapping = {}, new_columns = [] } = step;

        if (data_mapping[col.name] != undefined) {
          col.targetField = data_mapping[col.name] || col.name || '';

          const newCol = new_columns.find(
            ({ name }) => name == col.targetField
          );

          col.newDataType = (newCol && newCol.data_type) || col.data_type;
          col.isMatched = !newCol;

          if (newCol) col.targetFieldLabel = newCol.new_name || '';

          if (!newCol) {
            const targetObj = targetColumns.find(
              ({ name }) => name == col.targetField
            );

            col.targetFieldLabel = (targetObj && targetObj.display_name) || '';
          }

          from.push(col);
        }
      }
    });

    return from;
  };

  const getTargetTableColumns = header => {
    const options = step.targetTable.columns.map(opt => {
      const { data_type } = opt || {};
      let disabled = true;

      // match source and destination field data type
      if (header.data_type == data_type) {
        disabled = false;
      }

      return {
        label: opt.display_name,
        value: opt.name,
        option: opt,
        disabled,
      };
    });

    return options;
  };

  const onChangeTargetField = i => (event, selectedValue) => {
    if (selectedValue == null) return;

    const col = step.sourceTable.columns[i];
    if (!col) return;

    let { value, label } = selectedValue;
    let isNewCol = false;

    if (typeof selectedValue == 'string') {
      isNewCol = true;
      value = convertStringToSQLColumn(selectedValue);
      label = selectedValue;
    }

    if (selectedValue.inputValue) {
      isNewCol = true;
      value = convertStringToSQLColumn(selectedValue.inputValue);
      label = selectedValue.inputValue;
    }

    if (isNewCol) {
      const duplicateCol = step.sourceTable.columns.find(
        ({ targetField }) => targetField == value
      );

      if (duplicateCol) {
        showErrorMsg(PROCESS_MANAGER_MSG.append_duplicate_column);
        return;
      }
    }

    const targetObj = step.targetTable.columns.find(
      ({ name }) => name == value
    );

    col.targetField = value;
    col.targetFieldLabel = label;
    col.isMatched = Boolean(targetObj);
    col.isNewCol = isNewCol;
    col.newDataType = col.datat_type;

    step.sourceTable.columns[i] = col;

    setStepData(step, targetObj);
  };

  const onChangeDataType = i => (name, value) => {
    if (!step.sourceTable.columns[i]) return;

    step.sourceTable.columns[i][name] = value;

    setStepData(step);
  };

  const onDeleteHeader = i => () => {
    if (!step.sourceTable.columns[i]) return;

    step.sourceTable.columns.splice(i, 1);

    setStepData(step);
  };

  const toggleCreateNewTable = ({ target = {} }) => {
    step.isNewTable = target.checked;

    setStepData(step);
  };

  /**
   *
   * @param {String || Number} i
   * @returns
   */
  const onKeyDownDestination = i => event => {
    switch (event.key) {
      case 'Tab': {
        const inputValue = event.target.value || '';
        const targetName = step.sourceTable.columns[i].display_name || '';

        if (inputValue.length > 0 && targetName != inputValue) {
          const optionObj = {
            inputValue,
            label: `Add "${inputValue}"`,
          };
          onChangeTargetField(i)(event, optionObj);
        }
        break;
      }
      default:
        break;
    }
  };

  /**
   * Disable dropdown options as per data type of Source table
   */
  const applyDataTypeRules = ({ data_type }) => {
    const dataTypes = JSON.parse(JSON.stringify(COLUMN_DATA_TYPES));

    dataTypes.forEach(type => {
      // In case of alphanumeric
      if (
        data_type == COLUMN_DATA_TYPES_KEYS.alphanumeric &&
        type.value != COLUMN_DATA_TYPES_KEYS.alphanumeric
      ) {
        type.disabled = true;
      }

      // In case of date
      if (
        data_type == COLUMN_DATA_TYPES_KEYS.date &&
        type.value == COLUMN_DATA_TYPES_KEYS.amount
      ) {
        type.disabled = true;
      }

      // In case of Amount
      if (
        data_type == COLUMN_DATA_TYPES_KEYS.amount &&
        type.value == COLUMN_DATA_TYPES_KEYS.date
      ) {
        type.disabled = true;
      }

      return type;
    });

    return dataTypes || [];
  };

  /**
   * Add New Row
   */
  const addRow = () => {
    const newRow = { ...DEFAULT_COPY_APPEND_ROW };

    step.sourceTable.columns.push(newRow);

    setStepData(step);
  };

  const mergeNewRow = () => {
    step.newRows.forEach(row => {
      const newRows = {
        display_name: row.source_value || '',
        data_type: row.data_type || '',
        targetFieldLabel: row.display_name || '',
        isNewCol: false,
        isNewRow: true,
        isMatched: true,
        targetField: row.column_name,
      };

      step.sourceTable.columns.push(newRows);
    });

    setStepData(step);
  };

  return (
    <>
      {isFetchingCols && <Spinner />}

      <Divider />

      <div className={classes.root}>
        <Grid direction="row" container>
          <Box mr={2}>
            <TableSelector
              id="copy-source-table"
              label="Copy From"
              value={sourceTableId}
              isUpdatePrimary={false}
              disabledTable={targetTableId}
              name="sourceTable"
              onChange={handleSourceTable}
              error={step.isSubmit && !sourceTableId}
            />
          </Box>
          <Box>
            <TableSelector
              id="copy-target-table"
              label="Paste Into"
              value={targetTableId}
              disabledTable={sourceTableId}
              name="targetTable"
              onChange={handleTargetTable}
              isUpdatePrimary={false}
              error={
                (step.isSubmit && !targetTableId) ||
                (step.isSubmit && !validateName(targetTableName))
              }
              isCreateTable
              inputValue={step.targetTable.display_name}
            />
          </Box>

          {targetTableId && targetTableId === 'NEW' && (
            <Box display="flex" justifyItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    value="remember"
                    color="primary"
                    checked={step.isNewTable}
                    onChange={toggleCreateNewTable}
                  />
                }
                label="Create new table every time"
              />
            </Box>
          )}
        </Grid>

        {sourceTableId && targetTableId && (
          <>
            <Box my={3}>
              <Divider />
            </Box>

            <Box className="copy-table" mb={2}>
              <Grid direction="row" container>
                <Grid item xs={3} container direction="row" alignItems="center">
                  <Box ml={5}>
                    <Typography variant="body1" color="textSecondary">
                      Source Table Field Name
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3} container direction="row" alignItems="center">
                  <Box ml={1}>
                    <Typography variant="body1" color="textSecondary">
                      Data Type
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3} container direction="row" alignItems="center">
                  <Box>
                    <Typography variant="body1" color="textSecondary">
                      Destination Field Name
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3} container direction="row" alignItems="center">
                  <Box>
                    <Typography variant="body1" color="textSecondary">
                      Data Type
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {step.sourceTable.columns.map((header, i) => {
              return (
                <Box
                  borderRadius={4}
                  className="copy-table"
                  mb={2}
                  bgcolor="secondary.processTable"
                  key={i}
                >
                  <Grid
                    direction="row"
                    container
                    className="create-dialog-grid"
                  >
                    <Grid
                      item
                      xs={3}
                      container
                      direction="row"
                      alignItems="center"
                    >
                      {false && <DragIndicatorIcon />}
                      <Box ml={1}>{`#${i + 1}`}</Box>
                      <Box ml={1}>
                        {!header.isNewRow && (
                          <Typography variant="body1" color="textSecondary">
                            {header.display_name}
                          </Typography>
                        )}
                        {header.isNewRow && (
                          <TextField
                            name="newName"
                            value={header.display_name}
                            onChange={event => handleInput(event, i)}
                            required
                            autoComplete="off"
                            autoFocus
                            fullWidth
                            placeholder="Add New Value"
                            error={step.isSubmit && !header.display_name}
                            helperText={
                              step.isSubmit &&
                              !header.display_name &&
                              ERROR_MESSAGES.required
                            }
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      container
                      direction="row"
                      alignItems="center"
                    >
                      <Box ml={1} style={{ textTransform: 'capitalize' }}>
                        {!header.isNewRow && (
                          <Typography variant="body1" color="textSecondary">
                            {header.data_type}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid
                      item
                      xs={1}
                      container
                      alignItems="center"
                      justify="flex-start"
                    >
                      <ArrowRightAltIcon />
                    </Grid>
                    <Grid
                      item
                      xs={3}
                      container
                      alignItems="center"
                      className="border-form-input"
                    >
                      <Autocomplete
                        openOnFocus
                        disableClearable
                        id={`target-table-field-${step.targetTable.name}-${i}`}
                        className={`copy-table-autocomplete ${
                          header.isNewCol ? 'copy-table-new-tag' : ''
                        }`}
                        value={{ label: header.targetFieldLabel || '' }}
                        selectOnFocus
                        clearOnBlur
                        freeSolo
                        handleHomeEndKeys
                        ListboxComponent={ListboxComponent}
                        options={getTargetTableColumns(header)}
                        renderOption={option => option.label}
                        getOptionDisabled={({ disabled }) => Boolean(disabled)}
                        onChange={onChangeTargetField(i)}
                        getOptionLabel={option => {
                          // Add "xxx" option created dynamically
                          if (option.inputValue) {
                            return option.inputValue;
                          }

                          // Regular option
                          return option.label;
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            placeholder={NEW_FIELD}
                            onKeyDown={onKeyDownDestination(i)}
                            variant="standard"
                            error={step.isSubmit && !header.targetFieldLabel}
                            helperText={
                              step.isSubmit &&
                              !header.targetFieldLabel &&
                              ERROR_MESSAGES.required
                            }
                          />
                        )}
                        filterOptions={(options, params) => {
                          const filtered = filter(options, params);

                          // Suggest the creation of a new value
                          if (params.inputValue !== '') {
                            filtered.push({
                              inputValue: params.inputValue,
                              isNewAdd: true,
                              label: `Add "${params.inputValue}"`,
                            });
                          }

                          return filtered;
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      container
                      alignItems="center"
                      className="border-form-input"
                    >
                      <SingleSelect
                        variant="standard"
                        id="copy-data-type"
                        value={header.newDataType || header.data_type || ''}
                        name="newDataType"
                        disabled={!header.isNewCol}
                        options={applyDataTypeRules(header)}
                        onChange={onChangeDataType(i)}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={1}
                      container
                      direction="row"
                      justify="flex-end"
                    >
                      {step.sourceTable.columns.length > 1 && (
                        <IconButton onClick={onDeleteHeader(i)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              );
            })}

            <Box mr={2}>
              <Button size="small" color="primary" onClick={addRow}>
                + New Row
              </Button>
            </Box>

            <EnglishQueryViewer step={step} />
          </>
        )}

        <StepCardFooter
          step={step}
          stepNumber={stepNumber}
          updateStepData={updateStepData}
        />
      </div>
    </>
  );
}

CopyAppendData.propTypes = {
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(CopyAppendData);
