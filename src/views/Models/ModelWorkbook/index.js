import React from 'react';
import { withRouter, Prompt } from 'react-router-dom';
import { arrayOf, bool, func, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { get } from 'lodash';

import { Box, Divider, Paper } from '@material-ui/core';

import ModelWorkbookBase from './base';

import AppHeader from '../../../components/AppHeader';
import UnsavedChangesDialog from '../../../components/UnsavedChangesDialog';
import CustomScrollbars from '../../../components/ScrollBars';
import Spinner from '../../../components/Spinner';
import ConfirmationModal from '../../../components/ConfirmationModal';

import WorkbookHeader from './WorkbookHeader';
import NoModel from '../NoModel';
import WorkbookHeaderActions from './WorkbookHeaderActions';

import ModelWorkbookTabs from './Tabs';
import WorkbookStatus from './WorkbookStatus';
import SharedMappings from './SharedMappings';
import Assumptions from '../../Assumptions';
import GridTable from './GridPanel/GridTable';

import { MAX_API_COUNT_FOR_SYNC, SYNC_TIMEOUT } from './configs';
import { BETA_MSG, MODELS_MSG } from '../../../configs/messages';
import { MODELS_API } from '../../../configs/api';

import programmaticallyLoadByUrl from '../../../utils/helper/programmaticallyLoadByUrl';
import { getFormattedModelsList, MODEL_RUN_STATUS } from '../ModelsList/helper';
import { showSuccessMsg } from '../../../utils/notifications';
import { httpGet, httpPost } from '../../../utils/http';

import { getAssumptionData } from '../../../services/Models/index';

import {
  getForcastStartDate,
  getFormattedGridData,
  getFormattedGridHeaders,
  getGridTableByIndex,
} from './helper';
import {
  getFormattedParamsToSyncRecords,
  reAssignFailedChanges,
} from './snapshotHelper';

import {
  clearData,
  setActiveWorksheet,
  setWorkbook,
  setWorksheets,
  setGridHeaders,
  setGridData,
  setFormulaCells,
  setRowConfigs,
  setSharedMappings,
  setIsViewMode,
  setAssumptionListing,
} from '../../../reducers/Models/actions';
import {
  isFetching,
  getActiveWorksheet,
  getWorkbook,
  getWorksheets,
  getGridHeaders,
  getRowConfigs,
  getGridData,
  getIsViewMode,
  getGridCellFormulas,
  getGridDataTable,
} from '../../../reducers/Models/selectors';

import './styles.scss';
import {
  getGridDensity,
  getUserSession,
  setGridDensity,
} from '../../../utils/localStorage';
import { DEFAULT_DENSITY } from '../../../configs/density';
import { reCompileGridData } from './GridPanel/GridTable/helper';
import { logAmplitudeEvent } from '../../../utils/amplitude';

class ModelWorkbook extends ModelWorkbookBase {
  /**
   * Grid Changes
   * Structure > [key]: value
   */
  gridChanges = {};

  /**
   * Row Configs Changes
   * Structure > [key]: value
   */
  rowConfigsChanges = {};

  /**
   * Rows with Error
   */
  errorRows = {};

  /**
   * Sync Handler
   */
  syncHandler = {
    timeout: null, // Response of SetTimeout
    cancelHttp: null, // Axios cancel request function
    isSynced: false,
    isSyncing: false,
    runTimeout: null,
    count: 0,
  };

  /**
   * State
   */
  state = {
    showLoader: true,
    notice: '',
    isViewMode: false,

    isVisibleUnsavedChanges: false,
    unsavedChanges: false,
    discardAction: null,

    confirmAction: false,
    confirmMsg: false,

    showAssumptions: false,

    sheetHeight: 0,
    tableWidth: 0,
    assumptionData: [],

    isBlockDone: false,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);

    this.loadInitialData();
    this.setDensity();
  }

  /**
   * Set Screen Density setting if not set
   */
  setDensity = () => {
    const density = getGridDensity();

    if (!density) {
      setGridDensity(DEFAULT_DENSITY);
    }
  };

  /**
   * Load Initial Data
   */
  loadInitialData = async (skipDraftVerification = false) => {
    try {
      const {
        match,
        setIsViewMode,
        activeWorksheet: activeWorksheetFromProps,
      } = this.props;
      const id = get(match, 'params.id');

      if (!skipDraftVerification) {
        const hasDrafChanges = await this.verifyDraftChangesOnLoad(id);

        if (hasDrafChanges == null) {
          this.setState({ showLoader: false });

          return;
        }

        if (
          hasDrafChanges &&
          activeWorksheetFromProps &&
          Object.keys(activeWorksheetFromProps).length === 0
        ) {
          this.askToLoadorDiscardDraftChanges();

          return;
        }
      }

      const {
        activeWorksheet: existActiveWorksheet,
        setWorkbook,
        setWorksheets,
        setActiveWorksheet,
        setGridHeaders,
      } = this.props;

      this.setState({ showLoader: true });

      // Loading Workbook
      const getWorkBookUrl = MODELS_API.GET_WORKBOOK.replace('#ID#', id);
      const { data } = await httpGet(getWorkBookUrl, {
        callback: this.pushCancelCallback,
      });

      const {
        table_header: tableHeadersApi,
        sheets: worksheets,
        ...workbook
      } = data;

      if (worksheets.length == 0) {
        this.clearData();
        this.setState({
          notice: MODELS_MSG.no_worksheets,
          showLoader: false,
          loadingText: '',
        });

        return;
      }

      let [activeWorksheet = {}] = worksheets;
      if (
        existActiveWorksheet.id &&
        existActiveWorksheet.id != activeWorksheet.id
      ) {
        const activeWorksheetFounded = worksheets.find(
          ({ id }) => id == existActiveWorksheet.id
        );
        if (activeWorksheetFounded) {
          activeWorksheet = { ...activeWorksheetFounded };
        }
      }

      const forecastStartDate = getForcastStartDate(workbook);
      const [newWorkbook] = getFormattedModelsList([workbook]);

      if (workbook.run_status == MODEL_RUN_STATUS.inProcess) {
        this.setState({ notice: MODEL_RUN_STATUS.inProcess });
        setIsViewMode(true);
        this.setFetchWorkbookTimeout();
      }

      const gridHeaders = getFormattedGridHeaders({
        tableHeadersApi,
        forecastStartDate,
        options: activeWorksheet.options?.col_heading,
      });

      setWorksheets(worksheets);
      setActiveWorksheet({ ...activeWorksheet });
      setWorkbook(newWorkbook);
      setGridHeaders(gridHeaders);

      if (!activeWorksheet.id) {
        this.setState({ showLoader: false, loadingText: '' });

        return;
      }

      this.loadWorksheet({
        id,
        worksheet: activeWorksheet,
        gridHeaders,
        forecastStartDate,
      });
    } catch (e) {
      console.error(e);

      this.handleWindowResize();
      this.clearData();
      this.setState({
        notice: MODELS_MSG.no_workbook,
        showLoader: false,
        loadingText: '',
      });
    }
  };

  /**
   * Load Worksheet Data
   *
   * @param {Object}
   */
  loadWorksheet = async ({
    id,
    worksheet,
    gridHeaders,
    forecastStartDate,
    isDrafted = true,
  }) => {
    try {
      const {
        setGridData,
        setFormulaCells,
        setRowConfigs,
        setSharedMappings,
      } = this.props;

      // Loading Worksheet
      let getGridDataUrl = MODELS_API.GET_GRID_DATA.replace('#ID#', id);
      getGridDataUrl = getGridDataUrl.replace('#SHEET_ID#', worksheet.id);

      if (isDrafted) getGridDataUrl += '?mode=draft';

      const {
        data: { rows = [], shared_mappings = [] },
      } = await httpGet(getGridDataUrl, { callback: this.pushCancelCallback });

      const { rowConfigs, gridData, formulaCells } = getFormattedGridData({
        rows,
        headers: gridHeaders,
        forecastStartDate,
      });

      // fetch Assumption Listing && Store Assumption Listing in reducer

      const assumptionsDataListing = await getAssumptionData(id);
      const { setAssumptionListing } = this.props;
      setAssumptionListing(assumptionsDataListing);

      const gridDataTable = getGridTableByIndex(
        gridHeaders,
        rowConfigs,
        gridData,
        assumptionsDataListing
      );

      const { data: updatedData, newChanges } = reCompileGridData(
        gridData,
        { ...gridDataTable },
        {},
        formulaCells,
        rowConfigs
      );

      setRowConfigs(rowConfigs);
      setGridData(updatedData);

      if (newChanges && Object.keys(newChanges).length > 0) {
        this.handleGridUpdated(newChanges);
      }

      setFormulaCells(formulaCells);

      setSharedMappings(shared_mappings);

      this.setState({ showLoader: false, loadingText: '' });

      this.handleWindowResize();
      this.setSyncTimeout();
      this.subscribeConfirmLeavePage();
    } catch (err) {
      console.error(err);

      setRowConfigs([]);
      setGridData([]);

      this.handleWindowResize();
      this.setState({
        notice: MODELS_MSG.no_worksheet,
        showLoader: false,
        loadingText: '',
      });
    }
  };

  /**
   * Clear Data
   */
  clearData = () => {
    this.props.setRowConfigs([]);
    this.props.setGridData([]);
    this.props.setGridHeaders([]);
    this.props.setSharedMappings([]);
    this.props.setActiveWorksheet({});
  };

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    if (this.syncHandler.runTimeout) clearTimeout(this.syncHandler.runTimeout);
    this.syncHandler.runTimeout = null;

    this.clearSyncTimeout();
    this.props.clearData();
    this.cancelExistingHttpRequests();

    window.removeEventListener('resize', this.handleWindowResize);
    this.unsubscribeConfirmLeavePage();
  }

  /**
   * Clear Sync Timeout
   */
  clearSyncTimeout = () => {
    const { timeout } = this.syncHandler;
    if (timeout) clearTimeout(timeout);

    this.syncHandler.timeout = null;
  };

  /**
   * Set timeout to sync records
   */
  setSyncTimeout = () => {
    this.clearSyncTimeout();

    this.syncHandler.timeout = setTimeout(this.syncWorkbook, SYNC_TIMEOUT);
  };

  /**
   * Save Workbook
   */
  saveWorkbook = ({ callback } = {}) => {
    logAmplitudeEvent('Save model workbook');
    // Await for syncing background changes for draft mode
    try {
      // Hold save and run functionality until draft mode changes are syncing
      if (
        Object.keys(this.gridChanges).length != 0 ||
        this.syncHandler.isSyncing
      ) {
        if (this.syncHandler.count < MAX_API_COUNT_FOR_SYNC) {
          this.setState({ showLoader: true });

          setTimeout(() => {
            this.saveWorkbook({ callback });
            this.syncHandler.count++;
          }, SYNC_TIMEOUT);

          return;
        }
      }
    } catch (error) {
      this.setState({ showLoader: false });
    }

    // Handle exceptional case for clear grid Changes upto max limit
    if (this.syncHandler.count >= MAX_API_COUNT_FOR_SYNC) {
      this.gridChanges = {};
    }

    const startSaving = async () => {
      try {
        const { workbook } = this.props;

        let url = MODELS_API.SAVE_WORKBOOK;
        url = url.replace('#ID#', workbook.id);

        this.setState({ showLoader: true });

        this.syncHandler.count = 0;

        await httpPost(url, {}, { callback: this.pushCancelCallback });

        this.setState({ unsavedChanges: false, showLoader: false });

        if (typeof callback == 'function') callback();

        showSuccessMsg(MODELS_MSG.model_saved);
      } catch (err) {
        this.setState({ showLoader: false });
      }
    };

    this.syncWorkbook({ callback: startSaving });
  };

  /**
   * Sync Workbook
   *
   * @param {Object|Undefined} params
   */
  syncWorkbook = (params = {}) => {
    this.clearSyncTimeout();
    this.syncWorkbookViaApi(params);
  };

  /**
   * Sync Workbook in API
   *
   * @param {Object|Undefined}
   */
  syncWorkbookViaApi = async ({ callback } = {}) => {
    const { params } = getFormattedParamsToSyncRecords(this);

    // No records to sync
    if (!params) {
      callback && callback();
      this.setSyncTimeout();

      return;
    }

    try {
      if (callback) this.setState({ showLoader: true });

      const { workbook, activeWorksheet } = this.props;

      let url = MODELS_API.SYNC_RECORDS;
      url = url.replace('#WORKBOOK_ID#', workbook.id);
      url = url.replace('#WORKSHEET_ID#', activeWorksheet.id);

      this.syncHandler.isSyncing = true;

      if (this.state.showLoader) {
        this.syncHandler.count++;
      }

      const res = await httpPost(url, params, {
        callback: this.pushCancelCallback,
        hideError: true,
      });

      this.updateSuccessChanges(res);

      this.syncHandler.isSyncing = false;

      // Set timeout again
      this.setSyncTimeout();
      if (callback) {
        this.setState({ showLoader: false }, callback);
      }
    } catch (err) {
      console.error('# Sync Error ', err);

      this.syncHandler.isSyncing = false;

      reAssignFailedChanges(this, params);
      this.setSyncTimeout();

      if (callback) {
        this.setState({ showLoader: false });
        // callback({ error: true });
      }
    }
  };

  /**
   * Handle updates in Grid Headers
   */
  handleHeadersUpdated = () => {
    this.markHasUnsavedChanges();

    setTimeout(() => {
      this.saveHeadersOptions();
    }, 100);
  };

  /**
   * Handle Changes in Grid
   *
   * @param {Object} newChanges
   */
  handleGridUpdated = (
    newChanges,
    { isNewRow, isDeleteRow, isDuplicateRow, rowConfig } = {}
  ) => {
    this.gridChanges = {
      ...this.gridChanges,
      ...newChanges,
    };

    this.markHasUnsavedChanges();

    setTimeout(() => {
      if (isNewRow || isDuplicateRow) this.syncWorkbook();

      if (isDeleteRow) this.handleDeleteRow(rowConfig);
    }, 200);
  };

  /**
   * Handle Delete Row
   *
   * @param {Object} rowConfig
   */
  handleDeleteRow = async rowConfig => {
    try {
      this.setSyncTimeout();

      const { row_id, rowType } = rowConfig;

      const params = {
        rows: [
          {
            action: 'DELETE',
            row_id,
            type: rowType,
            is_dirty: true,
          },
        ],
      };

      const { workbook, activeWorksheet } = this.props;

      let url = MODELS_API.SYNC_RECORDS;
      url = url.replace('#WORKBOOK_ID#', workbook.id);
      url = url.replace('#WORKSHEET_ID#', activeWorksheet.id);

      this.syncHandler.isSyncing = true;

      await httpPost(url, params, { hideError: true });

      this.syncHandler.isSyncing = false;
    } catch (err) {
      this.setSyncTimeout();
    }
  };

  /**
   * Handle Changes in Row configs
   *
   * @param {Object} newChanges
   */
  handleRowConfigsUpdated = newChanges => {
    this.rowConfigsChanges = {
      ...this.rowConfigsChanges,
      ...newChanges,
    };

    this.markHasUnsavedChanges();
    setTimeout(this.syncWorkbook, 200);
  };

  /**
   * Handle Changes in Shared Mappings
   */
  handleSharedMappingsUpdated = () => {
    const { match, activeWorksheet, gridHeaders, workbook } = this.props;

    const id = get(match, 'params.id') || '';

    const forecastStartDate = getForcastStartDate(workbook);

    const loadWorksheet = () => {
      this.loadWorksheet({
        id,
        worksheet: activeWorksheet,
        gridHeaders,
        forecastStartDate,
        isDrafted: true,
      });
    };

    this.setState({ showLoader: true }, loadWorksheet);
    this.markHasUnsavedChanges();
  };

  /**
   * Handle Changes in Tabs
   *
   * @param {Object} newChanges
   * @param {Object}
   */
  handleTabsUpdated = (newChanges, { isNewTab, callback } = {}) => {
    this.tabsChanges = {
      ...this.tabsChanges,
      ...newChanges,
    };

    if (isNewTab) this.syncWorkbook({ callback });

    this.markHasUnsavedChanges();
  };

  /**
   * On Change Active Worksheet (Tab)
   *
   * @param {Object}
   */
  onChangeActiveWorksheet = ({ worksheet, prevWoeksheet }) => {
    const { workbook, gridHeaders, activeWorksheet } = this.props;

    if (activeWorksheet.id == worksheet.id) return;

    const loadWorksheetData = ({ error } = {}) => {
      if (error) {
        this.setState({ showLoader: false });
        this.props.setActiveWorksheet(prevWoeksheet);

        return;
      }

      const forecastStartDate = getForcastStartDate(workbook);

      // Clear Data for Tab
      setRowConfigs([]);
      setGridData([]);

      this.loadWorksheet({
        id: workbook.id,
        worksheet,
        gridHeaders,
        forecastStartDate,
      });
    };

    this.setState({ showLoader: true });
    this.syncWorkbook({ callback: loadWorksheetData });
  };

  /**
   * Handle Prompt message response
   *
   * @param {Object} nextLocation
   */
  handleBlockedNavigation = nextLocation => {
    const { isVisibleUnsavedChanges } = this.state;

    const isAuthenticated = Boolean(getUserSession());

    if (
      isAuthenticated &&
      this.hasUnsavedChanges() &&
      !isVisibleUnsavedChanges
    ) {
      this.setState({
        isVisibleUnsavedChanges: true,
        discardAction: () => this.discardChanges({ nextLocation }),
      });

      return false;
    }

    return true;
  };

  /**
   * Ask to user to load unsaved changes or discard unsaved changes
   */
  askToLoadorDiscardDraftChanges = () => {
    const confirmAction = 'CONFIRM_DISCARD_DRAFT';
    const confirmMsg = MODELS_MSG.ask_user_discard_draft;

    this.setState({ confirmAction, confirmMsg });
  };

  /**
   * Handle Response of Discard|Restore Unsaved changes
   *
   * @param {String|Boolean} res
   */
  handleDiscardConfirmation = res => {
    // Discard Changes
    if (!res) {
      this.setState({ confirmAction: false, confirmMsg: false });
      this.discardChanges({ callback: () => this.loadInitialData(true) });

      return;
    }

    // Restore Changes
    this.setState(
      { confirmAction: false, confirmMsg: false, unsavedChanges: true },
      () => this.loadInitialData(true)
    );
  };

  /**
   *Discard Confirmation Message HTML
   *
   * @return {HTML}
   */
  discardConfirmationMessageAsHtml = () => {
    return (
      <>
        <p>
          You have unsaved changes, or numbers in the database have changed
          through a different module and don’t match this model. You can either
        </p>
        <ol type="A">
          <li>Go back and Save/Run the model.</li>
          <li>Exit the model and leave the numbers as is.</li>
        </ol>
      </>
    );
  };

  /**
   * Toggle > Assumptions View
   */
  toggleAssumptionsView = () => {
    logAmplitudeEvent('Show model assumptions');
    this.setState({ showAssumptions: !this.state.showAssumptions });
  };

  handleCancelAssumption = () => {
    this.toggleAssumptionsView();

    const { workbook, activeWorksheet, gridHeaders } = this.props;
    const { id = '' } = workbook || {};
    const forecastStartDate = getForcastStartDate(workbook);

    this.setState({ showLoader: true });

    this.loadWorksheet({
      id,
      worksheet: activeWorksheet,
      gridHeaders,
      forecastStartDate,
      isDrafted: true,
    });
  };

  /**
   * Export Model
   */
  exportModel = async () => {
    logAmplitudeEvent('Export model');
    try {
      const { showLoader } = this.state;
      const {
        workbook: { id = '' },
      } = this.props;

      if (showLoader) return;

      this.setState({ showLoader: true });

      const url = MODELS_API.EXPORT_WORKBOOK.replace('#ID#', id);

      const { data } = await httpGet(url);

      programmaticallyLoadByUrl(data.url, { target: '_blank' });

      this.setState({ showLoader: false });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Refresh current workbook and active worksheet
   */
  refreshModel = () => {
    logAmplitudeEvent('Refresh model');
    this.loadInitialData();
  };

  /**
   * Render View
   */
  render() {
    const {
      notice,
      loadingText,
      showLoader,
      isVisibleUnsavedChanges,

      sheetHeight,
      tableWidth,

      confirmAction,
      confirmMsg,

      showAssumptions,
      unsavedChanges,
      isBlockDone,
    } = this.state;

    const {
      activeWorksheet,
      gridHeaders,
      gridData,
      workbook,
      isViewMode,
    } = this.props;

    return (
      <>
        <Prompt when message={this.handleBlockedNavigation} />

        {showLoader && <Spinner text={loadingText} />}

        <AppHeader
          readOnly={isViewMode}
          isBetaEnabled={!isBlockDone}
          betaMsg={!isBlockDone && BETA_MSG.modeling_beta_msg}
          showLoader={showLoader}
          header={
            <WorkbookHeader
              onChangeEditingState={value => {
                this.setState({ isBlockDone: value });
              }}
            />
          }
          headerActions={
            <WorkbookHeaderActions
              onSave={this.saveWorkbook}
              onRun={this.runWorkbook}
              isVisibleActions={!notice && !loadingText}
              onClickAssumptions={this.toggleAssumptionsView}
              onClickExport={this.exportModel}
              onClickRefresh={this.refreshModel}
              unsavedChanges={unsavedChanges}
              isButtonBlockDone={isBlockDone}
            />
          }
        />

        {showAssumptions && (
          <Assumptions
            isVisible
            modelId={workbook.id || ''}
            modelName={workbook.name || ''}
            onCancel={this.handleCancelAssumption}
            onSave={() => {}}
          />
        )}

        {notice && notice != MODEL_RUN_STATUS.inProcess && (
          <WorkbookStatus workbook={workbook} msg={notice} />
        )}

        {confirmAction == 'CONFIRM_DISCARD_DRAFT' && (
          <ConfirmationModal
            maxWidth="sm"
            handleClose={this.handleDiscardConfirmation}
            isOpen
            hideClose
            title="Load Unsaved Changes"
            yesText="Restore"
            noText="Discard"
            action={confirmAction}
            msg={confirmMsg}
          />
        )}

        {isVisibleUnsavedChanges && (
          <UnsavedChangesDialog
            handleUnsavedConf={this.handleUnsavedConf}
            message={this.discardConfirmationMessageAsHtml()}
            btnOneText="Stay"
            btnTwoText="Leave"
          />
        )}

        {!showLoader && !activeWorksheet.id && <NoModel />}

        <Box px={3} mt={2} className="configure-model-workbook">
          {activeWorksheet.id && gridHeaders.length > 0 && gridData.length > 0 && (
            <>
              <ModelWorkbookTabs
                isLoaded
                tableWidth={tableWidth}
                handleTabsUpdated={this.handleTabsUpdated}
                onChangeActiveWorksheet={this.onChangeActiveWorksheet}
                onChangeEditingState={value => {
                  this.setState({ isBlockDone: value });
                }}
              />

              <Paper
                elevation={1}
                className="configure-model-worksheet"
                id="configure-model-worksheet"
                style={{ height: '100%', marginTop: -3 }}
              >
                <CustomScrollbars
                  height={sheetHeight}
                  className="model-custom-scroll"
                >
                  <div className="mapping-wrapper">
                    <SharedMappings
                      handleSharedMappingsUpdated={
                        this.handleSharedMappingsUpdated
                      }
                      workbook={workbook}
                    />

                    <Box mx={1}>
                      <Divider />
                    </Box>

                    <GridTable
                      tableWidth={tableWidth}
                      errorRows={this.errorRows}
                      sheetHeight={sheetHeight}
                      isViewMode={isViewMode}
                      handleRowConfigsUpdated={this.handleRowConfigsUpdated}
                      handleGridUpdated={this.handleGridUpdated}
                      handleHeadersUpdated={this.handleHeadersUpdated}
                    />
                  </div>
                </CustomScrollbars>
              </Paper>
            </>
          )}
        </Box>
      </>
    );
  }
}

ModelWorkbook.propTypes = {
  activeWorksheet: shape({}).isRequired,
  clearData: func.isRequired,
  formulaCells: arrayOf(shape({})).isRequired,
  gridData: arrayOf(arrayOf(shape({}))).isRequired,
  gridDataTable: shape({}),
  gridHeaders: arrayOf(shape({})).isRequired,
  isFetching: bool.isRequired,
  isViewMode: bool.isRequired,
  rowConfigs: arrayOf(shape({})).isRequired,
  setActiveWorksheet: func.isRequired,
  setFormulaCells: func.isRequired,
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
  setIsViewMode: func.isRequired,
  setRowConfigs: func.isRequired,
  setWorkbook: func.isRequired,
  setWorksheets: func.isRequired,
  workbook: shape({}).isRequired,
  worksheets: arrayOf(shape({})).isRequired,
};

ModelWorkbook.defaultProps = {};

const mapStateToProps = createStructuredSelector({
  activeWorksheet: getActiveWorksheet(),
  isFetching: isFetching(),
  isViewMode: getIsViewMode(),
  workbook: getWorkbook(),
  worksheets: getWorksheets(),
  gridHeaders: getGridHeaders(),
  rowConfigs: getRowConfigs(),
  gridData: getGridData(),
  gridDataTable: getGridDataTable(),
  formulaCells: getGridCellFormulas(),
});

export default connect(mapStateToProps, {
  setActiveWorksheet,
  clearData,
  setWorkbook,
  setWorksheets,
  setGridHeaders,
  setFormulaCells,
  setGridData,
  setRowConfigs,
  setSharedMappings,
  setIsViewMode,
  setAssumptionListing,
})(withRouter(ModelWorkbook));
