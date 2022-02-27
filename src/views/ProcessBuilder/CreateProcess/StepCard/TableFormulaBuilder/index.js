import React, { useState } from 'react';
import { shape, number, func } from 'prop-types';

import {
  withStyles,
  Box,
  Grid,
  Divider,
  Typography,
  TextField,
  Button,
  IconButton,
} from '@material-ui/core';

import CloseRoundedIcon from '@material-ui/icons/CloseRounded';

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import Spinner from '../../../../../components/Spinner';
import TableSelector from '../TableSelector';
import StepCardFooter from '../StepCardFooter';
import CalculatedField from './CalculatedField';
import CompareAndOrRelations from '../CompareAndOrRelations';
import EnglishQueryViewer from '../EnglishQueryViewer';
import ListboxComponent from '../../../../../components/CustomListBox';
import RelationshipMap from '../RelationshipMap';

import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../../configs/app';
import { showErrorMsg } from '../../../../../utils/notifications';
import {
  getColumnsOfSourceTable,
  convertStringToSQLColumn,
  getColumnsOfSourceTables,
} from '../../helper';
import { getValidFilledCompareToDataForEdit } from '../CompareAndOrRelations/helper';

import { styles } from './styles';
import './styles.scss';

const filter = createFilterOptions();

function TableFormulaBuilder({ step, classes, stepNumber, updateStepData }) {
  if (!step.colsToUpdate) step.colsToUpdate = [];

  const { formulaType } = step;

  const [isFetchingCols, toggleFetchingCols] = useState(false);

  const targetTableId = (step.targetTable && String(step.targetTable.id)) || '';
  const relatedTablesIds = (step.relatedTables || []).map(({ id }) => id);

  const setStepData = data => {
    updateStepData(stepNumber, data);
  };

  const setFormula = i => formula => {
    step.colsToUpdate[i].formula = formula;

    setStepData(step);
  };

  const addNewColumn = () => {
    step.colsToUpdate.push({});

    setStepData(step);
  };

  const onDeleteCol = i => () => {
    step.colsToUpdate.splice(i, 1);

    setStepData(step);
  };

  const handleTargetTable = async (field, value, table) => {
    toggleFetchingCols(true);

    const { columns = [], tableData = {} } = await getColumnsOfSourceTable(
      table.id
    );

    toggleFetchingCols(false);

    if (!columns.length) {
      if (table.isEditMode) {
        delete step[field];
        setStepData(step);
      }
      return;
    }

    fillColumnsData({ columns, table, field, tableData });
  };

  /**
   * Handle Multiple Related Tables
   */
  const handleRelatedTables = (name, value) => {
    step[name] = value.map(id => ({ id }));
    setStepData(step);
  };

  /**
   * Handle Done > Multiple Related Tables Selection
   */
  const doneRelatedSelection = async ({ isEditMode } = {}) => {
    toggleFetchingCols(true);
    const ids = (step.relatedTables || []).map(({ id }) => id);
    const tables = await getColumnsOfSourceTables(ids);
    toggleFetchingCols(false);

    step.relatedTables = tables.map(table => {
      return {
        ...table,
        id: String(table.id),
        columns: table.columns.map(col => ({
          ...col,
          tableName: table.name,
          tableDisplayName: table.display_name,
          data_type: col.data_type || COLUMN_DATA_TYPES_KEYS.alphanumeric,
        })),
      };
    });

    setStepData(step);

    if (targetTableId && step.targetTable.columns.length > 0 && !isEditMode) {
      const { columns } = step.targetTable;

      fillColumnsData({
        columns,
        field: 'targetTable',
        table: step.targetTable,
      });
    }
  };

  /**
   * Fill Columns Data After Select Ralated or Target Table
   */
  const fillColumnsData = ({
    columns = [],
    table = {},
    field,
    tableData = {},
  }) => {
    const colsToCompare =
      table.isEditMode &&
      Array.isArray(step.colsToCompare.data) &&
      step.colsToCompare.data.length > 0
        ? getValidFilledCompareToDataForEdit({
            step,
            tableData,
            forFormula: true,
          })
        : { data: [{}], relation: 'AND' };

    step.colsToCompare = colsToCompare;
    step.colsToUpdate = table.isEditMode
      ? getValidFilledUpdateToDataForEdit({ step, tableData })
      : [{}];

    step[field] = {
      ...(step[field] || {}),
      ...table,
      ...tableData,
      columns,
      isEditMode: false,
    };

    step.isChangeTable = true;
    setStepData(step);
  };

  const getValidFilledUpdateToDataForEdit = ({ step, tableData }) => {
    const { colsToUpdate, lookupTables = [] } = step;

    const getValidData = updateCol => {
      let { formula = [] } = updateCol;

      if (updateCol.tableName == tableData.name) {
        updateCol.tableDisplayName = tableData.display_name;
      }

      formula = formula.map(fx => {
        if (fx.key == 'FIELD' && fx.tableName == tableData.name) {
          fx.tableDisplayName = tableData.display_name;
        }

        return fx;
      });

      lookupTables.forEach(lt => {
        if (updateCol.tableName == lt.name) {
          updateCol.tableDisplayName = lt.display_name;
        }

        formula = formula.map(fx => {
          if (fx.key == 'FIELD' && fx.tableName == tableData.name) {
            fx.tableDisplayName = tableData.display_name;
          }

          return fx;
        });
      });

      updateCol.formula = formula;

      return updateCol;
    };

    return colsToUpdate.map(getValidData);
  };

  const getColumnOptions = () => {
    const { name = '', display_name = '', columns = [] } =
      step.targetTable || {};

    return columns.map(col => {
      const isNumber = col.data_type == COLUMN_DATA_TYPES_KEYS.amount;

      const selected =
        isNumber && step.colsToUpdate.find(c => c.name == col.name);

      return {
        label: col.display_name,
        value: col.name,
        option: col,
        tableName: String(name),
        tableDisplayName: String(display_name),
        isDisabled: !isNumber || Boolean(selected),
      };
    });
  };

  const onChangeField = i => (event, opt) => {
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
        showErrorMsg(PROCESS_MANAGER_MSG.translate_table_duplicate_col);
        return;
      }

      const { columns = [] } = targetTable;
      if (columns && columns[0].isNewCol) columns.shift();

      const valueToPush = {
        data_type: COLUMN_DATA_TYPES_KEYS.amount,
        display_name: label,
        name: value,
        tableName,
        tableDisplayName,
        isNewCol,
      };
      columns.unshift(valueToPush);
    }

    step.colsToUpdate[i] = {
      ...colsToUpdate[i],
      data_type: COLUMN_DATA_TYPES_KEYS.amount,
      display_name: label,
      name: value,
      tableName,
      tableDisplayName,
      isNewCol,
    };

    setStepData(step);
  };

  return (
    <>
      {isFetchingCols && <Spinner />}

      <Divider />

      <div className={classes.root}>
        <Grid direction="row" container>
          {formulaType == 'multi' && (
            <Box mr={2}>
              <TableSelector
                id="formula-related-table"
                label="Related Tables"
                value={relatedTablesIds}
                disabledTable={targetTableId}
                isUpdatePrimary={false}
                name="relatedTables"
                error={step.isSubmit && !relatedTablesIds.length}
                multiple
                onChange={handleRelatedTables}
                onCloseSelect={doneRelatedSelection}
              />
            </Box>
          )}

          <Box mr={2}>
            <TableSelector
              id="delete-clear-target-table"
              label="Target Table"
              value={targetTableId}
              name="targetTable"
              isUpdatePrimary={false}
              disabledTable={relatedTablesIds}
              onChange={handleTargetTable}
              error={step.isSubmit && !targetTableId}
            />
          </Box>
        </Grid>

        {((formulaType == 'single' && targetTableId) ||
          (formulaType == 'multi' &&
            relatedTablesIds.length > 0 &&
            targetTableId)) && (
          <>
            {formulaType != 'multi' && (
              <Box my={3}>
                <Divider />
              </Box>
            )}

            {formulaType == 'multi' && relatedTablesIds.length > 0 && (
              <>
                <RelationshipMap
                  step={step}
                  stepNumber={stepNumber}
                  isLoading={isFetchingCols}
                  setStepData={setStepData}
                  relatedTablesKey="relatedTables"
                />

                <Box mb={3} mt={2}>
                  <Divider />
                </Box>

                <CompareAndOrRelations
                  step={step}
                  stepNumber={stepNumber}
                  updateStepData={updateStepData}
                  relatedTables={step.relatedTables || []}
                />

                <Box my={3}>
                  <Divider />
                </Box>
                <Box my={2} display="flex" justifyContent="space-between">
                  <Typography variant="body1">
                    Then Add/Update Field(s)
                  </Typography>
                </Box>
              </>
            )}

            {formulaType == 'single' && (
              <>
                <Box my={2} display="flex" justifyContent="space-between">
                  <Typography variant="body1">Calculated Field(s)</Typography>
                </Box>
              </>
            )}

            {step.colsToUpdate.map((col, i) => {
              const { display_name = '', name = '' } = col;

              return (
                <Grid
                  direction="row"
                  container
                  key={i}
                  alignItems="center"
                  className="position-relative"
                >
                  <Box display="flex" alignItems="center">
                    <Autocomplete
                      openOnFocus
                      id={`single-formula-builder-${i}`}
                      style={{ width: 300 }}
                      value={{ label: display_name }}
                      selectOnFocus
                      clearOnBlur
                      freeSolo
                      className={`small-select ${classes.formControl}`}
                      name="name"
                      handleHomeEndKeys
                      ListboxComponent={ListboxComponent}
                      groupBy={({ tableDisplayName = '' }) => tableDisplayName}
                      options={getColumnOptions()}
                      renderOption={option => option.label}
                      onChange={onChangeField(i)}
                      getOptionLabel={({ label = '' }) => label}
                      getOptionDisabled={({ isDisabled }) => isDisabled}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Add or Update Field"
                          variant="outlined"
                          error={step.isSubmit && !name}
                        />
                      )}
                      filterOptions={(options, params) => {
                        const filtered = filter(options, params);

                        // Suggest the creation of a new value
                        if (params.inputValue !== '') {
                          filtered.push({
                            inputValue: params.inputValue,
                            label: `Add "${params.inputValue}"`,
                          });
                        }

                        return filtered;
                      }}
                    />
                    <Box pr={3}>=</Box>
                  </Box>

                  <CalculatedField
                    col={col}
                    step={step}
                    setFormula={setFormula(i)}
                    isSubmit={step.isSubmit}
                  />

                  <Box className="calculation-close-icon">
                    {step.colsToUpdate.length > 1 && (
                      <IconButton onClick={onDeleteCol(i)}>
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
              );
            })}

            <Button color="primary" onClick={addNewColumn}>
              Add / Update Field
            </Button>

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

TableFormulaBuilder.propTypes = {
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(TableFormulaBuilder);
