import React from 'react';
import { withRouter } from 'react-router-dom';

import { Box, Typography, Divider } from '@material-ui/core';

import { DIMENSION_ACTIONS } from './Actions';
import AppHeader from '../../../components/AppHeader';
import DimensionGridView from './GridView';
import Spinner from '../../../components/Spinner';
import CreateDimensionModal from '../CreateDimension/CreateDimensionModal';

import { AI_MODULES_DISPLAY_NAME } from '../../../configs/app';
import { API_URLS } from '../../../configs/api';

import { TYPES } from '../EditDimension/configs';
import { httpGet } from '../../../utils/http';
import { logAmplitudeEvent } from '../../../utils/amplitude';
import { isHasScrollBar } from '../../../utils/helper/hasScrollBar';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class DimensionsList extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    search: '',
    dimensionsList: [],
    isSelectTableModal: false,
    glAccount: [],

    pagination: { ...PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.fetchDimensionsList();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  /**
   * Handle Scroll event to load more records
   */
  handleScroll = () => {
    const { showLoader, pagination, dimensionsList } = this.state;

    if (showLoader) return;

    if (pagination.total - 1 <= dimensionsList.length) return; // Remove COA from pagination total

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreDimensionsList();
  };

  /**
   * Fetch List of Dimensions from API
   */
  fetchDimensionsList = async () => {
    try {
      const { search, showLoader, pagination, dimensionsList } = this.state;
      const { limit, page } = pagination;

      if (showLoader) return;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_DIMENSION_LIST;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (search) url += `&search=${search}`;

      const {
        dimensions_table_info: { data = [], pagination: { total = 1 } = {} },
        gl_account = [],
      } = await httpGet(url);

      const list = page == 1 ? data : [...dimensionsList, ...data];

      this.setState({
        showLoader: false,
        dimensionsList: list,
        glAccount: gl_account,
        pagination: {
          ...pagination,
          total,
        },
      });

      if (!isHasScrollBar() && list.length < total - 1) {
        this.setState({ showLoader: false }, this.loadMoreDimensionsList);

        return;
      }
    } catch (e) {
      const { pagination } = this.state;

      this.setState({
        showLoader: false,
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
   * Update List
   *
   * @param {Array} dimensionsList
   */
  updateList = dimensionsList => {
    this.setState({ dimensionsList });
  };

  /**
   * Toggle Select Table Modal for Create Dimension
   */
  toggleSelectTableModal = () => {
    this.setState({ isSelectTableModal: !this.state.isSelectTableModal });
  };

  /**
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;

    switch (action) {
      case DIMENSION_ACTIONS.delete:
        const paginate = { ...pagination, total: pagination.total - 1 };

        this.setState({ pagination: paginate });
        break;

      default:
        break;
    }
  };

  /**
   * Render View
   */
  render() {
    const {
      showLoader,
      dimensionsList,
      glAccount,
      isSelectTableModal,
    } = this.state;

    return (
      <>
        <AppHeader
          header={`${AI_MODULES_DISPLAY_NAME.dimensions}`}
          // onSave={this.toggleSelectTableModal}
          // saveText="New Dimension"
        />

        <CreateDimensionModal
          isOpen={isSelectTableModal}
          onClose={this.toggleSelectTableModal}
        />

        {showLoader && dimensionsList.length == 0 && <Spinner />}

        {glAccount && glAccount.length > 0 && (
          <>
            <Box>
              <Box px={3} pt={3}>
                <Typography color="textSecondary" variant="h5">
                  {`System ${AI_MODULES_DISPLAY_NAME.dimensions}`}
                </Typography>
              </Box>
              <DimensionGridView
                list={glAccount}
                updateList={() => {}}
                isSystem
                onActionCompleted={this.handleActionCompleted}
              />
            </Box>
            <Box px={3} pt={2}>
              <Divider />
            </Box>
          </>
        )}
        <Box>
          <Box px={3} pt={3}>
            <Typography color="textSecondary" variant="h5">
              {`Custom ${AI_MODULES_DISPLAY_NAME.dimensions}`}
            </Typography>
          </Box>

          <DimensionGridView
            list={dimensionsList}
            updateList={this.updateList}
            type={TYPES[0]}
            onAddNew={() => {
              logAmplitudeEvent('Add custom dimension');
              this.toggleSelectTableModal();
            }}
            onActionCompleted={this.handleActionCompleted}
            showExternalLoader={showLoader}
          />
        </Box>
      </>
    );
  }
}

export default withRouter(DimensionsList);
