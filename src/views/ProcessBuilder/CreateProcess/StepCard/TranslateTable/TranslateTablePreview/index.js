import React from 'react';
import { arrayOf, shape, func, number, string } from 'prop-types';

import SheetRenderer from './SheetRenderer';
import CellRenderer from './CellRenderer';
import VirtualizedDataSheet from './VirtualizedSheet';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
} from '../../../../../../configs/app';
import getFormattedNumber from '../../../../../../utils/helper/getFormattedNumber';
import { getValueAsPerType } from '../../../../../SourceTables/ProcessImportedTable/helper';

import './style.scss';

const ROW_HEIGHT = 32;

class TranslateTablePreview extends React.Component {
  state = {
    tableWidth: 0,
    toggleHeaderResize: false,
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
   * Update State
   *
   * @param {Obejct} data
   */
  updateState = data => {
    this.setState(data);
  };

  /**
   * Calculate Virtual table Width
   */
  calculateTableWidth = () => {
    const setWidth = () => {
      const id = `data-header-${this.props.stepNumber}`;

      const headerEle = document.getElementById(`${id}-2`);

      if (!headerEle) return;

      const tableWidth = headerEle.offsetWidth || 0;

      this.setState({ tableWidth });
    };

    this.setState({ tableWidth: 0 }, setWidth);
  };

  /**
   * Render Sheet
   */
  sheetRenderer = props => {
    const {
      columns,
      updateColumn,
      deleteColumn,
      handleColumnAction,
      stepNumber,
      headings,
      tableHeight,
      headersToCompare,
      headersToUpdate,
      tableColumns,
      handleUpdateFields,
      handleCompareFields,
    } = this.props;

    const { toggleHeaderResize, tableWidth } = this.state;

    return (
      <SheetRenderer
        {...props}
        stepNumber={stepNumber}
        columns={columns}
        headings={headings}
        updateColumn={updateColumn}
        deleteColumn={deleteColumn}
        handleColumnAction={handleColumnAction}
        tableHeight={tableHeight}
        headersToCompare={headersToCompare}
        headersToUpdate={headersToUpdate}
        tableColumns={tableColumns}
        handleUpdateFields={handleUpdateFields}
        handleCompareFields={handleCompareFields}
        updateState={this.updateState}
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
      handleRowAction,
      headersToCompare,
      tableColumns,
      handleUpdateCell,
      stepNumber,
    } = this.props;

    return (
      <CellRenderer
        {...props}
        columns={columns}
        handleRowAction={handleRowAction}
        headersToCompare={headersToCompare}
        tableColumns={tableColumns}
        handleUpdateCell={handleUpdateCell}
        totalRows={grid.length}
        stepNumber={stepNumber}
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

    const {
      data_type: dataType,
      date_format: dateFormat = DEFAULT_DATE_FORMAT,
    } = columns[colIndex] || {};

    if (dataType != COLUMN_DATA_TYPES_KEYS.amount) {
      return getValueAsPerType({ value: cell.value, dataType, dateFormat });
    }

    return getFormattedNumber(cell.value);
  };

  /**
   * Render View
   */
  render() {
    const {
      columns,
      grid,
      handleCellsChanged,
      tableHeight,
      stepNumber,
    } = this.props;

    const { toggleHeaderResize, tableWidth } = this.state;

    return (
      <VirtualizedDataSheet
        toggleHeaderResize={toggleHeaderResize}
        data={grid}
        headers={columns}
        className="custom-sheet translate-table-data-grid"
        sheetRenderer={this.sheetRenderer}
        rowRenderer={this.rowRenderer}
        cellRenderer={this.cellRenderer}
        headerRenderer={this.headerRenderer}
        valueRenderer={this.valueRenderer}
        dataRenderer={cell => cell.value}
        onCellsChanged={handleCellsChanged}
        rowHeight={ROW_HEIGHT}
        tableHeight={tableHeight + 5}
        tableWidth={tableWidth}
        getHeaderHeight={() => ROW_HEIGHT}
        stepNumber={stepNumber}
      />
    );
  }
}

TranslateTablePreview.propTypes = {
  columns: arrayOf(shape({})),
  deleteColumn: func,
  firstColWidth: string,
  grid: arrayOf(arrayOf(shape({}))),
  handleCellsChanged: func,
  handleColumnAction: func,
  handleCompareFields: func,
  handleRowAction: func,
  handleUpdateCell: func,
  handleUpdateFields: func,
  headersToCompare: arrayOf(shape({})),
  headersToUpdate: arrayOf(shape({})),
  headings: arrayOf(shape({})),
  stepNumber: number,
  tableColumns: arrayOf(shape({})),
  tableHeight: number,
  updateColumn: func,
};

TranslateTablePreview.defaultProps = {
  columns: [],
  grid: [],
  handleCellsChanged: () => {},
  handleRowAction: () => {},
  updateColumn: () => {},
  deleteColumn: () => {},
  handleColumnAction: () => {},
  headings: [],
  handleUpdateCell: () => {},
};

export default TranslateTablePreview;
