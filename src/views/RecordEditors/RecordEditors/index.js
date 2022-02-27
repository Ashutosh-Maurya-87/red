import React from 'react';
import { withRouter } from 'react-router-dom';
import { bool, func } from 'prop-types';

import { Box, Button } from '@material-ui/core';

import { RECORD_EDITOR_ACTIONS } from './Actions';
import AppHeader from '../../../components/AppHeader';
import NoRecordEditor from '../NoRecordEditor';
import GridView from './GridView';
import Spinner from '../../../components/Spinner';
import CreateRecordEditorModal from '../CreateRecordEditor/CreateRecordEditorModal';

import { API_URLS } from '../../../configs/api';
import { APP_ROUTES } from '../../../configs/routes';
import { httpGet } from '../../../utils/http';
import { getFormattedRecordEditors } from './helper';
import { logAmplitudeEvent } from '../../../utils/amplitude';
import { isHasScrollBar } from '../../../utils/helper/hasScrollBar';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class RecordEditors extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    showArchived: false,
    isSelectTableModal: false,
    list: [],

    search: '',
    pagination: { ...PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);

    this.fetchRecordEditors();
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
    const { showLoader, pagination, list } = this.state;

    if (showLoader) return;

    if (pagination.total <= list.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreList();
  };

  /**
   * Toggle Select Table Modal for Create Record Editor
   */
  toggleSelectTableModal = () => {
    logAmplitudeEvent('Create new record editor');
    this.setState({ isSelectTableModal: !this.state.isSelectTableModal });
  };

  /**
   * Fetch List of Record Editors from API
   */
  fetchRecordEditors = async () => {
    try {
      const { search, showLoader, pagination, list, showArchived } = this.state;

      if (showLoader) return;

      const { limit, page } = pagination;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_RECORD_EDITORS;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (search) url += `&search=${search}`;
      if (showArchived) url += `&is_archived=1`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const sanitizedData = getFormattedRecordEditors(data);

      const newList = page == 1 ? sanitizedData : [...list, ...sanitizedData];

      this.setState({
        showLoader: false,
        list: newList,
        pagination: {
          ...pagination,
          total: count,
        },
      });

      if (!isHasScrollBar() && newList.length < count) {
        this.setState({ showLoader: false }, this.loadMoreList);

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
   * Load more List
   */
  loadMoreList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchRecordEditors
    );
  };

  /**
   * Update List
   *
   * @param {Array} list
   */
  updateList = list => {
    this.setState({ list });
  };

  /**
   * Go To > Route
   */
  goToRoute = route => () => {
    this.props.history.push(route);
  };

  /**
   *
   * @param {String} action
   */
  handleActionCompleted = action => {
    const { pagination } = this.state;

    switch (action) {
      case RECORD_EDITOR_ACTIONS.delete:
        const paginate = { ...pagination, total: pagination.total - 1 };

        this.setState({ pagination: paginate });
        break;

      default:
        break;
    }
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
        list: [],
      },
      this.fetchRecordEditors
    );
  };

  /**
   * Render View
   */
  render() {
    const { showLoader, list, showArchived, isSelectTableModal } = this.state;

    return (
      <>
        <AppHeader
          header={`${showArchived ? 'Archived ' : ''}Record Editor`}
          onSave={this.goToRoute(APP_ROUTES.CREATE_RECORD_EDITOR)}
          onBack={showArchived ? this.toggleArchived : undefined}
          backText={showArchived ? 'All Record Editor' : ''}
          headerActions={
            <HeaderActions
              onArchive={this.toggleArchived}
              onCreate={this.toggleSelectTableModal}
              showArchived={showArchived}
            />
          }
        />

        {showLoader && list.length == 0 && <Spinner />}

        <CreateRecordEditorModal
          isOpen={isSelectTableModal}
          onClose={this.toggleSelectTableModal}
        />

        {list.length > 0 ? (
          <GridView
            list={list}
            updateList={this.updateList}
            isArchived={showArchived}
            onActionCompleted={this.handleActionCompleted}
            showLoader={showLoader}
          />
        ) : (
          !showLoader && (
            <NoRecordEditor
              hideCreateBtn={showArchived}
              msg={showArchived ? 'No Archived Record Editor Found' : undefined}
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
        New Record Editor
      </Button>
    </Box>
  );
}

HeaderActions.propTypes = {
  onArchive: func.isRequired,
  onCreate: func.isRequired,
  showArchived: bool.isRequired,
};

export default withRouter(RecordEditors);
