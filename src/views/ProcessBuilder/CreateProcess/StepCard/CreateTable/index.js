import React from 'react';
import { shape, number, func, bool } from 'prop-types';
import { get } from 'lodash';

import {
  withStyles,
  Box,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider,
  TextField,
  Button,
  Typography,
} from '@material-ui/core';

import StepCardFooter from '../StepCardFooter';
import CreateTablePreview from './CreateTablePreview';
import EnglishQueryViewer from '../EnglishQueryViewer';

import { DATE_FORMAT } from '../../configs';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import {
  MAX_SOURCE_TABLE_NAME,
  COLUMN_DATA_TYPES_KEYS,
} from '../../../../../configs/app';

import { getValueAsPerType } from '../../../../SourceTables/ProcessImportedTable/helper';
import { getInitialHeaders, getInitialData, DEFAULT_COL } from './helper';
import { validateName } from '../../../../../utils/helper/validateName';
import { showErrorMsg } from '../../../../../utils/notifications';

import { styles } from './styles';
import './styles.scss';

export const ROW_ACTIONS = {
  insertAbove: 'Insert Row Above',
  insertBelow: 'Insert Row Below',
  delete: 'Delete Row',
  clear: 'Clear Row',
};

export const COLUMN_ACTIONS = {
  insertBefore: 'Insert Column Before',
  insertAfter: 'Insert Column After',
  delete: 'Delete Column',
  clear: 'Clear Column',
};

class CreateSourceTable extends React.Component {
  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { step } = this.props;

    if (!step.headers || step.headers.length == 0) {
      step.headers = getInitialHeaders();
      step.data = getInitialData();

      this.setStepData(step);
    }
  }

  /**
   * Show Error message for MAX Rows
   */
  showMaxRowsError = () => {
    let msg = PROCESS_MANAGER_MSG.create_table_max_rows;
    msg = msg.replace('#ROWS#', this.props.maxRows);

    showErrorMsg(msg);
  };

  /**
   * Set Step Data
   *
   * @param {Object} data
   */
  setStepData = data => {
    this.props.updateStepData(this.props.stepNumber, data);
  };

  /**
   * Get width of First Column
   *
   * @return {String}
   */
  getFirstColWidth = () => {
    const l = String(get(this.props, 'step.data.length') || 0).length;

    return `${l < 3 ? 50 : 18 * l}px`;
  };

  /**
   * Handle > Change Table Name
   */
  onChangeTableName = ({ target }) => {
    const tableName = target.value.substring(0, MAX_SOURCE_TABLE_NAME);

    const { step } = this.props;

    step.tableName = tableName;

    this.setStepData(step);
  };

  /**
   * Handle Selected Action for Row
   *
   * @param {Object}
   */
  handleRowAction = ({ action, row }) => {
    const { step, maxRows } = this.props;
    const { data, headers } = step;

    const getCols = () => headers.map(() => ({ ...DEFAULT_COL }));

    switch (action) {
      case ROW_ACTIONS.insertAbove:
        if (data.length == maxRows) {
          this.showMaxRowsError();
          return;
        }

        data.splice(row, 0, getCols());
        break;

      case ROW_ACTIONS.insertBelow:
        if (data.length == maxRows) {
          this.showMaxRowsError();
          return;
        }

        data.splice(row + 1, 0, getCols());
        break;

      case ROW_ACTIONS.delete:
        data.splice(row, 1);
        break;

      case ROW_ACTIONS.clear:
        data[row] = getCols();
        break;

      default:
        return;
    }

    step.data = data;
    step.headers = [...headers];

    this.setStepData(step);
  };

  /**
   * Handle Selected Action for Columns
   *
   * @param {Object}
   */
  handleColumnAction = ({ action, col }) => {
    const { step } = this.props;
    const { headers } = step;
    let { data } = step;

    const insertColumn = colIndex => {
      headers.splice(colIndex, 0, { ...DEFAULT_COL });

      data = data.map((row = []) => {
        row.splice(colIndex, 0, { ...DEFAULT_COL });

        return row;
      });
    };

    switch (action) {
      case COLUMN_ACTIONS.insertBefore:
        insertColumn(col);
        break;

      case COLUMN_ACTIONS.insertAfter:
        insertColumn(col + 1);
        break;

      case COLUMN_ACTIONS.delete:
        this.deleteColumn({ colIndex: col });
        break;

      case COLUMN_ACTIONS.clear:
        data = data.map((row = []) => {
          row[col] = { ...DEFAULT_COL };

          return row;
        });
        break;

      default:
        return;
    }

    step.data = data;
    step.headers = [...headers];

    this.setStepData(step);
  };

  /**
   * Add New Row
   */
  addRow = () => {
    const { step, maxRows } = this.props;
    const { headers, data } = step;
    const row = [];

    if (data.length == maxRows) {
      this.showMaxRowsError();
      return;
    }

    for (let i = 0; i < headers.length; i++) {
      row.push({ ...DEFAULT_COL });
    }

    data.push(row);

    step.headers = [...headers];
    step.data = data;

    this.setStepData(step);
  };

  /**
   * Add New Column
   */
  addColumn = () => {
    const { step } = this.props;
    const { headers, data } = step;

    for (let i = 0; i < data.length; i++) {
      data[i].push({ ...DEFAULT_COL });
    }

    headers.push(DEFAULT_COL);

    step.headers = [...headers];
    step.data = data;

    this.setStepData(step);
  };

  /**
   * Delete Column [Header]
   *
   * @param {Object}
   */
  deleteColumn = ({ colIndex }) => {
    const { step } = this.props;
    const { data, headers } = step;

    if (headers.length <= 2) {
      showErrorMsg(PROCESS_MANAGER_MSG.delete_col_required);
      return;
    }

    headers.splice(colIndex, 1);

    const mappedData = data.map((row = []) => {
      row.splice(colIndex, 1);
      return row;
    });

    step.data = mappedData;
    step.headers = [...headers];

    this.setStepData(step);
  };

  /**
   * Update Column [Header Props]
   *
   * @param {Object}
   */
  updateColumn = ({ colIndex, title, dataType, dateFormat }) => {
    const { step } = this.props;
    const { headers, data } = step;

    const copyHeaders = [...headers];

    const newCol = {
      ...copyHeaders[colIndex],
      label: title,
      dataType,
      dateFormat,
    };

    copyHeaders[colIndex] = { ...newCol };

    const formattedData = data.map(row => {
      const col = { ...row[colIndex] };
      const value = col.realValue || col.value;

      const formattedCol = {
        ...col,
        realValue: value,
        value: getValueAsPerType({ value, dataType, dateFormat }),
      };

      row[colIndex] = formattedCol;

      return row;
    });

    step.headers = copyHeaders;
    step.data = formattedData;

    this.setStepData(step);
  };

  /**
   * Handle Changed Values of Cells
   *
   * @param {Array} updatedCells
   */
  handleCellsChanged = (updatedCells = [], newCells = []) => {
    const allCells = [...updatedCells, ...newCells];
    const { step, maxRows } = this.props;
    let errorShowed = false;

    const getCols = () => headers.map(() => ({ ...DEFAULT_COL }));

    const { headers } = step;
    let dataCopy = [...step.data];

    // Update Cols
    allCells.forEach(({ row, col, value }) => {
      if (row >= maxRows) {
        if (!errorShowed) this.showMaxRowsError();

        errorShowed = true;
        return;
      }

      if (!headers[col]) headers[col] = { ...DEFAULT_COL };
      if (!dataCopy[row]) dataCopy[row] = getCols();

      const {
        dataType = COLUMN_DATA_TYPES_KEYS.alphanumeric,
        dateFormat = DATE_FORMAT,
      } = step.headers[col] || {};

      const validValue = getValueAsPerType({ value, dataType, dateFormat });

      dataCopy[row][col] = {
        ...DEFAULT_COL,
        ...dataCopy[row][col],
        value: validValue,
        realValue: value,
      };
    });

    // Add new cols in row
    if (newCells.length > 0) {
      dataCopy = dataCopy.map(row => {
        if (row.length == headers.length) return row;

        for (let i = 0; i < headers.length; i++) {
          if (!row[i]) row[i] = { ...DEFAULT_COL };
        }

        return row;
      });
    }

    step.data = dataCopy;
    step.headers = headers;

    this.setStepData(step);
  };

  /**
   * Toggle > Create New Table
   *
   * @param {Object}
   */
  toggleCreateNewTable = ({ target = {} }) => {
    const { step } = this.props;
    step.isNewTable = target.checked;

    this.setStepData(step);
  };

  /**
   * Render View
   */
  render() {
    const {
      classes,
      step = {},
      stepNumber,
      updateStepData,
      fromProcessBuilder,
      tableHeight,
    } = this.props;

    const { tableName = '', headers, isNewTable, data } = step;

    return (
      <>
        {fromProcessBuilder && <Divider />}

        <div className={`create-table ${classes.root}`}>
          {fromProcessBuilder && (
            <Grid direction="row" container>
              <Box mr={2} mb={4}>
                <TextField
                  size="small"
                  variant="outlined"
                  name="tableName"
                  value={tableName}
                  onChange={this.onChangeTableName}
                  required
                  autoComplete="off"
                  autoFocus
                  fullWidth
                  label="Table Name"
                  placeholder="Table Name"
                  error={
                    (step.isSubmit && !step.tableName) ||
                    (step.isSubmit && !validateName(step.tableName))
                  }
                />
              </Box>
              <Box mr={2} mb={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={isNewTable}
                      onChange={this.toggleCreateNewTable}
                    />
                  }
                  label="Create new table every time"
                />
              </Box>
            </Grid>
          )}

          <Box className="preview-table">
            <CreateTablePreview
              columns={headers}
              grid={data}
              stepIndex={stepNumber}
              updateColumn={this.updateColumn}
              deleteColumn={this.deleteColumn}
              handleCellsChanged={this.handleCellsChanged}
              handleRowAction={this.handleRowAction}
              handleColumnAction={this.handleColumnAction}
              firstColWidth={this.getFirstColWidth()}
              tableHeight={tableHeight}
            />

            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                <Box mr={2}>
                  <Button size="small" color="primary" onClick={this.addRow}>
                    + Add Row
                  </Button>
                </Box>
                <Button size="small" color="primary" onClick={this.addColumn}>
                  + Add Column
                </Button>
              </Box>

              <Typography variant="caption">
                Note: You can directly paste rows here from Excel.
              </Typography>
            </Box>
          </Box>

          {fromProcessBuilder && (
            <>
              <EnglishQueryViewer step={step} />
              <StepCardFooter
                step={step}
                stepNumber={stepNumber}
                updateStepData={updateStepData}
              />
            </>
          )}
        </div>
      </>
    );
  }
}

CreateSourceTable.propTypes = {
  fromProcessBuilder: bool,
  maxRows: number,
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  tableHeight: number,
  updateStepData: func.isRequired,
};

CreateSourceTable.defaultProps = {
  fromProcessBuilder: true,
  maxRows: 500,
  tableHeight: 300,
};

export default withStyles(styles)(CreateSourceTable);
