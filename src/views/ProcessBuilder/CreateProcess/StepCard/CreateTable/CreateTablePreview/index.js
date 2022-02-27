import React from 'react';
import { arrayOf, shape, func, number, string } from 'prop-types';

import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import ReactDataSheet from 'react-datasheet';
import { ClickAwayListener } from '@material-ui/core';
import SheetRenderer from './SheetRenderer';
import CellRenderer from './CellRenderer';

import { COLUMN_DATA_TYPES_KEYS } from '../../../../../../configs/app';
import getFormattedNumber from '../../../../../../utils/helper/getFormattedNumber';

import './style.scss';

class CreateTablePreview extends React.Component {
  /**
   * State
   */
  state = {
    selected: {},
  };

  /**
   * On Drag End
   */
  onDragEnd = () => {};

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
      firstColWidth,
      tableHeight,
    } = this.props;

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable key="dropable-cell" droppableId="dropable-cell">
          {droppableProvided => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
            >
              <SheetRenderer
                {...props}
                tableHeight={tableHeight}
                stepNumber={stepNumber}
                columns={columns}
                updateColumn={updateColumn}
                deleteColumn={deleteColumn}
                handleColumnAction={handleColumnAction}
                firstColWidth={firstColWidth}
              />

              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  /**
   * Render Row
   */
  rowRenderer = props => (
    <div className="data-row flex-fill" key={props.row}>
      {props.children}
    </div>
  );

  /**
   * Render Cell
   */
  cellRenderer = props => {
    const { columns, handleRowAction, firstColWidth } = this.props;

    return (
      <CellRenderer
        columns={columns}
        handleRowAction={handleRowAction}
        firstColWidth={firstColWidth}
        {...props}
      />
    );
  };

  /**
   * on Changes > Cells Selection
   *
   * @param {Object} selected
   */
  onSelectCells = selected => {
    try {
      const { columns } = this.props;

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
   * On Click outside > Remove cell selection
   */
  onSelectionRemove = () => {
    this.setState({ selected: {} });
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

    if (
      colIndex == 0 ||
      columns[colIndex].dataType != COLUMN_DATA_TYPES_KEYS.amount
    ) {
      return cell.value;
    }

    return getFormattedNumber(cell.value);
  };

  /**
   * Render View
   */
  render() {
    const { selected } = this.state;

    return (
      <ClickAwayListener
        mouseEvent="onMouseDown"
        touchEvent="onTouchStart"
        onClickAway={this.onSelectionRemove}
      >
        <ReactDataSheet
          data={this.props.grid}
          className="custom-sheet"
          sheetRenderer={this.sheetRenderer}
          rowRenderer={this.rowRenderer}
          cellRenderer={this.cellRenderer}
          valueRenderer={this.valueRenderer}
          dataRenderer={cell => cell.value}
          onCellsChanged={this.props.handleCellsChanged}
          onSelect={this.onSelectCells}
          selected={selected}
        />
      </ClickAwayListener>
    );
  }
}

CreateTablePreview.propTypes = {
  columns: arrayOf(shape({})),
  deleteColumn: func,
  firstColWidth: string,
  grid: arrayOf(arrayOf(shape({}))),
  handleCellsChanged: func,
  handleColumnAction: func,
  handleRowAction: func,
  stepNumber: number,
  tableHeight: number,
  updateColumn: func,
};

CreateTablePreview.defaultProps = {
  columns: [],
  grid: [],
  handleCellsChanged: () => {},
  handleRowAction: () => {},
  updateColumn: () => {},
  deleteColumn: () => {},
  handleColumnAction: () => {},
  firstColWidth: '50px',
};

export default CreateTablePreview;
