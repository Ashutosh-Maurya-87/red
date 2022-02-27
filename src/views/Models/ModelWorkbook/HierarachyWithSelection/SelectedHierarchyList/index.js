import React from 'react';
import { arrayOf, func, shape } from 'prop-types';
import { AutoSizer, Grid as VGrid } from 'react-virtualized';

import { Box, IconButton, Typography } from '@material-ui/core';
import { Cancel as CancelIcon } from '@material-ui/icons';

import CustomScrollbars from '../../../../../components/ScrollBars';

class SelectedHierarchyList extends React.Component {
  /**
   * Virtual Grid Ref
   */
  listRef = React.createRef();

  /**
   * Remove the selected item from the list
   *
   * @param {Number/String} id
   */
  removeSelection = id => () => {
    this.props.onRemoveItem(id);
  };

  /**
   * Render list row content
   *
   * @param {Array} list
   */
  rowRenderer = list => props => {
    const { style, rowIndex: index } = props;

    const { affa_h_key_name = '', affa_record_id = '' } = list[index] || {};

    return (
      <Box key={index} style={style}>
        <Box
          display="flex"
          justifyContent="space-between"
          width="100%"
          alignItems="center"
        >
          <Typography variant="body2" noWrap>
            {affa_h_key_name}
          </Typography>
          <IconButton
            aria-label="delete"
            size="small"
            onClick={this.removeSelection(affa_record_id)}
          >
            <CancelIcon color="error" fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  handleScrollEvent = ({ target }) => {
    if (!this.listRef.current) return;

    this.listRef.current.handleScrollEvent(target);
  };

  /**
   * Render View
   */
  render() {
    const { list } = this.props;

    return (
      <>
        <Box display="flex" style={{ height: '100%', width: '100%' }}>
          <div style={{ flex: '1 1 auto', height: '100%' }}>
            <AutoSizer>
              {({ width, height }) => (
                <CustomScrollbars
                  style={{ width, height }}
                  onScroll={this.handleScrollEvent}
                >
                  <VGrid
                    ref={this.listRef}
                    width={width}
                    columnWidth={width}
                    height={height}
                    rowCount={list.length}
                    overscanRowCount={5}
                    columnCount={1}
                    rowHeight={26}
                    cellRenderer={this.rowRenderer(list)}
                    style={{
                      overflowX: 'visible',
                      overflowY: 'visible',
                    }}
                  />
                </CustomScrollbars>
              )}
            </AutoSizer>
          </div>
        </Box>
      </>
    );
  }
}

SelectedHierarchyList.propTypes = {
  list: arrayOf(shape({})),
  onRemoveItem: func.isRequired,
};

SelectedHierarchyList.defaultProps = {
  list: [],
};

export default SelectedHierarchyList;
