import React, { useState } from 'react';
import { shape, func, number } from 'prop-types';

import { withStyles, Box, Grid, Divider, Typography } from '@material-ui/core';

import Spinner from '../../../../../components/Spinner';
import TableSelector from '../TableSelector';
import StepCardFooter from '../StepCardFooter';
import CompareAndOrRelations from '../CompareAndOrRelations';
import LoopupTableUpdateColumns from './UpdateColumns';
import EnglishQueryViewer from '../EnglishQueryViewer';
import RelationshipMap from '../RelationshipMap';

import { COLUMN_DATA_TYPES_KEYS } from '../../../../../configs/app';
import {
  getColumnsOfSourceTable,
  getColumnsOfSourceTables,
} from '../../helper';
import { getValidFilledCompareToDataForEdit } from '../CompareAndOrRelations/helper';

import { styles } from './styles';
import './styles.scss';

function LoopupTable({ step, classes, stepNumber, updateStepData }) {
  const [isFetchingCols, toggleFetchingCols] = useState(false);

  const { lookupType } = step;
  const lookupTablesIds = (step.lookupTables || []).map(({ id }) => id);
  const targetTableId = (step.targetTable && String(step.targetTable.id)) || '';

  const setStepData = data => {
    updateStepData(stepNumber, data);
  };

  /**
   * Handle Single Lookup Table
   */
  const handleLookupTable = async (name, value, table) => {
    if (!table.isEditMode && lookupTablesIds[0] == table.id) return;

    toggleFetchingCols(true);

    const { columns = [], tableData = {} } = await getColumnsOfSourceTable(
      table.id
    );

    toggleFetchingCols(false);

    if (!columns.length) {
      if (table.isEditMode) {
        step[name] = [];
        setStepData(step);
      }

      return;
    }

    step.lookupTables = [
      {
        ...tableData,
        id: String(tableData.id),
        columns: columns.map(col => ({
          ...col,
          data_type: col.data_type || COLUMN_DATA_TYPES_KEYS.alphanumeric,
        })),
      },
    ];

    setStepData(step);

    if (targetTableId && step?.targetTable?.columns.length > 0) {
      const { columns } = step.targetTable;
      step.targetTable.isEditMode = table.isEditMode;

      fillColumnsData({
        columns,
        field: 'targetTable',
        table: step.targetTable,
      });
    }
  };

  /**
   * Handle Multiple Lookup Tables
   */
  const handleLookupTables = (name, value) => {
    const ids = value.map(id => ({ id }));
    step[name] = ids;

    setStepData(step);
  };

  /**
   * Handle Done > Multiple Lookup Tables Selection
   */
  const doneLookupSelection = async ({ isEditMode } = {}) => {
    toggleFetchingCols(true);
    const ids = (step.lookupTables || []).map(({ id }) => id);
    const tables = await getColumnsOfSourceTables(ids);
    toggleFetchingCols(false);

    step.lookupTables = tables.map(table => {
      return {
        ...table,
        id: String(table.id),
        columns: table.columns.map(col => ({
          ...col,
          data_type: col.data_type || COLUMN_DATA_TYPES_KEYS.alphanumeric,
          tableName: table.name,
          tableDisplayName: table.display_name,
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
   * Handle target Table
   */
  const handleTargetTable = async (name, value, table) => {
    toggleFetchingCols(true);

    const { columns = [], tableData = {} } = await getColumnsOfSourceTable(
      table.id
    );

    toggleFetchingCols(false);

    if (!columns.length) {
      if (table.isEditMode) {
        delete step[name];
        setStepData(step);
      }
      return;
    }

    fillColumnsData({ columns, table, field: name, tableData });
  };

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
            forLookup: true,
          })
        : { data: [{}], relation: 'AND' };

    const data = step;
    data.colsToCompare = colsToCompare;
    data.colsToUpdate = table.isEditMode
      ? getValidFilledUpdateToDataForEdit({ step, table, tableData })
      : [{}];

    data[field] = {
      ...(step[field] || {}),
      ...table,
      ...tableData,
      columns,
      isEditMode: false,
    };

    step.isChangeTable = true;
    setStepData(data);
  };

  const getValidFilledUpdateToDataForEdit = ({ step, tableData }) => {
    const { colsToUpdate, lookupTables = [] } = step;

    const getValidData = updateCol => {
      const { target = {} } = updateCol;

      if (updateCol.tableName == tableData.name) {
        updateCol.tableDisplayName = tableData.display_name;
      }

      if (target.tableName == tableData.name) {
        target.tableDisplayName = tableData.display_name;
      }

      lookupTables.forEach(lt => {
        if (updateCol.tableName == lt.name) {
          updateCol.tableDisplayName = lt.display_name;
        }

        if (target.tableName == lt.name) {
          target.tableDisplayName = lt.display_name;
        }
      });

      updateCol.target = target;

      return updateCol;
    };

    return colsToUpdate.map(getValidData);
  };

  return (
    <>
      {isFetchingCols && <Spinner />}

      <Divider />

      <div className={classes.root}>
        <Grid direction="row" container>
          <Box mr={2}>
            {lookupType == 'single' && (
              <TableSelector
                id="lookup-source-table"
                label="Lookup Table"
                value={lookupTablesIds[0] || ''}
                isUpdatePrimary={false}
                disabledTable={targetTableId}
                name="lookupTables"
                onChange={handleLookupTable}
                error={step.isSubmit && !lookupTablesIds.length}
              />
            )}

            {lookupType == 'multi' && (
              <TableSelector
                id="lookup-source-table"
                label="Lookup Table"
                value={lookupTablesIds}
                isUpdatePrimary={false}
                disabledTable={lookupTablesIds}
                name="lookupTables"
                error={step.isSubmit && !lookupTablesIds.length}
                onChange={handleLookupTables}
                onCloseSelect={doneLookupSelection}
                multiple
              />
            )}
          </Box>
          <Box>
            <TableSelector
              id="lookup-target-table"
              label="Destination Table"
              value={targetTableId}
              disabledTable={lookupTablesIds}
              name="targetTable"
              onChange={handleTargetTable}
              error={step.isSubmit && !targetTableId}
            />
          </Box>
        </Grid>

        {lookupTablesIds.length > 0 && targetTableId && (
          <>
            <RelationshipMap
              step={step}
              stepNumber={stepNumber}
              showDelete
              isLoading={isFetchingCols}
              setStepData={setStepData}
              height={300}
            />

            <Box mb={3} mt={2}>
              <Divider />
            </Box>

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body1">
                How is the Lookup Table related to the Destination Table?
              </Typography>
            </Box>

            <CompareAndOrRelations
              step={step}
              stepNumber={stepNumber}
              updateStepData={updateStepData}
              relatedTables={step.lookupTables || []}
            />

            <Box my={3}>
              <Divider />
            </Box>

            <LoopupTableUpdateColumns
              step={step}
              stepNumber={stepNumber}
              updateStepData={updateStepData}
            />

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

LoopupTable.propTypes = {
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(LoopupTable);
