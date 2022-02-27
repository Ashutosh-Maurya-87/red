import React from 'react';
import { arrayOf, func, shape } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import qs from 'query-string';
import { get } from 'lodash';
import moment from 'moment';
import MomentUtils from '@date-io/moment';

import {
  Box,
  Tab,
  Tabs,
  Popover,
  Button,
  Paper,
  Typography,
  MenuItem,
  Tooltip,
} from '@material-ui/core';
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Edit as EdiIcon, Add as AddIcon } from '@material-ui/icons';

import ImgRenderer from '../../../components/ImgRenderer';
import Spinner from '../../../components/Spinner';
import AppHeader from '../../../components/AppHeader';
import UploadLoader from '../../../components/UploadLoader';
import ColumnsSelection from '../../../components/ColumnsSelection';

import DataOverview from './DataOverview';
import DataForecasting from './DataForecasting';
import RBMSetupWizard from '../RBMSetupWizard';
import RenameRBMInline from './RenameRBMInline';
import RBMHeaderActions from './RBMHeaderActions';
import { getFormattedPayload } from './helper';
import ImportSourceTable from '../../SourceTables/ImportSourceTable';

import {
  TABS,
  startDate,
  endDate,
  defaultStartDate,
  SETUP_WIZARD_ACTIONS,
} from './configs';
import { RULE_BASED_MODELS_API } from '../../../configs/api';

import { BETA_MSG, RULE_BASED_MODELS_MSG } from '../../../configs/messages';
import { APP_ROUTES } from '../../../configs/routes';
import {
  DEFAULT_DATE_FORMAT,
  EDIT_REPORT_VIEW,
  RBM_FORECAST_DATE_FORMAT,
} from '../../../configs/app';

import { uploadFiles } from '../../../services/Source';
import { handleFileForReloadTable } from '../../../services/Dimensions';

import { httpGet, httpPost } from '../../../utils/http';
import programmaticallyLoadByUrl from '../../../utils/helper/programmaticallyLoadByUrl';

import {
  setSingleRBM,
  setClearData,
  setDateRange,
  setOverViewGridData,
  setForecastingGridData,
  setForecastingGridHeaders,
  setForecastingData,
} from '../../../reducers/RuleBasedModels/actions';
import {
  getSingleRBM,
  getDateRange,
  getForecastingData,
  getForecastingGridData,
  getOverViewGridData,
  getForecastingGridHeaders,
  getOverViewGridHeaders,
} from '../../../reducers/RuleBasedModels/selectors';
import { setSourceTable } from '../../../reducers/SourceTables/actions';

import {
  getFormattedGridData,
  getFormattedGridHeaders,
} from './DataForecasting/helper';

import { getFormattedGridData as getForecastingOverViewGridData } from './DataOverview/helper';
import AddEditRecord from './DataOverview/AddEditRecord';

import './styles.scss';

class EditRuleBasedModel extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    isReloadTable: false,
    uploadPercentage: null,
    activeTab: 0,
    ruleActiveTab: 0,
    settingEle: null,
    isColumnsModal: false,
    isSubmit: false,
    isShowAddRecDraw: false,
    isBlockDone: false,
  };

  /**
   * Setup Wizard Ref
   */
  editSetupWizardRef = React.createRef();

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.loadInitialData();
  }

  /**
   * When Component will unmount -LifeCycle
   *
   * Purpose:- It will clear All Data from store
   */
  componentWillUnmount() {
    this.props.setClearData();
  }

  /**
   * Load Initial Data
   */
  loadInitialData = async () => {
    try {
      const {
        match,
        setSingleRBM,
        location: { search = '' } = {},
      } = this.props;

      const query = new URLSearchParams(search);
      const tab = Number(query.get('tab'));

      this.setState({ showLoader: true });

      const id = get(match, 'params.id');

      let activeTab = 0;
      if (tab > 0 && tab <= 2) activeTab = tab;

      // Loading singleRBM
      const getSingleRBM = RULE_BASED_MODELS_API.GET_SINGLE_RBM.replace(
        '#ID#',
        id
      );
      const { data } = await httpGet(getSingleRBM);

      setSingleRBM(data);

      this.setState({ showLoader: false, activeTab });
    } catch (e) {
      console.error(e);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Export Template
   */
  exportTemplate = async () => {
    try {
      const { showLoader } = this.state;
      if (showLoader) return;

      this.setState({ showLoader: true });

      const { singleRBM: { id = '' } = {}, overViewGridData } = this.props;

      if (id && overViewGridData.length == 0) {
        const url = RULE_BASED_MODELS_API.EXPORT_TEMPLATE_RBM.replace(
          '#ID#',
          id
        );

        const { data: { url: file_url } = {} } = await httpGet(url);

        programmaticallyLoadByUrl(file_url, { target: '_blank' });
      }

      if (overViewGridData && overViewGridData.length > 0) {
        const url = RULE_BASED_MODELS_API.EXPORT_OVERVIEW_RBM.replace(
          '#ID#',
          id
        );

        // Params with filters
        const { params = {} } = getFormattedPayload({
          headers: this.props.overViewGridHeaders,
        });

        const { data: { url: file_url } = {} } = await httpPost(
          encodeURI(url),
          params
        );
        programmaticallyLoadByUrl(file_url, { target: '_blank' });
      }

      this.setState({ showLoader: false });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Reload RBM
   */
  toggleImport = () => {
    this.setState({ isReloadTable: true });
  };

  /**
   * Handle File > Reload Rule Based Model
   *
   * @param {Object} file
   */
  handleFileForReload = async file => {
    try {
      const { singleRBM, history, setSourceTable } = this.props;

      this.setState({ isReloadTable: false });

      const uploadedFile = await this.uploadFile(file);
      if (!uploadedFile) return;

      const { source_table_id = '' } = singleRBM || {};

      const sourceTableObj = await handleFileForReloadTable(
        uploadedFile,
        source_table_id
      );

      if (sourceTableObj) {
        setSourceTable(sourceTableObj);
      }

      this.setState({ uploadPercentage: null });

      const {
        location: { pathname = '' },
      } = history;

      const url = `${APP_ROUTES.VIEW_RULE_BASED_MODEL}?redirectUrl=${pathname}`;

      history.push(url);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Set Upload Percentage
   *
   * @param {Number/String}
   */
  setUploadPercentage = percentage => {
    this.setState({ uploadPercentage: percentage });
  };

  /**
   * Upload Imported File
   *
   * @return {String}
   */
  uploadFile = async file => {
    try {
      this.setState({ uploadPercentage: 0 });

      const url = uploadFiles(file, this.setUploadPercentage);

      return url;
    } catch (e) {
      this.setState({ uploadPercentage: null });
      return '';
    }
  };

  /**
   * Callback -> Discard action
   *
   * When user trying to change tab from configuration tab then we check unsaved changes and trigger unsaved changes popup
   * if user click on discard button then this function will execute
   */
  redirectToNextRoute = () => {
    const { nextRoute = {} } = this.state || {};
    const { route = {}, activeTab } = nextRoute || {};

    if (route && Object.keys(route).length > 0) {
      const { history } = this.props;

      history.push(route);
      this.setState({ activeTab });
    }
  };

  /**
   * Handle > On Change Tab
   *
   * @param {Object}
   * @param {Number} activeTab
   */
  onChangeTab = (evt, activeTab) => {
    const {
      history,
      location: { pathname, search },
      singleRBM: { id = '' },
    } = this.props;

    const { ruleActiveTab = '' } = this.state;

    const searchObj = qs.parse(search);
    searchObj.tab = activeTab;
    let searchStr = qs.stringify(searchObj);

    if (activeTab == 2) {
      searchStr = `?tab=${activeTab}&activeTab=${ruleActiveTab}&id=${id}`;
    } else {
      searchStr = `?tab=${activeTab}`;
    }

    const { current = {} } = this.editSetupWizardRef || {};
    const { state = {} } = current || {};
    const { isUnsavedStructure = false } = state || {};

    if (isUnsavedStructure) {
      current.setState(
        {
          isVisibleUnsavedChanges: true,
          discardAction: this.redirectToNextRoute,
        },
        () => {
          this.setState({
            nextRoute: {
              route: { pathname, search: searchStr },
              activeTab,
            },
          });
        }
      );
      return;
    }

    this.setState({ activeTab });
    history.push({ pathname, search: searchStr });
  };

  /**
   * Close Context Menu Settings
   */
  closeContextMenuSettings = () => {
    this.setState({ settingEle: null });
  };

  /**
   * open Customize Columns
   */
  openColumnsSelection = () => {
    this.setState({
      isColumnsModal: true,
      settingEle: null,
    });
  };

  /**
   * close Customize Columns
   */
  handleCloseModal = () => {
    this.setState({ isColumnsModal: false });
  };

  /**
   * Columns for Customize Columns
   *
   * @return {Array}
   */
  headersOptions = (isSelected = false) => {
    const { forecastingData = {} } = this.props;
    const { metadata = [] } = forecastingData || {};

    let headers = [...metadata];

    headers = headers.map(data => {
      const { isSelected = true, display_name = '', name = '' } = data || {};

      return {
        label: display_name,
        value: name,
        isSelected,
        option: data,
      };
    });

    if (isSelected) {
      headers = headers.filter(header => header.isSelected);
    }

    return headers;
  };

  /**
   * On Apply Customize Columns
   *
   */
  handleDone = ({ allHeaders, selectedHeaders }) => {
    const metaData = [];

    allHeaders.forEach(({ isSelected, option = {} }) => {
      const header = {
        ...option,
        isSelected,
      };

      metaData.push(header);
    });

    const {
      forecastingData = {},
      setForecastingGridData,
      setForecastingGridHeaders,
      setForecastingData,
    } = this.props;

    const { forecastMetadata, data, customMetaData } = forecastingData || {};

    // Set Forecasting grid data
    const formattedHeaders = getFormattedGridHeaders({
      forecastMetadata,
      metaData,
      customMetaData,
    });

    const formattedData = getFormattedGridData({
      forecastMetadata,
      metaData,
      customMetaData,
      data,
    });

    // Set Forecasting data
    setForecastingGridData(formattedData);
    setForecastingGridHeaders(formattedHeaders);
    setForecastingData({
      forecastMetadata,
      metadata: metaData,
      customMetaData,
      data,
    });

    this.setState({ isColumnsModal: false });
  };

  /*
   *  Export forecast
   */
  exportForecast = async () => {
    try {
      const { showLoader } = this.state;
      if (showLoader) return;

      const {
        dateRange = {},
        singleRBM: { id = '' } = {},
        forecastingGridHeaders = [],
      } = this.props;

      this.setState({ showLoader: true });

      // Params with filters
      const { params = {} } = getFormattedPayload({
        headers: forecastingGridHeaders,
        forecastDateRange: dateRange,
      });

      // Preventing followings to send in API
      delete params.page;
      delete params.limit;
      delete params.order_by;

      const url = RULE_BASED_MODELS_API.EXPORT_FORECAST_RBM.replace('#ID#', id);

      const { data: { url: file_url } = {} } = await httpPost(
        encodeURI(url),
        params
      );

      programmaticallyLoadByUrl(file_url, { target: '_blank' });

      this.setState({ showLoader: false });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Handle Date range on Date Selection
   *
   * @param {String} name
   * @param {Object} date
   *
   * @returns
   */
  handleChangeDateRange = name => date => {
    const {
      dateRange = {},
      setDateRange,
      setForecastingGridHeaders,
    } = this.props;

    let validDate = moment(date);
    validDate = validDate.isValid()
      ? validDate.format(DEFAULT_DATE_FORMAT)
      : '';

    const end = moment(validDate)
      .add({ y: 2 })
      .subtract({ d: 1 })
      .format(DEFAULT_DATE_FORMAT);

    if (name == startDate) {
      const dateRangeUpdated = {
        ...dateRange,
        start: validDate,
        end,
      };

      setDateRange(dateRangeUpdated);
    }

    if (name == endDate) {
      const dateRangeUpdated = { ...dateRange };

      dateRangeUpdated.end = validDate;
      setDateRange(dateRangeUpdated);
    }

    setForecastingGridHeaders([]);
  };

  /**
   * Validate Start date
   */
  validateStartDate = () => {
    const { dateRange: { start = '' } = {} } = this.props;

    if (!start) {
      return RULE_BASED_MODELS_MSG.start_date;
    }

    return '';
  };

  /**
   * Validate End Date
   */
  validateEndDate = () => {
    const { dateRange: { end = '', start = '' } = {} } = this.props;

    if (!end) {
      return RULE_BASED_MODELS_MSG.end_date;
    }

    if (!moment(start).isBefore(end)) {
      return RULE_BASED_MODELS_MSG.end_greater_than_start;
    }

    return '';
  };

  /**
   * Handle Setup Wizard Actions
   *
   * @param {ruleActiveTab} Number
   * @param {actions} String
   */
  handleSetupWizardActions = ({ ruleActiveTab = 0, actions = '' }) => {
    const { current = {} } = this.editSetupWizardRef || {};
    const { innerChildRef = {} } = current || {};
    const { current: innerChildCurrent = {} } = innerChildRef || {};

    const {
      setIsShowAddCalDraw = () => {},
      onSave = () => {},
      handleNewColumn = () => {},
    } = innerChildCurrent || {};

    // In case of calculation tab
    if (
      ruleActiveTab == 0 &&
      actions == SETUP_WIZARD_ACTIONS.selectCalculation
    ) {
      setIsShowAddCalDraw(true);
    }

    // In case of field config tab
    if (ruleActiveTab == 1 && actions == SETUP_WIZARD_ACTIONS.newFieldColumn) {
      handleNewColumn();
    }

    // In case of save calculation/field config as per active screen
    if (actions == SETUP_WIZARD_ACTIONS.onSave) {
      onSave();
    }
  };

  /**
   *
   * Handle Add Record
   *
   * @param {Any}
   */
  handleAddRecord = props => {
    this.setState({ showLoader: true });

    const {
      overViewGridData = [],
      overViewGridHeaders = [],
      setOverViewGridData = [],
    } = this.props;

    const { record = {} } = props || {};
    const { affa_record_id = '' } = record || {};

    const copyOfOverViewGridData = [...overViewGridData];

    const result = getForecastingOverViewGridData({
      data: [{ ...record }],
      headers: overViewGridHeaders,
      affa_record_id,
    });

    if (result.length > 0) {
      const [firstChild] = result || [];
      firstChild.shift();

      copyOfOverViewGridData.splice(0, 0, firstChild);

      setOverViewGridData([...copyOfOverViewGridData]);
    }

    this.setState({ showLoader: false });
  };

  /**
   * Render View
   */
  render() {
    const {
      showLoader,
      activeTab,
      isReloadTable,
      settingEle,
      isColumnsModal,
      uploadPercentage,
      isBlockDone,
      isShowAddRecDraw,
    } = this.state;

    const {
      singleRBM,
      forecastingGridData,
      dateRange,
      overViewGridHeaders,
      overViewGridData,
      history,
      setSingleRBM,
    } = this.props;

    const { id = '', source_table_id: sourceId = '' } = singleRBM || {};

    const {
      location: { search = '' },
    } = history || {};

    const query = new URLSearchParams(search);
    const ruleActiveTab = query.get('activeTab');

    const { start = '', end = '' } = dateRange || {};

    return (
      <>
        {showLoader && <Spinner />}

        {/* RBM Header */}
        <AppHeader
          header={
            <RenameRBMInline
              singleRBM={singleRBM}
              onChangeEditingState={value => {
                this.setState({ isBlockDone: value });
              }}
            />
          }
          isBetaEnabled={!isBlockDone}
          betaMsg={!isBlockDone && BETA_MSG.rbm_beta_msg}
          showLoader={showLoader}
          headerActions={
            <RBMHeaderActions
              singleRBM={singleRBM}
              setSingleRBM={setSingleRBM}
              setLoader={showLoader => {
                this.setState({ showLoader });
              }}
              isButtonBlockDone={isBlockDone}
              forecastingGridData={forecastingGridData}
              overViewGridData={overViewGridData}
            />
          }
        />

        {/* RBM Data Display section */}
        {id && (
          <Paper
            className="rule-based-data-container"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <>
              <Box
                px={2}
                mb={1}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box textAlign="center" mt={1} fontSize={24}>
                  <Tabs
                    value={activeTab}
                    indicatorColor="primary"
                    textColor="primary"
                    className="rule-based-tab"
                    onChange={this.onChangeTab}
                  >
                    {TABS.map((tab, tabIndex) => {
                      return <Tab key={tab} label={tab} />;
                    })}
                  </Tabs>
                </Box>

                <Box display="flex" alignItems="center">
                  {/* enabling future for Hierarchy view Toggle button */}
                  {/* <Box mx={1}>
                    <FormControlLabel
                      control={<Switch name="checkedB" color="primary" />}
                      label="Hierarchy View"
                      labelPlacement="start"
                    />
                  </Box> */}

                  {activeTab == 0 && (
                    <>
                      <Box mx={1}>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() =>
                            this.setState({ isShowAddRecDraw: true })
                          }
                        >
                          Add New Row
                        </Button>
                      </Box>

                      <Box mx={1}>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={this.exportTemplate}
                        >
                          <ImgRenderer src="export-grey.svg" />
                          &nbsp; Export
                        </Button>
                      </Box>

                      <Box mx={1}>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={this.toggleImport}
                        >
                          <ImgRenderer src="import-grey.svg" />
                          &nbsp; Import
                        </Button>
                      </Box>
                    </>
                  )}

                  {/* Forecasting Tab */}
                  {activeTab == 1 && (
                    <>
                      {start && end && (
                        <Box
                          pr={1}
                          pl={2}
                          display="flex"
                          alignItems="center"
                          className="rule-based-datepicker"
                        >
                          {/* Start Date */}
                          <Box mx={1}>
                            <MuiPickersUtilsProvider utils={MomentUtils}>
                              <DatePicker
                                autoOk
                                name="startDate"
                                id="start-date-picker"
                                size="small"
                                minDate={defaultStartDate}
                                format={RBM_FORECAST_DATE_FORMAT}
                                value={(start && moment(start)) || null}
                                onChange={this.handleChangeDateRange(startDate)}
                                helperText={this.validateStartDate()}
                                error={Boolean(this.validateStartDate())}
                                views={['year', 'month']}
                              />
                            </MuiPickersUtilsProvider>
                          </Box>

                          {/* Date Range Separator */}
                          <Box mx={0.5}>to</Box>

                          {/* End Date */}
                          <Box mx={1}>
                            <MuiPickersUtilsProvider utils={MomentUtils}>
                              <DatePicker
                                autoOk
                                name="endDate"
                                id="end-date-picker"
                                size="small"
                                format={RBM_FORECAST_DATE_FORMAT}
                                value={(end && moment(end)) || null}
                                onChange={this.handleChangeDateRange(endDate)}
                                helperText={this.validateEndDate()}
                                error={Boolean(this.validateEndDate())}
                                minDate={start}
                                maxDate={moment(start)
                                  .add({ y: 5 })
                                  .subtract({ d: 1 })
                                  .format(DEFAULT_DATE_FORMAT)}
                                views={['year', 'month']}
                              />
                            </MuiPickersUtilsProvider>
                          </Box>

                          <Box mx={1}>
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={this.exportForecast}
                              startIcon={<ImgRenderer src="export-grey.svg" />}
                            >
                              Export
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* Export Template Button */}
                      {activeTab == 1 && (
                        <Tooltip
                          title={EDIT_REPORT_VIEW}
                          arrow
                          placement="bottom"
                        >
                          <Button
                            variant="contained"
                            color="secondary"
                            style={{
                              minWidth: '40px',
                              padding: '6px 10px',
                            }}
                            onClick={evt =>
                              this.setState({
                                settingEle: evt.currentTarget,
                              })
                            }
                            className="title-button"
                          >
                            <EdiIcon />
                          </Button>
                        </Tooltip>
                      )}

                      {activeTab == 0 &&
                        forecastingGridData &&
                        forecastingGridData.length > 0 && (
                          <Box mx={1}>
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={this.exportTemplate}
                            >
                              Export
                            </Button>
                          </Box>
                        )}
                    </>
                  )}

                  {activeTab == 2 && ruleActiveTab == 0 && (
                    <Box mx={1}>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          this.handleSetupWizardActions({
                            ruleActiveTab,
                            actions: SETUP_WIZARD_ACTIONS.selectCalculation,
                          })
                        }
                      >
                        Select/Create Calculations
                      </Button>
                    </Box>
                  )}

                  {activeTab == 2 && ruleActiveTab == 1 && (
                    <Box mx={1}>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          this.handleSetupWizardActions({
                            ruleActiveTab,
                            actions: SETUP_WIZARD_ACTIONS.newFieldColumn,
                          })
                        }
                      >
                        New Column
                      </Button>
                    </Box>
                  )}

                  {activeTab == 2 && ruleActiveTab < 2 && (
                    <Box mx={1}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          this.handleSetupWizardActions({
                            ruleActiveTab,
                            actions: SETUP_WIZARD_ACTIONS.onSave,
                          })
                        }
                      >
                        Save
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </>

            {/* Settings Popover */}
            <Popover
              open={Boolean(settingEle)}
              anchorEl={settingEle}
              onClose={this.closeContextMenuSettings}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{}}
            >
              <Box py={1} minWidth="150px">
                <MenuItem onClick={this.openColumnsSelection}>
                  <Typography variant="body2">Customize</Typography>
                </MenuItem>
              </Box>
            </Popover>

            {/* Display Columns filtering and re-ordering */}
            {isColumnsModal && (
              <ColumnsSelection
                isOpen
                isEnableReordering={false}
                headers={this.headersOptions()}
                selectedHeaders={this.headersOptions(true)}
                onClose={this.handleCloseModal}
                onDone={this.handleDone}
              />
            )}

            {/* Import Source Table */}
            {isReloadTable && (
              <ImportSourceTable
                isOpen
                handleClose={() => this.setState({ isReloadTable: false })}
                handleFile={this.handleFileForReload}
              />
            )}

            {/* File Uploader */}
            {typeof uploadPercentage == 'number' && (
              <UploadLoader
                isVisible
                uploadPercentage={uploadPercentage}
                savingText={RULE_BASED_MODELS_MSG.savingText}
              />
            )}

            {/* Add/Edit Record  */}
            {isShowAddRecDraw && (
              <AddEditRecord
                isOpen={isShowAddRecDraw}
                onClose={() => this.setState({ isShowAddRecDraw: false })}
                headers={overViewGridHeaders}
                data={overViewGridData}
                sourceId={sourceId}
                handleUpdateRecord={this.handleAddRecord}
              />
            )}

            {/* Active Tab display */}
            {activeTab == 0 && (
              <DataOverview
                onImport={this.toggleImport}
                onExport={this.exportTemplate}
              />
            )}
            {activeTab == 1 && <DataForecasting />}
            {/* Export Template Button */}
            {activeTab == 2 && (
              <RBMSetupWizard
                ref={this.editSetupWizardRef}
                type={APP_ROUTES.RULE_BASED_MODEL}
              />
            )}
          </Paper>
        )}
      </>
    );
  }
}

// Props Validations
EditRuleBasedModel.propTypes = {
  dateRange: shape({}),
  forecastingData: shape({}),
  forecastingGridData: arrayOf(arrayOf(shape({}))),
  forecastingGridHeaders: arrayOf(shape({})),
  overViewGridData: arrayOf(arrayOf(shape({}))),
  overViewGridHeaders: arrayOf(shape({})),
  setClearData: func,
  setDateRange: func,
  setForecastingData: func,
  setForecastingGridData: func,
  setForecastingGridHeaders: func,
  setOverViewGridData: func,
  setSingleRBM: func,
  setSourceTable: func.isRequired,
  singleRBM: shape({}),
};

// Default Props
EditRuleBasedModel.defaultProps = {
  forecastingGridHeaders: [],
  overViewGridData: [],
  overViewGridHeaders: [],
  singleRBM: {},
  setClearData: () => {},
  setSingleRBM: () => {},
  setSourceTable: () => {},
  setForecastingGridData: () => {},
  setOverViewGridData: () => {},
  setForecastingGridHeaders: () => {},
  setForecastingData: () => {},
};

// Map State to props
const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
  overViewGridData: getOverViewGridData(),
  forecastingGridData: getForecastingGridData(),
  forecastingGridHeaders: getForecastingGridHeaders(),
  overViewGridHeaders: getOverViewGridHeaders(),
  dateRange: getDateRange(),
  forecastingData: getForecastingData(),
});

export default connect(mapStateToProps, {
  setSingleRBM,
  setClearData,
  setSourceTable,
  setDateRange,
  setOverViewGridData,
  setForecastingGridData,
  setForecastingGridHeaders,
  setForecastingData,
})(withRouter(EditRuleBasedModel));
