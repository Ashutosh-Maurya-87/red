import React from 'react';
import { arrayOf, func, number, shape, any, bool, string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { get } from 'lodash';

import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  withStyles,
  Tooltip,
} from '@material-ui/core';
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@material-ui/icons';

import { API_URLS } from '../../../../configs/api';
// import { APP_ROUTES } from '../../../../configs/routes';
import { RECORD_EDITOR_MSG } from '../../../../configs/messages';
import { getGridHeaders } from '../AmountGrid/configs';

import getNumbers from '../../../../utils/helper/getNumbers';
import { httpPost } from '../../../../utils/http';
import { showErrorMsg, showSuccessMsg } from '../../../../utils/notifications';
import getFormattedNumber from '../../../../utils/helper/getFormattedNumber';
import { getAllValuesFalseInArr } from '../../../../utils/helper/getInitialEditState';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

import {
  getValidInputValue,
  getFormattedGridData,
  getFormattedFilters,
  getFormattedParamsToSaveRecord,
  isFiltersUpdated,
  getEmptyGrid,
} from './helper';
import { getInputAsPerType, getFormattedInputsData } from './inputFields';

import { MAX_YEAR_ADD_LIMIT } from '../configs';
import CustomScrollbars from '../../../../components/ScrollBars';
import Spinner from '../../../../components/Spinner';
import UnsavedChnagesDialog from '../../../../components/UnsavedChangesDialog';

import AmountGrid from '../AmountGrid';
import ChartsView from '../ChartsView/Index';
import RecordEdiotrFiltersModal from './FiltersModal';

import AddEditDimensionDialog from '../../../../components/AddEditDimensionDialog';

import { getUserProfile } from '../../../../reducers/UserProfile/selectors';
import { getSelectedTable } from '../../../../reducers/RecordEditor/selectors';

import { styles } from './styles';
import './styles.scss';

const GO_TO_ACTIONS = {
  cancel: 'Cancel',
  reset: 'Reset',
  prevPage: 'Prev Page',
  nextPage: 'Next Page',
  pageInput: 'Page Input',
  editUI: 'Edit UI',
  showFilters: 'Show Filters',
  addRecord: 'Add New Record',
};

/**
 * Default Pagination
 */
const PAGINATION = {
  page: 1,
  total: 0,
};

class UpdateRecord extends React.Component {
  /**
   * State
   */
  state = {
    inputs: {},
    inputsLabels: {},
    originalInputs: {},
    recordMeta: { ...PAGINATION },
    currentPage: PAGINATION.page,

    headers: [],
    data: [],
    apiData: {},
    scenarioMeta: {},
    isTableChanges: false,
    yearsShown: [],

    isSubmit: false,
    isAddNew: false,
    discardAction: '',
    hasUnsavedChanges: false,
    showLoader: false,

    activeInput: null,
    filtersEle: null,
    search: {},
    selectedDateRange: {},
    selectedAmountRange: {},
    sortDirection: '',
    sortBy: '',

    relationOptions: {},
    colValuesList: {},
    yearCount: 1,
    gridLastYear: null,
    isOpenDimensionDialog: false,
    dimensionId: null,
    fieldName: '',
    tempIdentifierCol: '',
    tempNameCol: '',

    isEditing: false,
    areFieldsEditing: {},
    inputValue: '',
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const fiscalMonth = get(
      this.props.userProfile,
      'actual_sce_meta.fiscal_year_beginning'
    );

    const headers = getGridHeaders(fiscalMonth);
    this.setState({ headers }, this.fetchRecord);
  }

  componentDidUpdate = props => {
    if (this.props.density !== props.density) {
      const fiscalMonth = get(
        this.props.userProfile,
        'actual_sce_meta.fiscal_year_beginning'
      );

      const headers = getGridHeaders(fiscalMonth);
      this.setState({ headers }, this.fetchRecord);
    }
  };

  /**
   * Update State Conditionally
   *
   * @param {Object} updatedState
   */
  updateState = (updatedState = {}) => {
    updatedState.hasUnsavedChanges = true;

    this.setState(updatedState);
  };

  /**
   * Fetch Record from API
   */
  fetchRecord = async () => {
    const { selectedFields } = this.props;

    try {
      let url = API_URLS.GET_RECORD_FOR_EDIT;
      url = url.replace('#ID#', this.props.id);

      const params = getFormattedFilters(this.state, selectedFields);

      this.setState({ showLoader: true });

      let { data: apiData } = await httpPost(url, params);
      if (!apiData) apiData = {};

      this.setState({ apiData }, this.fillData);
    } catch (err) {
      console.error(err);

      this.setState({
        showLoader: false,
        data: getEmptyGrid(),
      });
    }
  };

  /**
   * Fill Data
   */
  fillData = () => {
    const { currentPage, headers, apiData, isAddNew } = this.state;
    const { pagination_meta = {}, scenario_meta = {} } = apiData;
    const { selectedFields } = this.props;
    const operator = get(scenario_meta, 'operator');

    let { scenario_meta: scenarioMeta } = apiData;
    if (!scenarioMeta) scenarioMeta = {};

    let gridData = getFormattedGridData({
      data: apiData,
      headers,
      isAddNew,
      operator,
    });

    const {
      inputs = {},
      inputsLabels = {},
      selectedFields: updatedSelectedFields,
    } = getFormattedInputsData({
      data: apiData,
      isAddNew,
      selectedFields,
    });

    this.setState({
      areFieldsEditing: getAllValuesFalseInArr({
        data: apiData?.fields_data,
      }),
    });

    let gridLastYear = null;

    if (
      gridData.length > 0 &&
      gridData[gridData.length - 1][0] &&
      gridData[gridData.length - 1][0]?.value
    ) {
      const lastYear = gridData[gridData.length - 1][0]?.value || '';

      if (String(lastYear).includes('-')) {
        gridLastYear = Number(lastYear.split('-')[0]);
      }

      if (!String(lastYear).includes('-')) {
        gridLastYear = Number(lastYear);
      }
    }

    // Add Empty Row
    if (gridData.length == 0) gridData = getEmptyGrid();

    const allYearsArr = gridData.map(item => {
      const [firstChildItem = {}] = item || [];
      const { value = '' } = firstChildItem || {};

      return String(value);
    });

    this.setState(
      {
        hasUnsavedChanges: isAddNew,
        showLoader: false,
        isSubmit: false,

        recordMeta: { ...pagination_meta, page: currentPage },
        scenarioMeta,
        apiData,

        gridLastYear,
        data: gridData,
        yearsShown: allYearsArr,
        inputs,
        inputsLabels,
        originalInputs: { ...inputs },
      },
      () => {
        this.props.updateState({
          isUnsavedStructure: false,
          selectedFields: updatedSelectedFields,
        });
      }
    );
  };

  /**
   * Add New Year
   */
  addNewYear = () => {
    const {
      headers,
      data: gridData,
      yearCount,
      gridLastYear,
      yearsShown,
    } = this.state;

    if (gridData.length === 0 || !gridLastYear) return;

    if (gridData.length > 0) {
      if (gridLastYear + yearCount > gridLastYear + MAX_YEAR_ADD_LIMIT) {
        showErrorMsg(RECORD_EDITOR_MSG.max_year_allowed_for_add);
        return;
      }
    }

    const updatedGridData = [...gridData];

    const newCell = { value: '', readOnly: false, isForecast: true };

    const newYear = Number(gridLastYear) + Number(yearCount);

    const row = headers.map((header, index) => {
      let cell = { ...newCell };

      if (index === 0 || index === headers.length - 1) {
        let value = 0;

        if (index === 0) {
          value = `${newYear}-${Number(newYear) + 1}`;
        }

        cell = { ...newCell, readOnly: true, isForecast: false, value };
      }

      return cell;
    });

    updatedGridData.push(row);

    this.setState({
      data: updatedGridData,
      hasUnsavedChanges: true,
      yearCount: yearCount + 1,
      yearsShown: [
        ...yearsShown,
        `${newYear}-${Number(newYear) + 1}`.toString(),
      ],
    });
  };

  /**
   * Verify > Is form have unsaved changes
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  verifyIsUnsavedChanges = action => {
    if (this.state.hasUnsavedChanges) {
      this.setState({ discardAction: action });
      return true;
    }
    return false;
  };

  /**
   * Handle Confirmation Response for unsaved Changes Modal
   *
   * @param {Boolean} isDiscard
   */
  handleUnsavedConf = isDiscard => () => {
    if (!isDiscard) {
      this.setState({ discardAction: '' });
      return;
    }

    const { setUpdateRecordMode } = this.props;
    // const { isAddNew } = this.state;

    const doAction = () => {
      switch (this.state.discardAction) {
        case GO_TO_ACTIONS.editUI:
          setUpdateRecordMode(false);
          break;

        // case GO_TO_ACTIONS.cancel:
        //   isAddNew ? this.fillData() : history.push(APP_ROUTES.RECORD_EDITORS);
        //   break;

        case GO_TO_ACTIONS.reset:
          this.fillData();
          break;

        case GO_TO_ACTIONS.addRecord:
          this.addNewRecord();
          break;

        case GO_TO_ACTIONS.prevPage:
          this.viewPrevRecord();
          break;

        case GO_TO_ACTIONS.nextPage:
          this.viewNextRecord();
          break;

        case GO_TO_ACTIONS.pageInput:
        default:
          break;
      }

      this.setState({ discardAction: '' });
    };

    this.discardChanges();
    setTimeout(doAction, 200);
  };

  /**
   * Discard Changes
   */
  discardChanges = ({ callback } = {}) => {
    this.setState(
      {
        inputs: {},
        inputsLabels: {},
        hasUnsavedChanges: false,
        yearCount: 1,
        isAddNew: false,
      },
      this.fillData
    );
  };

  /**
   * Go To > Edit UI Page
   */
  goToEditUI = () => {
    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.editUI)) return;

    this.props.setUpdateRecordMode(false);
  };

  /**
   * Get Input Box as per field type
   *
   * @param {Object} field
   * @param {Number} fieldIndex
   *
   * @return {HTML|Null}
   */
  getInputAsPerType = (field, fieldIndex) => {
    return getInputAsPerType({ field, fieldIndex }, this);
  };

  /**
   * On Change Input Value
   *
   * @param {Object} field
   * @param {Number} fieldIndex
   */
  onChangeInput = (field, fieldIndex) => evt => {
    const { inputs, areFieldsEditing } = this.state;
    const { selectedFields, updateState } = this.props;

    const value = getValidInputValue({ evt, field });

    // To prevent user to enter alphabets and any other character expect '-'  (at first place) and '.'
    if (areFieldsEditing[field.name]) {
      inputs[`${field.user_table_id}-${field.name}`] = value;
    }

    inputs[`${field.user_table_id}-${field.name}`] = value;
    selectedFields[fieldIndex].isUpdated = true;

    this.setState({ inputs, hasUnsavedChanges: true });
    updateState({ selectedFields });
  };

  /**
   * Set Filters Element
   *
   * @param {Object} filtersEle
   */
  setFiltersEle = filtersEle => {
    this.setState({ filtersEle });
  };

  /**
   * Handle Page Input
   *
   * @param {Object} evt
   */
  handlePageInput = evt => {
    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.prevPage)) return;

    let { value } = evt.target;
    if (value == 0) value = '';

    const currentPage = Number(getNumbers(value));

    this.setState({ currentPage });
  };

  /**
   * Go to selected page
   */
  goToPage = evt => {
    evt.preventDefault();

    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.pageInput)) return;

    const { currentPage, recordMeta } = this.state;

    if (currentPage && currentPage == recordMeta.page) return;

    if (!currentPage || currentPage < 1) {
      this.setState({ currentPage: Number(recordMeta.page) });
      return;
    }

    if (currentPage < recordMeta.total) {
      this.fetchRecord();
      return;
    }

    this.setState({ currentPage: Number(recordMeta.total) }, () => {
      if (this.state.currentPage > 1) this.fetchRecord();
    });
  };

  /**
   * Handle > View Previous Record
   */
  viewPrevRecord = () => {
    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.prevPage)) return;

    const { currentPage } = this.state;

    if (currentPage <= 1) return;

    this.setState({ currentPage: currentPage - 1 }, this.fetchRecord);
  };

  /**
   * Handle > View Next Record
   */
  viewNextRecord = () => {
    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.nextPage)) return;

    const { currentPage, recordMeta } = this.state;

    if (currentPage >= recordMeta.total) return;

    this.setState({ currentPage: currentPage + 1 }, this.fetchRecord);
  };

  /**
   * Show Filters Dialog
   *
   * @param {Object} field
   */
  showFiltersDialog = field => evt => {
    try {
      evt.stopPropagation();

      if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.showFilters)) return;

      this.setState({
        activeInput: field,
        filtersEle: evt.currentTarget,
      });
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Handle Filter Action Done
   */
  applyFilters = ({
    fieldName,
    searchInput,
    dateRange,
    amountRange,
    isValuesFilterUpdated,
  }) => {
    const isUpdated = isFiltersUpdated(this.state, {
      fieldName,
      searchInput,
      dateRange,
      amountRange,
    });

    if (!isUpdated && !isValuesFilterUpdated) return;

    const { search, selectedDateRange, selectedAmountRange } = this.state;

    search[fieldName] = searchInput;
    selectedDateRange[fieldName] = dateRange;
    selectedAmountRange[fieldName] = amountRange;

    this.setState(
      { currentPage: 1, search, selectedDateRange, selectedAmountRange },
      this.fetchRecord
    );
  };

  /**
   * Handle Filter Action Reset
   */
  resetFilters = this.applyFilters;

  /**
   * Handle Sort Action
   */
  applySort = ({ sortBy, sortDirection }) => {
    if (
      this.state.sortBy == sortBy &&
      this.state.sortDirection == sortDirection
    ) {
      return;
    }

    this.setState({ sortBy, sortDirection }, this.fetchRecord);
  };

  /**
   * Add New Record
   */
  addNewRecord = () => {
    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.addRecord)) return;

    this.setState({ isAddNew: true, hasUnsavedChanges: true }, this.fillData);
  };

  /**
   * Add New Record via API
   */
  addNewRecordViaAPI = async () => {
    try {
      const { params, err } = getFormattedParamsToSaveRecord(
        this.state,
        this.props
      );

      const { data = {} } = params || {};
      const { amount_data = [] } = data || {};

      if (!this.isValidateSelectCOA(amount_data)) return;

      if (err) {
        showErrorMsg(err);
        return;
      }

      let url = API_URLS.UPDATE_RECORD_RE;
      url = url.replace('#ID#', this.props.id);

      this.setState({ showLoader: true });

      await httpPost(url, params);

      showSuccessMsg(RECORD_EDITOR_MSG.record_added);

      this.setState(
        { isAddNew: false, hasUnsavedChanges: false },
        this.fetchRecord
      );
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Validate Select COA
   *
   * @param {data} amountData
   * @returns {bool}
   */
  isValidateSelectCOA = amountData => {
    const { selectedFields = [], selectedTable = {} } = this.props;
    const { selectionType = '' } = selectedTable || {};

    if (selectionType == 'scenario' && amountData && amountData.length > 0) {
      const index = selectedFields.findIndex(
        ({ dimension_alias = '' }) => dimension_alias == 'gl_account'
      );

      if (index == -1) {
        showErrorMsg(RECORD_EDITOR_MSG.select_coa_field);
        return false;
      }
    }

    return true;
  };

  /**
   * Save Record
   */
  saveRecord = async () => {
    logAmplitudeEvent('Save updated record in record editor');

    try {
      this.setState({ isSubmit: true });

      if (this.state.isAddNew) {
        this.addNewRecordViaAPI();
        return;
      }

      const { params } = getFormattedParamsToSaveRecord(this.state, this.props);

      const { data = {} } = params || {};
      const { amount_data = [] } = data || {};

      if (!this.isValidateSelectCOA(amount_data)) return;

      let url = API_URLS.UPDATE_RECORD_RE;
      url = url.replace('#ID#', this.props.id);

      this.setState({ showLoader: true, yearCount: 1 });

      await httpPost(url, params);

      showSuccessMsg(RECORD_EDITOR_MSG.record_saved);

      this.fetchRecord();
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false });
    }
  };

  /**
   * On Reset
   */
  onReset = () => {
    logAmplitudeEvent('Cancelled record editor update');
    if (this.verifyIsUnsavedChanges(GO_TO_ACTIONS.reset));

    this.setState({ yearCount: 1 });
  };

  /**
   * Set Col Values List
   *
   * @param {String} key
   * @param {Object} data
   */
  setColValuesList = (key, data) => {
    const { colValuesList } = this.state;

    colValuesList[key] = data;

    this.setState({ colValuesList });
  };

  /**
   * Handle Add/Edit Dimension
   *
   * @param {object} props
   */
  handleAddEditDimension = props => {
    const {
      inputs = {},
      inputsLabels = {},
      relationOptions = {},
      fieldName = '',
      tempIdentifierCol = '',
      tempNameCol = '',
    } = this.state;

    const id = props[tempIdentifierCol];
    const name = props[tempNameCol];

    const { options = [] } = relationOptions[fieldName] || {};

    inputs[fieldName] = id;
    inputsLabels[fieldName] = name;
    options.push(props);

    this.setState({ relationOptions, inputs, inputsLabels });
  };

  /**
   * Render View
   */
  render() {
    const {
      height,
      amountColumns,
      selectedFields,
      classes,
      isButtonBlockDone,
      selectedChart,
      showDataPoints,
      showDataLabels,
    } = this.props;

    const {
      recordMeta,
      scenarioMeta,
      currentPage,

      headers,
      data,
      isTableChanges,
      yearsShown,

      discardAction,
      hasUnsavedChanges,
      showLoader,

      activeInput,
      filtersEle,
      search,
      selectedDateRange,
      selectedAmountRange,

      colValuesList,
      isOpenDimensionDialog,
      dimensionId,
      dimensionAlias,
      inputValue,
      tempNameCol,
    } = this.state;

    return (
      <>
        {showLoader && <Spinner />}

        <Paper
          elevation={1}
          square
          id="record-editor-builder"
          style={{ height }}
        >
          <CustomScrollbars height={height}>
            <Box p={3}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h5" color="textSecondary">
                  Record Editor
                </Typography>

                <Box display="flex" alignItems="center">
                  {!recordMeta.total && !showLoader && (
                    <Box mr={4}>
                      <Typography>No record found</Typography>
                    </Box>
                  )}

                  {recordMeta.total > 0 && (
                    <Box
                      display="flex"
                      alignItems="center"
                      className="pagination-wrapper"
                      mr={2}
                    >
                      <Typography>
                        {`${getFormattedNumber(recordMeta.total, 0)} record${
                          getFormattedNumber(recordMeta.total, 0) > 0 ? 's' : ''
                        } found`}
                        &nbsp;&nbsp;
                      </Typography>

                      <IconButton
                        color="primary"
                        className={classes.pagiBtn}
                        disabled={currentPage <= 1}
                        onClick={this.viewPrevRecord}
                      >
                        <NavigateBeforeIcon />
                      </IconButton>

                      <Box mx={1} display="flex" alignItems="center">
                        <form noValidate onSubmit={this.goToPage}>
                          <TextField
                            variant="outlined"
                            className="pagi-input"
                            value={currentPage}
                            autoComplete="off"
                            onChange={this.handlePageInput}
                            onBlur={this.goToPage}
                          />
                        </form>
                        <Typography>
                          &nbsp; of {getFormattedNumber(recordMeta.total, 0)}
                        </Typography>
                      </Box>

                      <IconButton
                        color="primary"
                        className={classes.pagiBtn}
                        disabled={currentPage >= recordMeta.total}
                        onClick={this.viewNextRecord}
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Box>
                  )}

                  <Button
                    color="primary"
                    size="medium"
                    ml={2}
                    variant="contained"
                    onClick={this.goToEditUI}
                    disabled={isButtonBlockDone}
                  >
                    Edit UI
                  </Button>
                </Box>
              </Box>

              <Box pt={4}>
                {selectedFields.map((field, fieldIndex) => {
                  const width = field.perWidth
                    ? `${field.perWidth}%`
                    : field.width;

                  return (
                    <Box
                      key={field.id}
                      mr={3}
                      mb={3}
                      display="inline-block"
                      width={width}
                    >
                      {this.getInputAsPerType(field, fieldIndex)}
                    </Box>
                  );
                })}
              </Box>
              {/* Display Charts */}
              <Box mt={4}>
                {data && data.length > 0 && (
                  <ChartsView
                    saveUpdatedState={this.saveRecord}
                    updateState={this.updateState}
                    data={data}
                    scenarioMeta={scenarioMeta}
                    headers={headers}
                    selectedChart={selectedChart}
                    showDataPoints={showDataPoints}
                    showDataLabels={showDataLabels}
                    isTableChanges={isTableChanges}
                    yearsShown={yearsShown}
                  />
                )}

                {amountColumns.map((col, i) => (
                  <>
                    <AmountGrid
                      key={`${col.user_table_id}-${col.id}`}
                      amountColumn={col}
                      index={i}
                      headers={headers}
                      data={data}
                      yearsShown={yearsShown}
                      saveUpdatedState={this.saveRecord}
                      updateState={this.updateState}
                      hasUnsavedChanges={hasUnsavedChanges}
                      scenarioMeta={scenarioMeta}
                    />
                    {data.length > 0 && (
                      <Tooltip title="Add New Year">
                        <IconButton
                          className="add-new-year-btn"
                          color="primary"
                          onClick={this.addNewYear}
                        >
                          +
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                ))}
              </Box>

              <Box textAlign="right" mt={4}>
                <Box component="span" mr={2}>
                  <Button
                    color="primary"
                    variant="outlined"
                    disabled={!hasUnsavedChanges}
                    onClick={this.onReset}
                  >
                    Cancel
                  </Button>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.saveRecord}
                  disabled={!hasUnsavedChanges || isButtonBlockDone}
                >
                  Save
                </Button>
              </Box>
            </Box>
          </CustomScrollbars>
        </Paper>

        {Boolean(discardAction) && (
          <UnsavedChnagesDialog handleUnsavedConf={this.handleUnsavedConf} />
        )}

        {filtersEle && (
          <RecordEdiotrFiltersModal
            field={activeInput}
            search={search}
            filtersEle={filtersEle}
            setFiltersEle={this.setFiltersEle}
            handleDoneAction={this.applyFilters}
            handleResetAction={this.resetFilters}
            handleSortAction={this.applySort}
            selectedDateRange={selectedDateRange}
            selectedAmountRange={selectedAmountRange}
            colValuesList={colValuesList}
            setColValuesList={this.setColValuesList}
          />
        )}

        {isOpenDimensionDialog && (
          <AddEditDimensionDialog
            isOpen={isOpenDimensionDialog}
            handleClose={value =>
              this.setState({ isOpenDimensionDialog: value })
            }
            dimension={{
              dimensionId,
              dimensionAlias,
              inputValue,
              tempNameCol,
            }}
            handleAddEditDimension={this.handleAddEditDimension}
          />
        )}
      </>
    );
  }
}

UpdateRecord.propTypes = {
  amountColumns: arrayOf(shape({})).isRequired,
  density: string,
  height: number.isRequired,
  id: any.isRequired,
  isButtonBlockDone: bool,
  selectedChart: any.isRequired,
  selectedFields: arrayOf(shape({})).isRequired,
  selectedTable: shape({}),
  setUpdateRecordMode: func.isRequired,
  showDataLabels: any.isRequired,
  showDataPoints: any.isRequired,
  updateState: func.isRequired,
  userProfile: shape({}),
};

const mapStateToProps = createStructuredSelector({
  userProfile: getUserProfile(),
  selectedTable: getSelectedTable(),
});

export default connect(mapStateToProps, {}, null, { forwardRef: true })(
  withStyles(styles)(UpdateRecord)
);
