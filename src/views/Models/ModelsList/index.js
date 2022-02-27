import React from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, bool, func, shape, string } from 'prop-types';

import { Box, Button, IconButton } from '@material-ui/core';
import {
  Apps as AppsIcon,
  FormatListBulleted as FormatListBulletedIcon,
} from '@material-ui/icons';

import {
  VIEW_MODES,
  DEFAULT_VIEW_MODE,
} from '../../../reducers/Models/constants';

import { MODEL_ACTIONS } from './Actions';
import AppHeader from '../../../components/AppHeader';
import Spinner from '../../../components/Spinner';
import NoModel from '../NoModel';
import ModelGridView from './GridView';
import ModelsListView from './ListView';
import Assumptions from '../../Assumptions';

import { MODELS_API } from '../../../configs/api';
import { APP_ROUTES } from '../../../configs/routes';
import { BETA_MSG } from '../../../configs/messages';

import { httpGet } from '../../../utils/http';
import { getFormattedModelsList } from './helper';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';
import { isHasScrollBar } from '../../../utils/helper/hasScrollBar';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

const [listMode, thumbnailMode] = VIEW_MODES;

class ModelsList extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    search: '',
    modelsList: [],
    showArchived: false,
    viewMode: DEFAULT_VIEW_MODE,
    showAssumptions: false,

    pagination: { ...PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);

    this.fetchModelsList();
  }

  /**
   * When Component Will Mount
   */
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  /**
   * Handle Scroll event to load more records
   */
  handleScroll = () => {
    const { showLoader, pagination, modelsList } = this.state;

    if (showLoader) return;

    if (pagination.total <= modelsList.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreModelsList();
  };

  /**
   * Fetch List of Models from API
   */
  fetchModelsList = async () => {
    try {
      const {
        search,
        showLoader,
        pagination,
        modelsList,
        showArchived,
      } = this.state;

      if (showLoader) return;

      const { limit, page } = pagination;

      this.setState({ showLoader: true });

      let url = MODELS_API.GET_WORKBOOKS;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (search) url += `&search=${search}`;
      if (showArchived) url += `&is_archived=1`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const sanitizedData = getFormattedModelsList(data);

      const list =
        page == 1 ? sanitizedData : [...modelsList, ...sanitizedData];

      this.setState({
        showLoader: false,
        modelsList: list,
        pagination: {
          ...pagination,
          total: count,
        },
      });

      if (!isHasScrollBar() && list.length < count) {
        this.setState({ showLoader: false }, this.loadMoreModelsList);

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
   * Load more Models List
   */
  loadMoreModelsList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchModelsList
    );
  };

  /**
   * Update List
   *
   * @param {Array} modelsList
   */
  updateList = modelsList => {
    this.setState({ modelsList });
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
        modelsList: [],
      },
      this.fetchModelsList
    );
  };

  /**
   * Toggle > Assumptions View
   */
  toggleAssumptionsView = () => {
    logAmplitudeEvent('Open assumptions view');
    this.setState({ showAssumptions: !this.state.showAssumptions });
  };

  /**
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;

    switch (action) {
      case MODEL_ACTIONS.delete:
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
      modelsList,
      showArchived,
      viewMode,
      showAssumptions,
    } = this.state;

    return (
      <>
        <AppHeader
          header={`${showArchived ? 'Archived ' : ''}Models`}
          isBetaEnabled={true}
          betaMsg={BETA_MSG.modeling_beta_msg}
          onSave={this.goToRoute(APP_ROUTES.CREATE_MODEL)}
          onBack={showArchived ? this.toggleArchived : undefined}
          backText={showArchived ? 'All Models' : ''}
          headerActions={
            <HeaderActions
              modelsList={modelsList}
              viewMode={viewMode}
              onArchive={this.toggleArchived}
              onCreate={this.goToRoute(APP_ROUTES.CREATE_MODEL)}
              setViewMode={this.setViewMode}
              showArchived={showArchived}
              onClickAssumptions={this.toggleAssumptionsView}
            />
          }
        />

        {showAssumptions && (
          <Assumptions
            isVisible
            onCancel={this.toggleAssumptionsView}
            onSave={() => {}}
          />
        )}

        {showLoader && modelsList.length == 0 && <Spinner />}

        {modelsList.length > 0 ? (
          <>
            {viewMode == thumbnailMode && (
              <ModelGridView
                list={modelsList}
                updateList={this.updateList}
                isArchived={showArchived}
                onActionCompleted={this.handleActionCompleted}
                showLoader={showLoader}
              />
            )}

            {viewMode == listMode && (
              <Box px={2}>
                <ModelsListView
                  list={modelsList}
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
            <NoModel
              hideCreateBtn={showArchived}
              msg={showArchived ? 'No Archived Model Found' : undefined}
            />
          )
        )}
      </>
    );
  }
}

function HeaderActions({
  modelsList,
  viewMode,
  setViewMode,
  onArchive,
  onCreate,
  showArchived,
  onClickAssumptions,
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
        color="primary"
        className="title-button"
        onClick={onClickAssumptions}
      >
        Assumptions
      </Button>

      <Button
        variant="contained"
        color="primary"
        className="title-button"
        onClick={() => {
          logAmplitudeEvent('Create new model');
          onCreate();
        }}
      >
        Create New Model
      </Button>

      <Box display="flex" justifyContent="flex-end" alignItems="center" pl={1}>
        <IconButton
          className={`${viewMode == thumbnailMode ? 'modal-list-active' : ''}`}
          onClick={setViewMode(thumbnailMode)}
        >
          <AppsIcon />
        </IconButton>
        <IconButton
          className={`${viewMode == listMode ? 'modal-list-active' : ''}`}
          onClick={setViewMode(listMode)}
        >
          <FormatListBulletedIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

HeaderActions.propTypes = {
  modelsList: arrayOf(shape({})),
  onArchive: func.isRequired,
  onClickAssumptions: func.isRequired,
  onCreate: func.isRequired,
  setViewMode: func.isRequired,
  showArchived: bool.isRequired,
  viewMode: string,
};

export default withRouter(ModelsList);
