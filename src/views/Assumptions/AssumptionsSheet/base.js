import React from 'react';
import { arrayOf, shape, func, number } from 'prop-types';

import SheetRenderer from './SheetRenderer';
import CellRenderer from './CellRenderer';
import HeaderCell from './HeaderCell';

import { HEADER_ROW_HEIGHT } from './configs';
import { getEmptyGridRow, validateLabelPattern } from './helper';
import { ASSUMPTION_KEYS } from '../helper';

import { ASSUMPTIONS_MSG } from '../../../configs/messages';
import { showErrorMsg } from '../../../utils/notifications';
import getNumbers from '../../../utils/helper/getNumbers';
import getLettersAndNumbers from '../../../utils/helper/getLettersAndNumbers';
import { getFormattedCellValue } from '../../Models/ModelWorkbook/GridPanel/helper';

class AssumptionsSheetBase extends React.Component {
  /**
   * Update State
   *
   * @param {Object} newState
   */
  updateState = newState => {
    this.setState({ ...newState });
  };

  /**
   * Update Height|Width of Sheet
   */
  updateHeightWidth = () => {
    try {
      const { data } = this.props;

      const tableMaxHeight = window.innerHeight - 154;
      let tableHeight = data.length * 32 + 44 + 44;

      if (tableHeight > tableMaxHeight) tableHeight = tableMaxHeight;

      const sideBarEle = document.getElementsByClassName('inner-sidebar')[0];
      const drawerEle = document.getElementById('assumptions-drawer');

      if (!sideBarEle || !drawerEle) return;

      const tableWidth = drawerEle.offsetWidth - sideBarEle.offsetWidth - 40;

      this.setState({ tableHeight, tableWidth, tableMaxHeight });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Get Empty Row
   */
  getEmptyGridRow = () => {
    return getEmptyGridRow(this.props.headers.length);
  };

  /**
   * On Change > Cells Selection
   *
   * @param {Object} selected
   */
  onSelectCells = selected => {
    try {
      const { headers } = this.props;

      const {
        start: { j: jStart },
        end: { j: jEnd },
      } = selected;

      if (jStart == 0 && jEnd == 0) {
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
   * Handle Any Change in Cell
   */
  handleTypingInCell = () => {
    // To Do
  };

  /**
   * Render Sheet
   */
  sheetRenderer = props => {
    const { headers, tableHeight } = this.props;

    return (
      <SheetRenderer {...props} columns={headers} tableHeight={tableHeight} />
    );
  };

  /**
   * Render Row
   */
  rowRenderer = props => props.children;

  /**
   * Get Header Height for Multi Grid
   *
   * @param {Object}
   *
   * @return {Number}
   */
  getHeaderHeight = ({ index }) => {
    return HEADER_ROW_HEIGHT;
  };

  /**
   * Update Header Cell Value
   *
   * @param {Object}
   */
  updateHeaderValue = ({ value, rowIndex, colIndex }) => {
    const { headers, setGridHeaders } = this.props;

    headers[colIndex] = {
      ...headers[colIndex],
      label: (value || '').trim(),
      error: '',
    };

    setGridHeaders(headers);
  };

  /**
   * Render Header for Mutli Grid
   *
   * @param {Object}
   *
   * @return {Number}
   */
  headerRenderer = props => {
    const { rowIndex: i, columnIndex: j } = props;

    const { headers } = this.props;
    let column = headers[j] || {};

    let toggleColContextMenu;

    if (i == 0) {
      if (j > 1 && j % 2) ({ toggleColContextMenu } = this);
    }

    if (i == 1) {
      if (j == 1) column = { ...column, label: '' };

      if (j > 1) {
        if (j % 2) {
          column = { ...column, label: String(ASSUMPTION_KEYS.valueLabel) };
        } else {
          column = { ...column, label: String(ASSUMPTION_KEYS.labelLabel) };
        }
      }
    }

    return (
      <HeaderCell
        column={column}
        rowIndex={i}
        colIndex={j}
        toggleColContextMenu={toggleColContextMenu}
        updateHeaderValue={this.updateHeaderValue}
        updateState={this.updateState}
      />
    );
  };

  /**
   * Render Cell
   */
  cellRenderer = props => {
    return (
      <CellRenderer
        {...props}
        labelCell={this.props.data[props.row][1]}
        data={this.props.data}
        onChange={this.handleTypingInCell}
        headers={this.props.headers}
        toggleRowContextMenu={this.toggleRowContextMenu}
        toggleColContextMenu={this.toggleColContextMenu}
      />
    );
  };

  /**
   * Render Value in Cell
   *
   * @param {Object} cell
   * @param {Number} rowIndex
   * @param {Number} colIndex
   *
   * @return {String|Number}
   */
  valueRenderer = (cell, rowIndex, colIndex) => {
    if (colIndex <= 1 || colIndex % 2 == 0) return cell.value;

    const headerCell = this.props.headers[colIndex - 1] || {};
    const rowConfig = { fieldType: headerCell.type };

    return getFormattedCellValue({
      col: colIndex,
      value: cell.value,
      rowConfig,
      isAssumption: true,
    });
  };

  /**
   * Render Data in Edit Cell
   *
   * @param {Object} cell
   * @param {Number} rowIndex
   * @param {Number} colIndex
   *
   * @return {String|Number}
   */
  dataRenderer = (cell, rowIndex, colIndex) => {
    // if (rowIndex > 1 && colIndex > 2 && colIndex % 2) {
    //   return cell.value ? Number(cell.value) : '';
    // }

    return cell.value;
  };

  /**
   * Handle Changed Values of Cells
   *
   * @param {Array} updatedCells
   * @param {Array} newCells
   */
  handleCellsChanged = async (updatedCells = [], newCells = []) => {
    const { data, setGridData } = this.props;

    let willAddNewRow = false;

    const { selected } = this.state;
    const {
      start: { i: iStart, j: jStart } = {},
      end: { i: iEnd, j: jEnd } = {},
    } = selected;

    const pasteSingleCellIntoMultiple = () => {
      return new Promise(resolve => {
        const [{ value }] = updatedCells;
        const newUpdatedCells = [];

        const iFrom = iStart < iEnd ? iStart : iEnd;
        const iTo = iStart > iEnd ? iStart : iEnd;

        const jFrom = jStart < jEnd ? jStart : jEnd;
        const jTo = jStart > jEnd ? jStart : jEnd;

        for (let i = iFrom; i <= iTo; i++) {
          for (let j = jFrom; j <= jTo; j++) {
            newUpdatedCells.push({
              row: i,
              col: j,
              value,
            });
          }
        }

        resolve(newUpdatedCells);
      });
    };

    if (updatedCells.length == 1 && (iStart != iEnd || jStart != jEnd)) {
      updatedCells = await pasteSingleCellIntoMultiple();
    }

    updatedCells.forEach(({ row, col, value }) => {
      if (!data[row]) data[row] = [];
      if (!data[row][col]) data[row][col] = {};

      let validValue = '';
      let isError = false;

      if (row >= 0) {
        if (col > 2 && col % 2) {
          validValue = String(getNumbers(value, true));
          if (!validValue) validValue = '';
        } else if (col == 1) {
          validValue = String(value || '').trim();
        } else if (validateLabelPattern(value)) {
          isError = true;
          showErrorMsg(ASSUMPTIONS_MSG.validate_label_pattern);
          validValue = getLettersAndNumbers(value).trim();
        } else {
          validValue = getLettersAndNumbers(value).trim();
        }

        data[row][col] = {
          ...data[row][col],
          value: validValue,
          error: isError,
        };
      }

      if (row == data.length - 1) willAddNewRow = true;
    });

    setGridData(data);

    if (willAddNewRow) {
      setTimeout(() => {
        this.activeRowIndex = data.length - 1;
        this.insertRowBelow();
      }, 100);
    }
  };
}

AssumptionsSheetBase.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  headers: arrayOf(shape({})),
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
  tableHeight: number.isRequired,
};

AssumptionsSheetBase.defaultProps = {
  data: [],
  headers: [],
};

export default AssumptionsSheetBase;
