import React from 'react';
import { withRouter } from 'react-router-dom';
import { bool, func } from 'prop-types';

import { Box, Button } from '@material-ui/core';

import AppHeader from '../../../components/AppHeader';
import NoScenario from '../NoScenario';
import ScenarioGridView from './GridView';
import Spinner from '../../../components/Spinner';

import { API_URLS } from '../../../configs/api';
import { APP_ROUTES } from '../../../configs/routes';
import { httpGet } from '../../../utils/http';
import { SCENARIO_ACTIONS } from './configs';
import { logAmplitudeEvent } from '../../../utils/amplitude';
import { isHasScrollBar } from '../../../utils/helper/hasScrollBar';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class ScenariosList extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    search: '',
    scenariosList: [],
    showArchived: false,

    pagination: { ...PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);

    this.fetchScenariosList();
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
    const { showLoader, pagination, scenariosList } = this.state;

    if (showLoader) return;

    if (pagination.total <= scenariosList.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreScenariosList();
  };

  /**
   * Fetch List of Scenarios from API
   */
  fetchScenariosList = async () => {
    try {
      const {
        search,
        showLoader,
        pagination,
        scenariosList,
        showArchived,
      } = this.state;

      if (showLoader) return;

      const { limit, page } = pagination;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_SCENARIO_LIST;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (search) url += `&search=${search}`;
      if (showArchived) url += `&is_archived=1`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const list = page == 1 ? data : [...scenariosList, ...data];

      this.setState({
        showLoader: false,
        scenariosList: list,
        pagination: {
          ...pagination,
          total: count,
        },
      });

      if (!isHasScrollBar() && list.length < count) {
        this.setState({ showLoader: false }, this.loadMoreScenariosList);

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
   * Load more Scenarios List
   */
  loadMoreScenariosList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchScenariosList
    );
  };

  /**
   * Update List
   *
   * @param {Array} scenariosList
   */
  updateList = scenariosList => {
    this.setState({ scenariosList });
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
        scenariosList: [],
      },
      this.fetchScenariosList
    );
  };

  /**
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;

    switch (action) {
      case SCENARIO_ACTIONS.delete:
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
    const { showLoader, scenariosList, showArchived } = this.state;
    return (
      <>
        <AppHeader
          header={`${showArchived ? 'Archived ' : ''}Scenarios`}
          onSave={this.goToRoute(APP_ROUTES.CREATE_SCENARIO)}
          onBack={showArchived ? this.toggleArchived : undefined}
          backText={showArchived ? 'All Scenarios' : ''}
          headerActions={
            <HeaderActions
              onArchive={this.toggleArchived}
              onCreate={this.goToRoute(APP_ROUTES.CREATE_SCENARIO)}
              showArchived={showArchived}
            />
          }
        />

        {showLoader && scenariosList.length == 0 && <Spinner />}

        {scenariosList.length > 0 ? (
          <ScenarioGridView
            list={scenariosList}
            updateList={this.updateList}
            isArchived={showArchived}
            onActionCompleted={this.handleActionCompleted}
            showLoader={showLoader}
          />
        ) : (
          !showLoader && (
            <NoScenario
              hideCreateBtn={showArchived}
              msg={showArchived ? 'No Archived Scenarios Found' : undefined}
            />
          )
        )}
      </>
    );
  }
}

function HeaderActions({ onArchive, onCreate, showArchived }) {
  if (showArchived) return null;

  return (
    <Box display="flex" alignItems="center">
      <Button
        // variant={showArchived ? 'outlined' : undefined}
        color="primary"
        className="title-button"
        onClick={() => {
          logAmplitudeEvent('Check archived scenarios');
          onArchive();
        }}
      >
        Archived
      </Button>

      <Button
        variant="contained"
        color="primary"
        className="title-button"
        onClick={() => {
          logAmplitudeEvent('Create new scenario');
          onCreate();
        }}
      >
        New Scenario
      </Button>
    </Box>
  );
}

HeaderActions.propTypes = {
  onArchive: func.isRequired,
  onCreate: func.isRequired,
  showArchived: bool.isRequired,
};

export default withRouter(ScenariosList);
