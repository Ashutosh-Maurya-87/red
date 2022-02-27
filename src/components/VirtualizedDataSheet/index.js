import { func, number } from 'prop-types';
import React from 'react';

import ReactDatSheet from 'react-datasheet';
import DataCell from 'react-datasheet/lib/DataCell';

import CustomMultiGrid from '../CustomMultiGrid';

import {
  HEADER_INDEX_ROW,
  HEADER_PERIOD_ROW,
} from '../../views/Models/ModelWorkbook/configs';

class VirtualizedDataSheet extends ReactDatSheet {
  componentDidUpdate(prevProps, nextProps) {
    try {
      if (prevProps.toggleHeaderResize != nextProps.toggleHeaderResize) {
        if (this.girdRef.current) this.girdRef.current.recomputeGridSize();
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Virtual Grid Ref
   */
  girdRef = React.createRef();

  /**
   * Render Data Cell
   *
   * @param {Object} props
   */
  renderCustomDataCell = props => {
    const { fixedRowsCustom } = this.props;

    const { style, columnIndex: j, isScrolling = false } = props;
    let { rowIndex: i } = props;

    const key = `${i}-${j}`;

    i -= fixedRowsCustom;

    const {
      cellRenderer,
      dataRenderer,
      valueRenderer,
      dataEditor,
      valueViewer,
      attributesRenderer,
      data,
    } = this.props;

    const { forceEdit } = this.state;
    const row = data[i];
    const cell = row[j];

    return (
      <span style={style} key={`cell-${key}`}>
        <DataCell
          key={key}
          row={i}
          col={j}
          cell={cell}
          forceEdit={forceEdit}
          onMouseDown={this.onMouseDown}
          onMouseOver={this.onMouseOver}
          onDoubleClick={this.onDoubleClick}
          onContextMenu={this.onContextMenu}
          onChange={this.onChange}
          onRevert={this.onRevert}
          onNavigate={this.handleKeyboardCellMovement}
          onKey={this.handleKey}
          selected={this.isSelected(i, j)}
          editing={!isScrolling ? this.isEditing(i, j) : false}
          clearing={this.isClearing(i, j)}
          selectedClasses={this.getSelectedCellClasses(i, j)}
          attributesRenderer={attributesRenderer}
          cellRenderer={cellRenderer}
          valueRenderer={valueRenderer}
          dataRenderer={dataRenderer}
          valueViewer={valueViewer}
          dataEditor={dataEditor}
        />
      </span>
    );
  };

  /**
   * Render Virtualized Cell
   *
   * @param {Object} props
   */
  renderVirtualCell = props => {
    const { fixedRowsCustom, headerRenderer, headers } = this.props;
    const { style, rowIndex: i, columnIndex: j } = props;

    const header = headers[j] || {};
    const key = `header-${i}-${j}-${header.isUpdated}`;

    if (fixedRowsCustom > 0 && i == 0) {
      return (
        <span style={style} key={key}>
          {headerRenderer(props)}
        </span>
      );
    }

    if (fixedRowsCustom > 1 && i == 1) {
      return (
        <span style={style} key={key}>
          {headerRenderer(props)}
        </span>
      );
    }

    return this.renderCustomDataCell(props);
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  handleScrollEvent = evt => {
    let { target } = evt;
    if (!target) target = evt;

    try {
      if (!this.girdRef.current) return;

      this.girdRef.current._onScroll(target);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Get Column Width
   *
   * @param {Object}
   *
   * @return {Number}
   */
  getColumnWidth = ({ index }) => {
    const { width = 0 } = this.props.headers[index] || {};

    return width;
  };

  /**
   * Get Row Height
   *
   * @param {Object}
   *
   * @return {Number}
   */
  getRowHeight = ({ index }) => {
    const { fixedRowsCustom, getHeaderHeight } = this.props;

    if (fixedRowsCustom > 0 && index == 0) return getHeaderHeight({ index });

    if (fixedRowsCustom > 1 && index == 1) return getHeaderHeight({ index });

    return this.props.rowHeight;
  };

  /**
   * Render View
   */
  render() {
    const {
      sheetRenderer: SheetRenderer,
      className,
      overflow,
      data,
      tableHeight,
      tableWidth,
      headers,
      selected,
      rowHeight,
      containerHeight,

      fixedRowsCustom,
      fixedColumnsCustom,
    } = this.props;

    return (
      <span
        ref={r => {
          this.dgDom = r;
        }}
        tabIndex="0"
        className="data-grid-container"
        onKeyDown={this.handleKey}
      >
        <SheetRenderer
          data={data}
          handleScrollEvent={this.handleScrollEvent}
          className={['data-grid', className, overflow]
            .filter(Boolean)
            .join(' ')}
        >
          <CustomMultiGrid
            ref={this.girdRef}
            selected={selected}
            height={tableHeight}
            width={tableWidth}
            columnWidth={this.getColumnWidth}
            rowHeight={this.getRowHeight}
            rowCount={data.length + fixedRowsCustom}
            columnCount={headers.length}
            overscanRowCount={5}
            overscanColumnCount={2}
            fixedColumnCount={fixedColumnsCustom}
            fixedRowCount={fixedRowsCustom}
            cellRenderer={this.renderVirtualCell}
            hideTopRightGridScrollbar
            hideTopLeftGridScrollbar
            hideBottomLeftGridScrollbar
            enableFixedRowScroll
            // enableFixedColumnScroll
            styleTopRightGrid={{
              overflowX: 'hidden',
              overflowY: 'hidden',
            }}
            styleBottomRightGrid={{
              overflowY:
                containerHeight - HEADER_INDEX_ROW - HEADER_PERIOD_ROW <
                rowHeight * data.length
                  ? 'visible'
                  : 'hidden',
              left: 0,
            }}
            handleBottomRightScroll={this.handleScrollEvent}
          />
        </SheetRenderer>
      </span>
    );
  }
}

VirtualizedDataSheet.propTypes = {
  fixedColumnsCustom: number,
  fixedRowsCustom: number,
  getHeaderHeight: func,
  headerRenderer: func,
};

VirtualizedDataSheet.defaultProps = {
  fixedColumnsCustom: 0,
  fixedRowsCustom: 0,
  headerRenderer: () => {},
  getHeaderHeight: () => 60,
};

export default VirtualizedDataSheet;
