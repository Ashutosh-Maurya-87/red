import React from 'react';
import { shape, number, func } from 'prop-types';
import {
  withStyles,
  Box,
  Grid,
  Divider,
  Button,
  Typography,
  Popover,
  TextField,
  FormLabel,
} from '@material-ui/core';

import Spinner from '../../../../../components/Spinner';
import StepCardFooter from '../StepCardFooter';
import TableSelector from '../TableSelector';
import TranslateTablePreview from './TranslateTablePreview';
import EnglishQueryViewer from '../EnglishQueryViewer';

import { DATE_FORMAT } from '../../configs';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../../configs/app';
import { DEFAULT_COL } from '../CreateTable/helper';
import { getValueAsPerType } from '../../../../SourceTables/ProcessImportedTable/helper';
import { getColumnsOfSourceTable } from '../../helper';
import { showSuccessMsg } from '../../../../../utils/notifications';

import { styles } from './styles';
import './styles.scss';

export const COL_WIDTH = 150;
export const LABEL_COL_WIDTH = 250;
export const MAX_ROWS = 1000000;

export const ROW_ACTIONS = {
  insertAbove: 'Insert Row Above',
  insertBelow: 'Insert Row Below',
  delete: 'Delete Row',
  clear: 'Clear Row',
};

export const TRANSLATE_HEADINGS = [
  { label: '' },
  { label: 'When source fields are equal to' },
  { label: 'Then change these fields to' },
];

class TranslateSourceTable extends React.Component {
  /**
   * State
   */
  state = {
    isFetchingCols: false,
    showLoader: false,

    headings: [...TRANSLATE_HEADINGS],
    allHeaders: [],

    addMultipleRowsEle: null,
    multipleRowsCount: 1,
  };

  mounted = false;

  componentDidMount() {
    this.mounted = true;
  }

  /**
   * Get Structure for All Hedares
   *
   * @param {Array} compare [Compare Headers]
   * @param {Array} update [Update Headers]
   *
   * @returns {Array}
   */
  getAllHeadersStructure = (compare, update) => {
    const allHeaders = [
      { ...DEFAULT_COL, width: LABEL_COL_WIDTH },
      ...compare,
      ...update,
    ];

    return allHeaders;
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
   * Fill Initial value for the grid
   */
  getInitialDataForGrid = (table, tableData, columns = []) => {
    const { step } = this.props;
    const { targetTable = {} } = step;

    const headersToCompare = [];
    const headersToUpdate = [];
    const INITIAL_COLS = 3;

    const dataToCompare = [];
    const dataToUpdate = [];

    columns.forEach((col, i) => {
      if (i < INITIAL_COLS) {
        headersToCompare.push({ ...col });
        headersToUpdate.push({ ...col });

        dataToCompare.push({ ...DEFAULT_COL });
        dataToUpdate.push({ ...DEFAULT_COL });
      }
    });

    const getData = () => {
      return [1, 2, 3].map((_, i) => {
        return [
          { ...DEFAULT_COL, value: `Rule ${i + 1}` },
          ...dataToCompare,
          ...dataToCompare,
        ];
      });
    };

    const newStep = {
      ...step,
      targetTable: {
        ...targetTable,
        ...table,
        ...tableData,
        columns,
      },
      headersToCompare,
      headersToUpdate,
      data: getData(),
    };

    return newStep;
  };

  /**
   * Handle Selected Target table
   */
  handleTargetTable = async (field, value, table) => {
    if (!this.mounted) return;

    this.setState({ isFetchingCols: true });
    const { columns = [], tableData = {} } = await getColumnsOfSourceTable(
      table.id
    );
    this.setState({ isFetchingCols: false });

    if (!columns.length) return;

    columns.forEach(col => {
      if (col.width) {
        col.width = Number(String(col.width).replace(/[^0-9]/g, ''));
      }
    });

    if (table.isEditMode) {
      this.fillEditData({ columns, table, tableData });
      return;
    }

    const newStep = this.getInitialDataForGrid(table, tableData, columns);

    const allHeaders = this.getAllHeadersStructure(
      newStep.headersToCompare,
      newStep.headersToUpdate
    );

    this.setState({ allHeaders });
    this.setStepData(newStep);
  };

  /**
   * Fill Data for Edit Mode
   *
   * @param {Object}
   */
  fillEditData = ({ columns, table, tableData }) => {
    const { step } = this.props;

    const {
      targetTable = {},
      headersToCompareNotFound = [],
      headersToUpdateNotFound = [],
    } = step;

    const headersToCompare = [];
    const headersToUpdate = [];

    /**
     * Remove cell from data
     *
     * @param {Array} data
     * @param {Number || String} indexToRm
     * @returns {Array}
     */
    const removeColInData = (data, indexToRm) => {
      return data.map(row => {
        const modifiedRows = [];

        row.forEach((cell, i) => {
          if (indexToRm != i) {
            modifiedRows.push(cell);
          }

          return cell;
        });

        return modifiedRows;
      });
    };

    step.headersToCompare.forEach((c, index) => {
      const compareCol = columns.find(col => c.name == col.name);

      if (!compareCol) {
        headersToCompareNotFound.push({ ...c });
        step.data = removeColInData(step.data, index + 1);
      }

      if (compareCol) headersToCompare.push({ ...compareCol });
    });

    step.headersToUpdate.forEach((c, index) => {
      const updateCol = columns.find(col => c.name == col.name);

      if (!updateCol) {
        headersToUpdateNotFound.push({ ...c });

        step.data = removeColInData(
          step.data,
          index + headersToCompare.length + 1
        );
      }

      if (updateCol) headersToUpdate.push({ ...updateCol });
    });

    let allHeaders = [];

    // If empty columns fill initial data
    if (headersToCompare.length == 0 || headersToUpdate.length == 0) {
      const newStep = this.getInitialDataForGrid(table, tableData, columns);

      newStep.headersToCompareNotFound = [
        ...(step.headersToCompareNotFound || []),
        ...headersToCompareNotFound,
      ];
      newStep.headersToUpdateNotFound = [
        ...(step?.headersToUpdateNotFound || []),
        ...headersToUpdateNotFound,
      ];

      allHeaders = this.getAllHeadersStructure(
        newStep.headersToCompare,
        newStep.headersToUpdate
      );

      this.setState({ allHeaders, isFetchingCols: false });
      this.setStepData(newStep);
      return;
    }

    const newStep = {
      ...step,
      targetTable: {
        ...targetTable,
        ...table,
        ...tableData,
        columns,
      },
      headersToCompare,
      headersToCompareNotFound,
      headersToUpdate,
      headersToUpdateNotFound,
    };

    allHeaders = this.getAllHeadersStructure(headersToCompare, headersToUpdate);

    this.setState({ allHeaders });
    this.setStepData(newStep);
  };

  /**
   * Get Empty Row
   *
   * @return {Array}
   */
  getEmptyRow = () => {
    const { step } = this.props;
    const { headersToCompare, headersToUpdate } = step;

    const totalHeaders = headersToCompare.length + headersToUpdate.length;
    const cols = [];

    let i = 0;
    while (i <= totalHeaders) {
      cols.push({ ...DEFAULT_COL });
      i++;
    }

    return cols;
  };

  /**
   * Handle Selected Action for Row
   *
   * @param {Object}
   */
  handleRowAction = ({ action, row }) => {
    const { step } = this.props;
    const { data } = step;

    switch (action) {
      case ROW_ACTIONS.insertAbove:
        data.splice(row, 0, this.getEmptyRow());
        break;

      case ROW_ACTIONS.insertBelow:
        data.splice(row + 1, 0, this.getEmptyRow());
        break;

      case ROW_ACTIONS.delete:
        data.splice(row, 1);
        break;

      case ROW_ACTIONS.clear:
        data[row] = this.getEmptyRow();
        break;

      default:
        return;
    }

    step.data = data;
    this.setStepData(step);
  };

  /**
   * Add New Row
   */
  addRow = () => {
    const { step } = this.props;
    const { data } = step;

    if (data.length >= MAX_ROWS) return;

    data.push(this.getEmptyRow());
    step.data = data;

    this.setStepData(step);
  };

  /**
   * Open Modal > Add Multiple Rows
   */
  openAddMultipleRowsModal = evt => {
    evt.preventDefault();

    this.setState({
      addMultipleRowsEle: evt.currentTarget,
      multipleRowsCount: 10,
    });
  };

  /**
   * Close Modal > Add Multiple Rows
   */
  closeAddMultipleRowsModal = () => {
    this.setState({ addMultipleRowsEle: null });
  };

  /**
   * On Change Rows Input
   */
  onChangeRowsCount = ({ target }) => {
    const { value } = target;

    let multipleRowsCount = value.replace(/[^0-9]/g, '');
    if (Number(multipleRowsCount) > 10000) multipleRowsCount = '10000';

    this.setState({ multipleRowsCount });
  };

  /**
   * Add Multiple Rows
   */
  addMultipleRows = evt => {
    evt.preventDefault();

    const { multipleRowsCount } = this.state;
    const rowsToAdd = Number(multipleRowsCount);

    if (!rowsToAdd) return;

    const { step } = this.props;
    const { data } = step;

    const emptyRow = this.getEmptyRow();

    let i = 0;
    while (i < rowsToAdd) {
      data.push(JSON.parse(JSON.stringify(emptyRow)));
      i++;
    }

    step.data = data;
    this.setStepData(step);

    const msg =
      rowsToAdd == 1
        ? PROCESS_MANAGER_MSG.add_row_success
        : PROCESS_MANAGER_MSG.add_rows_success.replace('#ROWS#', rowsToAdd);

    showSuccessMsg(msg);

    this.closeAddMultipleRowsModal();
  };

  /**
   * Handle Compare Headers List
   *
   * @param {Array} headers
   */
  handleCompareFields = headers => {
    const { step } = this.props;
    const { headersToCompare } = step;

    const { data } = step;

    const gridData = [];

    data.forEach(row => {
      const rowIndex = row.slice(0, 1);
      const rowSecond = row.slice(headersToCompare.length + 1);

      const rowData = [];

      [...headers].forEach(({ name, data_type }, i) => {
        const oldIndex = headersToCompare.findIndex(
          (column, i) => column.name == name
        );

        const index = oldIndex + 1;

        let value = row[index];

        if (oldIndex == -1) {
          value = {
            label: '',
            value: '',
            width: 150,
            dataType: data_type,
          };
        }

        rowData.push(value);
      });

      gridData.push([...rowIndex, ...rowData, ...rowSecond]);
    });

    step.data = gridData;

    step.headersToCompare = [...headers];

    const allHeaders = this.getAllHeadersStructure(
      step.headersToCompare,
      step.headersToUpdate
    );

    this.setState({ allHeaders });
    this.setStepData(step);
  };

  /**
   * Handle Update Headers List
   *
   * @param {Array} headers
   */
  handleUpdateFields = headers => {
    const { step } = this.props;

    const { headersToUpdate, headersToCompare } = step;

    let { data } = step;
    let diff = 0;

    if (headers.length > headersToUpdate.length) {
      diff = headers.length - headersToUpdate.length;

      data = data.map(row => {
        let i = 0;
        while (i < diff) {
          row.push({ ...DEFAULT_COL });
          i++;
        }

        return row;
      });
    } else if (headers.length < headersToUpdate.length) {
      diff = headersToUpdate.length - headers.length;

      data = data.map(row => {
        row.splice(
          headersToCompare.length + headersToUpdate.length - diff,
          diff
        );

        return row;
      });
    }

    step.data = data;

    this.reOrderData({
      step,
      oldHeaders: [...step.headersToUpdate],
      headersToCompare: step.headersToCompare,
      headers,
      isCompare: false,
    });
  };

  /**
   * Re-Order Step Data
   *
   * @param {Object} step
   * @param {Boolean} isCompare
   */
  reOrderData = ({
    step,
    oldHeaders,
    headersToCompare = [],
    headers,
    isCompare = true,
  }) => {
    try {
      step.data = step.data.map(row => {
        const newRow = [...row];

        headers.forEach((header, i) => {
          let oldIndex = oldHeaders.findIndex(
            oh => oh.display_name == header.display_name
          );

          let newIndex = i;

          // Clear Cell
          if (oldIndex < 0) {
            if (!isCompare) newIndex += headersToCompare.length;
            newRow[newIndex + 1] = { ...DEFAULT_COL };
            return;
          }

          if (newIndex == oldIndex) return;

          if (!isCompare) {
            oldIndex += headersToCompare.length;
            newIndex += headersToCompare.length;
          }

          newRow[newIndex + 1] = { ...row[oldIndex + 1] };
        });

        return newRow.filter(Boolean);
      });

      // Update Headers
      if (isCompare) {
        step.headersToCompare = [...headers];
      } else {
        step.headersToUpdate = [...headers];
      }

      const allHeaders = this.getAllHeadersStructure(
        step.headersToCompare,
        step.headersToUpdate
      );

      this.setState({ allHeaders });
      this.setStepData(step);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Handle Changed Values of Cells
   *
   * @param {Array} updatedCells
   * @param {Array} newCells
   */
  handleCellsChanged = async (updatedCells = [], newCells = []) => {
    this.setState({ showLoader: true }, () => {
      const allCells = updatedCells.concat(newCells);

      const { step } = this.props;
      const { allHeaders } = this.state;

      // Update Cols
      allCells.forEach(({ row, col, value }) => {
        if (row >= MAX_ROWS) return;

        if (!step.data[row]) step.data[row] = this.getEmptyRow();

        const {
          data_type: dataType = COLUMN_DATA_TYPES_KEYS.alphanumeric,
          date_format: dateFormat = DATE_FORMAT,
        } = allHeaders[col] || {};

        const validValue = getValueAsPerType({ value, dataType, dateFormat });

        let newCell = step.data[row][col];

        newCell = {
          ...DEFAULT_COL,
          ...newCell,
          value: validValue,
          realValue: value,
          formula: [],
        };

        step.data[row][col] = newCell;
      });

      // Add new cols in row
      if (newCells.length > 0) {
        step.data = step.data.map(row => {
          if (row.length == allHeaders.length) return row;

          let i = 0;
          while (i < allHeaders.length) {
            if (!row[i]) row[i] = { ...DEFAULT_COL };
            i++;
          }

          return row;
        });
      }

      this.setStepData(step);
      this.setState({ showLoader: false });
    });
  };

  /**
   * Handle Update Cell > Single Cell value
   *
   * @param {Object}
   */
  handleUpdateCell = ({ cell, row, col }) => {
    const { step } = this.props;

    if (!step.data[row] && step.data[row][col]) return;

    step.data[row][col] = {
      ...step.data[row][col],
      realValue: '',
      value: '',
      formula: cell.formula,
    };

    this.setStepData(step);
  };

  /**
   * Handle Done Button > Click
   *
   * @param {Number} index
   * @param {Object} data
   */
  handleUpdateCard = (index, data) => {
    const { updateStepData } = this.props;

    delete data.headersToCompareNotFound;
    delete data.headersToUpdateNotFound;

    updateStepData(index, data);
  };

  emptyCallback = () => {};

  /**
   * Render View
   */
  render() {
    const { classes, step = {}, stepNumber } = this.props;

    const {
      isFetchingCols,
      showLoader,
      headings,
      allHeaders,
      addMultipleRowsEle,
      multipleRowsCount,
    } = this.state;

    const {
      targetTable = {},
      headersToCompare = [],
      headersToUpdate = [],
      data = [],
    } = step;

    const totalRows = (step.data || []).length;

    return (
      <>
        {(isFetchingCols || showLoader) && <Spinner />}
        <Divider />

        <div className={`translate-table ${classes.root}`}>
          <Grid direction="row" container>
            <Box mr={2}>
              <TableSelector
                id="translate-target-table"
                label="Target Table"
                value={targetTable.id || ''}
                name="targetTable"
                onChange={this.handleTargetTable}
                error={step.isSubmit && !targetTable.id}
              />
            </Box>
          </Grid>

          {targetTable.columns && targetTable.columns.length > 0 && (
            <Box
              id="translate-preview-table"
              className="translate-preview-table"
              mt={2}
            >
              <Divider />

              <Box my={2} display="flex" justifyContent="space-between">
                <Typography variant="body1">
                  Define rules to translate data
                </Typography>
                <Typography variant="caption">
                  Note: You can directly paste rows here from Excel.
                </Typography>
              </Box>

              <TranslateTablePreview
                columns={allHeaders}
                headersToCompare={headersToCompare}
                headersToUpdate={headersToUpdate}
                headings={headings}
                grid={data}
                stepIndex={stepNumber}
                stepNumber={stepNumber}
                updateColumn={this.emptyCallback}
                deleteColumn={this.emptyCallback}
                handleColumnAction={this.emptyCallback}
                tableHeight={200}
                tableColumns={targetTable.columns}
                handleCompareFields={this.handleCompareFields}
                handleUpdateFields={this.handleUpdateFields}
                handleUpdateCell={this.handleUpdateCell}
                handleCellsChanged={this.handleCellsChanged}
                handleRowAction={this.handleRowAction}
              />

              <Box display="flex">
                <Button
                  size="small"
                  color="primary"
                  disabled={totalRows >= MAX_ROWS}
                  onClick={this.addRow}
                >
                  + Add New Row
                </Button>

                <Box ml={2} />

                <Button
                  size="small"
                  color="primary"
                  disabled={totalRows >= MAX_ROWS}
                  onClick={this.openAddMultipleRowsModal}
                >
                  + Add Multiple Rows
                </Button>
              </Box>

              <EnglishQueryViewer step={step} />
            </Box>
          )}

          <StepCardFooter
            step={step}
            stepNumber={stepNumber}
            updateStepData={this.handleUpdateCard}
          />
        </div>

        <Popover
          open={Boolean(addMultipleRowsEle)}
          anchorEl={addMultipleRowsEle}
          onClose={this.closeAddMultipleRowsModal}
          disableRestoreFocus
        >
          <form onSubmit={this.addMultipleRows}>
            <Box px={3} py={2}>
              <Box mb={3} mt={1}>
                <Box display="block">
                  <TextField
                    label="Rows"
                    variant="outlined"
                    value={multipleRowsCount}
                    onChange={this.onChangeRowsCount}
                    size="small"
                  />
                </Box>
                {!Number(multipleRowsCount) && (
                  <FormLabel error className="font-12">
                    {PROCESS_MANAGER_MSG.translate_table_add_valid_rows_count}
                  </FormLabel>
                )}
              </Box>

              <Grid container justify="flex-end" alignItems="center">
                <Box mr={1}>
                  <Button
                    color="primary"
                    onClick={this.closeAddMultipleRowsModal}
                    size="small"
                  >
                    Cancel
                  </Button>
                </Box>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  size="small"
                >
                  Add
                </Button>
              </Grid>
            </Box>
          </form>
        </Popover>
      </>
    );
  }
}

TranslateSourceTable.propTypes = {
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(TranslateSourceTable);
