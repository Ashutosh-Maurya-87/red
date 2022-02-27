import React from 'react';
import { string, func, shape, bool } from 'prop-types';
import moment from 'moment';
import { get } from 'lodash';

import { Grid as VirtualGrid, AutoSizer, ScrollSync } from 'react-virtualized';
import { Box, Button, TextField } from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';

import CreateScenarioFooter from '../Footer';
import CustomScrollbars from '../../../../components/ScrollBars';
import Spinner from '../../../../components/Spinner';
import ListboxComponent from '../../../../components/CustomListBox';

import { SORT_OPTIONS } from '../../../SourceTables';
import { API_URLS } from '../../../../configs/api';
import { DEFAULT_COL_WIDTH } from '../../../../configs/app';
import { DEFAULT_DATA, TABLE_CONFIGS, INITIAL_PAGINATION } from './configs';

import { getColumnsOfSourceTable } from '../../../ProcessBuilder/CreateProcess/helper';
import { fillFinancialEnvData } from '../../../FinancialEnvSetup/helper';
import { httpGet } from '../../../../utils/http';

import './styles.scss';

const filter = createFilterOptions();

class ViewScenarioSource extends React.Component {
  /**
   * State
   */
  state = {
    headers: [],
    height: 70,
    data: JSON.parse(JSON.stringify(DEFAULT_DATA)),

    isFetching: false,
    scenarios: [],

    actualTable: { columns: [] },
    actualTableInputs: {},

    search: '',
    sortBy: SORT_OPTIONS[3].value,
    pagination: { ...INITIAL_PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  async componentDidMount() {
    const isLoaded = await this.fetchFinancialEnvData();

    this.setHeaders();
    const callback = this.fillScenarioMapping;

    if (isLoaded) this.fetchScenarios({ callback });
  }

  /**
   * Set Table Headers
   */
  setHeaders = () => {
    const { scenarioInputs } = this.props;
    const { forecastStartDate } = scenarioInputs;

    const { actualTableInputs } = this.state;
    const { fiscalYear } = actualTableInputs;

    const fiscalYearObject = moment(fiscalYear);
    const forecastDateObject = moment(forecastStartDate);

    let month = fiscalYearObject.month();
    let year = forecastDateObject.year();

    if (forecastDateObject.month() < month) year--;

    const headers = [
      '',
      'Period',
      ...Array.apply(0, Array(12)).map((_, i) => {
        const header = moment()
          .year(year)
          .month(month)
          .format(TABLE_CONFIGS.headerDateFormat);

        month++;

        return header;
      }),
    ];

    this.setState({ headers });
  };

  /**
   * Fill Scenario Mappings
   */
  fillScenarioMapping = () => {
    if (!this.props.viewMode) return;

    const { data } = this.state;
    const { scenario: { source_scenario_mapping = [] } = {} } = this.props;

    source_scenario_mapping.forEach((s, i) => {
      if (!s.source_scenario_id) return;

      // Set Source Period
      const srcPeriod = s.source_period
        ? moment(s.source_period).format(TABLE_CONFIGS.headerDateFormat)
        : '';
      data[1][i + 2] = { label: srcPeriod, value: srcPeriod };

      // Set Scenario
      if (s.source_scenario_id) {
        data[0][i + 2] = {
          label: s.source_scenario_id,
          value: s.source_scenario_id,
        };
      }
    });

    this.setState({ data });
  };

  /**
   * Fetch Financial ENV Setup Data from API and Fill in Inputs
   */
  fetchFinancialEnvData = async () => {
    try {
      this.setState({ isFetching: true });

      let actualTable = { columns: [] };

      const res = await httpGet(API_URLS.GET_FINANCIAL_ENV_DATA);

      const {
        actualTable: actualTableMeta,
        actualTableInputs,
      } = fillFinancialEnvData(res);

      if (actualTableMeta && actualTableMeta.id) {
        const { tableData, columns } = await getColumnsOfSourceTable(
          actualTableMeta.id
        );

        actualTable = { ...tableData, columns, type: 'actual' };
      }

      if (!actualTableInputs.dateFormat) {
        actualTableInputs.dateFormat = TABLE_CONFIGS.headerDateFormat;
      }

      this.setState({ isFetching: false, actualTable, actualTableInputs });
      return true;
    } catch (e) {
      this.setState({ isFetching: false });
      return false;
    }
  };

  /**
   * Fetch Scenarios from API
   */
  fetchScenarios = async ({ callback } = {}) => {
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

      const cancelSearchHttp = func => {
        this.cancelSearchHttp = func;
      };

      const {
        data: { data, count },
      } = await httpGet(url, { callback: cancelSearchHttp });

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

      if (callback) callback();
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
    const { pagination, isFetching, scenarios } = this.state;

    if (isFetching || pagination.total <= scenarios.length) return;

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
   * Add Next Month
   */
  addNextMonth = () => {
    const { headers } = this.state;

    const lastMonth = headers[headers.length - 1] || '';

    const nextMonth = moment(lastMonth)
      .add(1, 'M')
      .format(TABLE_CONFIGS.headerDateFormat);

    headers.push(nextMonth);

    this.setState({ headers });
  };

  /**
   * Render Header Cell
   */
  renderHeaderCell = ({ columnIndex, key, style }) => {
    const { headers } = this.state;
    const label = headers[columnIndex] || '';

    let isShowDelete = false;
    if (columnIndex > 13 && columnIndex == headers.length - 1) {
      isShowDelete = true;
    }

    return (
      <div className="headerCell" key={key} style={style}>
        {label}

        {isShowDelete && (
          <DeleteIcon
            fontSize="small"
            className="cursor-pointer"
            onClick={this.removeHeader}
          />
        )}
      </div>
    );
  };

  /**
   * Handle > Remove Headar
   */
  removeHeader = () => {
    const { headers, data } = this.state;

    const updatedData = data.map(row => {
      row.splice(headers.length - 1, 1);
      return row;
    });

    headers.pop();

    this.setState({ headers, data: updatedData });
  };

  /**
   * Render Body Cell
   */
  renderBodyCell = ({ columnIndex, key, rowIndex, style }) => {
    const styles = { ...style };

    const { data, headers, scenarios } = this.state;
    const { scenarioInputs: { forecastStartDate = '' } = {} } = this.props;

    let cellValue = '';
    const headerDate = headers[columnIndex];

    let isActual = false;
    let selectValue = '';

    if (
      columnIndex > 0 &&
      forecastStartDate &&
      moment(headerDate)
        .startOf('month')
        .isBefore(moment(forecastStartDate).startOf('month'))
    ) {
      isActual = true;
    }

    // Show Text "Actual"
    if (isActual && rowIndex == 0) {
      cellValue = <Box color="primary.main">Actual</Box>;
    }

    // Show Actual Table Month
    if (isActual && rowIndex == 1) {
      cellValue = moment(headerDate).format(TABLE_CONFIGS.headerDateFormat);
    }

    if (!cellValue) {
      ({ label: cellValue = '' } =
        (data[rowIndex] && data[rowIndex][columnIndex]) || {});
    }

    // Scenario Selection
    if (!isActual && columnIndex > 1 && rowIndex == 0) {
      selectValue = cellValue;
      styles.paddingRight = 0;

      cellValue = (
        <Autocomplete
          style={{ width: '100%' }}
          value={{ label: selectValue }}
          selectOnFocus
          clearOnBlur
          disableClearable
          blurOnSelect
          handleHomeEndKeys
          ListboxComponent={ListboxComponent}
          ListboxProps={{
            state: this.state,
            loadMoreTables: this.loadMoreScenarios,
          }}
          className="small-select"
          options={scenarios.map(s => ({
            label: s.display_name,
            value: s.id,
          }))}
          getOptionLabel={({ label = '' }) => label}
          onChange={this.handleSelectScenario({
            columnIndex,
            rowIndex,
            isActual,
          })}
          renderInput={params => <TextField {...params} variant="standard" />}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            return filtered;
          }}
        />
      );
    }

    // Source Period Selection
    if (!isActual && columnIndex > 1 && rowIndex == 1) {
      selectValue = cellValue;
      styles.paddingRight = 0;

      const { scenario = {} } = get(data, `${rowIndex}.${columnIndex}`) || {};
      const { sourcePeriods = [] } = scenario;

      cellValue = (
        <Autocomplete
          style={{ width: '100%' }}
          value={{ label: selectValue }}
          selectOnFocus
          clearOnBlur
          disableClearable
          blurOnSelect
          handleHomeEndKeys
          ListboxComponent={ListboxComponent}
          className="small-select"
          options={sourcePeriods}
          getOptionLabel={({ label = '' }) => label}
          onChange={this.handleSelectSourcePeriod({
            columnIndex,
            rowIndex,
            isActual,
          })}
          renderInput={params => <TextField {...params} />}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            return filtered;
          }}
        />
      );
    }

    return (
      <div className="cell" key={`${key}-${cellValue}`} style={styles}>
        {cellValue}
      </div>
    );
  };

  /**
   * Get Row Height
   *
   * @return {Number}
   */
  getRowHeight = ({ index }) => {
    return 30;
  };

  /**
   * Get Column Width
   *
   * @param {*} param0
   */
  getColumnWidth = ({ index }) => {
    switch (index) {
      case 0:
        return 40;

      default:
        return DEFAULT_COL_WIDTH;
    }
  };

  /**
   * Handle Table Scrolling
   */
  handleOnScroll = evt => {
    const { scrollTop, scrollLeft } = evt.target;

    this.dataCellGrid.handleScrollEvent({ scrollTop, scrollLeft });
  };

  /**
   * Handle > Select Scenario
   *
   * @param {Object}
   */
  handleSelectScenario = ({ columnIndex, rowIndex }) => async (evt, opt) => {
    try {
      const { data, scenarios, headers } = this.state;

      const { label = '', value = '' } = opt || {};

      const cellValue = { label, value };

      const scenarioIndex = scenarios.findIndex(({ id }) => id == value);
      const scenario = scenarios[scenarioIndex] || {};

      if (scenarioIndex > -1 && !scenario.sourcePeriods) {
        this.setState({ isFetching: true });

        let url = API_URLS.GET_SCENARIOI_SRC_PERIODS;
        url = url.replace('#ID#', value);

        const { data } = await httpGet(url);

        const sourcePeriods = [];

        (data || []).forEach(date => {
          if (!date) return;

          const value = moment(date, 'YYYY-MM').format(
            TABLE_CONFIGS.headerDateFormat
          );

          sourcePeriods.push({ label: value, value });
        });

        scenario.sourcePeriods = sourcePeriods;
        scenarios[scenarioIndex] = { ...scenario };
      }

      if (!data[rowIndex]) data[rowIndex] = [];
      if (!data[rowIndex][columnIndex]) data[rowIndex][columnIndex] = {};
      if (!data[rowIndex + 1]) data[rowIndex] = [];
      if (!data[rowIndex + 1][columnIndex]) data[rowIndex][columnIndex] = {};

      data[rowIndex][columnIndex] = cellValue;

      const headerDate = headers[columnIndex];

      let matchedHeader = false;

      scenario.sourcePeriods.filter(headers => {
        if (headers.label == headerDate) {
          matchedHeader = true;
        }
        return matchedHeader;
      });

      data[rowIndex + 1][columnIndex] = {
        ...data[rowIndex + 1][columnIndex],
        scenario,
        label: matchedHeader ? headerDate : '',
        value: matchedHeader ? headerDate : '',
      };

      this.setState({ data, scenarios, isFetching: false }, () =>
        this.fillSourceColumns({
          cellValue,
          scenario,
          columnIndex,
        })
      );
    } catch (e) {
      console.error(e);
      this.setState({ isFetching: false });
    }
  };

  /**
   * Auto fill all Source-columns with scenarios
   *
   * @param {Object}
   */
  fillSourceColumns = ({ cellValue, scenario, columnIndex }) => {
    const { data = [], headers = [] } = this.state || {};
    const sourceData = [...data];
    const [sourceFirstElement = []] = sourceData || [];

    // Filling scenarios in all sources
    headers.forEach((header, index) => {
      if (sourceFirstElement.length <= headers.length - 1) {
        sourceFirstElement.push(cellValue);
      }

      // when sources are not emptied in between
      if (!sourceFirstElement[index] && index > columnIndex) {
        sourceFirstElement[index] = cellValue;
      }
    });

    // Updating states and callback
    this.setState({ data: sourceData }, () =>
      this.fillSourcePeriodColumns({
        sourceData,
        scenario,
        cellValue,
      })
    );
  };

  /**
   * Auto fill source-period as per header matching months
   *
   * @param {Array} param
   */
  fillSourcePeriodColumns = ({ sourceData, scenario, cellValue }) => {
    const { headers = [] } = this.state || {};
    const [sourceFirstElement = [], sourceSecondElement = []] =
      sourceData || [];

    headers.forEach((header, headIndex) => {
      let matchedHeader = false;

      if (headIndex <= 1) return;

      // Matching if header == source-period dropdown
      scenario.sourcePeriods.filter(({ label = '' }) => {
        if (label == header) {
          matchedHeader = true;
        }
        return matchedHeader;
      });

      // Auto fill source-period months in dropdown
      if (
        matchedHeader &&
        sourceFirstElement[headIndex] &&
        sourceFirstElement[headIndex] === cellValue
      ) {
        sourceSecondElement[headIndex] = {
          scenario,
          label: header || '',
          value: header || '',
        };
      }

      // when source-period are not emptied in between
      if (sourceFirstElement[headIndex] && !sourceSecondElement[headIndex]) {
        sourceSecondElement[headIndex] = { scenario, label: '', value: '' };
      }

      // Adding dropdown when source-period doesn't match with header
      if (sourceSecondElement.length <= headers.length - 1) {
        sourceSecondElement.push({
          scenario,
          label: '',
          value: '',
        });
      }
    });

    // Updating state
    this.setState({ data: sourceData });
  };

  /**
   * Handle > Select Source Period
   *
   * @param {Object}
   */
  handleSelectSourcePeriod = ({ columnIndex, rowIndex }) => (evt, opt) => {
    const { data } = this.state;
    const { label = '', value = '' } = opt || {};

    const cellValue = { label, value };

    if (!data[rowIndex]) data[rowIndex] = [];
    if (!data[rowIndex][columnIndex]) data[rowIndex][columnIndex] = {};

    data[rowIndex][columnIndex] = {
      ...data[rowIndex][columnIndex],
      ...cellValue,
    };

    this.setState({ data });
  };

  /**
   * Handle Click on Create Scenario
   */
  handleCreate = () => {
    const { onNext } = this.props;
    const { headers, data } = this.state;

    onNext({ headers, data });
  };

  /**
   * Render View
   */
  render() {
    const { backText, nextText, onBack, showLoader, viewMode } = this.props;
    const { headers, height, isFetching } = this.state;

    const { headerCellHeight } = TABLE_CONFIGS;

    return (
      <>
        {(showLoader || isFetching) && <Spinner />}

        <Box px={4}>
          <div className="virtualized-data-sheet scenario-data-view">
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
                          if (
                            width >
                            (headers.length - 1) * DEFAULT_COL_WIDTH
                          ) {
                            width =
                              (headers.length - 1) * DEFAULT_COL_WIDTH +
                              TABLE_CONFIGS.firstColWidth;
                          }

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
                                  columnWidth={this.getColumnWidth}
                                  overscanColumnCount={5}
                                  cellRenderer={this.renderHeaderCell}
                                  rowCount={1}
                                  columnCount={headers.length}
                                  scrollLeft={scrollLeft}
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
                                    columnWidth={this.getColumnWidth}
                                    columnCount={headers.length}
                                    height={height}
                                    onScroll={onScroll}
                                    overscanColumnCount={1}
                                    overscanRowCount={1}
                                    cellRenderer={this.renderBodyCell}
                                    rowHeight={this.getRowHeight}
                                    rowCount={2}
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

          {!viewMode && headers.length > 0 && (
            <Box pt={2} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                onClick={this.addNextMonth}
              >
                <AddIcon fontSize="small" />
                &nbsp; Add Next Month
              </Button>
            </Box>
          )}
        </Box>

        {!viewMode && headers.length > 0 && (
          <Box px={1}>
            <CreateScenarioFooter
              backText={backText}
              nextText={nextText}
              onBack={onBack}
              onNext={this.handleCreate}
            />
          </Box>
        )}
      </>
    );
  }
}

ViewScenarioSource.propTypes = {};

ViewScenarioSource.propTypes = {
  backText: string,
  hideFooter: bool,
  nextText: string,
  onBack: func,
  onNext: func.isRequired,
  scenario: shape({}),
  scenarioInputs: shape({}).isRequired,
  showLoader: bool,
  viewMode: bool,
};

ViewScenarioSource.defaultProps = {
  backText: 'Back',
  nextText: 'Create',
  hideFooter: false,
  onBack: () => {},
  showLoader: false,
  viewMode: false,
  scenario: {},
};

export default ViewScenarioSource;
