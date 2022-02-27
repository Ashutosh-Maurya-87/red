import React from 'react';
import { MultiGrid } from 'react-virtualized';
import CustomScrollbars from '../ScrollBars';

class CustomMultiGrid extends MultiGrid {
  /**
   * Render View
   */
  render() {
    const {
      onScroll,
      onSectionRendered,
      onScrollbarPresenceChange, // eslint-disable-line no-unused-vars
      scrollLeft: scrollLeftProp, // eslint-disable-line no-unused-vars
      scrollToColumn,
      scrollTop: scrollTopProp, // eslint-disable-line no-unused-vars
      scrollToRow,
      ...rest
    } = this.props;

    this._prepareForRender();

    // Don't render any of our Grids if there are no cells.
    // This mirrors what Grid does,
    // And prevents us from recording inaccurage measurements when used with CellMeasurer.
    if (this.props.width === 0 || this.props.height === 0) {
      return null;
    }

    // scrollTop and scrollLeft props are explicitly filtered out and ignored
    const { scrollLeft, scrollTop } = this.state;

    return (
      <div style={this._containerOuterStyle}>
        <div style={this._containerTopStyle}>
          {this._renderTopLeftGrid(rest)}

          {this._renderTopRightGrid({
            ...rest,
            onScroll,
            scrollLeft,
          })}
        </div>

        <div style={this._containerBottomStyle}>
          {this._renderBottomLeftGrid({
            ...rest,
            onScroll,
            scrollTop,
          })}

          <CustomScrollbars
            style={{
              width: this._getRightGridWidth(this.props),
              height: this._getBottomGridHeight(this.props),
              left: this._getLeftGridWidth(this.props),
            }}
            onScroll={rest.handleBottomRightScroll}
          >
            {this._renderBottomRightGrid({
              ...rest,
              onScroll,
              onSectionRendered,
              scrollLeft,
              scrollToColumn,
              scrollToRow,
              scrollTop,
            })}
          </CustomScrollbars>
        </div>
      </div>
    );
  }
}

export default CustomMultiGrid;
