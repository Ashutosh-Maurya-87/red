import React from 'react';
import { Prompt } from 'react-router-dom';
import { get } from 'lodash';

import { Box, Button, TextField, Typography } from '@material-ui/core';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import AppHeader from '../../../components/AppHeader';
import Spinner from '../../../components/Spinner';
import ListboxComponent from '../../../components/CustomListBox';
import UnsavedChangesBase from '../../../components/UnsavedChangesDialog/base';

import { MAX_MODEL_NAME, FORECASTING_YEARS } from './configs';
import { APP_ROUTES } from '../../../configs/routes';
import { API_URLS, MODELS_API } from '../../../configs/api';
import {
  MODELS_MSG,
  ERROR_MESSAGES,
  BETA_MSG,
} from '../../../configs/messages';
import { PRE_DEFINED_LABELS } from '../../../configs/app';

import { getParamsToCreateModel } from './helper';
import { getFormattedModelsList } from '../ModelsList/helper';
import { showErrorMsg, showSuccessMsg } from '../../../utils/notifications';
import { httpGet, httpPost } from '../../../utils/http';
import UnsavedChangesDialog from '../../../components/UnsavedChangesDialog';
import { validateName } from '../../../utils/helper/validateName';

const filter = createFilterOptions();

const PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
};

class CreateModel extends UnsavedChangesBase {
  /**
   * State
   */
  state = {
    isVisibleUnsavedChanges: false,
    isUnsavedChanges: false,

    isFetchingModels: false,
    isFetchingSce: false,
    isFetchingModelList: false,
    isFetching: false,
    isSaving: false,
    isSubmit: false,
    isDuplicate: false,

    copyFromName: '',
    copyFromId: '',
    modelName: '',
    scenario: '',
    scenarioId: '',
    startingYear: '',
    forecastingFor: `${FORECASTING_YEARS[0]} Year`,

    startingYears: [],

    modelsList: [],
    modelsPagination: { ...PAGINATION },
    modelSearch: '',

    scenarios: [],
    scePagination: { ...PAGINATION },
    sceSearch: '',

    isValidName: true,
  };

  /**
   * Cancel Http
   */
  cancelSearchSceHttp = null;

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { match } = this.props;
    const id = get(match, 'params.id') || '';

    this.setState({ copyFromId: id, isDuplicate: Boolean(id) }, () => {
      if (this.state.isDuplicate) {
        this.fetchSingleModel(id, this.fetchModelsList);
      }

      this.fetchScenarios();
    });

    this.subscribeConfirmLeavePage();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    this.unsubscribeConfirmLeavePage();
  }

  /**
   * Verify > Has Unsaved Changes
   *
   * @return {Boolean}
   */
  hasUnsavedChanges = () => {
    return this.state.isUnsavedChanges;
  };

  /**
   * Handle Cancel
   */
  handleCancel = () => {
    this.props.history.push(APP_ROUTES.MODELS_LIST);
  };

  /**
   * Handle Create
   */
  handleCreate = () => {
    this.setState({ isSubmit: true }, this.creatingModel);
  };

  /**
   * Validate Inputs
   *
   * @return {Boolean}
   */
  validateInputs = () => {
    const {
      isDuplicate,
      copyFromId,

      modelName,
      scenario,
      startingYear,
      forecastingFor,
      isValidName,
    } = this.state;
    let validDuuplicate = true;
    if (isDuplicate && !copyFromId) validDuuplicate = false;

    this.setState({ isValidName: validateName(modelName) });

    if (!modelName) {
      showErrorMsg(
        !modelName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
      );

      return false;
    }

    if (
      modelName &&
      scenario &&
      startingYear &&
      forecastingFor &&
      isValidName &&
      validDuuplicate
    ) {
      return true;
    }

    return false;
  };

  /**
   * Creating Model in API
   */
  creatingModel = async () => {
    if (!this.validateInputs()) return;

    try {
      this.setState({ isSaving: this.validateInputs ? true : false });

      const params = getParamsToCreateModel(this.state);

      const { isDuplicate } = this.state;

      const url = isDuplicate
        ? MODELS_API.DUPLICATE_WORKBOOK.replace('#ID#', this.state.copyFromId)
        : MODELS_API.CREATE_WORKBOOK;

      const { data } = await httpPost(url, params);

      showSuccessMsg(MODELS_MSG.model_created);

      this.setState({ isUnsavedChanges: false }, () => {
        const route = APP_ROUTES.MODELS_WORKBOOK.replace(':id', data.id);
        this.props.history.push(route);
      });
    } catch (e) {
      console.error(e);
      this.setState({ isSaving: false });
    }
  };

  /**
   * Fetch single model by ID
   */
  fetchSingleModel = async (id, callback) => {
    try {
      // Loading Workbook
      const getWorkBookUrl = MODELS_API.GET_WORKBOOK.replace('#ID#', id);
      const { data } = await httpGet(getWorkBookUrl);
      const {
        name = '',
        number_of_forecast_years = '',
        scenario_id = '',
        start_year = '',
      } = data;

      this.setState(
        {
          modelsList: [{ ...data }],
          copyFromName: name,
          modelName: `Copy of ${name}`,
          forecastingFor: `${number_of_forecast_years} Year${
            number_of_forecast_years > 1 ? 's' : ''
          }`,
          scenarioId: scenario_id,
          startingYear: start_year,
        },
        () => callback()
      );
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Fetch List of Models from API
   */
  fetchModelsList = async () => {
    try {
      const {
        modelSearch,
        isFetchingModelList,
        modelsPagination,
        modelsList,
        showArchived,
      } = this.state;

      if (isFetchingModelList) return;

      const { limit, page } = modelsPagination;

      this.setState({ isFetchingModelList: true });

      let url = MODELS_API.GET_WORKBOOKS;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (modelSearch) url += `&search=${modelSearch}`;
      if (showArchived) url += `&is_archived=1`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const sanitizedData = getFormattedModelsList(data);

      const list =
        page == 1 ? sanitizedData : [...modelsList, ...sanitizedData];

      this.setState({
        isFetchingModelList: false,
        modelsList: list,
        modelsPagination: {
          ...modelsPagination,
          total: count,
        },
      });
    } catch (e) {
      console.error(e);
      const { modelsPagination } = this.state;

      this.setState({
        isFetchingModelList: false,
        modelsPagination: {
          ...modelsPagination,
          page: modelsPagination.page == 1 ? 1 : modelsPagination.page - 1,
        },
      });
    }
  };

  /**
   * Load more Models List
   */
  loadMoreModelsList = () => {
    const { modelsPagination, isFetchingModelList, modelsList } = this.state;

    if (isFetchingModelList || modelsPagination.total <= modelsList.length)
      return;

    this.setState(
      {
        modelsPagination: {
          ...modelsPagination,
          page: modelsPagination.page + 1,
        },
      },
      this.fetchModelsList
    );
  };

  /**
   * Fetch Scenarios from API
   */
  fetchScenarios = async ({ callback } = {}) => {
    try {
      const {
        sceSearch,
        isFetchingSce,
        scePagination,
        scenarios,
        isDuplicate,
        copyFromId,
      } = this.state;
      const { limit, page } = scePagination;

      if (isFetchingSce) return;

      this.setState({ isFetchingSce: true });

      let url = API_URLS.GET_SCENARIO_LIST;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (sceSearch) url += `&search=${sceSearch}`;

      if (isDuplicate) url += `&model_id=${copyFromId}`;

      const cancelSearchHttp = func => {
        this.cancelSearchSceHttp = func;
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
            display_name: name || '<No Name>',
          };
        });
      }

      // Remove actuals from list
      updatedData = updatedData.filter(
        ({ label = '' }) => label != PRE_DEFINED_LABELS.actuals.label
      );

      const list = page == 1 ? updatedData : [...scenarios, ...updatedData];

      const { scenarioId } = this.state;

      const state = {};
      if (scenarioId) {
        const selectedScenario = list.filter(({ id }) => id == scenarioId);
        if (selectedScenario.length > 0) {
          state.scenario = selectedScenario[0];
          this.fetchActualYears(state.scenario.id);
        }
      }

      this.setState({
        ...state,
        scenarios: list,
        isFetchingSce: false,
        scePagination: {
          ...scePagination,
          total: count,
        },
      });

      if (callback) callback();
    } catch (e) {
      const { scePagination } = this.state;

      this.setState({
        isFetchingSce: false,
        scePagination: {
          ...scePagination,
          page: scePagination.page == 1 ? 1 : scePagination.page - 1,
        },
      });
    }
  };

  /**
   * Load more Scenarios
   */
  loadMoreScenarios = () => {
    const { scePagination, isFetchingSce, scenarios } = this.state;

    if (isFetchingSce || scePagination.total <= scenarios.length) return;

    this.setState(
      {
        scePagination: {
          ...scePagination,
          page: scePagination.page + 1,
        },
      },
      this.fetchScenarios
    );
  };

  /**
   * Fetch Actual Years of Scenarios
   *
   * @param {String|Number} scenarioId
   */
  fetchActualYears = async scenarioId => {
    try {
      if (!scenarioId) return;

      this.setState({ isFetching: true });

      const url = MODELS_API.SCENARIO_ACTUAL_YEARS.replace('#ID#', scenarioId);
      const { data } = await httpGet(url);

      // Filter years array in asc order
      const sorrtedData = data.sort((a, b) => {
        if (a < b) return -1;

        return 0;
      });

      const startingYears = (sorrtedData || []).filter(Boolean).map(String);
      const [startingYear = ''] = startingYears;

      if (this.state.startingYear) {
        this.setState({
          isFetching: false,
          startingYears,
        });

        return;
      }
      this.setState({
        isFetching: false,
        startingYears,
        startingYear,
      });
    } catch (e) {
      console.error(e);

      this.setState({
        isFetching: false,
        startingYears: [],
        startingYear: '',
      });
    }
  };

  /**
   * Identify and open Unsaved changes popup
   */
  identifyUnsavedChanges = () => {
    const { isUnsavedChanges } = this.state;
    if (!isUnsavedChanges) this.setState({ isUnsavedChanges: true });
  };

  /**
   * Handle model Name input
   *
   * @param {Object} evt
   */
  handleModelName = evt => {
    this.identifyUnsavedChanges();

    let { value: modelName } = evt.target;
    modelName = modelName.trimStart().substring(0, MAX_MODEL_NAME);

    this.setState({ modelName });
  };

  /**
   * Error showing on name validation
   *
   * @returns {string}
   */
  validNameFunc = () => {
    const { modelName } = this.state;

    if (!validateName(modelName)) {
      return !modelName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name;
    }
    return '';
  };

  /**
   * Handle model List changing Event
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  handleModelList = (evt, opt) => {
    this.identifyUnsavedChanges();

    const { option: model = {} } = opt || {};
    const { name, id } = model || {};
    const copyFromName = name.trimStart().substring(0, MAX_MODEL_NAME);

    this.setState(
      {
        copyFromName,
        copyFromId: id,
        modelName: `Copy of ${copyFromName}`,
      },
      () => {
        this.fetchScenarios();
      }
    );
  };

  /**
   * Handle Scenario List changing Event
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  handleScenarioChange = (evt, opt) => {
    this.identifyUnsavedChanges();

    const { option: scenario = {} } = opt || {};
    this.fetchActualYears(scenario.id);
    this.setState({ scenario });
  };

  /**
   * Handle Starting Year List changing Event
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  handleStartingYearChange = (evt, opt) => {
    this.identifyUnsavedChanges();

    const { label: startingYear = '' } = opt || {};
    this.setState({ startingYear });
  };

  /**
   * Handle forecasting Year List changing Event
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  handleForecastingForChange = (evt, opt) => {
    this.identifyUnsavedChanges();

    const { label: forecastingFor = '' } = opt || {};
    this.setState({ forecastingFor });
  };

  /**
   * Render View
   */
  render() {
    const {
      isVisibleUnsavedChanges,
      isFetching,
      isSaving,
      isSubmit,
      isDuplicate,

      copyFromName,
      modelName,
      scenario,
      startingYear,
      forecastingFor,

      startingYears,
      modelsList,
      scenarios,
    } = this.state;

    return (
      <>
        <Prompt when message={this.handleBlockedNavigation} />

        {isVisibleUnsavedChanges && (
          <UnsavedChangesDialog handleUnsavedConf={this.handleUnsavedConf} />
        )}

        {(isFetching || isSaving) && <Spinner />}

        <AppHeader
          header={`${
            isDuplicate ? `Copy from ${copyFromName}` : 'Create New Model'
          }`}
          isBetaEnabled={true}
          betaMsg={BETA_MSG.modeling_beta_msg}
        />

        <Box px={3} className="configure-model" width="400px">
          {isDuplicate && (
            <Box mt={4}>
              <Box display="flex">
                <Typography
                  variant="body2"
                  className="config-count"
                  color="textSecondary"
                >
                  1
                </Typography>
                <Typography variant="body1">
                  Select the Source for Model
                </Typography>
              </Box>
              <Box display="flex" pl={4} pt={2}>
                <Autocomplete
                  fullWidth
                  value={{ label: copyFromName }}
                  openOnFocus
                  selectOnFocus
                  clearOnBlur
                  freeSolo
                  ListboxComponent={ListboxComponent}
                  handleHomeEndKeys
                  renderOption={({ label }) => label}
                  onChange={this.handleModelList}
                  getOptionLabel={({ label = '' }) => label}
                  getOptionDisabled={({ label }) => label == copyFromName}
                  options={modelsList.map(mdl => ({
                    label: mdl.name,
                    option: mdl,
                  }))}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Select Model"
                      placeholder="Select Model"
                      error={isSubmit && !copyFromName}
                    />
                  )}
                  filterOptions={(options, params) => {
                    return filter(options, params);
                  }}
                  ListboxProps={{
                    state: this.state,
                    loadMoreTables: this.loadMoreModelsList,
                  }}
                />
              </Box>
            </Box>
          )}

          <Box mt={4}>
            <Box display="flex">
              <Typography
                variant="body2"
                className="config-count"
                color="textSecondary"
              >
                {isDuplicate ? 2 : 1}
              </Typography>
              <Typography variant="body1">Name your Model</Typography>
            </Box>
            <Box display="flex" pl={4} pt={2}>
              <TextField
                size="small"
                name="modelName"
                value={modelName}
                onChange={this.handleModelName}
                autoComplete="off"
                fullWidth
                label="Model Name"
                placeholder="Model Name"
                error={isSubmit && this.validNameFunc()}
                helperText={isSubmit && this.validNameFunc()}
              />
            </Box>
          </Box>

          <Box mt={4}>
            <Box display="flex">
              <Typography
                variant="body2"
                className="config-count"
                color="textSecondary"
              >
                {isDuplicate ? 3 : 2}
              </Typography>
              <Typography variant="body1">
                Select the scenario for Model
              </Typography>
            </Box>
            <Box display="flex" pl={4} pt={2}>
              <Autocomplete
                fullWidth
                value={{ label: scenario.display_name }}
                openOnFocus
                selectOnFocus
                clearOnBlur
                freeSolo
                ListboxComponent={ListboxComponent}
                handleHomeEndKeys
                renderOption={({ label }) => label}
                onChange={this.handleScenarioChange}
                getOptionLabel={({ label = '' }) => label}
                getOptionDisabled={({ label, is_disabled }) =>
                  label == scenario.display_name || is_disabled
                }
                options={scenarios.map(sce => ({
                  label: `${sce.display_name}`,
                  value: sce.id,
                  option: sce,
                }))}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Select Scenario"
                    placeholder="Select Scenario"
                    error={isSubmit && !scenario.display_name}
                  />
                )}
                filterOptions={(options, params) => {
                  return filter(options, params);
                }}
              />
            </Box>
          </Box>

          <Box mt={4}>
            <Box display="flex">
              <Typography
                variant="body2"
                className="config-count"
                color="textSecondary"
              >
                {isDuplicate ? 4 : 3}
              </Typography>
              <Typography variant="body1">
                Select the starting period for Model
              </Typography>
            </Box>
            <Box display="flex" pl={4} pt={2} justifyContent="space-between">
              <Autocomplete
                style={{ width: '45%' }}
                value={{ label: String(startingYear) }}
                openOnFocus
                selectOnFocus
                clearOnBlur
                freeSolo
                ListboxComponent={ListboxComponent}
                handleHomeEndKeys
                renderOption={({ label }) => label}
                onChange={this.handleStartingYearChange}
                getOptionLabel={({ label = '' }) => label}
                getOptionDisabled={({ label }) => label == startingYear}
                options={startingYears.map(y => ({ label: y }))}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Starting Year"
                    placeholder="Starting Year"
                    error={isSubmit && !startingYear}
                  />
                )}
                filterOptions={(options, params) => {
                  return filter(options, params);
                }}
              />
              <Autocomplete
                style={{ width: '45%' }}
                value={{ label: forecastingFor }}
                openOnFocus
                selectOnFocus
                clearOnBlur
                freeSolo
                ListboxComponent={ListboxComponent}
                handleHomeEndKeys
                renderOption={({ label }) => label}
                onChange={this.handleForecastingForChange}
                getOptionLabel={({ label = '' }) => label}
                getOptionDisabled={({ label }) => label == forecastingFor}
                options={FORECASTING_YEARS.map(y => ({
                  label: `${y} Year${y > 1 ? 's' : ''}`,
                  value: y,
                }))}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Forecasting For"
                    placeholder="Forecasting For"
                    error={isSubmit && !forecastingFor}
                  />
                )}
                filterOptions={(options, params) => {
                  return filter(options, params);
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box pt={5} px={4} mb={4}>
          <Box component="span" mr={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={this.handleCancel}
            >
              Cancel
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
      </>
    );
  }
}

CreateModel.propTypes = {};

CreateModel.defaultProps = {};

export default CreateModel;
