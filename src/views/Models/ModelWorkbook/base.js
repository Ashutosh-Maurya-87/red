import { get } from 'lodash';
import moment from 'moment';

import UnsavedChangesBase from '../../../components/UnsavedChangesDialog/base';

import { MODELS_API } from '../../../configs/api';

import {
  getFormattedDates,
  getRunStatusDetails,
  MODEL_RUN_STATUS,
} from '../ModelsList/helper';
import { getRowIndexViaRowId } from './snapshotHelper';
import { httpDelete, httpGet, httpPost, httpPut } from '../../../utils/http';
import { getPercentageFieldValue } from './helper';
import { reCompileDataOfGrid } from './GridPanel/GridTable/helper';
import { logAmplitudeEvent } from '../../../utils/amplitude';

class ModelWorkbookHelper extends UnsavedChangesBase {
  // Cancel http request callback Array
  httpCancelTokens = [];

  /**
   * Cancel http request callback
   */
  pushCancelCallback = func => {
    this.httpCancelTokens.push(func);
  };

  /**
   * Cancel existing API Requests
   */
  cancelExistingHttpRequests = () => {
    this.httpCancelTokens.forEach(cancelFunc => cancelFunc());
  };

  /**
   * Mark Workbook has unsaved changes
   */
  markHasUnsavedChanges = () => {
    if (!this.state.unsavedChanges) {
      this.setState({ unsavedChanges: true });
    }
  };

  /**
   * Verify > Has Unsaved Changes
   */
  hasUnsavedChanges = () => {
    const { unsavedChanges } = this.state;

    return unsavedChanges;
  };

  /**
   * Handle Window Resize
   */
  handleWindowResize = () => {
    try {
      const [ele] = document.getElementsByClassName('app-header');
      const sheetHeight = window.innerHeight - ele.offsetHeight - 70;

      const headerEle = document.getElementById('data-header');
      const tableWidth = (headerEle && headerEle.offsetWidth) || 0;

      this.setState({ sheetHeight, tableWidth });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Verify > Model has draft changes on load
   *
   * @param {String} id [Workbook ID]
   *
   * @return {Boolean}
   */
  verifyDraftChangesOnLoad = async id => {
    try {
      const url = MODELS_API.HAS_DRAFT_CHANGES.replace('#ID#', id);

      const {
        data: { has_draft_changes = false },
      } = await httpGet(url, {
        hideError: false,
        callback: this.pushCancelCallback,
      });

      return has_draft_changes;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  /**
   * Discard Model Grid Changes
   *
   * @param {Object} nextLocation
   */
  discardChanges = async ({ callback, nextLocation }) => {
    const { history, match } = this.props;
    const id = get(match, 'params.id');

    try {
      this.setState({ showLoader: true });

      let url = MODELS_API.DISCARD_RECORDS;
      url = url.replace('#ID#', id);

      await httpDelete(url);

      this.setState({ showLoader: false, unsavedChanges: false });

      if (nextLocation) history.push(nextLocation.pathname);

      if (callback) callback();
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Set Timeout to fetch workbook (status) after run or in process
   */
  setFetchWorkbookTimeout = () => {
    if (this.syncHandler.runTimeout) {
      clearTimeout(this.syncHandler.runTimeout);
    }

    this.syncHandler.runTimeout = setTimeout(this.fetchWorkbookAfterRun, 5000);
  };

  /**
   * Fetch workvook (status) after run or in Process
   */
  fetchWorkbookAfterRun = async () => {
    try {
      const { setIsViewMode } = this.props;
      const id = get(this.props, 'match.params.id');

      const getWorkBookUrl = MODELS_API.GET_WORKBOOK.replace('#ID#', id);
      const {
        data: { run_status },
      } = await httpGet(getWorkBookUrl, { callback: this.pushCancelCallback });

      if (run_status == MODEL_RUN_STATUS.inProcess) {
        this.setFetchWorkbookTimeout();
        return;
      }

      setIsViewMode(false);
      this.setState(
        { notice: '', loadingText: 'Refreshing...' },
        this.loadInitialData
      );
    } catch (err) {
      this.setFetchWorkbookTimeout();
    }
  };

  /**
   * Run Workbook
   */
  runWorkbook = () => {
    logAmplitudeEvent('Run model');

    // Update Workbook Status
    const updateStatus = () => {
      const { workbook, setWorkbook, setIsViewMode } = this.props;

      workbook.run_status = MODEL_RUN_STATUS.inProcess;
      workbook.last_run_at = moment().utc().format('YYYY-MM-DD HH:mm:ss');

      const updatedWorkbook = {
        ...workbook,
        ...getRunStatusDetails(workbook),
        ...getFormattedDates(workbook),
      };

      setWorkbook(updatedWorkbook);
      setIsViewMode(true);

      this.setState({
        notice: MODEL_RUN_STATUS.inProcess,
        showLoader: false,
      });

      this.setFetchWorkbookTimeout();
    };

    // Run Workbook
    const runWorkbook = async () => {
      try {
        this.setState({ showLoader: true });

        const id = get(this.props, 'match.params.id');
        const url = MODELS_API.RUN_WORKBOOK.replace('#ID#', id);

        await httpPost(url, {}, { callback: this.pushCancelCallback });

        updateStatus();
      } catch (err) {
        console.error(err);
        this.setState({ showLoader: false });
      }
    };

    // Sync|save Workbook
    this.saveWorkbook({ callback: runWorkbook });
  };

  /**
   * Save Headers Options
   */
  saveHeadersOptions = async () => {
    try {
      const { activeWorksheet, gridHeaders, setActiveWorksheet } = this.props;
      const colWidthsArray = (gridHeaders || []).map(({ width = '' }) => {
        return { width };
      });

      const { workbook_id = '', id = '' } = activeWorksheet;
      const url = MODELS_API.UPDATE_WIDTH.replace('#ID#', workbook_id).replace(
        '#SHEET_ID#',
        id
      );

      const params = {
        col_heading: colWidthsArray,
      };

      const { data = {} } = await httpPut(url, params);
      setActiveWorksheet(data);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Update Changes after Sync in Database
   *
   * @param {Object} that
   * @param {Object} response
   */
  updateSuccessChanges = ({ data }) => {
    try {
      const { rowConfigs, setRowConfigs, gridData, setGridData } = this.props;

      let hasGridChanges = false;

      const fillCellValues = (row, rowIndex) => {
        row.cells.forEach((cell, i) => {
          const cellIndex = i + 2;
          const key = `${row.row_id}--${cellIndex}`;

          const rowIndex = getRowIndexViaRowId({
            rowConfigs,
            rowId: row.row_id,
          });

          if (rowIndex < 0) return;

          let cellValue = cell.value || '';

          if (this.gridChanges[key]) {
            cellValue = this.gridChanges[key];
          }

          // If row fiels type is percentage then multiplicate real value by 100
          cellValue = getPercentageFieldValue(
            rowConfigs[rowIndex].fieldType,
            cellValue,
            true
          );

          if (gridData[rowIndex] && gridData[rowIndex][cellIndex]) {
            gridData[rowIndex][cellIndex].value =
              cellValue == null || cellValue == '' ? '' : cellValue;
          }
        });
      };

      data.forEach(row => {
        let { row_options } = row;
        if (typeof row_options == 'string') {
          row_options = JSON.parse(JSON.parse(row_options));
        }

        const { tempRowId = row.row_id } = row_options;

        delete this.errorRows[tempRowId];

        const rowIndex = getRowIndexViaRowId({ rowConfigs, rowId: tempRowId });
        if (rowIndex < 0) return;

        rowConfigs[rowIndex] = {
          ...rowConfigs[rowIndex],
          row_id: row.row_id,
          error: row.error_message || '',
          extractFormula: row.extract_formula?.tokens || [],
          postingFormula: row.posting_formula?.tokens || [],
        };

        hasGridChanges = true;
        fillCellValues(row, rowIndex);
      });

      setRowConfigs(rowConfigs);

      if (hasGridChanges)
        setGridData(gridData).then(({ scope = {} }) => {
          reCompileDataOfGrid(
            { ...this.props, handleGridUpdated: this.handleGridUpdated },
            scope
          );
        });
    } catch (err) {
      console.error(err);
    }
  };
}

ModelWorkbookHelper.propTypes = {};

ModelWorkbookHelper.defaultProps = {};

export default ModelWorkbookHelper;
