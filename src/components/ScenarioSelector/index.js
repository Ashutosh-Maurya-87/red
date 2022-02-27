import React from 'react';
import { any, func, string, number, bool } from 'prop-types';

import { Box, TextField, Grid, Link } from '@material-ui/core';
import { API_URLS } from '../../configs/api';
import { SORT_OPTIONS } from '../../views/SourceTables';
import { httpGet } from '../../utils/http';

import Spinner from '../Spinner';
import ThumbnailSelector from '../ThumbnailSelector';
import CustomScrollbars from '../ScrollBars';
import NoScenario from '../../views/Scenarios/NoScenario';

class ScenarioSelector extends React.Component {
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
   * Camcel Search Request Handler
   */
  cancelSearchHttp;

  /**
   * State
   */
  state = {
    isFetching: false,
    scenarios: [],

    search: '',
    sortBy: SORT_OPTIONS[3].value,
    pagination: { ...this.INITIAL_PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fetchScenarios();
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
    const { isFetching, pagination, scenarios } = this.state;

    if (isFetching) return;

    if (pagination.total <= scenarios.length) return;

    if (
      window.innerHeight + document.documentElement.scrollTop + 10 <
      document.documentElement.offsetHeight
    ) {
      return;
    }

    this.loadMoreScenarios();
  };

  /**
   * Fetch Scenarios from API
   */
  fetchScenarios = async () => {
    try {
      const { search, isFetching, pagination, sortBy, scenarios } = this.state;
      const { limit, page } = pagination;

      if (isFetching) return;

      this.setState({ isFetching: true });

      const [sortField, sortOrder] = sortBy.split(' - ');

      let url = API_URLS.GET_SCENARIO_LIST;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&sort=${sortField}`;
      url += `&order=${sortOrder}`;

      if (search) url += `&search=${search}`;

      const callback = func => {
        this.cancelSearchHttp = func;
      };

      const {
        data: { data, count },
      } = await httpGet(url, { callback });

      let updatedData = [];
      if (data) {
        updatedData = data.map(s => {
          const { scenario_meta: { dataset_name: name = '' } = {} } = s;

          return {
            ...s,
            display_name: name,
          };
        });
      }

      const list = page == 1 ? updatedData : [...scenarios, ...updatedData];

      this.setState({
        scenarios: list,
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
   * Load more Scenarios
   */
  loadMoreScenarios = () => {
    const { pagination, isFetching } = this.state;

    if (isFetching) return;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchScenarios
    );
  };

  /**
   * Search Scenarios
   */
  searchScenarios = () => {
    this.setState(
      { pagination: { ...this.INITIAL_PAGINATION }, scenarios: [] },
      this.fetchScenarios
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

    this.searchTimeout = setTimeout(this.searchScenarios, 1500);
  };

  /**
   * Handle Selected Scenarios
   *
   * @param {Object} table
   */
  handleSelectedScenarios = table => {
    this.props.onSelect(table);
  };

  /**
   * Get Scenarios List Element
   *
   * @return {HTML}
   */
  getScenariosListElement = () => {
    const { selectedScenario } = this.props;
    const { scenarios, isFetching, pagination } = this.state;

    return (
      <div>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
        >
          {scenarios.map(table => {
            return (
              <ThumbnailSelector
                key={table.id}
                table={table}
                onSelect={this.handleSelectedScenarios}
                selectedTable={selectedScenario}
              />
            );
          })}
        </Grid>

        <Box width="100%" textAlign="center">
          {!isFetching && scenarios.length == 0 && <NoScenario hideImportBtn />}

          {!isFetching &&
            scenarios.length > 0 &&
            scenarios.length < pagination.total && (
              <Link className="cursor-pointer" onClick={this.loadMoreScenarios}>
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

        {!withScroll && this.getScenariosListElement()}

        {withScroll && (
          <CustomScrollbars style={{ width: '100%', height }}>
            {this.getScenariosListElement()}
          </CustomScrollbars>
        )}
      </Box>
    );
  }
}

ScenarioSelector.propTypes = {
  height: string,
  mt: number,
  onSelect: func.isRequired,
  selectedScenario: any,
  withScroll: bool,
};

ScenarioSelector.defaultProps = {
  height: '600px',
  mt: 0,
  withScroll: false,
};

export default ScenarioSelector;
