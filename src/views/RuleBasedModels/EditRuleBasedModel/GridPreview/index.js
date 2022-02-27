import React from 'react';
import { arrayOf, shape, number, func, bool } from 'prop-types';

import { ClickAwayListener } from '@material-ui/core';
import SheetRenderer from './SheetRenderer';
import CellRenderer from './CellRenderer';
import VirtualizedDataSheet from './VirtualizedSheet';

import { getFormattedCellValue } from './helper';
import { DEFAULT_DATE_FORMAT } from '../../../../configs/app';

import './style.scss';

const ROW_HEIGHT = 32;

class GridPreview extends React.Component {
  state = {
    tableWidth: 0,
    toggleHeaderResize: false,
    selected: {},
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('resize', this.calculateTableWidth);

    setTimeout(() => this.calculateTableWidth(), 1);
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.calculateTableWidth);
  }

  /**
   * Update headers data
   *
   * @param {Array} headers
   */
  handleUpdateHeaders = (headers = []) => {
    const { onHeaderUpdate = () => {} } = this.props || {};

    onHeaderUpdate(headers);
  };

  /**
   * Calculate Virtual table Width
   */
  calculateTableWidth = () => {
    const setWidth = () => {
      const id = `data-header-0`;

      const headerEle = document.getElementById(`${id}-2`);

      if (!headerEle) return;

      const tableWidth = headerEle.offsetWidth || 0;

      this.setState({ tableWidth });
    };

    this.setState({ tableWidth: 0 }, setWidth);
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
   * On Change > Cells Selection
   *
   * @param {Object} selected
   */
  onSelectCells = selected => {
    try {
      const { columns = [] } = this.props;

      const {
        start: { j: jStart },
        end: { j: jEnd },
      } = selected;

      if (jStart == 0 && jEnd == 0) {
        selected = {
          start: {
            ...selected.start,
            j: 0,
          },
          end: {
            ...selected.end,
            j: columns.length - 1,
          },
        };
      }

      this.setState({ selected });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Render Sheet
   */
  sheetRenderer = props => {
    const { columns, tableHeight } = this.props;

    const { toggleHeaderResize, tableWidth } = this.state;

    return (
      <SheetRenderer
        {...props}
        columns={columns}
        tableHeight={tableHeight}
        onHeadersUpdate={this.handleUpdateHeaders}
        toggleHeaderResize={toggleHeaderResize}
        tableWidth={tableWidth}
      />
    );
  };

  /**
   * Render Row
   */
  rowRenderer = props => props.children;

  /**
   * Render Cell
   */
  cellRenderer = props => {
    const {
      grid,
      columns,
      isContextMenuEnable,
      contextMenuOptions,
      onClickRowAction,
    } = this.props;

    return (
      <CellRenderer
        {...props}
        columns={columns}
        totalRows={grid.length}
        onContextMenu={evt => {}}
        isContextMenuEnable={isContextMenuEnable}
        contextMenuOptions={contextMenuOptions}
        selection={this.state.selected}
        onUpdateSelection={this.onSelectCells}
        onClickRowAction={onClickRowAction}
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
    const { columns } = this.props;

    const { dataType, dateFormat = DEFAULT_DATE_FORMAT } =
      columns[colIndex] || {};

    return getFormattedCellValue(dataType, dateFormat, cell?.value);
  };

  /**
   * Render View
   */
  render() {
    const { columns, grid, tableHeight, hasLoadMore, onLoadMore } = this.props;

    const { toggleHeaderResize, tableWidth, selected } = this.state;

    return (
      <>
        <ClickAwayListener
          mouseEvent="onMouseDown"
          touchEvent="onTouchStart"
          onClickAway={this.onSelectionRemove}
        >
          <VirtualizedDataSheet
            toggleHeaderResize={toggleHeaderResize}
            data={grid}
            headers={columns}
            className="custom-sheet rbm-table-data-grid"
            sheetRenderer={this.sheetRenderer}
            rowRenderer={this.rowRenderer}
            cellRenderer={this.cellRenderer}
            headerRenderer={this.headerRenderer}
            valueRenderer={this.valueRenderer}
            dataRenderer={cell => cell.value}
            rowHeight={ROW_HEIGHT}
            tableHeight={tableHeight + 5}
            tableWidth={tableWidth}
            getHeaderHeight={() => ROW_HEIGHT}
            hasLoadMore={hasLoadMore}
            onLoadMore={onLoadMore}
            selected={selected}
            onSelect={this.onSelectCells}
          />
        </ClickAwayListener>
      </>
    );
  }
}

GridPreview.propTypes = {
  columns: arrayOf(shape({})),
  contextMenuOptions: arrayOf(shape({})),
  grid: arrayOf(arrayOf(shape({}))),
  hasLoadMore: bool,
  isContextMenuEnable: bool,
  onClickRowAction: func,
  onHeaderUpdate: func,
  onLoadMore: func,
  tableHeight: number,
};

GridPreview.defaultProps = {
  isContextMenuEnable: false,
  columns: [],
  grid: [],
  contextMenuOptions: {},
  onHeaderUpdate: () => {},
  onClickRowAction: () => {},
};

export default GridPreview;
