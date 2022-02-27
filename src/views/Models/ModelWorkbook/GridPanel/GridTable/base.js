import React from 'react';
import { get, range, cloneDeep } from 'lodash';
import { arrayOf, shape, func, number, bool } from 'prop-types';

import { Box } from '@material-ui/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import SheetRenderer from './SheetRenderer';
import CellRenderer from './CellRenderer';
import HeaderCell from './HeaderCell';

import { FIXED_ROWS, FIELD_TYPE_KEYS } from '../configs';
import {
  MAX_ROWS,
  ROW_HEIGHT,
  HEADER_INDEX_ROW,
  HEADER_PERIOD_ROW,
} from '../../configs';

import { MODELS_MSG } from '../../../../../configs/messages';

import { showErrorMsg } from '../../../../../utils/notifications';
import { getFormattedCellValue } from '../helper';
import { getAlphabetColumnName, getPercentageFieldValue } from '../../helper';
import { computeExpr, getCellAxis } from './helper';
import getNumbers from '../../../../../utils/helper/getNumbers';
import { getCellsFromClipBoard } from '../../../../../components/VirtualizedDataSheet/helper';
import copyToClipBoard from '../../../../../utils/helper/copyToClipBoard';

class GridTableBase extends React.Component {
  /**
   * Handle `Key Down` Event
   *
   * @param {Event} evt
   */
  handleKeyDown = evt => {
    // keyCode detection
    const key = evt.which || evt.keyCode;

    // ctrl detection
    const ctrl = evt.ctrlKey ? evt.ctrlKey : key === 17;
    if (!ctrl) return;
    switch (key) {
      case 67: // Ctrl + C
        break;

      case 86: // Ctrl + V
        break;

      default:
        break;
    }
  };

  /**
   * Get Table Height
   *
   * @return {Number}
   */
  getTableHeight = containerHeight => {
    const { data } = this.props;

    let headerHeight = this.getHeaderHeight({ index: FIXED_ROWS > 1 ? 0 : 1 });
    if (FIXED_ROWS == 2) {
      headerHeight += this.getHeaderHeight({ index: 1 });
    }

    let height = data.length * ROW_HEIGHT + headerHeight || 40;

    const max = containerHeight;

    if (height > max) height = max;

    return height;
  };

  /**
   * Handle Any CHnage in Cell
   */
  handleTypingInCell = () => {
    // To Do
  };

  /**
   * Render Move Element
   *
   * @param {Object} provided
   * @param {Object} snapshot
   * @param {Object} rubric
   *
   * @return {HTML}
   */
  renderClone = (provided, snapshot, rubric) => {
    const { source: { index } = {} } = rubric || {};

    const rowLabel = get(this.props, `data.${index}.1.value`);

    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <Box
          component="div"
          bgcolor="primary.main"
          color="primary.contrastText"
          fontWeight="normal"
          display="flex"
          alignItems="center"
          height={32}
          width={200}
          px={2}
          borderRadius={4}
        >
          {`Moving ${rowLabel || 'Row'}`}
        </Box>
      </div>
    );
  };

  /**
   * Render Sheet
   */
  sheetRenderer = props => {
    const { headers } = this.props;

    return (
      <DragDropContext onDragEnd={this.onDragRow}>
        <Droppable
          key="dropable-cell"
          droppableId="dropable-cell"
          ignoreContainerClipping
          renderClone={this.renderClone}
        >
          {droppableProvided => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
            >
              {droppableProvided.placeholder}
              <SheetRenderer
                {...props}
                columns={headers}
                tableHeight={this.getTableHeight()}
              />
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
    // Need to update in header styles as well in HeaderCell component
    if (index == 0) return HEADER_INDEX_ROW;

    if (index == 1) return HEADER_PERIOD_ROW;

    return ROW_HEIGHT;
  };

  /**
   * Render Header for Mutli Grid
   *
   * @param {Object}
   *
   * @return {Number}
   */
  headerRenderer = props => {
    const { rowIndex, columnIndex } = props;

    const { tableWidth } = this.state;

    const {
      headers,
      data,
      setGridHeaders,
      tableWidth: tableWidthFromProps,
    } = this.props;

    const column = headers[columnIndex] || {};

    if (rowIndex == 0) {
      return (
        <HeaderCell
          column={column}
          rowIndex={rowIndex}
          colIndex={columnIndex}
          totalCols={headers.length}
          tableWidth={tableWidthFromProps || tableWidth}
        />
      );
    }

    const updateHeader = updatedHeader => {
      if (column.width == updatedHeader.width) return;

      headers[columnIndex] = updatedHeader;

      const updatedHeaders = headers.map((item, itemIndex) => {
        if (columnIndex < itemIndex - 1) return item;

        return {
          ...item,
          isUpdated: !item.isUpdated,
        };
      });

      setGridHeaders(updatedHeaders);
      this.props.handleHeadersUpdated();

      this.setState({ toggleHeaderResize: !this.state.toggleHeaderResize });
    };

    const handleHeaderDoubleClick = () => {
      try {
        const valuesArray = [];
        data.forEach(cols => {
          const { value } = cols[columnIndex] || {};
          if (value) valuesArray.push(Number(value));
        });

        const maxNumber = Math.max(...valuesArray);

        const { rowConfigs } = this.props;

        const cellValue = getFormattedCellValue({
          col: columnIndex,
          value: maxNumber,
          rowConfig: rowConfigs[rowIndex],
        });

        const cellEle = document.createElement('span');
        cellEle.innerText = `$${cellValue}`;
        document.body.appendChild(cellEle);

        let width = cellEle.offsetWidth + 30;
        width += 10;

        document.body.removeChild(cellEle);
        if (width < 100) return;

        updateHeader({ ...column, width });
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <HeaderCell
        column={column}
        rowIndex={rowIndex}
        colIndex={columnIndex}
        updateHeader={updateHeader}
        totalRows={data.length}
        totalCols={headers.length}
        updateState={this.updateState}
        handleDoubleClick={handleHeaderDoubleClick}
      />
    );
  };

  /**
   * Update Cell Programmatically
   */
  updateCellProgrammatically = ({ row, col, styles, isCut }) => {
    const { data, setGridData, rowConfigs, handleGridUpdated } = this.props;
    const { row_id } = rowConfigs[row] || {};

    const cell = data[row][col];

    if (styles) cell.styles = styles;

    if (isCut) cell.value = '';

    data[row][col] = cell;

    setGridData(data);

    handleGridUpdated({ [`${row_id}--${col}`]: cell.value });
  };

  /**
   * Paste Data in Cell Programmatically
   */
  pasteDataProgrammatically = async () => {
    const { selected } = this.state;
    const { data } = this.props;

    const { changes, additions } = await getCellsFromClipBoard({
      selected,
      data,
    });

    this.handleCellsChanged(changes, additions);
  };

  /**
   * Render Cell
   */
  cellRenderer = props => {
    const { row, col } = props;

    return (
      <Draggable
        key={`cell-${row}-${col}`}
        draggableId={`cell-${row}-${col}`}
        isDragDisabled
        index={row}
      >
        {draggableProvided => (
          <div
            className="dragable-cell"
            ref={draggableProvided.innerRef}
            {...draggableProvided.draggableProps}
            {...draggableProvided.dragHandleProps}
          >
            <CellRenderer
              {...props}
              labelCell={this.props.data[props.row][1]}
              onChange={this.handleTypingInCell}
              headers={this.props.headers}
              toggleSetupRow={this.toggleSetupRowVisibility}
              toggleRowContextMenu={this.toggleRowContextMenu}
              onContextMenu={event => {}} // To maintain the selection of cell we have to pass empty onContextMenu function to pass our custom context menu
              rowConfigs={this.props.rowConfigs}
              isViewMode={this.props.isViewMode}
              pasteDataProgrammatically={this.handleManualPaste}
              updateCellProgrammatically={this.updateCellProgrammatically}
              handleCopyCells={this.handleCopyCells}
              selection={this.state.selected}
              onUpdateSelection={this.onSelectCells}
            />
          </div>
        )}
      </Draggable>
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
    const { rowConfigs, headers } = this.props;
    const { expr = '', value = '' } = cell;

    const formulatedCellValue =
      expr && value == '' ? 0 : colIndex + 1 <= headers.length && value;
    return getFormattedCellValue({
      col: colIndex,
      // value: colIndex + 1 <= headers.length && cell?.value,
      value: formulatedCellValue,
      rowConfig: rowConfigs[rowIndex],
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
    if (colIndex <= 1) return cell?.value;

    if (cell.expr) return cell.expr;

    return cell.value ? cell.value.noExponents() : '';
  };

  /**
   * Handle copy cells
   */
  handleCopyCells = options => {
    try {
      const {
        event = {},
        dataRenderer = () => {},
        valueRenderer = () => {},

        range = {},
        isCopyValue = false,
        isCopyFormula = false,
      } = options || {};

      let { data = [], start = null, end = null } = options || {};

      if (!start || !end) {
        const { start: selStart, end: selEnd } = this.state?.selected || {};
        const { data: selData } = this.props;

        start = selStart;
        end = selEnd;
        data = selData;
      }

      const { i: iStart, j: jStart } = start;
      const { i: iEnd, j: jEnd } = end;

      let value = '';

      const iFrom = iStart < iEnd ? iStart : iEnd;
      const iTo = iStart > iEnd ? iStart : iEnd;

      const jFrom = jStart < jEnd ? jStart : jEnd;
      const jTo = jStart > jEnd ? jStart : jEnd;

      for (let i = iFrom; i <= iTo; i++) {
        for (let j = jFrom; j <= jTo; j++) {
          if (isCopyValue) {
            value += `${
              data[i][j].value !== undefined || data[i][j].value !== null
                ? data[i][j].value
                : ''
            }${j != jTo ? '\t' : ''}`;
          }

          if (isCopyFormula) {
            value += `${
              data[i][j].expr !== undefined || data[i][j].expr !== null
                ? data[i][j].expr
                : ''
            }${j != jTo ? '\t' : ''}`;
          }

          if (!isCopyFormula && !isCopyValue) {
            value += `${data[i][j].expr ? data[i][j].expr : data[i][j].value}${
              j != jTo ? '\t' : ''
            }`;
          }
        }

        value += `${i != iTo ? '\n' : ''}`;
      }

      this.setState({
        copyData: {
          event,
          dataRenderer,
          valueRenderer,
          data,
          start,
          end,
          range,
          copyText: value || '',
        },
      });
      copyToClipBoard(value);
    } catch (error) {
      console.error(error);
    }
  };

  handleManualPaste = async () => {
    const pastedText = await navigator.clipboard.readText();
    const updatedMatrix = this.handlePasteCells(pastedText);
    const { data } = this.props;

    const updatedCells = [];

    const {
      start: { i: iStart, j: jStart },
      end: { i: iEnd, j: jEnd },
    } = this.state.selected || {};

    const {
      start: { i: iStartCopy, j: jStartCopy } = {},
      end: { i: iEndCopy, j: jEndCopy } = {},
    } = this.state.copyData || {};

    // const copyiStart = iStartCopy < iEndCopy ? iStartCopy : iEndCopy;
    const copyiEnd = iStartCopy > iEndCopy ? iStartCopy : iEndCopy;

    // const copyjStart = jStartCopy < jEndCopy ? jStartCopy : jEndCopy;
    const copyjEnd = jStartCopy > jEndCopy ? jStartCopy : jEndCopy;

    const iFrom = iStart < iEnd ? iStart : iEnd;
    let iTo = iStart > iEnd ? iStart : iEnd;

    const jFrom = jStart < jEnd ? jStart : jEnd;
    let jTo = jStart > jEnd ? jStart : jEnd;

    iTo = iTo < copyiEnd ? copyiEnd : iTo + 1;

    if (iFrom !== iTo && !this.state.copyData && updatedMatrix.length > 0) {
      iTo = iFrom + updatedMatrix.length - 1;
      jTo = jFrom + updatedMatrix[0].length - 1;
    }

    range(iFrom, iTo + 1).map((row, rowIndex) => {
      return range(jFrom, jTo < copyjEnd ? copyjEnd : jTo + 1).map(
        (col, colIndex) => {
          let cell = {};

          if (rowIndex < data.length) {
            cell = {
              row,
              col,
              value: updatedMatrix[rowIndex][colIndex],
            };

            updatedCells.push(cell);
          }

          return cell;
        }
      );
    });

    // Update cells
    this.handleCellsChanged(updatedCells, []);
  };

  /**
   * Handle paste of cells
   *
   * @param {String} pastedText
   * @param {Bool} isManualPasted
   * @returns {Array}
   */
  handlePasteCells = pastedText => {
    const {
      start: { i: iStart, j: jStart } = {},
      end: { i: iEnd, j: jEnd } = {},
    } = this.state.copyData || {};

    const cells = pastedText.split(/\r\n|\n|\r/).map(row => row.split('\t'));

    if (!this.state.copyData) return cells;

    const copyiStart = iStart < iEnd ? iStart : iEnd;
    const copyiEnd = iStart > iEnd ? iStart : iEnd;

    const copyjStart = jStart < jEnd ? jStart : jEnd;
    const copyjEnd = jStart > jEnd ? jStart : jEnd;

    /**
     * Get array of copied row and col
     * @returns {Array}
     */
    const getCopiedArray = () => {
      const {
        start: { i: iStart, j: jStart } = {},
        end: { i: iEnd, j: jEnd } = {},
      } = this.state.copyData || {};

      const iFrom = iStart < iEnd ? iStart : iEnd;
      const iTo = iStart > iEnd ? iStart : iEnd;

      const jFrom = jStart < jEnd ? jStart : jEnd;
      const jTo = jStart > jEnd ? jStart : jEnd;

      return range(iFrom, iTo + 1).map(row => {
        return range(jFrom, jTo + 1).map(col => {
          return {
            row,
            col,
          };
        });
      });
    };

    /**
     * Get array of pasted row and col
     * @returns {Array}
     */
    const getPastedArray = () => {
      const {
        start: { i: iStart, j: jStart },
        end: { i: iEnd, j: jEnd },
      } = this.state.selected || {};

      const iFrom = iStart < iEnd ? iStart : iEnd;
      let iTo = iStart > iEnd ? iStart : iEnd;

      const jFrom = jStart < jEnd ? jStart : jEnd;
      let jTo = jStart > jEnd ? jStart : jEnd;

      const copyiFrom = copyiStart < copyiEnd ? copyiStart : copyiEnd;
      const copyiTo = copyiStart > copyiEnd ? copyiStart : copyiEnd;

      const copyjFrom = copyjStart < copyjEnd ? copyjStart : copyjEnd;
      const copyjTo = copyjStart > copyjEnd ? copyjStart : copyjEnd;

      iTo = iFrom + copyiTo - copyiFrom;
      jTo = jFrom + copyjTo - copyjFrom;

      return range(iFrom, iTo + 1).map(row => {
        return range(jFrom, jTo + 1).map(col => {
          return {
            row,
            col,
          };
        });
      });
    };

    const copyIndexs = getCopiedArray();
    const pasteIndexs = getPastedArray();

    const { start, end } = this.state.selected || {};
    const selectedNumberOfRows = Math.abs(end.i - start.i) + 1;
    const selectedNumberOfCols = Math.abs(end.j - start.j) + 1;

    if (cells.length === 0) return [];

    const [firstCell = []] = cells || [];
    const rows = Math.max(selectedNumberOfRows, cells.length);
    const cols = Math.max(selectedNumberOfCols, firstCell.length);

    return range(rows).map((row, rowIndex) => {
      return range(cols).map((col, colIndex) => {
        let value = cells[row % cells.length][col % firstCell.length];

        // Identify the length of copy and pasted array
        if (row % cells.length > copyIndexs.length) return value;

        // Identify the first cell length of copy and pasted array
        const [copyFirstCell = []] = copyIndexs[row % cells.length] || [];
        if (col % firstCell.length > copyFirstCell.length - 1) return value;

        const { row: copyRow, col: copyCol } =
          copyIndexs[row % cells.length][col % firstCell.length] || {};

        let { col: pasteCol, row: pasteRow } =
          pasteIndexs[row % cells.length][col % firstCell.length] || {};

        if (
          (copyiStart === copyiEnd && copyjStart === copyjEnd) ||
          !(pasteIndexs[row] && pasteIndexs[row][col])
        ) {
          pasteCol += colIndex - (col % firstCell.length);

          if (col % cells.length === 0 || copyIndexs.length > pasteRow) {
            pasteRow += rowIndex - (row % cells.length);
          }
        }

        if (value && String(value).charAt(0) != '=') {
          return value;
        }

        const regx = /([A-Z])+/;
        if (
          value &&
          String(value).charAt(0) == '=' &&
          !regx.test(String(value))
        ) {
          return value;
        }

        if (value && String(value).charAt(0) == '=') {
          const tokens = getCellAxis({
            expr: value,
            row: copyRow,
            col: copyCol,
          });

          const obj = {};
          tokens.forEach(token => {
            let row = pasteRow - token.x;
            let col = pasteCol - token.y;

            row += 1;
            col -= 1;

            const updatedIndex =
              col > 0 && row > 0
                ? `${getAlphabetColumnName(col)}${row}`
                : `Error`;

            obj[token.cellIndex] = updatedIndex ? updatedIndex : '';
          });

          // Create dynamic regx to replace string
          const reg = new RegExp(Object.keys(obj).join('|'), 'gi');
          value = value.replace(reg, matched => {
            if (!matched) return '';

            return obj[matched];
          });

          return value;
        }

        return value;
      });
    });
  };

  /**
   * Handle Changed Values of Cells
   *
   * @param {Array} updatedCells
   * @param {Array} newCells
   */
  handleCellsChanged = async (updatedCells = [], newCells = []) => {
    // const allCells = [...updatedCells, ...newCells];
    const newChanges = {};
    const {
      setGridData,
      setFormulaCell,
      setRowConfigs,
      deleteFormulaCell,
      rowConfigs,
      gridDataTable,
      handleGridUpdated,
    } = this.props;

    const { data } = this.props;

    let isUpdateRowConfigs = false;
    let willAddNewRow = false;

    const { selected } = this.state;
    const {
      start: { i: iStart, j: jStart },
      end: { i: iEnd, j: jEnd },
    } = selected;

    /**
     * Paste value into single/Multi Cells
     *
     * @returns {Array}
     */
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

    let scope = { ...gridDataTable };

    updatedCells.forEach(({ row, col, value }) => {
      const rowConfig = rowConfigs[row] || {};

      const { fieldType } = rowConfig || {};

      if (!data[row]) data[row] = [];
      if (!data[row][col]) data[row][col] = {};

      let validValue = '';
      let error = '';
      let expr = '';
      let className = '';

      if (col == 1) {
        validValue = String(value || '').trim();
        error = this.validateRowName(validValue);
      } else {
        const trailKey = `${getAlphabetColumnName(col - 1)}${row + 1}`;

        const {
          className: customClasses = '',
          expr: computedExpr = '',
          value: computedVal = '',
          scope: updatedScope,
        } = computeExpr(trailKey, value?.toUpperCase(), cloneDeep(scope));
        scope = updatedScope;

        const validNumber = getNumbers(computedVal, true);
        validValue = String(validNumber);

        if (expr && validValue && fieldType === FIELD_TYPE_KEYS.percentage) {
          // If row field type is percentage then multiplicate real value by 100
          validValue = getPercentageFieldValue(fieldType, validValue, true);
        }

        expr = computedExpr;
        className = customClasses;

        if (expr) {
          setFormulaCell({
            cellIndex: trailKey,
            row,
            col,
          });
        }

        if (
          data[row][col]?.expr &&
          data[row][col]?.expr.charAt(0) == '=' &&
          !expr
        ) {
          deleteFormulaCell(trailKey);
        }

        if (!validValue) validValue = '';
      }

      let { row_id } = rowConfig;

      // Assign New Row ID
      if (!row_id) {
        isUpdateRowConfigs = true;
        row_id = `NEW_ROW_${row}`;

        if (rowConfigs[row]) {
          rowConfigs[row].row_id = row_id;
        }
      }

      newChanges[`${row_id}--${col}`] = validValue;

      data[row][col] = {
        ...data[row][col],
        className,
        error,
        expr,
        value: validValue,
      };

      if (row == data.length - 1) willAddNewRow = true;
    });

    if (isUpdateRowConfigs) setRowConfigs(rowConfigs);

    setGridData(data).then(({ scope = {} }) => {
      this.reCompileGridDataBeign(scope);
    });

    handleGridUpdated(newChanges, { isNewRow: isUpdateRowConfigs });

    if (willAddNewRow) {
      setTimeout(() => {
        this.activeRowIndex = rowConfigs.length - 1;
        this.insertEmptyRow();
      }, 200);
    }
  };

  /**
   * Validate Row Name
   *
   * @param {String} newName
   *
   * @return {String}
   */
  validateRowName = newName => {
    const duplicate = this.props.data.find(
      row => (row[1] || {}).value == newName
    );

    if (duplicate) return MODELS_MSG.duplicate_row_label;

    return '';
  };

  /**
   * Show Error message for MAX Rows
   */
  showMaxRowsError = () => {
    let msg = MODELS_MSG.model_max_rows;
    msg = msg.replace('#ROWS#', MAX_ROWS);

    showErrorMsg(msg);
  };

  /**
   * Verify > Is allow New Row
   *
   * @param {Boolean} showErr
   *
   * @return {Boolean}
   */
  isAllowNewRow = (showErr = true) => {
    const { data } = this.props;

    if (data.length == MAX_ROWS) {
      if (showErr) this.showMaxRowsError();
      return false;
    }

    return true;
  };
}

GridTableBase.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  deleteFormulaCell: func.isRequired,
  gridDataTable: shape({}),
  handleGridUpdated: func,
  handleHeadersUpdated: func.isRequired,
  headers: arrayOf(shape({})),
  isViewMode: bool,
  rowConfigs: arrayOf(shape({})),
  setFormulaCell: func.isRequired,
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
  setRowConfigs: func,
  sheetHeight: number,
  tableWidth: number,
};

GridTableBase.defaultProps = {
  isViewMode: false,
  data: [],
  handleGridUpdated: () => {},
  headers: [],
  rowConfigs: [],
  setGridData: () => {},
  setFormulaCell: () => {},
  sheetHeight: 0,
};

export default GridTableBase;
