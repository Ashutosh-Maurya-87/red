/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import ReactDataSheet from 'react-datasheet';

import SheetRenderer from './SheetRenderer';
import RowRenderer from './RowRenderer';
import CellRenderer from './CellRenderer';

import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import getFormattedNumber from '../../../../utils/helper/getFormattedNumber';

import './style.scss';

class ImportedTablePreview extends PureComponent {
  /**
   * State
   */
  state = {
    selections: [],
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.setSelectedRowsOnload();
  }

  /**
   * Set selection on Onload
   */
  setSelectedRowsOnload = () => {
    const selections = [];

    this.props.grid.forEach(() => {
      selections.push(false);
    });

    this.setState({ selections });
  };

  /**
   * Handle Click > Select|Unselect all Rows
   */
  handleSelectAllChanged = selected => {
    const selections = this.state.selections.map(s => selected);

    this.setState({ selections });
  };

  /**
   * Handle Click > Select|Unselect specific Row
   */
  handleSelectChanged = (index, selected) => {
    const selections = [...this.state.selections];
    selections[index] = selected;
    this.setState({ selections });
  };

  /**
   * Render Sheet
   */
  sheetRenderer = props => {
    const { selections } = this.state;

    const {
      columns,
      selectedHeaders,
      importedHeaders,
      transposedHeaders,
      handleSelectedHeadings,
      areHeadersSelectable,
      isHeaderCheckbox,
      updateColumn,
      deleteColumn,
      showDataType,
      isReloadTable,
      scrollHeight,
    } = this.props;

    return (
      <SheetRenderer
        {...props}
        columns={columns}
        selections={selections}
        onSelectAllChanged={this.handleSelectAllChanged}
        selectedHeaders={selectedHeaders}
        importedHeaders={importedHeaders}
        transposedHeaders={transposedHeaders}
        handleSelectedHeadings={handleSelectedHeadings}
        areHeadersSelectable={areHeadersSelectable}
        isHeaderCheckbox={isHeaderCheckbox}
        updateColumn={updateColumn}
        deleteColumn={deleteColumn}
        showDataType={showDataType}
        scrollHeight={scrollHeight}
        isReloadTable={isReloadTable}
      />
    );
  };

  /**
   * Render Row
   */
  rowRenderer = props => {
    const { selections } = this.state;

    return (
      <RowRenderer
        selected={selections[props.row] || false}
        onSelectChanged={this.handleSelectChanged}
        className="data-row flex-fill"
        {...props}
      />
    );
  };

  /**
   * Render Cell
   */
  cellRenderer = props => {
    return <CellRenderer as="div" columns={this.props.columns} {...props} />;
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

    if (columns[colIndex].dataType != COLUMN_DATA_TYPES_KEYS.amount) {
      return cell.value;
    }

    return getFormattedNumber(cell.value);
  };

  /**
   * Render View
   */
  render() {
    return (
      <>
        <ReactDataSheet
          data={this.props.grid}
          className="custom-sheet"
          sheetRenderer={this.sheetRenderer}
          rowRenderer={this.rowRenderer}
          cellRenderer={this.cellRenderer}
          valueRenderer={this.valueRenderer}
          dataRenderer={cell => cell.value}
          onCellsChanged={this.props.handleCellsChanged}
        />
      </>
    );
  }
}

ImportedTablePreview.defaultProps = {
  handleSelectedHeadings: () => {},
  columns: [],
  grid: [],
  selections: [],
  areHeadersSelectable: false,
  isHeaderCheckbox: false,
  selectedHeaders: {},
  scrollHeight: '200px',
  showDataType: false,
  importedHeaders: {},
  transposedHeaders: {},
  isReloadTable: false,
};

export default ImportedTablePreview;
