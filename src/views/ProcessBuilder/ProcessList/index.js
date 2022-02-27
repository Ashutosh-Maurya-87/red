import React from 'react';
import { withRouter } from 'react-router-dom';

import AppHeader from '../../../components/AppHeader';
import NoProcess from '../NoProcess';
import ProcessesGridView from './GridView';
import Spinner from '../../../components/Spinner';

import { PROCESS_ACTIONS } from './configs';
import { getFormattedProcessList } from './helper';
import { API_URLS } from '../../../configs/api';
import { APP_ROUTES } from '../../../configs/routes';
import { httpGet } from '../../../utils/http';
import { logAmplitudeEvent } from '../../../utils/amplitude';
import { isHasScrollBar } from '../../../utils/helper/hasScrollBar';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class ProcessList extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    search: '',
    processList: [],

    pagination: { ...PAGINATION },
  };

  componentDidMount() {
    this.fetchProcessList();
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  /**
   * Handle Scroll event to load more records
   */
  handleScroll = () => {
    const { showLoader, pagination, processList } = this.state;

    if (showLoader) return;

    if (pagination.total <= processList.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreProcessList();
  };

  /**
   * Fetch List of Process from API
   */
  fetchProcessList = async () => {
    try {
      const { search, showLoader, pagination, processList } = this.state;
      const { limit, page } = pagination;

      if (showLoader) return;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_PROCESS_LIST;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (search) url += `&search=${search}`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const sanitizedData = getFormattedProcessList(data);

      const list =
        page == 1 ? sanitizedData : [...processList, ...sanitizedData];

      this.setState({
        showLoader: false,
        processList: list,
        pagination: {
          ...pagination,
          total: count,
        },
      });

      if (!isHasScrollBar() && list.length < count) {
        this.setState({ showLoader: false }, this.loadMoreProcessList);

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
   * Load more Process List
   */
  loadMoreProcessList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchProcessList
    );
  };

  /**
   * Update List
   *
   * @param {Array} processList
   */
  updateList = processList => {
    this.setState({ processList });
  };

  /**
   * Go To > Create Process
   */
  goToCreateProcess = () => {
    logAmplitudeEvent('Create process');
    this.props.history.push(APP_ROUTES.CREATE_PROCESS);
  };

  /**
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;
    const [, , , deleteProcess] = PROCESS_ACTIONS;

    switch (action) {
      case deleteProcess:
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
    const { showLoader, processList } = this.state;

    return (
      <>
        <AppHeader
          header="Process Builder"
          onSave={this.goToCreateProcess}
          saveText="Create Process"
        />

        {showLoader && processList.length == 0 && <Spinner />}

        {processList.length > 0 ? (
          <ProcessesGridView
            list={processList}
            updateList={this.updateList}
            onActionCompleted={this.handleActionCompleted}
            showLoader={showLoader}
          />
        ) : (
          !showLoader && <NoProcess />
        )}
      </>
    );
  }
}

export default withRouter(ProcessList);
