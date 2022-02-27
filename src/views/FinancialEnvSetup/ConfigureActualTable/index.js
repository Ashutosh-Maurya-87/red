import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { string, func, shape, bool } from 'prop-types';

import {
  Box,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  InputAdornment,
  IconButton,
} from '@material-ui/core';
import { Event as CalendarIcon } from '@material-ui/icons';

import { Alert } from '@material-ui/lab';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import ListboxComponent from '../../../components/CustomListBox';
import Spinner from '../../../components/Spinner';
import ViewSourceTable from '../../SourceTables/ViewSourceTable';
import FinancialEnvSetupFooter from '../Footer';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
  // EXCEL_DATE_FORMATS,
  FISCAL_YEAR_DATE_FORMAT,
  getExcelDateFormatLabel,
  PRE_DEFINED_LABELS,
} from '../../../configs/app';
import { FINANCIAL_ENV_SETUP_MENU_KEYS } from '../configs';
import { API_URLS } from '../../../configs/api';

import { httpPost } from '../../../utils/http';
import scrollTo from '../../../utils/helper/scrollTo';

import {
  setActiveTab,
  setActualTable,
  setActualTableInputs,
} from '../../../reducers/FinancialEnvSetup/actions';
import { setUserProfile } from '../../../reducers/UserProfile/actions';

import {
  getActualTable,
  getActualTableInputs,
} from '../../../reducers/FinancialEnvSetup/selectors';
import { getUserProfile } from '../../../reducers/UserProfile/selectors';

import {
  getColumnValue,
  getformatDate,
} from '../../Scenarios/CreateScenario/helper';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const filter = createFilterOptions();

class ConfigureActualTable extends React.Component {
  defaultState = {
    warningText: '',

    isFetching: false,
    isSaving: false,
    tableData: [],
    tableColumns: [],

    // Form value
    id: null,
    isSubmit: false,
    actualName: '',
    dateColumn: '',
    dateFormat: '',
    fiscalYear: '',
    glAccountID: '1',
    glAccountIDColumn: '',
    glAccountName: '0',
    glAccountNameColumn: '',
    amountColumn: '',
  };

  /**
   * State
   */
  state = { ...this.defaultState };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const {
      table: { id, display_name = '' },
      actualTableInputs,
      hideTable,
      scenarioTable,
    } = this.props;

    this.setState({
      actualName: display_name,
      id: actualTableInputs.id || null,
    });

    if (!hideTable && !id) {
      this.handlePrev();
      return;
    }

    if (hideTable) {
      this.setState(
        {
          tableData: scenarioTable,
          tableColumns: scenarioTable.columns || [],
        },
        this.fillInputs
      );
    }
  }

  /**
   * Fill Inputs On load Source Table
   */
  fillInputs = () => {
    const { actualTableInputs, scenarioInputs, hideTable } = this.props;

    let inputs = { ...actualTableInputs };

    let { actualName } = this.state;
    if (!actualName) {
      actualName = actualTableInputs.actualName || '';
    }

    if (hideTable) {
      inputs = { ...scenarioInputs };
      actualName = scenarioInputs.actualName || '';
    }

    let dateColumn = '';
    let amountColumn = '';
    let glAccountIDColumn = '';
    let glAccountNameColumn = '';

    let dateFormat = getExcelDateFormatLabel(
      inputs.dateFormat || DEFAULT_DATE_FORMAT
    );

    const {
      warningText,
      firstAmountCol,
      firstDateCol,
    } = this.validateTableFields();

    this.state.tableColumns.forEach(({ name, display_name }) => {
      switch (name) {
        case inputs.dateColumn:
          dateColumn = display_name;
          break;

        case inputs.amountColumn:
          amountColumn = display_name;
          break;

        case inputs.glAccountIDColumn:
          glAccountIDColumn = display_name;

          if (name === inputs.glAccountNameColumn) {
            glAccountNameColumn = '';
          }
          break;

        case inputs.glAccountNameColumn:
          glAccountNameColumn = '';
          break;

        default:
          break;
      }
    });

    if (firstAmountCol && !amountColumn) {
      amountColumn = firstAmountCol.display_name;
    }

    if (firstDateCol && !dateColumn) {
      dateColumn = firstDateCol.display_name;

      dateFormat = getExcelDateFormatLabel(
        firstDateCol.date_format || DEFAULT_DATE_FORMAT
      );
    }

    this.setState({
      ...inputs,
      dateFormat,
      dateColumn,
      amountColumn,
      glAccountIDColumn,
      glAccountNameColumn,
      warningText,
      actualName,
    });
  };

  /**
   * Get Table Data for View Table
   *
   * @param {Object}
   */
  onLoadSourceTable = ({ data = [], metadata = [] }) => {
    this.setState({ tableColumns: metadata, tableData: data }, this.fillInputs);
  };

  /**
   * Validate Table Columns Types
   *
   * @return {Object}
   */
  validateTableFields = () => {
    const { tableColumns } = this.state;

    let hasAmountColumn = false;
    let hasDateColumn = false;

    let firstAmountCol = null;
    let firstDateCol = null;

    tableColumns.forEach(col => {
      if (col.data_type == COLUMN_DATA_TYPES_KEYS.amount) {
        if (!firstAmountCol) firstAmountCol = col;
        hasAmountColumn = true;
      }

      if (col.data_type == COLUMN_DATA_TYPES_KEYS.date) {
        if (!firstDateCol) firstDateCol = col;
        hasDateColumn = true;
      }
    });

    let msg = '';

    if (!hasAmountColumn && !hasDateColumn) {
      msg = 'Date type and Amount type columns are missing in table.';
    } else if (!hasAmountColumn) {
      msg = 'Amount type column is missing in table.';
    } else if (!hasDateColumn) {
      msg = 'Date type column is missing in table.';
    }

    return { warningText: msg, firstAmountCol, firstDateCol };
  };

  /**
   * Handle > Change Input Value
   *
   * @param {Object}
   */
  handleChangeInput = ({ target: { name, value } }) => {
    this.setState({ [name]: value });
  };

  /**
   * Handle > Select Source Table
   *
   * @param {String} name
   * @param {Object} option
   */
  handleOnChangeSelect = name => (evt, option) => {
    const { label = '', option: { date_format } = {} } = option || {};

    if (name == 'dateColumn' && date_format) {
      const dateFormat = getExcelDateFormatLabel(date_format);
      this.setState({ [name]: label, dateFormat });
      return;
    }

    this.setState({ [name]: label });
  };

  /**
   * Handle > Select Source Table
   *
   * @param {Object} evt
   */
  handleOnChangeRadio = ({ target: { name, value } }) => {
    this.setState({ [name]: value });
  };

  /**
   * Handle > On Change Fiscal Year
   *
   * @param {Object} momentObj
   */
  handleOnChangeDate = momentObj => {
    this.setState({ fiscalYear: momentObj.format('MMMM YYYY') });
  };

  /**
   * Validate the current form fields value
   */
  validateFields = () => {
    const {
      actualName,
      dateColumn,
      dateFormat,
      fiscalYear,
      glAccountID,
      glAccountIDColumn,
      // glAccountName,
      // glAccountNameColumn,
      amountColumn,
    } = this.state;

    if (
      !actualName ||
      !dateColumn ||
      !dateFormat ||
      !fiscalYear ||
      !amountColumn ||
      (glAccountID === '1' && !glAccountIDColumn) ||
      glAccountID == 0
      // remove this comment to enable glAccountName validation
      // (glAccountName === '1' && !glAccountNameColumn) ||
      // (glAccountID == 0 && glAccountName == 0)
    )
      return true;

    return false;
  };

  /**
   * Handle Next button
   */
  handleNext = () => {
    logAmplitudeEvent('Financial Env. Setup: next on configure actuals info');

    this.setState({ isSubmit: true }, () => {
      if (this.validateFields()) {
        scrollTo('.Mui-error');
        return;
      }

      this.saveActuals();
    });
  };

  /**
   * Handle Back button
   */
  handlePrev = () => {
    logAmplitudeEvent('Financial Env. Setup: back on configure actuals info');

    this.setState({ ...this.defaultState });

    this.props.setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.loadActuals);
    this.props.setActualTable({});
  };

  /**
   * Save Actuals
   *
   * @param {Object}
   */
  saveActuals = async () => {
    try {
      if (this.state.isSaving) return;

      const { actualName } = this.state;

      const {
        onSaveSuccess,
        setActiveTab,
        setActualTableInputs,
        scenarioInputs,
      } = this.props;

      const params = this.getParamsToSaveActuals();

      this.setState({ isSaving: true });

      const { data } = await httpPost(API_URLS.SAVE_CONFIG_ACTUALS, params);

      const { userProfile, setUserProfile } = this.props;
      setUserProfile({ ...userProfile, actual_sce_meta: data.scenario_meta });

      onSaveSuccess();
      this.setState({ isSaving: false });
      scenarioInputs.actualName = actualName;

      const {
        dateColumn,
        dateFormat,
        fiscalYear,
        glAccountID,
        glAccountIDColumn,
        glAccountName,
        glAccountNameColumn,
        amountColumn,
      } = this.state;

      setActualTableInputs({
        id: data.id,
        actualName,
        dateColumn,
        dateFormat,
        fiscalYear,
        glAccountID,
        glAccountIDColumn,
        glAccountName,
        glAccountNameColumn,
        amountColumn,
      });

      setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts);
    } catch (e) {
      console.error(e);
      this.setState({ isSaving: false });
    }
  };

  /**
   * Get Formatted Params to Save Actuals
   *
   * @return {Object}
   */
  getParamsToSaveActuals = () => {
    const { table, scenarioTable } = this.props;

    const {
      tableColumns,

      id,
      actualName,
      dateColumn,
      dateFormat,
      fiscalYear,

      glAccountID,
      glAccountIDColumn,
      glAccountName,
      glAccountNameColumn,

      amountColumn,
    } = this.state;

    const gl_account_id_col_name =
      glAccountID == '1' ? getColumnValue(tableColumns, glAccountIDColumn) : '';

    const gl_acc_nm_col_name =
      glAccountName == '1'
        ? getColumnValue(tableColumns, glAccountNameColumn)
        : '';

    const params = {
      id,
      label: PRE_DEFINED_LABELS.actuals.label,
      source_type: 'source_table',
      source_id: table.id || scenarioTable.id || null,
      meta: {
        dataset_name: actualName,
        date_col_name: getColumnValue(tableColumns, dateColumn),
        date_col_format: getformatDate(dateFormat),
        fiscal_year_beginning: fiscalYear,
        gl_account_id_col_name,
        gl_acc_nm_col_name,
        amt_col_name: getColumnValue(tableColumns, amountColumn),
        actuals_metacol: '',
      },
    };

    return params;
  };

  /**
   * Common code for YES and NO option's
   */
  renderYesNoOptions = (defaultValue, name, value) => {
    return (
      <RadioGroup
        defaultValue={defaultValue}
        value={value}
        aria-label={name}
        name={name}
        row
      >
        <FormControlLabel
          key={`yes-${name}`}
          label="Yes"
          control={
            <Radio
              key={1}
              disabled
              size="small"
              color="primary"
              name={name}
              value="1"
              onChange={this.handleOnChangeRadio}
            />
          }
        />

        <FormControlLabel
          key={`no-${name}`}
          label="No"
          control={
            <Radio
              disabled
              key={1}
              size="small"
              color="primary"
              name={name}
              value="0"
              onChange={this.handleOnChangeRadio}
            />
          }
        />
      </RadioGroup>
    );
  };

  /**
   * Render View
   */
  render() {
    const {
      isFetching,
      isSaving,
      isSubmit,
      actualName,
      dateColumn,
      tableColumns,
      glAccountID,
      glAccountName,
      amountColumn,
      // dateFormat,
      fiscalYear,
      glAccountIDColumn,
      glAccountNameColumn,
      warningText,
    } = this.state;

    const { subTitle, title, table, hideTable } = this.props;
    const year = moment().format('YYYY');

    return (
      <Box>
        <Box mt={1} mb={3}>
          <Typography variant="h2">{title}</Typography>

          {warningText && (
            <Box my={2}>
              <Alert variant="outlined" severity="warning">
                {warningText}
              </Alert>
            </Box>
          )}
        </Box>

        {((!hideTable && !table.id) || isFetching || isSaving) && <Spinner />}

        {!hideTable && (
          <Box height="280px">
            <Typography variant="caption">{subTitle}</Typography>
            {table.id && (
              <ViewSourceTable
                hideFilters
                hideHeader
                scrollHeight={200}
                tableId={table.id || ''}
                onLoadData={this.onLoadSourceTable}
              />
            )}
          </Box>
        )}

        <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              1
            </Typography>
            <Typography variant="body1">
              Would you like to rename the data set?
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <TextField
              size="small"
              name="actualName"
              style={{ width: 300 }}
              value={actualName}
              onChange={this.handleChangeInput}
              required
              autoComplete="off"
              autoFocus={!hideTable}
              fullWidth
              label="Actuals Name"
              placeholder="Actuals"
              error={isSubmit && !actualName}
            />
          </Box>
        </Box>

        <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              2
            </Typography>
            <Typography variant="body1">
              Select the column with DATE from the drop down. Note: Date must be
              in one column and it must contain days, month, and year (ex.
              2021-01-31)
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <Autocomplete
              id="date-column"
              value={{ label: dateColumn }}
              options={tableColumns.map(table => ({
                label: table.display_name,
                option: table,
              }))}
              getOptionDisabled={({ label, option = {} }) =>
                option.data_type != COLUMN_DATA_TYPES_KEYS.date ||
                label === amountColumn ||
                (glAccountID === '1' && label === glAccountIDColumn) ||
                (glAccountName === '1' && label === glAccountNameColumn)
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Date Column"
                  placeholder="Date"
                  name="date-column"
                  error={isSubmit && !dateColumn}
                />
              )}
              style={{ width: 300 }}
              openOnFocus
              selectOnFocus
              clearOnBlur
              freeSolo
              ListboxComponent={ListboxComponent}
              handleHomeEndKeys
              renderOption={option => option.label}
              onChange={this.handleOnChangeSelect('dateColumn')}
              getOptionLabel={({ label = '' }) => label}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                return filtered;
              }}
            />
          </Box>
        </Box>

        {/* <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              3
            </Typography>
            <Typography variant="body1">
              Select the date format of your date column
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <Autocomplete
              id="date-format"
              style={{ width: 300 }}
              value={{ label: dateFormat }}
              openOnFocus
              selectOnFocus
              clearOnBlur
              freeSolo
              ListboxComponent={ListboxComponent}
              handleHomeEndKeys
              options={EXCEL_DATE_FORMATS.map(format => ({
                label: format.label,
                option: format,
              }))}
              renderOption={option => option.label}
              getOptionDisabled={({ disabled }) => Boolean(disabled)}
              onChange={this.handleOnChangeSelect('dateFormat')}
              getOptionLabel={({ label = '' }) => label}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Date Format"
                  placeholder="dd-mm-yyy"
                  error={isSubmit && !dateFormat}
                />
              )}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                return filtered;
              }}
            />
          </Box>
        </Box> */}

        <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              3
            </Typography>
            <Typography variant="body1">
              {`When did your fiscal year ${year} begin?`}
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <DatePicker
                autoOk
                name="fiscalYear"
                id="fiscal-year"
                size="small"
                style={{ width: 300 }}
                format={FISCAL_YEAR_DATE_FORMAT}
                value={(fiscalYear && moment(fiscalYear)) || null}
                onChange={this.handleOnChangeDate}
                minDate={new Date(`2020-01-01`)}
                maxDate={new Date(`${year}-12-31`)}
                helperText=""
                error={isSubmit && !fiscalYear}
                views={['year', 'month']}
                variant="dialog"
                inputVariant="standard"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end">
                        <CalendarIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </MuiPickersUtilsProvider>
          </Box>
        </Box>

        <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              4
            </Typography>
            <Typography variant="body1">
              Does your Actuals data have a GL Account ID in it?
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2} alignItems="center">
            {/* {this.renderYesNoOptions(1, 'glAccountID', glAccountID)} */}
            {glAccountID === '1' && (
              <Box ml={2}>
                <Autocomplete
                  id="glAccountID-column"
                  style={{ width: 300 }}
                  value={{ label: glAccountIDColumn }}
                  openOnFocus
                  selectOnFocus
                  clearOnBlur
                  freeSolo
                  ListboxComponent={ListboxComponent}
                  handleHomeEndKeys
                  options={tableColumns.map(table => ({
                    label: table.display_name,
                    option: table,
                  }))}
                  renderOption={option => option.label}
                  getOptionDisabled={({ label }) =>
                    label === amountColumn || label === dateColumn
                  }
                  onChange={this.handleOnChangeSelect('glAccountIDColumn')}
                  getOptionLabel={({ label = '' }) => label}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Select GL Account ID"
                      placeholder="GL Account ID"
                      error={isSubmit && !glAccountIDColumn}
                    />
                  )}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    return filtered;
                  }}
                />
              </Box>
            )}
          </Box>
          {isSubmit && glAccountID == 0 && glAccountName == 0 && (
            <Box ml={4}>
              <FormLabel error className="font-12">
                Please provide GL Account ID or GL Account Name.
              </FormLabel>
            </Box>
          )}
        </Box>

        {/* <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              6
            </Typography>
            <Typography variant="body1">
              Does your Actuals data have a GL Account Name in it?
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2} alignItems="center">
            {this.renderYesNoOptions(1, 'glAccountName', glAccountName)}
            {glAccountName === '1' && (
              <Box ml={2}>
                <Autocomplete
                  id="glAccountID-column"
                  style={{ width: 300 }}
                  value={{ label: glAccountNameColumn }}
                  openOnFocus
                  selectOnFocus
                  clearOnBlur
                  freeSolo
                  ListboxComponent={ListboxComponent}
                  handleHomeEndKeys
                  options={tableColumns.map(table => ({
                    label: table.display_name,
                    option: table,
                  }))}
                  renderOption={option => option.label}
                  getOptionDisabled={({ label }) =>
                    label === amountColumn || label === dateColumn
                  }
                  onChange={this.handleOnChangeSelect('glAccountNameColumn')}
                  getOptionLabel={({ label = '' }) => label}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Select GL Account Name Column"
                      placeholder="GL Account Name"
                      error={isSubmit && !glAccountNameColumn}
                    />
                  )}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    return filtered;
                  }}
                />
              </Box>
            )}
          </Box>
        </Box> */}

        <Box mt={5} mb={2}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              5
            </Typography>
            <Typography variant="body1">
              Select the column with Amount from the drop down
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <Autocomplete
              id="amount-column"
              style={{ width: 300 }}
              value={{ label: amountColumn }}
              openOnFocus
              selectOnFocus
              clearOnBlur
              freeSolo
              ListboxComponent={ListboxComponent}
              handleHomeEndKeys
              options={tableColumns.map(table => ({
                label: table.display_name,
                option: table,
              }))}
              renderOption={option => option.label}
              getOptionDisabled={({ label, option = {} }) =>
                option.data_type != COLUMN_DATA_TYPES_KEYS.amount ||
                label === dateColumn ||
                (glAccountID === '1' && label === glAccountIDColumn) ||
                (glAccountName === '1' && label === glAccountNameColumn)
              }
              onChange={this.handleOnChangeSelect('amountColumn')}
              getOptionLabel={({ label = '' }) => label}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Amount Column"
                  placeholder="Amount"
                  error={isSubmit && !amountColumn}
                />
              )}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                return filtered;
              }}
            />
          </Box>
        </Box>

        {!hideTable && (
          <FinancialEnvSetupFooter
            activeTab={FINANCIAL_ENV_SETUP_MENU_KEYS.configureActuals}
            nextTab={FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts}
            prevTab={FINANCIAL_ENV_SETUP_MENU_KEYS.loadActuals}
            onPrev={this.handlePrev}
            onNext={this.handleNext}
            // helperText="You can select source table or created data sets from processes."
          />
        )}
      </Box>
    );
  }
}

ConfigureActualTable.propTypes = {
  actualTableInputs: shape({}),
  hideTable: bool,
  onSaveSuccess: func,
  scenarioInputs: shape({}),
  scenarioTable: shape({}),
  setActiveTab: func.isRequired,
  setActualTable: func.isRequired,
  setActualTableInputs: func.isRequired,
  setUserProfile: func.isRequired,
  subTitle: string,
  table: shape({}).isRequired,
  title: string,
  userProfile: shape({}),
};

ConfigureActualTable.defaultProps = {
  title: 'Tell us about your Actuals data',
  subTitle: 'Your Actual Data Preview',
  hideTable: false,
  scenarioTable: {},
  scenarioInputs: {},
  onSaveSuccess: () => {},
};

const mapStateToProps = createStructuredSelector({
  table: getActualTable(),
  actualTableInputs: getActualTableInputs(),
  userProfile: getUserProfile(),
});

export default connect(
  mapStateToProps,
  {
    setActiveTab,
    setActualTable,
    setActualTableInputs,
    setUserProfile,
  },
  null,
  { forwardRef: true }
)(ConfigureActualTable);
