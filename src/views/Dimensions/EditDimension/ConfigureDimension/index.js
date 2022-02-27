import React from 'react';
import { shape, func } from 'prop-types';
import moment from 'moment';

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@material-ui/core';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import { Event as CalendarIcon } from '@material-ui/icons';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import ListboxComponent from '../../../../components/CustomListBox';
import Spinner from '../../../../components/Spinner';

import { API_URLS } from '../../../../configs/api';
import { DIMENSIONS_MSG } from '../../../../configs/messages';

import { httpPost, httpPut } from '../../../../utils/http';
import scrollTo from '../../../../utils/helper/scrollTo';
import { showSuccessMsg } from '../../../../utils/notifications';

import { getColumnValue } from '../../../Scenarios/CreateScenario/helper';
import { getColumnsOfSourceTable } from '../../../ProcessBuilder/CreateProcess/helper';

import { TYPES } from '../configs';

const filter = createFilterOptions();

class ConfigureDimension extends React.Component {
  /**
   * Default State
   */
  defaultState = {
    showLoader: false,

    tableData: {},
    tableColumns: [],

    isSubmit: false,
    nameColumn: '',
    idColumn: '',

    fiscalYear: '',
    fiscalMonth: '',
  };

  /**
   * State
   */
  state = { ...this.defaultState, timeDimension: this.props };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fillInitialData();
  }

  /**
   * Fill Initial Data
   */
  fillInitialData = async () => {
    const {
      table: {
        dimension_meta: { current_month = '', fiscal_year = '' },
        source_table_id,
        dimension_name_col,
        dimension_identifier_col,
      },
    } = this.props;

    this.setState({
      fiscalMonth: moment(current_month, 'MM-YYYY').format('MMM YYYY'),
      fiscalYear: moment(fiscal_year, 'MM-YYYY').format('MMM YYYY'),
    });

    if (!source_table_id) return;

    this.setState({ showLoader: true });

    // Load table columns
    const { columns: tableColumns, tableData } = await getColumnsOfSourceTable(
      source_table_id
    );

    // Fill Values
    // Implement `If` instead of `switch` due to same column name for both fields
    let { nameColumn, idColumn } = this.state;
    tableColumns.forEach(({ name, display_name }) => {
      if (!nameColumn && name == dimension_name_col) {
        nameColumn = display_name;
      }

      if (!idColumn && name == dimension_identifier_col) {
        idColumn = display_name;
      }
    });

    this.setState({
      showLoader: false,
      tableData,
      tableColumns,
      nameColumn,
      idColumn,
    });
  };

  /**
   * Handle > On Change Select
   *
   * @param {String} name
   * @param {Object} option
   */
  handleOnChangeSelect = name => (evt, option) => {
    const { label = '' } = option || {};

    this.setState({ [name]: label });
  };

  /**
   * Validate the current form fields value
   */
  validateFields = () => {
    const { idColumn, nameColumn } = this.state;

    if (!idColumn || !nameColumn) return true;

    return false;
  };

  /**
   * Handle Save Button Action
   */
  handleSave = () => {
    const {
      timeDimension: { type = '' },
    } = this.state;
    if (type == TYPES[2]) return this.timeDimeSave();

    this.setState({ isSubmit: true }, () => {
      if (this.validateFields()) {
        scrollTo('.Mui-error');
        return;
      }

      this.saveConfigs();
    });

    return null;
  };

  /**
   * Save Configs
   */
  saveConfigs = async () => {
    try {
      this.setState({ showLoader: true });

      const params = this.getParamsToSaveConfigs();

      let url = API_URLS.SAVE_DIMENSION_CONFIGS;
      url = url.replace('#ID#', this.props.table.id);

      const { message = '' } = await httpPost(url, params);

      if (message) {
        showSuccessMsg(message);
      }

      // showSuccessMsg(DIMENSIONS_MSG.configs_saved);

      this.setState({ showLoader: false });
      this.props.updateTable(params);
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Get Formatted Params to Save Configs
   *
   * @return {Object}
   */
  getParamsToSaveConfigs = () => {
    const { tableColumns, idColumn, nameColumn } = this.state;

    const dimension_identifier_col = getColumnValue(tableColumns, idColumn);
    const dimension_name_col = getColumnValue(tableColumns, nameColumn);

    const params = {
      dimension_identifier_col,
      dimension_name_col,
    };

    return params;
  };

  /**
   * Select Year
   *
   * @param {String}
   */
  handleOnChangeYear = async year => {
    this.setState({
      fiscalYear: year.format('MMM YYYY'),
    });
  };

  /**
   * Select Month
   *
   * @param {String}
   */
  handleOnChangeMonth = async month => {
    this.setState({ fiscalMonth: month.format('MMM YYYY') });
  };

  /**
   * Updating time dimension configuration(update fiscal Year & Month)
   *
   */
  timeDimeSave = async () => {
    try {
      const { fiscalYear, fiscalMonth } = this.state;

      if (!fiscalMonth && !fiscalYear) return;

      this.setState({ showLoader: true });

      const formData = {
        fiscal_year: moment(fiscalYear, 'MMM YYYY').format('MM-YYYY'),
        current_month: moment(fiscalMonth, 'MMM YYYY').format('MM-YYYY'),
      };

      const url = API_URLS.TIME_DIMENSION_UPDATE;
      const { message = '', data = {} } = await httpPut(url, formData);

      this.props.onTimeDimensionUpdate(data);
      showSuccessMsg(message);
      this.setState({ showLoader: false });
    } catch (error) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const {
      showLoader,
      isSubmit,
      tableColumns,

      idColumn,
      nameColumn,

      timeDimension: { type = '' },
      fiscalYear,
      fiscalMonth,
    } = this.state;

    const year = moment().format('YYYY');

    return (
      <>
        {showLoader && <Spinner />}

        <Box className="configure-scenario">
          {type == TYPES[2] && (
            <Box px={2} py={1} display="flex" flexDirection="column">
              <Box mt={5}>
                <Box display="flex">
                  <Typography variant="body2" className="config-count">
                    1
                  </Typography>
                  <Typography variant="body1">
                    When did your fiscal {moment().format('YYYY')} begin?
                  </Typography>
                </Box>
                <Box display="flex" pl={4} pt={2}>
                  <MuiPickersUtilsProvider utils={MomentUtils}>
                    <DatePicker
                      autoOk
                      name="fiscalYear"
                      id="fiscal-year"
                      size="small"
                      openTo="year"
                      style={{ width: 300 }}
                      value={fiscalYear && moment(fiscalYear)}
                      onChange={this.handleOnChangeYear}
                      minDate={new Date(`2020-01-01`)}
                      maxDate={new Date(`${year}-12-31`)}
                      error={!fiscalYear}
                      helperText={
                        !fiscalYear ? DIMENSIONS_MSG.select_year : null
                      }
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
                    2
                  </Typography>
                  <Typography variant="body1">
                    Select your Current Month?
                  </Typography>
                </Box>
                <Box display="flex" pl={4} pt={2}>
                  <MuiPickersUtilsProvider utils={MomentUtils}>
                    <DatePicker
                      autoOk
                      name="fiscalMonth"
                      id="fiscal-id"
                      size="small"
                      style={{ width: 300 }}
                      openTo="month"
                      value={fiscalMonth && moment(fiscalMonth)}
                      onChange={this.handleOnChangeMonth}
                      minDate={new Date(`2020-01-01`)}
                      maxDate={new Date(`${year}-12-31`)}
                      error={!fiscalMonth}
                      helperText={
                        !fiscalMonth ? DIMENSIONS_MSG.select_month : null
                      }
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
            </Box>
          )}

          {type == TYPES[0] && (
            <>
              <Box mt={5}>
                <Box display="flex">
                  <Typography variant="body2" className="config-count">
                    1
                  </Typography>
                  <Typography variant="body1">
                    Select Name column from table
                  </Typography>
                </Box>

                <Box display="flex" pl={4} pt={2}>
                  <Autocomplete
                    id="nameColumn"
                    style={{ width: 300 }}
                    value={{ label: nameColumn }}
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
                    renderOption={({ label }) => label}
                    onChange={this.handleOnChangeSelect('nameColumn')}
                    getOptionLabel={({ label = '' }) => label}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Select Name Column"
                        placeholder="Name Column"
                        error={isSubmit && !nameColumn}
                      />
                    )}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);

                      return filtered;
                    }}
                    // getOptionDisabled={({ label }) => label === idColumn}
                  />
                </Box>
              </Box>

              <Box mt={5}>
                <Box display="flex">
                  <Typography variant="body2" className="config-count">
                    2
                  </Typography>
                  <Typography variant="body1">
                    Select ID column from table
                  </Typography>
                </Box>
                <Box display="flex" pl={4} pt={2}>
                  <Autocomplete
                    id="idColumn"
                    style={{ width: 300 }}
                    value={{ label: idColumn }}
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
                    renderOption={({ label }) => label}
                    onChange={this.handleOnChangeSelect('idColumn')}
                    getOptionLabel={({ label = '' }) => label}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Select ID Column"
                        placeholder="ID Column"
                        error={isSubmit && !idColumn}
                      />
                    )}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);

                      return filtered;
                    }}
                    // getOptionDisabled={({ label }) => label === nameColumn}
                  />
                </Box>
              </Box>
            </>
          )}
          <Box ml={4} my={5}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleSave}
            >
              Save
            </Button>
          </Box>
        </Box>
      </>
    );
  }
}

ConfigureDimension.propTypes = {
  inputs: shape({}),
  onTimeDimensionUpdate: func,
  table: shape({}).isRequired,
  updateTable: func.isRequired,
};

ConfigureDimension.defaultProps = {
  inputs: {},
};

export default ConfigureDimension;
