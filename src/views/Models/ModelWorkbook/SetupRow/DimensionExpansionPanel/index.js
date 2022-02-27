import React from 'react';
import {
  shape,
  bool,
  func,
  arrayOf,
  oneOfType,
  string,
  number,
} from 'prop-types';

import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';

import {
  Typography,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Box,
} from '@material-ui/core';

import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

import { getSharedMappings } from '../../../../../reducers/Models/selectors';

import HierarchyWithSelection from '../../HierarachyWithSelection';
import { API_URLS } from '../../../../../configs/api';
import { httpGet } from '../../../../../utils/http';

const PAGINATION = {
  total: 0,
  limit: 100,
  page: 1,
};

class DimensionExpansionPanel extends React.Component {
  /**
   * State
   */
  state = {
    hierarchy: [],
    isFetchingHierarchy: false,
    search: '',
    pagination: { ...PAGINATION },
    selectedHierarchies: [],
  };

  /**
   * Store cancel tokens
   */
  cancelToken = [];

  /**
   * Store the index of active dimension
   */
  activeDimension;

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { selectedItems, dimension } = this.props;

    if (selectedItems && selectedItems.length > 0) {
      const { id } = dimension || {};

      const currentDimension = selectedItems.filter(
        item => item.dimension.id == id
      );

      if (currentDimension && currentDimension.length > 0) {
        const [{ selectedHierarchies }] = currentDimension;

        this.setState({ selectedHierarchies });
      }
    }
  }

  /**
   * Handle Event > When expansion expanded or collapsed
   *
   * @param {Object} event
   * @param {Boolean} expanded
   */
  handleExpansionPanel = (event, expanded) => {
    const { hierarchy } = this.state;

    if (expanded && hierarchy.length === 0) {
      this.getHierarchy();
    }
  };

  /**
   * Get GL Account Listing
   *
   * @param {String|Number} id
   */
  getHierarchy = async () => {
    try {
      const { isFetchingHierarchy, hierarchy, pagination, search } = this.state;
      const { limit, page } = pagination;
      const { dimension, scenarioId } = this.props;
      const { id: dimensionId } = dimension || {};

      if (isFetchingHierarchy) return;

      this.setState({ isFetchingHierarchy: true });

      let url = API_URLS.MODELS_API.GET_HIERARCHY;
      url += `?id=${dimensionId}&limit=${limit}&page=${page}&scenario_id=${scenarioId}`;

      if (search) {
        url += `&name=${search}`;
      }

      const { data = [], pagination: { total = 1 } = {} } = await httpGet(url, {
        hideError: true,
        callback: this.pushCancelToken,
      });

      const list = page == 1 ? data : [...hierarchy, ...data];

      this.setState({
        hierarchy: list,
        isFetchingHierarchy: false,
        pagination: {
          ...pagination,
          total,
        },
      });
    } catch (error) {
      const { pagination } = this.state;

      this.setState({
        isFetchingHierarchy: false,
        pagination: {
          ...pagination,
          page: pagination.page == 1 ? 1 : pagination.page - 1,
        },
      });
    }
  };

  /**
   * Push cancel tokens of API calls
   *
   * @param {Object} token
   */
  pushCancelToken = token => {
    this.cancelToken.push(token);
  };

  /**
   * Cancel existing API Requests
   */
  cancelExistingHttpRequests = () => {
    this.cancelToken.forEach(cancelFunc => cancelFunc());
  };

  /**
   * Load more Hierarchy List
   */
  loadMoreHierarchyList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.getHierarchy
    );
  };

  /**
   * Search Hierarchy
   *
   * @param {Srting} search
   */
  onSeachHierarchy = search => {
    this.cancelExistingHttpRequests();
    this.setState(
      {
        search,
        pagination: PAGINATION,
      },
      () => {
        setTimeout(() => {
          this.getHierarchy();
        }, 300);
      }
    );
  };

  /**
   * Handle callback > When any hierarchy selected
   *
   * @param {Array} selectedHierarchies
   */
  handleHierarchySelection = selectedHierarchies => {
    this.setState({ selectedHierarchies });

    const { onSelection, dimension } = this.props;
    onSelection(selectedHierarchies, dimension);
  };

  /**
   * Identify the current node is already selected or not
   *
   * @param {Number} dimensionId
   */
  isHavingNode = dimensionId => {
    if (!dimensionId) return false;

    const { sharedMappings = [] } = this.props;

    const ids = sharedMappings.map(({ dimension_id }) =>
      dimension_id?.toString()
    );

    return ids.indexOf(dimensionId?.toString()) != -1;
  };

  /**
   * Get Selected member display label
   *
   * @returns {String}
   */
  getSelectedMemberCount = isDisabled => {
    const { isMulti } = this.props;
    const { selectedHierarchies } = this.state;

    if (isDisabled) return '';

    if (isMulti && selectedHierarchies.length == 0) return '(All)';

    if (!isMulti && selectedHierarchies.length == 0)
      return '(No member selected)';

    return `(${selectedHierarchies.length} Selected)`;
  };

  /**
   * Render View
   */
  render() {
    const { dimension } = this.props;
    const {
      hierarchy,
      isFetchingHierarchy,
      selectedHierarchies,
      pagination,
    } = this.state;

    const { page, total, limit } = pagination || {};

    const { display_name, id } = dimension || {};

    const isDisabled = this.isHavingNode(id);

    return (
      <>
        <ExpansionPanel
          disabled={isDisabled}
          onChange={this.handleExpansionPanel}
        >
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Box display="flex" width="100%" justifyContent="space-between">
              <Typography variant="body2">{display_name}</Typography>
              <Typography variant="body2" color="primary">
                {this.getSelectedMemberCount(isDisabled)}
              </Typography>
            </Box>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <HierarchyWithSelection
              isMulti
              list={hierarchy}
              isLoading={isFetchingHierarchy}
              hasMore={page < total / limit}
              loadMore={this.loadMoreHierarchyList}
              selectedHierarchies={selectedHierarchies}
              onSelection={this.handleHierarchySelection}
              onSearch={this.onSeachHierarchy}
            />
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </>
    );
  }
}

DimensionExpansionPanel.propTypes = {
  dimension: shape({}).isRequired,
  isMulti: bool.isRequired,
  onSelection: func.isRequired,
  scenarioId: oneOfType([string, number]).isRequired,
  selectedItems: arrayOf(shape({})),
  sharedMappings: arrayOf(shape({})).isRequired,
};

DimensionExpansionPanel.defaultProps = {
  isMulti: false,
  isDisabled: false,
  selectedItems: [],
  sharedMappings: [],
  dimension: {},
  onSelection: () => {},
};

const mapStateToProps = createStructuredSelector({
  sharedMappings: getSharedMappings(),
});

export default connect(mapStateToProps, {})(DimensionExpansionPanel);
