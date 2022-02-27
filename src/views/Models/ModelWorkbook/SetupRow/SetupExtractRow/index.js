import React from 'react';
import {
  arrayOf,
  bool,
  func,
  number,
  oneOfType,
  shape,
  string,
} from 'prop-types';

import { Box, CircularProgress } from '@material-ui/core';

import { AutoSizer } from 'react-virtualized';

import { API_URLS } from '../../../../../configs/api';

import { httpGet } from '../../../../../utils/http';
import CustomScrollbars from '../../../../../components/ScrollBars';
import DimensionExpansionPanel from '../DimensionExpansionPanel';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class SetupExtractRow extends React.Component {
  /**
   * State
   */
  state = {
    dimensionsList: [],
    pagination: { ...PAGINATION },
    isFetchingDimensions: false,
  };

  /**
   * Dimesion Panel Ref
   */
  dimesionPanelRef = React.createRef();

  /**
   * Store the index of active dimension
   */
  activeDimension;

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fetchDimensionsList();
  }

  /**
   * Fetch List of Dimensions from API
   */
  fetchDimensionsList = async () => {
    try {
      const { isFetchingDimensions, pagination, dimensionsList } = this.state;
      const { limit, page } = pagination;
      const { workbookId } = this.props;

      if (isFetchingDimensions) return;

      this.setState({ isFetchingDimensions: true });

      let url = API_URLS.MODELS_API.GET_MODEL_DIMENSIONS.replace(
        '#ID#',
        workbookId
      );
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&include_system_dimension=1&include_related_dimension=1`;

      const {
        data: {
          dimensions_table_info: {
            data = [],
            pagination: { count = 1 } = {},
          } = {},
        },
      } = await httpGet(url);

      const list = page == 1 ? data : [...dimensionsList, ...data];

      this.setState({
        isFetchingDimensions: false,
        dimensionsList: list,
        pagination: {
          ...pagination,
          total: count,
        },
      });
    } catch (e) {
      const { pagination } = this.state;

      this.setState({
        isFetchingDimensions: false,
        pagination: {
          ...pagination,
          page: pagination.page == 1 ? 1 : pagination.page - 1,
        },
      });
    }
  };

  /**
   * Load more Dimensions List
   */
  loadMoreDimensionsList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchDimensionsList
    );
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  handleScrollEvent = ({ target }) => {
    if (!this.dimesionPanelRef.current) return;

    const { pagination } = this.state;
    const { page, total, limit } = pagination || {};

    if (page > total / limit) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    const height = scrollTop + clientHeight;

    if (scrollTop > this.lastScrollTop && height >= scrollHeight - 50) {
      this.loadMoreDimensionsList();
    }

    this.lastScrollTop = scrollTop;
    if (
      this.dimesionPanelRef &&
      this.dimesionPanelRef.current &&
      this.dimesionPanelRef.current.handleScrollEvent
    )
      this.dimesionPanelRef.current.handleScrollEvent(target);
  };

  /**
   * Handle callback > When any hierarchy selected
   *
   * @param {Array} selectedHierarchies
   * @param {Object} dimension
   */
  handleHierarchySelection = (selectedHierarchies, dimension) => {
    const { onSelection } = this.props;

    onSelection(selectedHierarchies, dimension);
  };

  /**
   * Render View
   */
  render() {
    const { isMulti, selectedItems, scenarioId } = this.props;

    const { isFetchingDimensions, dimensionsList } = this.state;

    return (
      <Box display="flex" flexDirection="column" style={{ height: '100%' }}>
        {isFetchingDimensions && (
          <Box display="flex" justifyContent="center">
            <CircularProgress size={24} />
          </Box>
        )}
        <Box display="flex" style={{ height: '100%', width: '100%' }}>
          <div style={{ flex: '1 1 auto', height: '100%' }}>
            <AutoSizer>
              {({ width, height }) => (
                <Box>
                  <CustomScrollbars
                    style={{ width, height }}
                    onScroll={this.handleScrollEvent}
                  >
                    {dimensionsList.map((dimension, i) => {
                      return (
                        <Box mb={1} key={i} ref={this.dimesionPanelRef}>
                          <DimensionExpansionPanel
                            isMulti={isMulti}
                            dimension={dimension}
                            scenarioId={scenarioId}
                            selectedItems={selectedItems}
                            onSelection={this.handleHierarchySelection}
                          />
                        </Box>
                      );
                    })}
                  </CustomScrollbars>
                </Box>
              )}
            </AutoSizer>
          </div>
        </Box>
      </Box>
    );
  }
}

SetupExtractRow.propTypes = {
  isMulti: bool.isRequired,
  onSelection: func.isRequired,
  scenarioId: oneOfType([string, number]).isRequired,
  selectedItems: arrayOf(shape({})),
  workbookId: oneOfType([string, number]).isRequired,
};

SetupExtractRow.defaultProps = {
  isMulti: false,
  scenarioId: '',
  onSelection: () => {},
};

export default SetupExtractRow;
