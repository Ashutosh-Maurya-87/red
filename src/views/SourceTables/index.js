import React from 'react';
import { func, arrayOf, string, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  setViewMode,
  clearData,
  setTablesList,
} from '../../reducers/SourceTables/actions';
import {
  isFetching,
  getTablesList,
  getViewMode,
} from '../../reducers/SourceTables/selectors';

import AppHeader from '../../components/AppHeader';
import ImportSourceTable from './ImportSourceTable';

import Spinner from '../../components/Spinner';

import { API_URLS } from '../../configs/api';
import { APP_ROUTES } from '../../configs/routes';

import { TABLE_ACTIONS } from './SourceTablesList/Actions';
import SourceTablesList from './SourceTablesList';
import { SELECT_TABLE_TABS } from './SourceTablesList/ThumbnailView/configs';

import { httpGet } from '../../utils/http';
import { logAmplitudeEvent } from '../../utils/amplitude';
import { isElementHasScroll } from '../../utils/helper/elementHasScroll';

export const SORT_OPTIONS = [
  {
    label: 'Name (Asc)',
    value: 'display_name - asc',
  },
  {
    label: 'Name (Desc)',
    value: 'display_name - desc',
  },
  {
    label: 'Created on (Asc)',
    value: 'created_at - asc',
  },
  {
    label: 'Created on (Desc)',
    value: 'created_at - desc',
  },
];

const INITIAL_PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class SourceTables extends React.Component {
  /**
   * State
   */
  state = {
    isImportModal: false,
    showLoader: false,
    search: '',
    sortBy: SORT_OPTIONS[3].value,

    pagination: { ...INITIAL_PAGINATION },

    tabType: SELECT_TABLE_TABS.ALL.value,
  };

  componentDidMount() {
    this.fetchSourceTables();
  }

  componentWillUnmount() {
    this.props.clearData();
  }

  /**
   * Fetch Source Tables from API
   */
  fetchSourceTables = async () => {
    try {
      const { search, showLoader, pagination, sortBy, tabType } = this.state;
      const { limit, page } = pagination;

      if (showLoader) return;

      this.setState({ showLoader: true });

      const [sortField, sortOrder] = sortBy.split(' - ');
      const { tablesList } = this.props;

      let url = API_URLS.GET_SOURCE_TABLES;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&sort=${sortField}`;
      url += `&order=${sortOrder}`;

      if (tabType !== SELECT_TABLE_TABS.ALL.value) {
        url += `&source_filter=${tabType}`; // On selecting Tabs
      }

      if (search) url += `&search=${search}`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const list = page == 1 ? data : [...tablesList, ...data];
      this.props.setTablesList(list);

      const element = document.querySelector(
        '#source-table-list .scrollbar-custom-view'
      );

      if (
        !isElementHasScroll(element) &&
        this.props.tablesList.length < count
      ) {
        this.setState({ showLoader: false }, this.loadMoreTables);

        return;
      }

      this.setState({
        showLoader: false,
        pagination: {
          ...pagination,
          total: count,
        },
      });
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
   * Load more Source Tables
   */
  loadMoreTables = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchSourceTables
    );
  };

  openImportModal = () => {
    logAmplitudeEvent('Open import table modal');
    this.setState({ isImportModal: true });
  };

  goToCreateTable = () => {
    logAmplitudeEvent('Go to create Table');
    this.props.history.push(APP_ROUTES.CREATE_SOURCE_TABLE);
  };

  closeImportModal = () => {
    logAmplitudeEvent('Close import table modal');
    this.setState({ isImportModal: false });
  };

  handleSortBy = evt => {
    const { value: sortBy } = evt.target;

    this.props.setTablesList([]);

    this.setState(
      { sortBy, pagination: { ...INITIAL_PAGINATION } },
      this.fetchSourceTables
    );
  };

  /**
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;

    switch (action) {
      case TABLE_ACTIONS.delete:
        const paginate = { ...pagination, total: pagination.total - 1 };

        this.setState({ pagination: paginate });
        break;

      default:
        break;
    }
  };

  /**
   * Call back: Tab value getting from Thumbnail view
   *
   * @param {String} tabType
   */
  onTabChange = tabType => {
    this.props.setTablesList([]);

    this.setState(
      { tabType, pagination: INITIAL_PAGINATION },
      this.fetchSourceTables
    );
  };

  /**
   * Render View
   */
  render() {
    const { setViewMode, tablesList, viewMode } = this.props;
    const { isImportModal, showLoader, pagination, sortBy } = this.state;

    return (
      <>
        <AppHeader
          header="Source Tables"
          saveText="Import Table"
          onSave={this.openImportModal}
          cancelText="Create Table"
          onCancel={this.goToCreateTable}
          cancelColor="primary"
          totalRecords={pagination.total}
        />

        {showLoader && tablesList.length == 0 && <Spinner />}

        <SourceTablesList
          tablesList={tablesList}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          handleSortBy={this.handleSortBy}
          onActionCompleted={this.handleActionCompleted}
          showLoader={showLoader}
          onTabChange={this.onTabChange}
          pagination={pagination}
          onLoadMore={this.loadMoreTables}
        />

        {isImportModal && (
          <ImportSourceTable isOpen handleClose={this.closeImportModal} />
        )}
      </>
    );
  }
}

SourceTables.propTypes = {
  clearData: func.isRequired,
  setTablesList: func.isRequired,
  setViewMode: func.isRequired,
  tablesList: arrayOf(shape({})),
  viewMode: string,
};

const mapStateToProps = createStructuredSelector({
  isFetching: isFetching(),
  tablesList: getTablesList(),
  viewMode: getViewMode(),
});

export default connect(mapStateToProps, {
  setViewMode,
  clearData,
  setTablesList,
})(SourceTables);
