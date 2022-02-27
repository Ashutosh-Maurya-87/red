import React from 'react';
import { withRouter } from 'react-router-dom';
import { func, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Box, Typography, TextField, Button } from '@material-ui/core';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import ListboxComponent from '../../../components/CustomListBox';
import Spinner from '../../../components/Spinner';
import AppHeader from '../../../components/AppHeader';

import { setSelectedTable } from '../../../reducers/Dimensions/actions';
import { getSelectedTable } from '../../../reducers/Dimensions/selectors';

import { AI_MODULES_DISPLAY_NAME } from '../../../configs/app';
import { API_URLS } from '../../../configs/api';
import { APP_ROUTES } from '../../../configs/routes';
import { ERROR_MESSAGES } from '../../../configs/messages';
import { MAX_DIMENSION_NAME } from '../EditDimension/configs';

import { httpPost } from '../../../utils/http';
import scrollTo from '../../../utils/helper/scrollTo';
import { showSuccessMsg, showErrorMsg } from '../../../utils/notifications';

import { getColumnValue } from '../../Scenarios/CreateScenario/helper';
import { getColumnsOfSourceTable } from '../../ProcessBuilder/CreateProcess/helper';

import { validateName } from '../../../utils/helper/validateName';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const filter = createFilterOptions();

class CreateDimension extends React.Component {
  /**
   * Default State
   */
  defaultState = {
    showLoader: false,
    isSubmit: false,

    tableData: {},
    tableColumns: [],

    name: '',
    errName: '',
    nameColumn: '',
    idColumn: '',

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
    this.loadInitialData();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    this.props.setSelectedTable({});
  }

  /**
   * Load Initial Data
   */
  loadInitialData = async () => {
    try {
      const { table, history } = this.props;

      if (!table.id) {
        history.push(APP_ROUTES.DIMENSIONS);
        return;
      }

      const { display_name = '', id } = table || {};
      const validName = display_name.substring(0, MAX_DIMENSION_NAME);

      this.setState({ showLoader: true });

      // Load Table Columns
      const {
        columns: tableColumns,
        tableData,
      } = await getColumnsOfSourceTable(id);

      this.setState({
        showLoader: false,
        name: validName,
        tableColumns,
        tableData,
      });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Handle Input Change > Dimension Name
   *
   * @param {Object}
   */
  onChangeName = ({ target: { value } }) => {
    const name = value.substring(0, MAX_DIMENSION_NAME);

    this.setState({ name, errName: '' });
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
   * Validate the name to show error
   */
  validateNameFun = () => {
    const { name } = this.state;

    if (!validateName(name)) {
      return !name ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name;
    }
    return '';
  };

  /**
   * Validate the current form fields value
   */
  validateFields = () => {
    const { name, idColumn, nameColumn } = this.state;

    this.setState({ isValidName: validateName(name) }, () => {
      if (!validateName(name)) {
        showErrorMsg(
          !name ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
        );
        this.setState({ showLoader: false });
        return false;
      }
      return '';
    });

    if (!name.trim() || !idColumn || !nameColumn) return true;

    return false;
  };

  /**
   * Handle Cancel Button Action
   */
  handleCancel = () => {
    logAmplitudeEvent('Cancel create dimension');
    this.props.history.push(APP_ROUTES.DIMENSIONS);
  };

  /**
   * Handle Create Button Action
   */
  handleCreate = () => {
    logAmplitudeEvent('Create dimension');

    this.setState({ isSubmit: true }, () => {
      if (this.validateFields()) {
        scrollTo('.Mui-error');
        return;
      }

      this.createDimension();
    });
  };

  /**
   * Create Dimension
   */
  createDimension = async () => {
    try {
      const { name, isValidName } = this.state;

      const { table } = this.props;

      if (!isValidName) return;

      const params = {
        type: 'custom',
        source_table_id: table.id,
        table_name: table.name,
        name,
      };

      const { data } = await httpPost(API_URLS.SAVE_DIMENSION, params);

      this.saveConfigs(data);
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Save Configs
   */
  saveConfigs = async dimension => {
    try {
      const params = this.getParamsToSaveConfigs();

      let url = API_URLS.SAVE_DIMENSION_CONFIGS;
      url = url.replace('#ID#', dimension.id);

      const { message = '' } = await httpPost(url, params);

      if (message) {
        showSuccessMsg(message);
      }

      // showSuccessMsg(DIMENSIONS_MSG.dimension_created);

      this.setState({ showLoader: false });

      const route = APP_ROUTES.EDIT_DIMENSION.replace(':id', dimension.id);
      this.props.history.push(route);
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
   * Render View
   */
  render() {
    const {
      showLoader,
      isSubmit,
      tableColumns,

      idColumn,
      nameColumn,
      name,
      errName,
    } = this.state;

    return (
      <>
        {showLoader && <Spinner />}

        <AppHeader header="" saveText="" cancelText="" />

        <Box px={3}>
          <Box className="configure-scenario">
            {showLoader && <Spinner />}

            <Box mt={5}>
              <Box display="flex">
                <Typography variant="body2" className="config-count">
                  1
                </Typography>
                <Typography variant="body1">
                  {`${AI_MODULES_DISPLAY_NAME.dimension} Name`}
                </Typography>
              </Box>
              <Box display="flex" pl={4} pt={2}>
                <TextField
                  style={{ width: 300 }}
                  name="name"
                  value={name}
                  onChange={this.onChangeName}
                  required
                  autoComplete="off"
                  autoFocus
                  fullWidth
                  placeholder={`${AI_MODULES_DISPLAY_NAME.dimension} Name`}
                  error={
                    isSubmit && (this.validateNameFun() || Boolean(errName))
                  }
                  helperText={isSubmit && this.validateNameFun()}
                />
              </Box>
            </Box>

            <Box mt={5}>
              <Box display="flex">
                <Typography variant="body2" className="config-count">
                  2
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
                  3
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

            <Box ml={4} my={5} display="flex" alignItems="center">
              <Box mr={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={this.handleCancel}
                >
                  cancel
                </Button>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleCreate}
              >
                Create
              </Button>
            </Box>
          </Box>
        </Box>
      </>
    );
  }
}

CreateDimension.propTypes = {
  setSelectedTable: func.isRequired,
  table: shape({}).isRequired,
};

CreateDimension.defaultProps = {};

const mapStateToProps = createStructuredSelector({
  table: getSelectedTable(),
});

export default connect(mapStateToProps, { setSelectedTable })(
  withRouter(CreateDimension)
);
