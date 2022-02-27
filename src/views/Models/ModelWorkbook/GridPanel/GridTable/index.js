import React from 'react';
import {
  arrayOf,
  shape,
  func,
  bool,
  oneOfType,
  string,
  number,
} from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { get } from 'lodash';
import moment from 'moment';

import { Box, ClickAwayListener, Divider, Popover } from '@material-ui/core';
import { AutoSizer } from 'react-virtualized';
import VirtualizedDataSheet from '../../../../../components/VirtualizedDataSheet';

import {
  setActiveWorksheet,
  setWorkbook,
  setWorksheets,
  setGridData,
  setGridHeaders,
  setFormulaCell,
  deleteFormulaCell,
  setRowConfigs,
  setFormulaCells,
} from '../../../../../reducers/Models/actions';
import {
  getActiveWorksheet,
  getGridHeaders,
  getGridData,
  getWorkbook,
  getWorksheets,
  getRowConfigs,
  getIsViewMode,
  getSystemDimension,
  getSharedMappings,
  getGridDataTable,
  getGridCellFormulas,
} from '../../../../../reducers/Models/selectors';

import SetupRow from '../../SetupRow';
import GridTableBase from './base';
import RowContextMenu from './RowContextMenu';
import FormattingBar from '../FormattingBar';

import {
  FIXED_ROWS,
  FIXED_COLUMNS,
  ROW_CONTEXT_MENU_ACTIONS_KEYS,
  DEFAULT_ROUNDING_DIGIT,
  DEFAULT_ROUND_OFF,
  FIELD_TYPE_KEYS,
  DEFAULT_ERROR_TEXT,
} from '../configs';

import { MODELS_MSG } from '../../../../../configs/messages';
import { getGridDensity } from '../../../../../utils/localStorage';
import { DEFAULT_ROW_CONFIG, ROW_HEIGHT } from '../../configs';
import { filterCellIndexs, reCompileDataOfGrid } from './helper';

import {
  getAlphabetColumnName,
  getCellPath,
  getEmptyGridRow,
  getPercentageFieldValue,
  getUpdatedCellPath,
} from '../../helper';

import './styles.scss';
import { logAmplitudeEvent } from '../../../../../utils/amplitude';

class GridTable extends GridTableBase {
  /**
   * Active Row
   */
  activeRow = [];

  /**
   * Index of Active Row
   */
  activeRowIndex = -1;

  /**
   * Index of Active Row
   */
  activeRowName = '';

  /**
   * State
   */
  state = {
    selected: {},
    copyData: null,
    forecastStartDate: '',
    toggleHeaderResize: true,

    rowContextEle: null,
    tableWidth: 0,
    isVisibleSetupRow: false,

    fieldType: null,
    isRoundOff: DEFAULT_ROUND_OFF,
    roundingDigits: DEFAULT_ROUNDING_DIGIT,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);

    let { tableWidth } = this.props;
    if (!tableWidth) {
      const headerEle = document.getElementById('data-header');

      if (headerEle) {
        tableWidth = headerEle.offsetWidth || 0;
      }
    }

    const forecastStartDate = this.getForcastStartDate();

    this.setState({ tableWidth, forecastStartDate });
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('keypress', this.handleKeyDown);
  }

  /**
   * Get Forecats Start Date
   *
   * @return {String}
   */
  getForcastStartDate = () => {
    const { workbook } = this.props;

    let forecastStartDate = get(
      workbook,
      'scenario.scenario_meta.forecast_start_date'
    );

    // For old scenarios
    if (!forecastStartDate) {
      forecastStartDate = get(
        workbook,
        'scenario.scenario_meta.fiscal_year_beginning'
      );
    }

    if (forecastStartDate) {
      return moment(forecastStartDate);
    }

    return '';
  };

  /**
   * Get Empty Grid Row
   *
   * @return {Array}
   */
  getEmptyGridRow = () => {
    const { headers } = this.props;
    const { forecastStartDate } = this.state;

    return getEmptyGridRow(headers.length, { forecastStartDate, headers });
  };

  /**
   * On Change > Cells Selection
   *
   * @param {Object} selected
   */
  onSelectCells = selected => {
    try {
      const { headers, rowConfigs } = this.props;

      const {
        start: { i: iStart, j: jStart },
        end: { j: jEnd },
      } = selected;

      const rowConfig = rowConfigs[iStart] || {};

      if (rowConfig.isRowUseAsHeading || (jStart == 0 && jEnd == 0)) {
        selected = {
          start: {
            ...selected.start,
            j: 1,
          },
          end: {
            ...selected.end,
            j: headers.length - 1,
          },
        };
      }

      this.setState({ selected });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * On Click outside > Remove cell selection
   */
  onSelectionRemove = () => {
    setTimeout(() => {
      this.setState({ selected: {} });
    }, 200);
  };

  /**
   *	Handle Selected option of Context Menu of Row
   *
   * @param {Object} opt
   */
  handleRowContextMenuAction = opt => () => {
    this.setState({ rowContextEle: null });

    switch (opt) {
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertAbove:
        this.insertRowAbove();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertBelow:
        this.insertRowBelow();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.duplicate:
        this.duplicateRow();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.delete:
        this.deleteRow();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.moveAbove:
        this.moveRowAbove();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.moveBelow:
        this.moveRowBelow();
        break;

      default:
        break;
    }
  };

  /**
   * Update State Data
   *
   * @param {Object} data
   */
  updateState = data => {
    this.setState({ ...data });
  };

  /**
   * Re-order Rows via Drag|Drop feature
   */
  onDragRow = ({ source, destination }) => {
    if (!source || !destination) return;

    try {
      const { index: sourceIndex } = source || {};
      const { index: destinationIndex } = destination || {};

      const {
        data,
        rowConfigs,
        setGridData,
        setRowConfigs,
        handleRowConfigsUpdated,
      } = this.props;

      const [removedData] = data.splice(sourceIndex, 1);
      data.splice(destinationIndex, 0, removedData);

      const [removedRowConfigs] = rowConfigs.splice(sourceIndex, 1);
      rowConfigs.splice(destinationIndex, 0, removedRowConfigs);

      setGridData(data);
      setRowConfigs(rowConfigs);

      const rowConfig = rowConfigs[this.activeRowIndex] || {};

      const newRowConfig = {
        move_after: null,
        move_before: null,
      };

      handleRowConfigsUpdated({
        [rowConfig.row_id]: { ...newRowConfig },
      });
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Move Row Above
   */
  moveRowAbove = () => {
    const {
      rowConfigs,
      setGridData,
      setRowConfigs,
      handleRowConfigsUpdated,
      setFormulaCells,
      handleGridUpdated,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const { formulaCells, data, newChanges } = this.onMoveRowUpdateMatrix(
      this.activeRowIndex,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs,
      -1
    );

    const [removedData] = data.splice(this.activeRowIndex - 1, 1);
    data.splice(this.activeRowIndex, 0, removedData);

    const [removedRowConfigs] = rowConfigs.splice(this.activeRowIndex - 1, 1);
    rowConfigs.splice(this.activeRowIndex, 0, removedRowConfigs);

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });
    setRowConfigs(rowConfigs);

    const rowConfig = rowConfigs[this.activeRowIndex - 1] || {};
    const rowConfigAbove = rowConfigs[this.activeRowIndex] || {};

    const newRowConfig = {
      move_after: null,
      move_before: rowConfigAbove.row_id,
    };

    handleGridUpdated(newChanges);

    handleRowConfigsUpdated({
      [rowConfig.row_id]: { ...newRowConfig },
    });
  };

  /**
   * Move Row Below
   */
  moveRowBelow = () => {
    const {
      rowConfigs,
      setGridData,
      setRowConfigs,
      handleRowConfigsUpdated,
      setFormulaCells,
      handleGridUpdated,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const { formulaCells, data, newChanges } = this.onMoveRowUpdateMatrix(
      this.activeRowIndex,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs,
      1
    );

    const [removedData] = data.splice(this.activeRowIndex + 1, 1);
    data.splice(this.activeRowIndex, 0, removedData);

    const [removedRowConfigs] = rowConfigs.splice(this.activeRowIndex + 1, 1);
    rowConfigs.splice(this.activeRowIndex, 0, removedRowConfigs);

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });
    setRowConfigs(rowConfigs);

    const rowConfig = rowConfigs[this.activeRowIndex + 1] || {};
    const rowConfigBelow = rowConfigs[this.activeRowIndex] || {};

    const newRowConfig = {
      move_after: rowConfigBelow.row_id,
      move_before: null,
    };

    handleGridUpdated(newChanges);

    handleRowConfigsUpdated({
      [rowConfig.row_id]: { ...newRowConfig },
    });
  };

  /**
   * Update reference of formula cell on move row above/down
   *
   * @param {String/Number} activeRowIndex
   * @param {Array} data
   * @param {Array} formulaCells
   * @param {Array} rowConfigs
   * @param {String} addSubtract
   *
   * @returns {Object}
   */
  onMoveRowUpdateMatrix = (
    activeRowIndex,
    data,
    formulaCells,
    rowConfigs,
    addSubtract
  ) => {
    const newChanges = {};

    formulaCells.filter(
      cell => cell.row > activeRowIndex || cell.row < activeRowIndex
    );

    const updatedFormulaCells = formulaCells.map(formulaCell => {
      const { row, col } = formulaCell || {};
      const { expr = '' } = data[row][col] || {};

      const tokens = filterCellIndexs(expr);

      // Update formula expr
      const obj = {};
      tokens.forEach(token => {
        const { x } = getCellPath({ letter: token });

        // Move Row Above and Down
        if (x == activeRowIndex) {
          const { cellIndex } = getUpdatedCellPath({
            letter: token,
            addSubtractValue: addSubtract,
          });

          obj[token] = cellIndex ? cellIndex : '';
        }

        // Update Matrix On Move Row Above/Below
        if (x == activeRowIndex + addSubtract) {
          const { cellIndex } = getUpdatedCellPath({
            letter: token,
            addSubtractValue: addSubtract == 1 ? -1 : 1,
          });
          obj[token] = cellIndex ? cellIndex : '';
        }
      });

      // Create dynamic regx to replace string
      if (Object.keys(obj).length > 0) {
        const reg = new RegExp(Object.keys(obj).join('|'), 'gi');
        const value = expr.replace(reg, matched => {
          return obj[matched];
        });

        data[row][col].expr = value;

        const { row_id } = rowConfigs[row] || {};
        newChanges[`${row_id}--${col}`] = data[row][col].value;
      }

      if (row == activeRowIndex) {
        const { cellIndex } = getUpdatedCellPath({
          letter: formulaCell?.cellIndex || '',
          addSubtractValue: addSubtract,
        });

        formulaCell = {
          ...formulaCell,
          cellIndex,
          row: row + addSubtract,
        };
      }

      // Update formulaCells On Move Row Above/Below
      if (row == activeRowIndex + addSubtract) {
        const { cellIndex } = getUpdatedCellPath({
          letter: formulaCell?.cellIndex || '',
          addSubtractValue: addSubtract == 1 ? -1 : 1,
        });

        formulaCell = {
          ...formulaCell,
          cellIndex,
          row: addSubtract == 1 ? row - 1 : row + 1,
        };
      }

      return formulaCell;
    });

    return { formulaCells: updatedFormulaCells, data, newChanges };
  };

  /**
   * Update reference of updated cell
   *
   * @param {String/Number} activeRowIndex
   * @param {Array} data
   * @param {Array} formulaCells
   * @param {Array} rowConfigs
   * @returns {Object}
   */
  updateFormulaRef = (activeRowIndex, data, formulaCells, rowConfigs) => {
    const newChanges = {};

    formulaCells.filter(
      cell => cell.row > activeRowIndex || cell.row < activeRowIndex
    );

    const updatedFormulaCells = formulaCells.map(formulaCell => {
      const { row, col } = formulaCell || {};
      const { expr } = data[row][col] || {};

      const tokens = filterCellIndexs(expr);

      // Update formula expr
      const obj = {};
      tokens.forEach(token => {
        const { x } = getCellPath({ letter: token });
        if (x >= activeRowIndex) {
          const { cellIndex } = getUpdatedCellPath({
            letter: token,
            addSubtractValue: 1,
          });
          obj[token] = cellIndex ? cellIndex : '';
        }
      });

      // Create dynamic regx to replace string
      if (Object.keys(obj).length > 0) {
        const reg = new RegExp(Object.keys(obj).join('|'), 'gi');
        const value = expr.replace(reg, matched => {
          return obj[matched];
        });

        data[row][col].expr = value;

        const { row_id } = rowConfigs[row] || {};
        newChanges[`${row_id}--${col}`] = data[row][col].value;
      }

      if (row >= activeRowIndex) {
        const { cellIndex } = getUpdatedCellPath({
          letter: formulaCell?.cellIndex || '',
          addSubtractValue: 1,
        });

        formulaCell = {
          ...formulaCell,
          cellIndex,
          row: row + 1,
        };
      }

      return formulaCell;
    });

    return { formulaCells: updatedFormulaCells, data, newChanges };
  };

  /**
   * Delete reference of cells
   *
   * @param {String/Number} activeRowIndex
   * @param {Array} data
   * @param {Array} formulaCells
   * @param {Array} rowConfigs
   * @returns {Object}
   */
  deleteFormulaRef = (activeRowIndex, data, formulaCells, rowConfigs) => {
    const newChanges = {};

    let updatedFormulaCells = formulaCells.filter(
      cell => cell.row > activeRowIndex || cell.row < activeRowIndex
    );

    updatedFormulaCells = updatedFormulaCells.map(formulaCell => {
      const { row, col } = formulaCell || {};
      const { expr } = data[row][col] || {};

      const tokens = filterCellIndexs(expr);

      // Update formula expr
      const obj = {};
      tokens.forEach(token => {
        const { x } = getCellPath({ letter: token });

        if (x === activeRowIndex) {
          obj[token] = DEFAULT_ERROR_TEXT;
          return;
        }

        if (x >= activeRowIndex) {
          const { cellIndex } = getUpdatedCellPath({
            letter: token,
            addSubtractValue: -1,
          });
          obj[token] = cellIndex ? cellIndex : '';
        }
      });

      // Create dynamic regx to replace string
      if (Object.keys(obj).length > 0) {
        const reg = new RegExp(Object.keys(obj).join('|'), 'gi');
        const value = expr.replace(reg, matched => {
          return obj[matched];
        });

        data[row][col].expr = value;

        const { row_id } = rowConfigs[row] || {};
        newChanges[`${row_id}--${col}`] = data[row][col].value;
      }

      if (row > activeRowIndex) {
        const { cellIndex, x } = getUpdatedCellPath({
          letter: formulaCell?.cellIndex || '',
          addSubtractValue: -1,
        });

        formulaCell = {
          ...formulaCell,
          cellIndex,
          row: x,
        };
      }

      return formulaCell;
    });

    return { formulaCells: updatedFormulaCells, data, newChanges };
  };

  /**
   * Insert Row Above
   */
  insertRowAbove = () => {
    if (!this.isAllowNewRow()) return;

    const {
      rowConfigs,
      setGridData,
      setRowConfigs,
      setFormulaCells,
      handleGridUpdated,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const { formulaCells, data, newChanges } = this.updateFormulaRef(
      this.activeRowIndex,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs
    );

    const rowId = `NEW_ROW_${data.length}`;

    data.splice(this.activeRowIndex, 0, this.getEmptyGridRow());
    rowConfigs.splice(this.activeRowIndex, 0, {
      ...DEFAULT_ROW_CONFIG,
      row_id: rowId,
    });

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });
    setRowConfigs(rowConfigs);

    newChanges[`${rowId}--1`] = '';
    handleGridUpdated(newChanges, { isNewRow: true });
  };

  /**
   * Insert Row Below
   */
  insertRowBelow = () => {
    if (!this.isAllowNewRow()) return;

    const {
      rowConfigs,
      setGridData,
      setRowConfigs,
      setFormulaCells,
      handleGridUpdated,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const { formulaCells, data, newChanges } = this.updateFormulaRef(
      this.activeRowIndex + 1,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs
    );

    const rowId = `NEW_ROW_${data.length}`;

    data.splice(this.activeRowIndex + 1, 0, this.getEmptyGridRow());
    rowConfigs.splice(this.activeRowIndex + 1, 0, {
      ...DEFAULT_ROW_CONFIG,
      row_id: rowId,
    });

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });
    setRowConfigs(rowConfigs);

    newChanges[`${rowId}--1`] = '';
    handleGridUpdated(newChanges, { isNewRow: true });
  };

  /**
   * Insert Empty Row Below
   */
  insertEmptyRow = () => {
    if (!this.isAllowNewRow()) return;

    const {
      rowConfigs,
      setGridData,
      setRowConfigs,
      setFormulaCells,
      handleGridUpdated,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const { formulaCells, data, newChanges } = this.updateFormulaRef(
      this.activeRowIndex + 1,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs
    );

    data.splice(this.activeRowIndex + 1, 0, this.getEmptyGridRow());
    rowConfigs.splice(this.activeRowIndex + 1, 0, { ...DEFAULT_ROW_CONFIG });

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });

    setRowConfigs(rowConfigs);
    handleGridUpdated(newChanges);
  };

  /**
   * Duplicate Row
   */
  duplicateRow = () => {
    if (!this.isAllowNewRow()) return;

    const {
      rowConfigs,
      setGridData,
      setRowConfigs,
      setFormulaCells,
      handleGridUpdated,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const result = this.updateFormulaRef(
      this.activeRowIndex + 1,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs
    );

    const { formulaCells, data } = result || {};
    let { newChanges } = result || {};

    const duplicateRow = JSON.parse(JSON.stringify(data[this.activeRowIndex]));
    const duplicateRowConfig = JSON.parse(
      JSON.stringify(rowConfigs[this.activeRowIndex])
    );

    const filterResult = data.filter(row =>
      row[1].value.includes(duplicateRow[1].value)
    );

    // Append postfix count to duplicated row name
    duplicateRow[1].value = `Copy of(${filterResult.length + 1}) - ${
      duplicateRow[1].value
    }`;

    // If duplicate row has formula cells then push cells into formulaCells varible to manage cell re-rendering.
    duplicateRow.forEach((row, index) => {
      const { expr } = row;

      if (expr) {
        const trailKey = `${getAlphabetColumnName(index - 1)}${
          this.activeRowIndex + 2
        }`;

        formulaCells.push({
          cellIndex: trailKey,
          row: this.activeRowIndex + 1,
          col: index,
        });
      }
    });

    data.splice(this.activeRowIndex + 1, 0, duplicateRow);
    rowConfigs.splice(this.activeRowIndex + 1, 0, duplicateRowConfig);

    const rowId = `NEW_ROW_${data.length}`;
    duplicateRowConfig.row_id = rowId;
    duplicateRow[1].error = MODELS_MSG.duplicate_row_label;

    // data.push(duplicateRow);
    // rowConfigs.push(duplicateRowConfig);

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });
    setRowConfigs(rowConfigs);

    handleGridUpdated(newChanges);

    newChanges = {};
    duplicateRow.forEach((cell, i) => {
      if (i == 0) return;
      newChanges[`${rowId}--${i}`] = cell.value;
    });

    handleGridUpdated(newChanges, { isDuplicateRow: true });
  };

  /**
   * Delete Row
   */
  deleteRow = () => {
    const {
      setGridData,
      rowConfigs,
      setRowConfigs,
      handleGridUpdated,
      setFormulaCells,
      data: dataFromProps,
      formulaCells: formulaCellsFromProps,
    } = this.props;

    const { formulaCells, data, newChanges } = this.deleteFormulaRef(
      this.activeRowIndex,
      dataFromProps,
      formulaCellsFromProps,
      rowConfigs
    );

    const rowConfig = { ...rowConfigs[this.activeRowIndex] };

    data.splice(this.activeRowIndex, 1);
    rowConfigs.splice(this.activeRowIndex, 1);

    setFormulaCells(formulaCells);
    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });
    setRowConfigs(rowConfigs);

    handleGridUpdated({}, { isDeleteRow: true, rowConfig });
    handleGridUpdated(newChanges);
  };

  /**
   * Toggle Row Context Menu Visibility
   *
   * @param {Object} evt
   */
  toggleRowContextMenu = props => evt => {
    if (evt) evt.stopPropagation();

    if (props) this.activeRowIndex = props.row;
    const { rowConfigs, data, setRowConfigs, setGridData } = this.props;
    const rowsData = [...data];

    // Open Context Menu
    if (!this.state.rowContextEle && evt.currentTarget) {
      const { fieldType, roundingDigits, isRoundOff } =
        rowConfigs[props.row] || {};

      this.setState({
        rowContextEle: evt.currentTarget,
        fieldType,
        isRoundOff,
        roundingDigits,
      });

      return;
    }

    const { fieldType, roundingDigits, isRoundOff } = this.state;
    const rowConfig = rowConfigs[this.activeRowIndex] || {};

    // Detect Changes in Row Configs
    const detectChangesInConfigs = () => {
      const changes = {};

      if (fieldType != rowConfig.fieldType) {
        changes.fieldType = fieldType;
        rowsData[this.activeRowIndex] = detectChangesInRow();
      }

      if (isRoundOff != rowConfig.isRoundOff) {
        changes.isRoundOff = isRoundOff;
      }

      if (roundingDigits != rowConfig.roundingDigits) {
        changes.roundingDigits = roundingDigits;
      }

      if (Object.keys(changes).length == 0) return null;

      return changes;
    };

    const detectChangesInRow = () => {
      if (rowsData && rowsData.length == 0) return {};

      const newModifiedRow = [];

      const currentRowData = [...rowsData[this.activeRowIndex]];

      currentRowData.forEach((cell, index) => {
        if (index > 1) {
          let { value = '' } = cell || {};

          if (
            fieldType == FIELD_TYPE_KEYS.percentage ||
            rowConfig.fieldType == FIELD_TYPE_KEYS.percentage
          ) {
            value =
              fieldType == FIELD_TYPE_KEYS.percentage
                ? getPercentageFieldValue(fieldType, value, true)
                : getPercentageFieldValue(rowConfig.fieldType, value, false);
          }

          cell = { ...cell, value };
        }

        newModifiedRow.push(cell);
      });

      return newModifiedRow;
    };

    const newChanges = detectChangesInConfigs();

    if (!newChanges) {
      this.setState({ rowContextEle: null });
      return;
    }

    const newRowConfig = { ...rowConfig, ...newChanges };
    rowConfigs[this.activeRowIndex] = newRowConfig;

    setGridData(rowsData);
    setRowConfigs(rowConfigs);

    this.setState({ rowContextEle: null });

    this.props.handleRowConfigsUpdated({
      [rowConfig.row_id]: {},
    });
  };

  /**
   * Toggle Setup Row Drawer Visibility
   */
  toggleSetupRowVisibility = props => () => {
    logAmplitudeEvent('Setup model row');

    if (props) {
      const { data } = this.props;

      this.activeRowIndex = props.row;
      this.activeRowName = data[props.row][1].value || '';
    }

    this.setState({ isVisibleSetupRow: !this.state.isVisibleSetupRow });
  };

  /**
   * Re calculate grid formula values
   */
  reCompileGridDataBeign = scope => {
    reCompileDataOfGrid(this.props, scope);
  };

  /**
   * Save Row Configs
   *
   * @param {Object} rowConfig
   */
  handleSaveConfig = rowConfig => {
    const {
      rowConfigs,
      setRowConfigs,
      setGridData,
      handleRowConfigsUpdated,
      data,
    } = this.props;

    const copyRowConfigs = [...rowConfigs];
    copyRowConfigs[this.activeRowIndex] = rowConfig;

    const copyOfData = [...data];

    const updatedCell = (copyOfData[this.activeRowIndex] || []).map(cell => {
      cell.expr = '';
      return cell;
    });

    copyOfData[this.activeRowIndex] = updatedCell;

    setRowConfigs(copyRowConfigs);
    setGridData(copyOfData);
    handleRowConfigsUpdated({ [rowConfig.row_id]: {} });
  };

  /**
   * Validate Rounding Digit
   */
  isValidRoundingDigit = value => {
    const { isRoundOff } = this.state;

    if (!isRoundOff || value == 0) return false;

    if (value == undefined || value == null || value == '') return true;

    return false;
  };

  /**
   * Render View
   */
  render() {
    const {
      headers,
      data,
      rowConfigs,
      isViewMode,
      tableWidth: tableWidthFromProps,
      setGridData,
      handleGridUpdated,
      workbook,
      systemDimensions,
      sharedMappings,
    } = this.props;

    const {
      selected,
      tableWidth,
      isVisibleSetupRow,
      rowContextEle,
      toggleHeaderResize,
    } = this.state;

    const activeDensity = `model-${getGridDensity()?.toLowerCase()}`;

    return (
      <>
        <Box style={{ flex: '1 1 0' }}>
          <AutoSizer>
            {({ width, height }) => (
              <ClickAwayListener
                mouseEvent="onMouseDown"
                touchEvent="onTouchStart"
                onClickAway={this.onSelectionRemove}
              >
                <Box
                  style={{ width, height: this.getTableHeight(height) - 48 }}
                  className={`model-grid ${activeDensity}`}
                >
                  <Box p={1}>
                    <FormattingBar
                      data={data}
                      setData={setGridData}
                      selected={selected}
                      rowConfigs={rowConfigs}
                      handleCellsChanged={this.handleCellsChanged}
                      handleGridUpdated={handleGridUpdated}
                    />
                  </Box>

                  <Box mx={1}>
                    <Divider />
                  </Box>

                  <Box p={1}>
                    <VirtualizedDataSheet
                      data={data}
                      headers={headers}
                      rowHeight={ROW_HEIGHT}
                      sheetRenderer={this.sheetRenderer}
                      rowRenderer={this.rowRenderer}
                      headerRenderer={this.headerRenderer}
                      cellRenderer={this.cellRenderer}
                      valueRenderer={this.valueRenderer}
                      dataRenderer={this.dataRenderer}
                      onCellsChanged={this.handleCellsChanged}
                      tableHeight={this.getTableHeight(height - 65)}
                      containerHeight={height - 65}
                      tableWidth={tableWidthFromProps || tableWidth}
                      getHeaderHeight={this.getHeaderHeight}
                      selected={selected}
                      onSelect={this.onSelectCells}
                      fixedColumnsCustom={FIXED_COLUMNS}
                      fixedRowsCustom={FIXED_ROWS}
                      isViewMode={isViewMode}
                      toggleHeaderResize={toggleHeaderResize}
                      parsePaste={this.handlePasteCells}
                      handleCopy={this.handleCopyCells}
                    />
                  </Box>
                </Box>
              </ClickAwayListener>
            )}
          </AutoSizer>

          <Box p={1}>
            <Popover
              open={Boolean(rowContextEle)}
              anchorEl={rowContextEle}
              onClose={this.toggleRowContextMenu()}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                style: { width: '300px' },
              }}
            >
              <RowContextMenu
                state={this.state}
                activeRowIndex={this.activeRowIndex}
                updateState={this.updateState}
                handleRowContextMenuAction={this.handleRowContextMenuAction}
                isValidRoundingDigit={this.isValidRoundingDigit}
                rowsCount={data.length}
              />
            </Popover>

            {isVisibleSetupRow && (
              <SetupRow
                rowConfig={rowConfigs[this.activeRowIndex]}
                rowIndex={this.activeRowIndex}
                rowConfigs={rowConfigs}
                handleClose={this.toggleSetupRowVisibility()}
                isOpen={isVisibleSetupRow}
                onSaveConfig={this.handleSaveConfig}
                title={`${this.activeRowName}`}
                workbook={workbook}
                systemDimensions={systemDimensions}
                sharedMappings={sharedMappings}
              />
            )}
          </Box>
        </Box>
      </>
    );
  }
}

GridTable.propTypes = {
  containerHeight: oneOfType([number, string]),
  data: arrayOf(arrayOf(shape({}))),
  deleteFormulaCell: func.isRequired,
  formulaCells: arrayOf(shape({})).isRequired,
  gridDataTable: shape({}),
  headers: arrayOf(shape({})),
  isViewMode: bool.isRequired,
  rowConfigs: arrayOf(shape({})),
  setFormulaCell: func.isRequired,
  setFormulaCells: func.isRequired,
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
  setRowConfigs: func.isRequired,
  // activeWorksheet: shape({}).isRequired,
  // setActiveWorksheet: func.isRequired,
  // setWorkbook: func.isRequired,
  // setWorksheets: func.isRequired,
  sharedMappings: arrayOf(shape({})).isRequired,
  systemDimensions: arrayOf(shape({})).isRequired,
  workbook: shape({}).isRequired,
  // worksheets: arrayOf(shape({})).isRequired,
};

GridTable.defaultProps = {
  data: [],
  headers: [],
  sharedMappings: [],
  systemDimensions: [],
  containerHeight: 0,
};

const mapStateToProps = createStructuredSelector({
  activeWorksheet: getActiveWorksheet(),
  isViewMode: getIsViewMode(),
  workbook: getWorkbook(),
  worksheets: getWorksheets(),
  headers: getGridHeaders(),
  data: getGridData(),
  rowConfigs: getRowConfigs(),
  systemDimensions: getSystemDimension(),
  sharedMappings: getSharedMappings(),
  gridDataTable: getGridDataTable(),
  formulaCells: getGridCellFormulas(),
});

export default connect(mapStateToProps, {
  deleteFormulaCell,
  setActiveWorksheet,
  setGridData,
  setGridHeaders,
  setFormulaCell,
  setRowConfigs,
  setWorkbook,
  setWorksheets,
  setFormulaCells,
})(GridTable);
