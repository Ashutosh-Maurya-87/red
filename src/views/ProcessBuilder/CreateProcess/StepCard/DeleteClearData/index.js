import React, { useState } from 'react';
import { shape, number, func } from 'prop-types';

import {
  withStyles,
  Box,
  Grid,
  Divider,
  Typography,
  FormLabel,
} from '@material-ui/core';

import Spinner from '../../../../../components/Spinner';
import TableSelector from '../TableSelector';
import ColumnSelector from '../ColumnSelector';
import StepCardFooter from '../StepCardFooter';
import SingleSelect from '../SingleSelect';
import HeadersComparison from './HeadersComparison';
import EnglishQueryViewer from '../EnglishQueryViewer';

import { DELETE_TYPE_ACTIONS, DELETE_TYPE_ACTION_KEYS } from '../../configs';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';

import { getColumnsOfSourceTable } from '../../helper';

import { styles } from './styles';
import './styles.scss';

function DeleteClearData({ step, classes, stepNumber, updateStepData }) {
  const [isFetchingCols, toggleFetchingCols] = useState(false);
  const targetTableId = (step.targetTable && String(step.targetTable.id)) || '';

  if (!step.dropColumns) step.dropColumns = [];

  const setStepData = data => {
    updateStepData(stepNumber, data);
  };

  const handleTargetTable = async (field, value, table) => {
    if (!table?.id) return;

    if (isFetchingCols) return;

    toggleFetchingCols(true);

    const { columns = [], tableData = {} } = await getColumnsOfSourceTable(
      table.id
    );

    toggleFetchingCols(false);

    // if (!columns.length) return;

    const [firstCol] = columns;

    const colsToDelete =
      table.isEditMode &&
      Array.isArray(step.colsToDelete.data) &&
      step.colsToDelete.data.length > 0
        ? step.colsToDelete
        : { data: [{ ...firstCol }], relation: 'AND' };

    const data = {
      ...step,
      is_primary: table?.is_primary || false,
      [field]: {
        ...(step[field] || {}),
        ...tableData,
        ...table,
        columns,
      },
      colsToDelete,
    };

    setStepData(data);
  };

  /**
   * Handle Delete Columns option
   */
  const handleDropColumns = (name, value) => {
    step[name] = value;
    setStepData(step);
  };

  const handleActionType = (name, value) => {
    setStepData({ ...step, [name]: value });
  };

  const handleMultiDropError = step => {
    const {
      isSubmit,
      dropColumns,
      actionType,
      targetTable: { columns = [] },
    } = step || {};

    if (isSubmit && dropColumns.length == 0) return true;

    // Validate Primary columns for Delete Columns
    if (
      isSubmit &&
      dropColumns.length > 0 &&
      (actionType == DELETE_TYPE_ACTION_KEYS.dropColumns ||
        actionType == DELETE_TYPE_ACTION_KEYS.clearColumns)
    ) {
      const filterPrimaryCols = columns.filter(
        ({ name, is_primary }) => dropColumns.includes(name) && is_primary
      );

      if (filterPrimaryCols.length > 0) {
        return true;
      }
    }

    return false;
  };

  const handleMultiDropErrorMsg = step => {
    const {
      isSubmit,
      dropColumns,
      actionType,
      targetTable: { columns = [] },
    } = step || {};
    // Validate Primary columns for Delete Columns
    if (
      isSubmit &&
      dropColumns.length > 0 &&
      (actionType == DELETE_TYPE_ACTION_KEYS.dropColumns ||
        actionType == DELETE_TYPE_ACTION_KEYS.clearColumns)
    ) {
      const filterPrimaryCols = columns
        .filter(
          ({ name, is_primary }) => dropColumns.includes(name) && is_primary
        )
        .map(({ display_name }) => display_name)
        .join(',');

      // Showing message when user tries to drop or clear columns
      if (
        filterPrimaryCols.length > 0 &&
        (actionType == DELETE_TYPE_ACTION_KEYS.clearColumns ||
          actionType == DELETE_TYPE_ACTION_KEYS.dropColumns)
      ) {
        return PROCESS_MANAGER_MSG.system_configure_columns.replace(
          '#COLUMNS#',
          filterPrimaryCols
        );
      }
    }

    return '';
  };

  const handleTargetTableErr = step => {
    const { isSubmit, actionType, is_primary = false } = step || {};

    if (isSubmit && !targetTableId) return true;

    if (
      isSubmit &&
      is_primary &&
      actionType == DELETE_TYPE_ACTION_KEYS.dropTable
    )
      return true;

    return false;
  };

  const handleTargetTableMsg = step => {
    const {
      isSubmit,
      actionType,
      is_primary = false,
      targetTable: { display_name = '' } = {},
    } = step || {};

    if (isSubmit && !targetTableId) return '';

    if (
      isSubmit &&
      is_primary &&
      actionType == DELETE_TYPE_ACTION_KEYS.dropTable
    )
      return PROCESS_MANAGER_MSG.primary_table.replace(
        '#TABLE_NAME#',
        display_name
      );

    return '';
  };

  return (
    <>
      {isFetchingCols && <Spinner />}

      <Divider />

      <div className={classes.root}>
        <Grid direction="row" container>
          <Box mr={2}>
            <TableSelector
              id="delete-clear-target-table"
              label="Target Table"
              value={targetTableId}
              name="targetTable"
              onChange={handleTargetTable}
              error={handleTargetTableErr(step)}
              helperText={handleTargetTableMsg(step)}
            />
          </Box>
          <Box>
            <SingleSelect
              id="delete-clear-target-table-action"
              label="Delete / Clear"
              value={step.actionType || ''}
              name="actionType"
              options={DELETE_TYPE_ACTIONS}
              onChange={handleActionType}
              error={step.isSubmit && !step.actionType}
            />
          </Box>
        </Grid>

        {targetTableId &&
          step.actionType == DELETE_TYPE_ACTION_KEYS.clearSelected && (
            <>
              <Box my={3}>
                <Divider />
              </Box>
              <Box my={2} display="flex" justifyContent="space-between">
                <Typography variant="body1">
                  Remove data from rows when
                </Typography>
              </Box>

              <HeadersComparison
                step={step}
                stepNumber={stepNumber}
                updateStepData={updateStepData}
              />
            </>
          )}

        {targetTableId &&
          (step.actionType == DELETE_TYPE_ACTION_KEYS.dropColumns ||
            step.actionType == DELETE_TYPE_ACTION_KEYS.clearColumns) && (
            <>
              <Box mt={3} mb={4}>
                <Divider />
              </Box>

              <Box mb={4}>
                <ColumnSelector
                  id="drop-multi-columns"
                  label="Select Column(s)"
                  name="dropColumns"
                  value={step.dropColumns}
                  columnList={
                    (step.targetTable && step.targetTable.columns) || []
                  }
                  onChange={handleDropColumns}
                  error={handleMultiDropError(step)}
                  helperText={handleMultiDropErrorMsg(step)}
                />
                {step.dropColumns &&
                  step.dropColumns.length ==
                    step.targetTable.columns.length && (
                    <FormLabel error className="all-columns-drop-err">
                      {step.actionType == DELETE_TYPE_ACTION_KEYS.dropColumns &&
                        PROCESS_MANAGER_MSG.all_columns_drop_html}

                      {step.actionType ==
                        DELETE_TYPE_ACTION_KEYS.clearColumns &&
                        PROCESS_MANAGER_MSG.all_columns_clear_html}
                    </FormLabel>
                  )}
              </Box>
            </>
          )}

        {targetTableId && step.actionType && <EnglishQueryViewer step={step} />}

        <StepCardFooter
          step={step}
          stepNumber={stepNumber}
          updateStepData={updateStepData}
        />
      </div>
    </>
  );
}

DeleteClearData.propTypes = {
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(DeleteClearData);
