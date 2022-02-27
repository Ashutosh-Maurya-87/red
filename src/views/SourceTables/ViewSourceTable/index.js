import React from 'react';
import { withRouter } from 'react-router-dom';
import { bool, oneOfType, number, string, func } from 'prop-types';
import moment from 'moment';

import { Grid as VirtualGrid, AutoSizer, ScrollSync } from 'react-virtualized';
import { Box } from '@material-ui/core';

import Spinner from '../../../components/Spinner';
import AppHeader from '../../../components/AppHeader';
import CustomScrollbars from '../../../components/ScrollBars';
import ViewSourceTableFiltersModal from './FiltersModal';

import { API_URLS } from '../../../configs/api';
import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_COL_WIDTH,
  DEFAULT_DATE_FORMAT,
} from '../../../configs/app';

import { httpGet } from '../../../utils/http';
import programmaticallyLoadByUrl from '../../../utils/helper/programmaticallyLoadByUrl';
import getFormattedNumber from '../../../utils/helper/getFormattedNumber';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const CHARS_PER_LINE = 16;
const MIN_ROW_HEIGHT = 40;

class ViewSourceTable extends React.Component {
  /**
   * Initial Pagination
   */
  INITIAL_PAGINATION = {
    total: 0,
    limit: 5000,
    page: 1,
  };

  /**
   * Table Data
   */
  tableData = [];

  /**
   * Used to detect up|down scroll of table
   */
  lastScrollTop = 0;

  /**
   * State;
   */
  state = {
    id: '',
    tableName: '',
    tableMetaData: {},
    rangeData: {},
    headers: [],

    showLoader: false,
    isExporting: false,
    showFilterPopover: false,

    pagination: { ...this.INITIAL_PAGINATION },
    sortBy: '',
    sortDirection: '',
    selectedRange: {}, // For Number Filter
    selectedDateRange: {}, // For Date Filter
    search: {},

    // VirtualGrid configs
    overscanColumnCount: 1,
    overscanRowCount: 1,
    headerCellHeight: 50,
    height: 200,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const {
      match: { params },
      tableId,
      fromProcess,
    } = this.props;

    if (fromProcess) {
      this.INITIAL_PAGINATION.limit = 100;
      this.setState({ pagination: { ...this.INITIAL_PAGINATION } });
    }

    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();

    const id = tableId || params.id;
    this.setState({ id }, () => this.fetchTableData(true));
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  /**
   * Handle Window Resize
   */
  handleWindowResize = () => {
    const reduceHeight = this.props.fromProcess ? 150 : 170;

    if (this.props.scrollHeight) {
      this.setState({ height: this.props.scrollHeight });
      return;
    }

    this.setState({ height: window.innerHeight - reduceHeight });
  };

  /**
   * Get Formatted URL with Filters to get records
   */
  getFormattedUrl = isExport => {
    const {
      id,
      sortBy,
      sortDirection,
      selectedRange,
      selectedDateRange,
      search,
      pagination,
    } = this.state;

    const { page, limit } = pagination;
    const filters = [];

    let url = API_URLS.GET_SOURCE_TABLE_BY_ID;
    if (isExport) url = API_URLS.EXPORT_SOURCE_TABLE;

    url = url.replace('#ID#', id);

    // Add Pagination
    if (!isExport) {
      url += `?limit=${limit}`;
      url += `&offset=${page == 1 ? 0 : (page - 1) * limit}`;
    } else {
      url += `?offset=0`;
      url += `&response_type=url`;
    }

    // Add Sort
    if (sortBy && sortDirection) url += `&sort=${sortBy} ${sortDirection}`;

    // Add Search
    Object.keys(search).forEach(key => {
      const value = search[key];
      if (value) {
        filters.push({
          name: key,
          op: 'like',
          value,
        });
      }
    });

    // Add Number Range Filter
    Object.keys(selectedRange).forEach(key => {
      if (selectedRange[key]) {
        const [min, max] = selectedRange[key];

        filters.push({
          name: key,
          op: 'gte',
          value: String(min),
        });

        filters.push({
          name: key,
          op: 'lte',
          value: String(max),
        });
      }
    });

    // Add Date Range Filter
    Object.keys(selectedDateRange).forEach(key => {
      const { start, end } = selectedDateRange[key];

      if (start) {
        filters.push({
          name: key,
          op: 'gte',
          value: start,
        });
      }

      if (end) {
        filters.push({
          name: key,
          op: 'lte',
          value: end,
        });
      }
    });

    if (filters.length > 0) {
      url += `&q=${btoa(JSON.stringify({ filters }))}`;
    }

    return url;
  };

  /**
   * Fetch Table Data form API
   */
  fetchTableData = async isOnMount => {
    try {
      const { showLoader, pagination, tableMetaData } = this.state;
      let { rangeData } = this.state;

      if (showLoader) return;

      const { page } = pagination;
      this.setState({ showLoader: true });

      const {
        table_name = '',
        data,
        metadata,
        ranges,
        pagination: { total } = {},
      } = await httpGet(this.getFormattedUrl());

      this.tableData = page == 1 ? data : [...this.tableData, ...data];
      if (this.tableData.length == 0) this.tableData = [{}];

      let headers = [];

      if (page == 1) {
        this.setState({ headers: [] }); // To fix data cell height

        (metadata || []).forEach(meta => {
          if (!meta.data_type) {
            meta.data_type = COLUMN_DATA_TYPES_KEYS.alphanumeric;
          }

          tableMetaData[meta.name] = meta;
          headers.push(meta.name);
        });

        (ranges || []).forEach(range => {
          rangeData = { ...rangeData, ...range };
        });
      }

      if (headers.length == 0) ({ headers } = this.state);

      this.setState({
        headers,
        showLoader: false,
        tableMetaData,
        tableName: table_name,
        rangeData,
        pagination: {
          ...pagination,
          total,
        },
      });

      if (isOnMount) this.props.onLoadData({ data, metadata });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Load more records
   */
  loadMore = () => {
    const { pagination } = this.state;

    if (this.tableData.length >= pagination.total) return;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchTableData
    );
  };

  /**
   * Export Source Table (Also with Filters)
   */
  exportSourceTable = async () => {
    logAmplitudeEvent('Export source table');

    try {
      const { tableName, isExporting } = this.state;
      if (isExporting) return;

      this.setState({ isExporting: true });

      const url = this.getFormattedUrl(true);
      const { file_url } = await httpGet(url);

      programmaticallyLoadByUrl(file_url, {
        target: '_blank',
        name: `${tableName}.xls`,
      });

      this.setState({ isExporting: false });
    } catch (e) {
      this.setState({ isExporting: false });
    }
  };

  /**
   * Render Header Cell
   */
  renderHeaderCell = ({ columnIndex, key, style }) => {
    const { tableMetaData, headers, rangeData } = this.state;

    const label = headers[columnIndex];
    const lableForView = String(tableMetaData[label].display_name || label);

    return (
      <div className="headerCell" key={key} style={style}>
        <ViewSourceTableFiltersModal
          state={this.state}
          label={label}
          hideFilters={this.props.hideFilters}
          lableForView={lableForView}
          tableMetaData={tableMetaData}
          rangeData={rangeData}
          handleSortAction={this.handleSortAction}
          handleDoneAction={this.handleDoneAction}
          handleResetAction={this.handleResetAction}
        />
      </div>
    );
  };

  /**
   * Render Body Cell
   */
  renderBodyCell = ({ columnIndex, key, rowIndex, style }) => {
    const { tableMetaData, headers } = this.state;

    const headerKey = headers[columnIndex];
    const { date_format, data_type } = tableMetaData[headerKey] || {};

    let cellValue = this.tableData[rowIndex][headers[columnIndex]];

    if (cellValue && data_type == COLUMN_DATA_TYPES_KEYS.date) {
      cellValue = moment(cellValue).format(date_format || DEFAULT_DATE_FORMAT);
    }

    if (cellValue && data_type == COLUMN_DATA_TYPES_KEYS.amount) {
      cellValue = getFormattedNumber(cellValue);
    }

    return (
      <div className="cell" key={`${key}-${cellValue}`} style={style}>
        {cellValue}
      </div>
    );
  };

  /**
   * Handle Table Scrolling
   */
  handleOnScroll = e => {
    const { scrollTop, scrollLeft, scrollHeight, clientHeight } = e.target;
    const height = scrollTop + clientHeight;

    if (scrollTop > this.lastScrollTop && height >= scrollHeight - 1000) {
      this.loadMore();
    }

    this.lastScrollTop = scrollTop;
    this.dataCellGrid.handleScrollEvent({ scrollTop, scrollLeft });
  };

  /**
   * Get Row Height
   *
   * @return {Number}
   */
  getRowHeight = ({ index }) => {
    const row = this.tableData[index];

    let chars = CHARS_PER_LINE;
    Object.keys(row).forEach(key => {
      const l = String(row[key]).length;
      if (l > chars) chars = l;
    });

    const lines = chars / CHARS_PER_LINE;
    const height = MIN_ROW_HEIGHT * lines;

    if (height < MIN_ROW_HEIGHT) return MIN_ROW_HEIGHT;

    return height;
  };

  /**
   * Handle Sort Action
   *
   * @param {Object}
   */
  handleSortAction = ({ sortBy, sortDirection }) => {
    if (
      this.state.sortBy == sortBy &&
      this.state.sortDirection == sortDirection
    ) {
      return;
    }

    this.setState(
      { sortBy, sortDirection, pagination: { ...this.INITIAL_PAGINATION } },
      this.fetchTableData
    );
  };

  /**
   * Handle Reset Filters Action
   *
   * @param {Object}
   */
  handleResetAction = params => {
    this.handleDoneAction(params);
  };

  /**
   * Handle Apply Filters Action
   *
   * @param {Object}
   */
  handleDoneAction = ({ label, rangeValue, dateRange, searchInput }) => {
    const {
      tableMetaData,
      search,
      selectedRange,
      selectedDateRange,
    } = this.state;

    switch (tableMetaData[label].data_type) {
      case COLUMN_DATA_TYPES_KEYS.alphanumeric:
        if (search[label] == searchInput) return;

        search[label] = searchInput;
        break;

      case COLUMN_DATA_TYPES_KEYS.amount:
        if (
          rangeValue &&
          JSON.stringify(selectedRange[label]) == JSON.stringify(rangeValue)
        ) {
          return;
        }

        selectedRange[label] = rangeValue;
        break;

      case COLUMN_DATA_TYPES_KEYS.date:
        if (
          JSON.stringify(selectedDateRange[label]) == JSON.stringify(dateRange)
        ) {
          return;
        }

        selectedDateRange[label] = dateRange;
        break;

      default:
        return;
    }

    this.setState(
      {
        pagination: { ...this.INITIAL_PAGINATION },
        search,
        selectedRange,
        selectedDateRange,
      },
      this.fetchTableData
    );
  };

  /**
   * Render View
   */
  render() {
    const {
      headers,
      selectedRange,
      selectedDateRange,
      showLoader,
      tableName,
      isExporting,
      pagination: { total },

      // Virtual Grid configs
      headerCellHeight,
      height,
      overscanColumnCount,
      overscanRowCount,
    } = this.state;

    const { fromProcess, hideHeader } = this.props;

    return (
      <>
        {!hideHeader && (
          <AppHeader
            header={tableName}
            totalRecords={total}
            showBreadcrumbs={!fromProcess}
            saveText={total > 0 ? 'Export' : ''}
            onSave={this.exportSourceTable}
          />
        )}

        {(showLoader || isExporting) && <Spinner />}

        {!showLoader && total == 0 && headers.length == 0 && (
          <Box textAlign="center" marginTop="48px" fontSize="18px">
            No records found.
          </Box>
        )}

        {headers.length > 0 && (
          <div className="virtualized-data-sheet">
            <ScrollSync>
              {({ onScroll, scrollLeft, clientHeight }) => {
                return (
                  <div
                    className="GridRow"
                    style={{ height: clientHeight + headerCellHeight }}
                  >
                    <div className="GridColumn">
                      <AutoSizer>
                        {({ width }) => {
                          if (width > headers.length * DEFAULT_COL_WIDTH) {
                            width = headers.length * DEFAULT_COL_WIDTH;
                          }

                          const cellWidth = DEFAULT_COL_WIDTH;

                          return (
                            <>
                              <div
                                style={{
                                  backgroundColor: `rgb(51, 51, 51)`,
                                  color: '#fff',
                                  height: headerCellHeight,
                                  width,
                                }}
                              >
                                {/* Table Header */}
                                <VirtualGrid
                                  className="HeaderGrid"
                                  height={headerCellHeight}
                                  rowHeight={headerCellHeight}
                                  width={width}
                                  columnWidth={cellWidth}
                                  overscanColumnCount={overscanColumnCount}
                                  cellRenderer={this.renderHeaderCell}
                                  rowCount={1}
                                  columnCount={headers.length}
                                  scrollLeft={scrollLeft}
                                  selectedRange={selectedRange} // Required to Re-render header
                                  selectedDateRange={selectedDateRange} // Required to Re-render header
                                />
                              </div>

                              <div
                                style={{
                                  backgroundColor: `rgb(100,100,100)`,
                                  color: '#fff',
                                  height,
                                  width,
                                }}
                              >
                                <CustomScrollbars
                                  backgroundColor="#1d1d1d"
                                  style={{ width, height }}
                                  onScroll={this.handleOnScroll}
                                  autoHide={false}
                                >
                                  {/* Table Body */}
                                  <VirtualGrid
                                    ref={node => {
                                      this.dataCellGrid = node;
                                    }}
                                    className="BodyGrid"
                                    columnWidth={cellWidth}
                                    columnCount={headers.length}
                                    height={height}
                                    onScroll={onScroll}
                                    overscanColumnCount={overscanColumnCount}
                                    overscanRowCount={overscanRowCount}
                                    cellRenderer={this.renderBodyCell}
                                    rowHeight={this.getRowHeight}
                                    rowCount={this.tableData.length}
                                    width={width}
                                    style={{
                                      overflowX: 'visible',
                                      overflowY: 'visible',
                                    }}
                                  />
                                </CustomScrollbars>
                              </div>
                            </>
                          );
                        }}
                      </AutoSizer>
                    </div>
                  </div>
                );
              }}
            </ScrollSync>
          </div>
        )}
      </>
    );
  }
}

ViewSourceTable.propTypes = {
  fromProcess: bool,
  hideFilters: bool,
  hideHeader: bool,
  onLoadData: func,
  scrollHeight: number,
  tableId: oneOfType([number, string]),
};

ViewSourceTable.defaultProps = {
  hideHeader: false,
  onLoadData: () => {},
  fromProcess: false,
  hideFilters: false,
};

export default withRouter(ViewSourceTable);
