import React from 'react';
import moment from 'moment';
import { bool, func, shape, string } from 'prop-types';

import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
} from '@material-ui/core';
import { Event as CalendarIcon } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';

import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import ListboxComponent from '../../../../components/CustomListBox';
import Spinner from '../../../../components/Spinner';
import CreateScenarioFooter from '../Footer';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
  EXCEL_DATE_FORMATS,
  SCENARIO_START_DATE_FORMAT,
  getExcelDateFormatLabel,
} from '../../../../configs/app';
import { ERROR_MESSAGES } from '../../../../configs/messages';

import scrollTo from '../../../../utils/helper/scrollTo';
import { showErrorMsg } from '../../../../utils/notifications';
import { validateName } from '../../../../utils/helper/validateName';

import { validateTableName } from '../../../SourceTables/ProcessImportedTable/helper';

const filter = createFilterOptions();

class ConfigureScenario extends React.Component {
  defaultState = {
    warningText: '',

    isFetching: false,
    isSaving: false,
    tableData: [],
    tableColumns: [],

    // Form value
    id: null,
    scenarioName: '',
    dateColumn: '',
    dateFormat: '',
    forecastStartDate: '',
    amountColumn: '',

    isValidName: true,
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
      table: { display_name = '' },
      scenarioInputs,
    } = this.props;

    this.setState(
      {
        scenarioName: display_name,
        id: scenarioInputs.id || null,
      },
      this.loadSourceTable
    );
  }

  /**
   * Fill Inputs On load Source Table
   */
  fillInputs = () => {
    const { scenarioInputs } = this.props;

    let dateColumn = '';
    let amountColumn = '';

    let dateFormat = getExcelDateFormatLabel(
      scenarioInputs.dateFormat || DEFAULT_DATE_FORMAT
    );

    const {
      warningText,
      firstAmountCol,
      firstDateCol,
    } = this.validateTableFields();

    this.state.tableColumns.forEach(({ name, display_name }) => {
      switch (name) {
        case scenarioInputs.dateColumn:
          dateColumn = display_name;
          break;

        case scenarioInputs.amountColumn:
          amountColumn = display_name;
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
      ...scenarioInputs,
      dateFormat,
      dateColumn,
      amountColumn,
      warningText,
      isFetching: false,
    });
  };

  /**
   * Get Table Data
   *
   * @param {Object}
   */
  loadSourceTable = async () => {
    const {
      table: { columns = [] },
    } = this.props;

    this.setState({ tableColumns: columns }, this.fillInputs);
  };

  /**
   * Validate Table Columns Types
   *
   * @return {Object}
   */
  validateTableFields = () => {
    if (this.props.fromScenario) return { warningText: '' };

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
    const validName = value.substring(0, 50);

    this.setState({ [name]: validName, isValidName: validateName(validName) });
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
   * @param {Object} momentObj
   */
  handleOnChangeDate = momentObj => {
    this.setState({
      forecastStartDate: momentObj.format(SCENARIO_START_DATE_FORMAT),
    });
  };

  /**
   * Validate the current form fields value
   */
  validateFields = () => {
    const {
      scenarioName,
      dateColumn,
      dateFormat,
      forecastStartDate,
      amountColumn,
      isValidName,
    } = this.state;

    this.setState({ isValidName: validateName(scenarioName) }, () => {
      if (!isValidName) {
        showErrorMsg(
          !scenarioName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
        );
        this.setState({ isSaving: false });
        return false;
      }
      return '';
    });

    if (this.props.fromScenario) {
      return Boolean(!scenarioName || !forecastStartDate);
    }

    return Boolean(
      !scenarioName ||
        !dateColumn ||
        !dateFormat ||
        !forecastStartDate ||
        !amountColumn
    );
  };

  /**
   * Handle Next button
   */
  handleNext = () => {
    this.setState({ isSubmit: true }, () => {
      if (this.validateFields()) {
        scrollTo('.Mui-error');
        return;
      }
      this.processScenarioInputs();
    });
  };

  /**
   * Process Scenario Inputs
   *
   * @param {Object}
   */
  processScenarioInputs = async () => {
    if (!this.state.isValidName) return;
    try {
      const { scenarioInputs, handleNext, table = {} } = this.props;
      const { id = '' } = table || {};

      const { scenarioName } = this.state;

      // Validate Scenario Unique Name
      if (scenarioInputs.scenarioName != scenarioName) {
        this.setState({ isSaving: true });

        const { is_exists, message = '' } = await validateTableName(
          scenarioName,
          id
        );

        if (is_exists) {
          showErrorMsg(message);
          this.setState({ isSaving: false });
          return;
        }
      }

      const {
        dateColumn,
        dateFormat,
        forecastStartDate,
        glAccountID,
        glAccountIDColumn,
        glAccountName,
        glAccountNameColumn,
        amountColumn,
      } = this.state;

      this.setState({ isSaving: false });

      handleNext({
        scenarioName,
        dateColumn,
        dateFormat,
        forecastStartDate,
        glAccountID,
        glAccountIDColumn,
        glAccountName,
        glAccountNameColumn,
        amountColumn,
      });
    } catch (e) {
      console.error(e);
      this.setState({ isSaving: false });
    }
  };

  /**
   * Validate the name to show error
   */
  validateNameFun = () => {
    const { scenarioName } = this.state;
    if (!validateName(scenarioName)) {
      return !scenarioName
        ? ERROR_MESSAGES.required
        : ERROR_MESSAGES.invalid_name;
    }
    return '';
  };

  /**
   * Render View
   */
  render() {
    const { onBack, backText, nextText, fromScenario, viewMode } = this.props;

    const {
      isFetching,
      isSaving,
      isSubmit,

      warningText,

      scenarioName,
      dateColumn,
      tableColumns,
      glAccountID,
      glAccountName,
      amountColumn,
      dateFormat,
      forecastStartDate,
      glAccountIDColumn,
      glAccountNameColumn,
    } = this.state;

    return (
      <Box className="configure-scenario">
        {warningText && (
          <Box>
            <Alert variant="outlined" severity="warning">
              {warningText}
            </Alert>
          </Box>
        )}

        {(isFetching || isSaving) && <Spinner />}

        <Box mt={3}>
          <Box display="flex">
            <Typography
              variant="body2"
              className="config-count"
              color="textSecondary"
            >
              1
            </Typography>
            <Typography variant="body1">Name your Scenario</Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <TextField
              size="small"
              name="scenarioName"
              style={{ width: 300 }}
              value={scenarioName}
              onChange={this.handleChangeInput}
              required
              autoComplete="off"
              autoFocus
              fullWidth
              label="Scenario Name"
              placeholder="Scenario Name"
              error={isSubmit && this.validateNameFun()}
              helperText={isSubmit && this.validateNameFun()}
            />
          </Box>
        </Box>

        {!fromScenario && (
          <Box mt={5}>
            <Box display="flex">
              <Typography
                variant="body2"
                className="config-count"
                color="textSecondary"
              >
                2
              </Typography>
              <Typography variant="body1">
                Select the column with DATE from the drop down. Note: Date must
                be in one column and it must contain days, month, and year (ex.
                2020-01-31)
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
        )}

        {!fromScenario && (
          <Box mt={5}>
            <Box display="flex">
              <Typography
                variant="body2"
                className="config-count"
                color="textSecondary"
              >
                3
              </Typography>
              <Typography variant="body1">
                Select the format of your date column
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
                    placeholder="DD-MM-YYYY"
                    error={isSubmit && !dateFormat}
                  />
                )}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);

                  return filtered;
                }}
              />
            </Box>
          </Box>
        )}

        <Box mt={5}>
          <Box display="flex">
            <Typography
              variant="body2"
              className="config-count"
              color="textSecondary"
            >
              {fromScenario ? 2 : 4}
            </Typography>
            <Typography variant="body1">Forecast start date</Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <DatePicker
                autoOk
                name="forecastStartDate"
                id="forecast-start-date"
                size="small"
                style={{ width: 300 }}
                placeholder="Forecast start date"
                format={SCENARIO_START_DATE_FORMAT}
                value={(forecastStartDate && moment(forecastStartDate)) || null}
                onChange={this.handleOnChangeDate}
                error={isSubmit && !forecastStartDate}
                views={['year', 'month']}
                openTo="month"
                disabled={viewMode}
                variant="dialog"
                inputVariant="standard"
                helperText=""
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

        {!fromScenario && (
          <Box mt={5} mb={2}>
            <Box display="flex">
              <Typography
                variant="body2"
                className="config-count"
                color="textSecondary"
              >
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
        )}

        <CreateScenarioFooter
          backText={backText}
          nextText={nextText}
          onBack={onBack}
          onNext={this.handleNext}
        />
      </Box>
    );
  }
}

ConfigureScenario.propTypes = {
  backText: string,
  fromScenario: bool,
  handleNext: func.isRequired,
  nextText: string,
  onBack: func,
  scenarioInputs: shape({}),
  table: shape({}).isRequired,
  viewMode: bool,
};

ConfigureScenario.defaultProps = {
  backText: 'Back',
  nextText: 'Next',
  onBack: () => {},
  fromScenario: false,
  viewMode: false,
};

export default ConfigureScenario;
