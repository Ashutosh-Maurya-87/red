import { bool, func, number } from 'prop-types';
import React from 'react';

import ReactDatSheet from 'react-datasheet';
import DataCell from 'react-datasheet/lib/DataCell';
import { Grid } from 'react-virtualized';

class VirtualizedDataSheet extends ReactDatSheet {
  /**
   * Store last scroll value
   */
  lastScrollTop = 0;

  /**
   * Virtual Grid Ref
   */
  girdRef = React.createRef();

  /**
   * When Component Did Update
   *
   * @param {Object} prevProps
   * @param {Object} nextProps
   */
  componentDidUpdate(prevProps, nextProps) {
    if (prevProps.toggleHeaderResize != nextProps.toggleHeaderResize) {
      if (this.girdRef.current) this.girdRef.current.recomputeGridSize();
    }
  }

  /**
   * Render Data Cell
   *
   * @param {Object} props
   */
  renderCustomDataCell = props => {
    const { style, columnIndex: j } = props;
    const { rowIndex: i } = props;

    const key = `${i}-${j}`;

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
    const cell = row[j] || {};

    return (
      <div style={style} key={`cell-${key}`}>
        <DataCell
          key={key}
          row={i}
          col={j}
          cell={cell}
          forceEdit={forceEdit}
          as="div"
          onMouseDown={this.onMouseDown}
          onMouseOver={this.onMouseOver}
          onDoubleClick={this.onDoubleClick}
          selectedClasses={this.getSelectedCellClasses(i, j)}
          onContextMenu={this.onContextMenu}
          onChange={this.onChange}
          onRevert={this.onRevert}
          onNavigate={this.handleKeyboardCellMovement}
          onKey={this.handleKey}
          selected={this.isSelected(i, j)}
          editing={this.isEditing(i, j)}
          clearing={this.isClearing(i, j)}
          attributesRenderer={attributesRenderer}
          cellRenderer={cellRenderer}
          valueRenderer={valueRenderer}
          dataRenderer={dataRenderer}
          valueViewer={valueViewer}
          dataEditor={dataEditor}
        />
      </div>
    );
  };

  /**
   * Render Virtualized Cell
   *
   * @param {Object} props
   */
  renderVirtualCell = props => {
    return this.renderCustomDataCell(props);
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  handleScrollEvent = evt => {
    const { clientHeight, scrollHeight, scrollTop, scrollLeft } = evt || {};
    const { onLoadMore, hasLoadMore = false } = this.props || {};

    try {
      if (!this.girdRef.current) return;

      this.girdRef.current.handleScrollEvent(evt);

      const height = scrollTop + clientHeight;

      if (
        scrollTop > this.lastScrollTop &&
        height >= scrollHeight - 50 &&
        hasLoadMore
      ) {
        onLoadMore();
      }

      this.lastScrollTop = scrollTop;

      const id = `data-header-0`;

      const ele = document.getElementById(`${id}-wrap`);
      if (ele) ele.scrollLeft = scrollLeft;
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

    if (index == 0) {
      return 50;
    }

    if (index > 0) {
      return 150;
    }

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
    return this.props.rowHeight;
  };

  /**
   * Set Grid Ref
   *
   * @param {Object} ref
   */
  setGridRef = ref => {
    this.dgDom = ref;
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
    } = this.props;

    return (
      <span
        ref={this.setGridRef}
        tabIndex="0"
        className="data-grid-container"
        onKeyDown={this.handleKey}
      >
        <SheetRenderer
          data={data}
          className={`data-grid ${className} ${overflow}`}
          tableWidth={tableWidth}
        >
          <Grid
            ref={this.girdRef}
            height={tableHeight}
            width={tableWidth + (data.length > 6 ? 8 : 0)}
            columnWidth={this.getColumnWidth}
            rowHeight={this.getRowHeight}
            rowCount={data.length}
            columnCount={headers.length}
            overscanRowCount={1}
            overscanColumnCount={1}
            cellRenderer={this.renderVirtualCell}
            onScroll={this.handleScrollEvent}
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
  hasLoadMore: bool,
  headerRenderer: func,
  onLoadMore: func,
  stepNumber: number,
};

VirtualizedDataSheet.defaultProps = {
  fixedColumnsCustom: 0,
  fixedRowsCustom: 0,
  headerRenderer: () => {},
  getHeaderHeight: () => 44,
};

export default VirtualizedDataSheet;
