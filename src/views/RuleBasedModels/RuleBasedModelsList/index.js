import React from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, bool, func, shape, string } from 'prop-types';

import {
  Box,
  Button,
  IconButton,
  FormControl,
  MenuItem,
  Select,
} from '@material-ui/core';
import {
  Apps as AppsIcon,
  FormatListBulleted as FormatListBulletedIcon,
} from '@material-ui/icons';

import {
  VIEW_MODES,
  DEFAULT_VIEW_MODE,
} from '../../../reducers/Models/constants';

import AppHeader from '../../../components/AppHeader';
import Spinner from '../../../components/Spinner';

import RuleBasedModelGridView from './GridView';
import RuleBasedModelListView from './ListView';
import { getFormattedRuleBasedModelList } from './helper';

import CreateRuleBaseModelDialog from '../CreateRuleBaseModelDialog';
import NoRuleBasedModel from '../NoRuleBasedModel';
import { PAGINATION, RULE_BASED_MODEL_ACTIONS, SORT_OPTIONS } from '../configs';

import { RULE_BASED_MODELS_API } from '../../../configs/api';
import { RBM_DISPLAY_NAME } from '../../../configs/app';
import { APP_ROUTES } from '../../../configs/routes';
import { BETA_MSG } from '../../../configs/messages';

import { httpGet } from '../../../utils/http';
import { isHasScrollBar } from '../../../utils/helper/hasScrollBar';

import './styles.scss';

const [listMode, thumbnailMode] = VIEW_MODES;
const [, , , descCreateAt] = SORT_OPTIONS;
const { value: descCreatedValue = '' } = descCreateAt || {};

class RuleBasedModelsList extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    search: '',
    ruleBasedModelsList: [],
    showArchived: false,
    viewMode: DEFAULT_VIEW_MODE,
    pagination: { ...PAGINATION },
    isShowCreateRBM: false,

    sortBy: descCreatedValue,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);

    this.fetchRuleBasedModelsList();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  /**
   * Handle Scroll event to load more RBM
   */
  handleScroll = () => {
    const { showLoader, pagination, ruleBasedModelsList } = this.state;

    if (showLoader) return;

    if (pagination.total <= ruleBasedModelsList.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreRuleBasedModelsList();
  };

  /**
   * Fetch List of Rule Based Model from API
   */
  fetchRuleBasedModelsList = async () => {
    try {
      const {
        search,
        showLoader,
        pagination,
        ruleBasedModelsList,
        showArchived,
        sortBy = descCreatedValue,
      } = this.state || {};

      if (showLoader) return;
      this.setState({ showLoader: true });

      const { limit, page } = pagination;
      const [sortField = '', sortOrder = ''] = sortBy.split(' - ');

      let url = RULE_BASED_MODELS_API.GET_RBM_LIST;

      url += `?limit=${limit}`;
      url += `&page=${page == 1 ? 1 : page}`;
      url += `&sort_by=${sortField}`;
      url += `&sort_order=${sortOrder}`;

      if (search) url += `&search=${search}`;
      if (showArchived) url += `&is_archived=1`;

      const { data = [], pagination: apiPagination = {} } = await httpGet(url);

      const { count = '' } = apiPagination || {};

      const sanitizedData = getFormattedRuleBasedModelList(data);

      const list =
        page == 1 ? sanitizedData : [...ruleBasedModelsList, ...sanitizedData];

      this.setState({
        showLoader: false,
        ruleBasedModelsList: list,
        pagination: {
          ...pagination,
          total: count,
        },
      });

      if (!isHasScrollBar() && list.length < count) {
        this.setState({ showLoader: false }, this.loadMoreRuleBasedModelsList);

        return;
      }
    } catch (e) {
      console.error(e);
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
   * Load more Rule Based Model
   */
  loadMoreRuleBasedModelsList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchRuleBasedModelsList
    );
  };

  /**
   * Update List
   *
   * @param {Array} ruleBasedModelsList
   */
  updateList = ruleBasedModelsList => {
    this.setState({ ruleBasedModelsList });
  };

  /**
   * Set active view mode
   *
   * @param {String} mode
   */
  setViewMode = mode => () => {
    this.setState({ viewMode: mode });
  };

  /**
   * Go To > Route
   */
  goToRoute = route => () => {
    this.props.history.push(route);
  };

  /**
   * Toggle > Show Archived List
   */
  toggleArchived = () => {
    const { showArchived } = this.state;

    this.setState(
      {
        pagination: { ...PAGINATION },
        showArchived: !showArchived,
        ruleBasedModelsList: [],
      },
      this.fetchRuleBasedModelsList
    );
  };

  /**
   * Action for Grid & List view
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;

    switch (action) {
      case RULE_BASED_MODEL_ACTIONS.delete:
        const paginate = { ...pagination, total: pagination.total - 1 };

        this.setState({ pagination: paginate });
        break;

      default:
        break;
    }
  };

  /**
   * On Create Rule Based Model
   */
  onCreateRuleBasedModel = () => {
    this.setState({ isShowCreateRBM: true });
  };

  /**
   * Handle Sorting of RBMs as per Name & created-at in Ascending and Descending order
   *
   * @param {Object} event
   */
  handleSortBy = ({ target = {} }) => {
    const { value: sortBy = '' } = target || {};

    this.setState(
      { sortBy, pagination: { ...PAGINATION } },
      this.fetchRuleBasedModelsList
    );
  };

  /**
   * Render View
   */
  render() {
    const {
      showLoader,
      ruleBasedModelsList,
      showArchived,
      viewMode,
      isShowCreateRBM,
      sortBy,
    } = this.state || {};

    return (
      <>
        <AppHeader
          header={`${showArchived ? 'Archived ' : ''} ${
            RBM_DISPLAY_NAME.rbmHeaderLabel
          }`}
          isBetaEnabled={true}
          betaMsg={BETA_MSG.rbm_beta_msg}
          onSave={this.goToRoute(APP_ROUTES.CREATE_RULE_BASED_MODEL)}
          onBack={showArchived ? this.toggleArchived : undefined}
          backText={showArchived ? 'All Rule Based Model' : ''}
          headerActions={
            <HeaderActions
              ruleBasedModelsList={ruleBasedModelsList}
              viewMode={viewMode}
              onArchive={this.toggleArchived}
              onCreate={this.onCreateRuleBasedModel}
              setViewMode={this.setViewMode}
              showArchived={showArchived}
            />
          }
        />

        {/* Sort by menus */}
        <div style={{ textAlign: 'right', minWidth: '200px' }}>
          <Box mx={3}>
            <FormControl variant="standard">
              <Select
                id="sort-sourcetabled"
                value={sortBy}
                name="sortBy"
                sortBy={sortBy}
                onChange={this.handleSortBy}
                defaultValue=""
              >
                <MenuItem disabled value="">
                  <em>Sort By</em>
                </MenuItem>

                {SORT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </div>

        {isShowCreateRBM && (
          <CreateRuleBaseModelDialog
            isOpen={isShowCreateRBM}
            showLoader={showLoader}
            handleClose={() => this.setState({ isShowCreateRBM: false })}
          />
        )}

        {showLoader && ruleBasedModelsList.length == 0 && <Spinner />}

        {ruleBasedModelsList.length > 0 ? (
          <>
            {viewMode == thumbnailMode && (
              <RuleBasedModelGridView
                list={ruleBasedModelsList}
                updateList={this.updateList}
                isArchived={showArchived}
                onActionCompleted={this.handleActionCompleted}
                showLoader={showLoader}
              />
            )}

            {viewMode == listMode && (
              <Box px={2}>
                <RuleBasedModelListView
                  list={ruleBasedModelsList}
                  updateList={this.updateList}
                  isArchived={showArchived}
                  onActionCompleted={this.handleActionCompleted}
                  showLoader={showLoader}
                />
              </Box>
            )}
          </>
        ) : (
          !showLoader && (
            <NoRuleBasedModel
              hideCreateBtn={showArchived}
              msg={
                showArchived
                  ? `No Archived ${RBM_DISPLAY_NAME.label} Found`
                  : undefined
              }
            />
          )
        )}
      </>
    );
  }
}

function HeaderActions({
  ruleBasedModelsList,
  viewMode,
  setViewMode,
  onArchive,
  onCreate,
  showArchived,
}) {
  if (showArchived) return null;

  return (
    <Box display="flex" alignItems="center">
      {false && (
        <Button color="primary" className="title-button" onClick={onArchive}>
          Archived
        </Button>
      )}

      <Button
        variant="contained"
        color="primary"
        className="title-button"
        onClick={onCreate}
      >
        Create
      </Button>

      <Box display="flex" justifyContent="flex-end" alignItems="center" pl={1}>
        <IconButton
          className={`${
            viewMode == thumbnailMode ? 'rule-based-models-list-active' : ''
          }`}
          onClick={setViewMode(thumbnailMode)}
        >
          <AppsIcon />
        </IconButton>
        <IconButton
          className={`${
            viewMode == listMode ? 'rule-based-models-list-active' : ''
          }`}
          onClick={setViewMode(listMode)}
        >
          <FormatListBulletedIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

HeaderActions.propTypes = {
  onArchive: func.isRequired,
  onCreate: func.isRequired,
  ruleBasedModelsList: arrayOf(shape({})),
  setViewMode: func.isRequired,
  showArchived: bool.isRequired,
  viewMode: string,
};

export default withRouter(RuleBasedModelsList);
