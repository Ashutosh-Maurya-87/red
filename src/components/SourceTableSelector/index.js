import React from 'react';
import { any, func, string, number, bool } from 'prop-types';

import { Box, TextField, Grid, Link } from '@material-ui/core';

import Spinner from '../Spinner';
import CustomScrollbars from '../ScrollBars';
import ThumbnailSelector from '../ThumbnailSelector';

import { API_URLS } from '../../configs/api';
import { PRE_DEFINED_LABELS } from '../../configs/app';

import { SORT_OPTIONS } from '../../views/SourceTables';
import NoSourceTables from '../../views/SourceTables/NoSourceTables';
import { SELECT_TABLE_TABS } from '../../views/SourceTables/SourceTablesList/ThumbnailView/configs';

import { httpGet } from '../../utils/http';

class SourceTableSelector extends React.Component {
  /**
   * Initial Pagination State
   */
  INITIAL_PAGINATION = {
    total: 0,
    limit: 20,
    page: 1,
  };

  /**
   * Search timeout Handler
   */
  searchTimeout;

  /**
   * Cancel Search Request Handler
   */
  cancelSearchHttp;

  /**
   * State
   */
  state = {
    isFetching: false,
    tables: [],

    search: '',
    sortBy: SORT_OPTIONS[3].value,
    pagination: { ...this.INITIAL_PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fetchTables();
    // window.addEventListener('scroll', this.handleScroll);
  }

  /**
   * When Component will Unmount
   */
  componentWillUnmount() {
    // window.removeEventListener('scroll', this.handleScroll);
  }

  /**
   * Handle Scroll event to load more records
   */
  handleScroll = () => {
    const { isFetching, pagination, tables } = this.state;

    if (isFetching) return;

    if (pagination.total <= tables.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreTables();
  };

  /**
   * Fetch Source Tables from API
   */
  fetchTables = async () => {
    try {
      const { search, isFetching, pagination, sortBy, tables } = this.state;
      const { type } = this.props;
      const { limit, page } = pagination;

      if (isFetching) return;

      this.setState({ isFetching: true });

      const [sortField, sortOrder] = sortBy.split(' - ');

      let url = API_URLS.GET_SOURCE_TABLES;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&sort=${sortField}`;
      url += `&order=${sortOrder}`;

      if (type) {
        url += `&source_filter=${type}`;
      }

      if (search) url += `&search=${search}`;

      const callback = func => {
        this.cancelSearchHttp = func;
      };

      const {
        data: { data, count },
      } = await httpGet(url, { callback });

      const list = page == 1 ? data : [...tables, ...data];

      this.setState({
        tables: list,
        isFetching: false,
        pagination: {
          ...pagination,
          total: count,
        },
      });
    } catch (e) {
      const { pagination } = this.state;

      this.setState({
        isFetching: false,
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
    const { pagination, isFetching } = this.state;

    if (isFetching) return;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchTables
    );
  };

  /**
   * Search Source Tables
   */
  searchTables = () => {
    this.setState(
      { pagination: { ...this.INITIAL_PAGINATION }, tables: [] },
      this.fetchTables
    );
  };

  /**
   * Handle Search Input
   *
   * @param {Event}
   */
  handleSearch = ({ target }) => {
    this.setState({ search: target.value });

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (this.cancelSearchHttp) this.cancelSearchHttp();

    this.searchTimeout = setTimeout(this.searchTables, 1500);
  };

  /**
   * Handle Selected Table
   *
   * @param {Object} table
   */
  handleSelectedTable = table => {
    this.props.onSelect(table);
  };

  /**
   * Get Tables List Element
   *
   * @return {HTML}
   */
  getTablesListElement = () => {
    const {
      selectedTable,
      isDisplayScenarioLabel,
      isActualEnabled,
      title,
    } = this.props;
    const { tables, isFetching, pagination } = this.state;

    return (
      <div>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
        >
          {tables.map((table, i) => {
            return (
              <>
                {table?.scenario?.label !== PRE_DEFINED_LABELS.actuals.label &&
                  !isActualEnabled && (
                    <ThumbnailSelector
                      key={i}
                      table={table}
                      onSelect={this.handleSelectedTable}
                      selectedTable={selectedTable}
                      isDisplayScenarioLabel={isDisplayScenarioLabel}
                    />
                  )}
                {isActualEnabled && (
                  <ThumbnailSelector
                    key={i}
                    table={table}
                    onSelect={this.handleSelectedTable}
                    selectedTable={selectedTable}
                    isDisplayScenarioLabel={isDisplayScenarioLabel}
                  />
                )}
              </>
            );
          })}
        </Grid>

        <Box width="100%" textAlign="center">
          {!isFetching && tables.length == 0 && (
            <NoSourceTables hideImportBtn title={title} />
          )}

          {!isFetching &&
            tables.length > 0 &&
            tables.length < pagination.total && (
              <Link className="cursor-pointer" onClick={this.loadMoreTables}>
                Load more
              </Link>
            )}

          {isFetching && pagination.page > 1 && <Link>Loading...</Link>}
        </Box>
      </div>
    );
  };

  /**
   * Render View
   */
  render() {
    const { height, mt, withScroll } = this.props;
    const { search, isFetching, pagination } = this.state;

    return (
      <Box>
        <Box width={450} mt={mt} mb={2}>
          <TextField
            name="search"
            placeholder="Search Table"
            value={search}
            onChange={this.handleSearch}
            variant="outlined"
            size="small"
            fullWidth
            autoComplete="off"
          />
        </Box>

        {isFetching && pagination.page == 1 && <Spinner />}

        {!withScroll && this.getTablesListElement()}

        {withScroll && (
          <CustomScrollbars style={{ width: '100%', height }}>
            {this.getTablesListElement()}
          </CustomScrollbars>
        )}
      </Box>
    );
  }
}

SourceTableSelector.propTypes = {
  height: string,
  isActualEnabled: bool,
  isDisplayScenarioLabel: bool,
  mt: number,
  onSelect: func.isRequired,
  selectedTable: any,
  title: string,
  type: string,
  withScroll: bool,
};

SourceTableSelector.defaultProps = {
  height: '600px',
  mt: 0,
  withScroll: false,
  isDisplayScenarioLabel: false,
  type: SELECT_TABLE_TABS.SOURCE.value,
  isActualEnabled: true,
};

export default SourceTableSelector;
