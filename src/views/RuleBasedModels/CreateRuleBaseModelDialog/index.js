import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { bool, func, string } from 'prop-types';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import Spinner from '../../../components/Spinner';
import ImgRenderer from '../../../components/ImgRenderer';
import ListboxComponent from '../../../components/CustomListBox';
import CreateRBMLoader from '../../../components/ContentLoaders/CreateRBMLoader';

import { RULE_BASED_MODELS_API, API_URLS } from '../../../configs/api';
import { PRE_DEFINED_LABELS, RBM_DISPLAY_NAME } from '../../../configs/app';
import { APP_ROUTES } from '../../../configs/routes';
import {
  ERROR_MESSAGES,
  RULE_BASED_MODELS_MSG,
} from '../../../configs/messages';

import { validateName } from '../../../utils/helper/validateName';
import { showSuccessMsg } from '../../../utils/notifications';
import { httpPost, httpGet } from '../../../utils/http';

import { TEMPLATE_KEYS } from './configs';

import './styles.scss';

/**
 * Create Material Object Filter
 */
const filter = createFilterOptions();

/**
 * Default pagination
 */
const PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
};

const CreateRuleBaseModelDialog = ({
  isOpen,
  handleClose,
  showLoader,
  doneText,
  title,
}) => {
  const [templates, setTemplates] = useState([]);
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
  const [selectTemplate, setSelectTemplate] = useState(TEMPLATE_KEYS);
  const [isFetchingSce, setIsFetchingSce] = useState(false);
  const [scePagination] = useState({ ...PAGINATION });
  const [isLoading, setLoading] = useState(false);
  const [isLoader, setLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState('');
  const [name, setName] = useState('');

  const history = useHistory();

  /**
   * On click Create Button => Redirects to RBM setup Wizard if created
   */
  const onCreate = async e => {
    e.preventDefault();
    try {
      if (isLoading) return;

      setLoading(true);
      setSubmitted(true);

      if (validNameFunc()) {
        setLoading(false);

        return;
      }

      const url = RULE_BASED_MODELS_API.CREATE_NEW_RBM;

      const { id: scenarioId = '' } = scenario || {};

      const formData = {
        name,
        template_code: selectTemplate,
      };

      if (scenarioId) {
        formData.scenario_id = scenarioId;
      }

      const { data = {} } = await httpPost(url, formData);

      const { id } = data || {};

      setLoading(false);
      showSuccessMsg(RULE_BASED_MODELS_MSG.rule_based_model_created);

      if (!id) return;

      let route = APP_ROUTES.CREATE_RULE_BASED_MODEL;
      route += `?id=${id}&activeTab=0`;

      history.push(route);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  /**
   * validate name field with underscore
   */
  const validNameFunc = () => {
    if (!validateName(name)) {
      return !name ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name;
    }
    return '';
  };

  /**
   * Set Select Template
   */
  const handleSelectTemplate = opt => {
    setSelectTemplate(opt);
  };

  /**
   * Input Type Name Change Handler
   */
  const nameChangeHandler = ({ target: { value = '' } = {} }) => {
    setName(value);
  };

  /**
   * Handle Close Modal without data
   */
  const handleCloseRBM = () => {
    handleClose(false);
  };

  /**
   * Fetch Templates from API
   */
  const fetchTemplates = async () => {
    try {
      if (isFetchingTemplate) return;

      setLoader(true);
      setIsFetchingTemplate(true);

      const url = RULE_BASED_MODELS_API.GET_RBM_TEMPLATES;

      const { data = [] } = await httpGet(url);

      if (!data) return;

      setTemplates(data);
      setIsFetchingTemplate(false);
      setLoader(false);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Fetch Scenarios from API
   */
  const fetchScenarios = async () => {
    const { limit, page } = scePagination;

    if (isFetchingSce) return;

    setIsFetchingSce({ isFetchingSce: true });

    let url = API_URLS.GET_SCENARIO_LIST;
    url += `?limit=${limit}`;
    url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

    const {
      data: { data },
    } = await httpGet(url);

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

    setScenarios(list);
    setIsFetchingSce(false);
  };

  /**
   * Callback > fetch Scenarios
   */
  const fetchScenariosCallback = useCallback(fetchScenarios, []);

  /**
   * Callback > fetch Templates
   */
  const fetchTemplatesCallback = useCallback(fetchTemplates, []);

  /**
   * Load Data on Load Component
   */
  useEffect(() => {
    fetchScenariosCallback();
    fetchTemplatesCallback();
  }, [fetchScenariosCallback, fetchTemplatesCallback]);

  /**
   * Handle Scenario List changing Event
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  const handleScenarioChange = (evt, opt) => {
    const { option: scenario = {} } = opt || {};

    setScenario(scenario);
  };

  /**
   * Error showing on name validation
   *
   * @returns {string}
   */
  return (
    <>
      <Dialog
        className="customized-rename-human-capital-dialog"
        disableBackdropClick
        maxWidth="lg"
        fullWidth
        onClose={handleCloseRBM}
        open={isOpen}
      >
        {isLoading && <Spinner />}

        <form noValidate onSubmit={onCreate}>
          <DialogTitle id="customized-dialog-title" className="rbm-title">
            <Grid
              container
              direction="row"
              justify="space-between"
              alignItems="center"
            >
              <Box>{title}</Box>
              <Box mr={-1}>
                <IconButton onClick={handleCloseRBM}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Grid>
          </DialogTitle>

          <DialogContent>
            <Box mb={2} maxWidth={340}>
              <TextField
                name="newName"
                value={name}
                onChange={nameChangeHandler}
                required
                autoComplete="off"
                margin="dense"
                autoFocus
                variant="outlined"
                label="Name"
                fullWidth
                inputProps={{ maxLength: 50 }}
                error={submitted && Boolean(validNameFunc())}
                helperText={submitted && validNameFunc()}
              />
            </Box>

            {/* Scenario dropdown */}
            <Box mb={4} maxWidth={340}>
              <Autocomplete
                openOnFocus
                selectOnFocus
                clearOnBlur
                ListboxComponent={ListboxComponent}
                freeSolo
                value={{ label: scenario.display_name }}
                renderOption={({ label }) => label}
                onChange={handleScenarioChange}
                getOptionLabel={({ label = '' }) => label}
                getOptionDisabled={({ label, is_disabled }) =>
                  label == scenario.display_name || is_disabled
                }
                options={scenarios.map((sce, index) => ({
                  label: `${sce.display_name}`,
                  value: sce.id,
                  option: sce,
                  key: { index },
                }))}
                renderInput={params => (
                  <TextField
                    variant="outlined"
                    margin="dense"
                    {...params}
                    label=" Select Scenario (Optional)"
                  />
                )}
                filterOptions={(options, params) => {
                  return filter(options, params);
                }}
              />
            </Box>

            <Box mb={2}>
              <Typography variant="body1">Choose Template</Typography>
            </Box>
            <div style={{ padding: 8 }}>
              <Grid container spacing={4}>
                {templates.map((opt, index) => {
                  const { code: name = '' } = opt;

                  return (
                    <Grid item sm={12} md={6} key={index}>
                      <Box
                        className={`rule-template-box ${
                          selectTemplate == name ? 'active' : ''
                        }`}
                        display="flex"
                        alignItems="stretch"
                        borderRadius={6}
                        onClick={() => handleSelectTemplate(name)}
                      >
                        <Box
                          p={2}
                          mr={1}
                          minWidth={140}
                          minHeight={120}
                          alignItems="center"
                          justifyContent="center"
                          className="rule-template-icon"
                          display="flex"
                          style={{
                            borderTopLeftRadius: '6px',
                            borderBottomLeftRadius: '6px',
                          }}
                        >
                          <ImgRenderer
                            style={{ height: '66px' }}
                            src={opt.icon}
                            key={index}
                          />
                        </Box>

                        <Box
                          style={{
                            justifyContent: 'space-between',
                            padding: '20px 18px',
                          }}
                        >
                          <Typography variant="h6" gutterBottom>
                            {opt.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {opt.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}

                {isLoader && (
                  <Grid item sm={12} md={6}>
                    <Box display="flex" alignItems="stretch" borderRadius={6}>
                      <CreateRBMLoader />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </div>
          </DialogContent>
          <DialogActions style={{ padding: '31px' }}>
            <Box display="flex">
              <Box mr={1}>
                <Button
                  onClick={handleCloseRBM}
                  color="primary"
                  disabled={showLoader}
                >
                  Cancel
                </Button>
              </Box>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={showLoader}
              >
                {doneText}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

/**
 * propTypes of component
 */
CreateRuleBaseModelDialog.propTypes = {
  doneText: string.isRequired,
  handleClose: func.isRequired,
  isOpen: bool.isRequired,
  showLoader: bool.isRequired,
  title: string,
};

/**
 * defaultProps of component
 */
CreateRuleBaseModelDialog.defaultProps = {
  doneText: 'Create',
  title: `Create a New ${RBM_DISPLAY_NAME.label}`,
};

/**
 * Bind reducer with props and export component
 */
export default CreateRuleBaseModelDialog;
