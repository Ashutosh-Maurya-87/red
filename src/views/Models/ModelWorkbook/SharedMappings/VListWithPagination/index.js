import React from 'react';
import { arrayOf, number, shape, func, string } from 'prop-types';

import InfiniteScroll from 'react-infinite-scroll-component';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { VariableSizeList } from 'react-window';
import { Box, ListItem, Typography } from '@material-ui/core';

const OuterElementContext = React.createContext({});

class VListWithPagination extends React.Component {
  /**
   * Load more item in list
   */
  loadMore = () => {
    this.props.loadMore();
  };

  /**
   * Create outer element for perfect scroll bar
   */
  OuterElementType = React.forwardRef((props, ref) => {
    const { id } = this.props;
    const outerProps = React.useContext(OuterElementContext);

    return (
      <PerfectScrollbar
        options={{ suppressScrollX: true }}
        id={id}
        ref={ref}
        {...props}
        {...outerProps}
      />
    );
  });

  /**
   * Return fixed size of single child in list
   */
  getChildSize = () => {
    const { list } = this.props;

    if (list && list.length > 0) return 36;

    return list.length;
  };

  /**
   * Identify the current node is already selected or not
   *
   * @param {Number} dimensionId
   */
  isHavingNode = dimensionId => {
    const { selectedList = [] } = this.props;

    const ids = selectedList.map(({ dimension_id }) => String(dimension_id));

    return ids.indexOf(String(dimensionId)) !== -1;
  };

  /**
   * Return List child component
   *
   * @param {Object} Props
   */
  Item = ({ data, index, style }) => {
    const item = data[index];
    const { display_name, id } = item || {};

    const { onClickItem } = this.props;

    return (
      <ListItem
        button
        disabled={this.isHavingNode(id)}
        style={style}
        onClick={onClickItem(item)}
      >
        <Typography variant="body2" noWrap title={display_name}>
          {display_name}
        </Typography>
      </ListItem>
    );
  };

  /**
   * Render View
   */
  render() {
    const { list, page, totalPages, id } = this.props;

    const hasNextPage = page <= totalPages;

    return (
      <InfiniteScroll
        dataLength={list.length}
        next={this.loadMore}
        hasMore={hasNextPage}
        scrollableTarget={id}
      >
        {list.length > 0 && (
          <OuterElementContext.Provider>
            <VariableSizeList
              itemData={list}
              height={280}
              width="100%"
              outerElementType={this.OuterElementType}
              itemSize={index => this.getChildSize(list[index])}
              overscanCount={5}
              itemCount={list.length}
              {...this.props}
            >
              {this.Item}
            </VariableSizeList>
          </OuterElementContext.Provider>
        )}

        {list.length == 0 && (
          <Box display="flex" p={2}>
            No Mappings Found
          </Box>
        )}
      </InfiniteScroll>
    );
  }
}

VListWithPagination.propTypes = {
  id: string.isRequired,
  list: arrayOf(shape({})),
  loadMore: func.isRequired,
  onClickItem: func.isRequired,
  page: number.isRequired,
  selectedList: arrayOf(shape({})).isRequired,
  totalPages: number.isRequired,
};

VListWithPagination.defaultProps = {};

export default VListWithPagination;
