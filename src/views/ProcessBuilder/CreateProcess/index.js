import React from 'react';
import { withRouter } from 'react-router-dom';
import { func } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { get, debounce } from 'lodash';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Grid, Typography, Link } from '@material-ui/core';

import AppHeader from '../../../components/AppHeader';
import UploadLoader from '../../../components/UploadLoader';
import Spinner from '../../../components/Spinner';
import ProcessStepIcon from './ProcessStepIcon';
import ProcessBuilderStepCard from './StepCard';
import CreateProcessMenus from './Menus';
import EditProcessNameHeader from './EditProcessNameHeader';
import RenameProcessModal from '../RenameProcessModal';
import ProcessHeaderActions from './HeaderActions';

import { STEP_STRUCTURE } from '../../../reducers/ProcessBuilder/constants';
import { clearData } from '../../../reducers/ProcessBuilder/actions';

import { PROCESS_STATUS, PROCESS_EXECUTION_TYPES } from './configs';
import { API_URLS } from '../../../configs/api';
import { APP_ROUTES } from '../../../configs/routes';
import { PROCESS_MANAGER_MSG } from '../../../configs/messages';

import { showSuccessMsg, showErrorMsg } from '../../../utils/notifications';
import { httpPost, httpGet } from '../../../utils/http';
import scrollTo from '../../../utils/helper/scrollTo';
import {
  getParamsToSaveProcess,
  getParamsToRunProcess,
  insertTaskIdIntoSteps,
  isExecutionMode,
  getStatusForSync,
} from './helper';
import {
  getFilledStepsDataForEditMode,
  getSelectedSteps,
} from './fill-edit-data';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

class CreateProcess extends React.Component {
  /**
   * Batch ID of Process
   */
  batchId;

  /**
   * Default States
   */
  defaultState = {
    name: `New Process`,

    isSaving: false,
    isRunning: false,
    isFetching: get(this.props, 'match.params.id') ? true : false,
    isEditMode: false,
    isSaveAsModal: false,
    isSelectionEnable: false,
    isFinishing: false,
    isCancelingProcess: false,
    showStatusCard: false,

    processId: '',
    processStatus: '',
    lastRunAt: '',

    isStepByStep: false,
    queuedTasks: [],
    toggle: false,
    isBlockDone: false,
  };

  /**
   * State
   */
  state = {
    ...this.defaultState,
  };

  /**
   * All Steps Data
   */
  steps = [];

  /**
   * Fetch Process Status Timer
   */
  statusTimer;

  /**
   * Set Steps Data
   *
   * @param {Array} steps
   */
  setSteps = steps => {
    this.steps = steps;
    this.setState({ toggle: !this.state.toggle });
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fetchProcessSteps();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    this.props.clearData();

    if (this.statusTimer) clearInterval(this.statusTimer);
  }

  /**
   * Fetching Process With steps
   */
  fetchProcessSteps = data => {
    const processId = get(this.props, 'match.params.id') || '';

    const { clearData } = this.props;

    if (this.steps.length > 0) {
      clearData();
      this.steps = [];
    }

    if (data && !processId) {
      this.setState({ isEditMode: true }, this.fetchProcessById);
    }

    if (processId) {
      this.setState({ processId, isEditMode: true }, this.fetchProcessById);
    }
  };

  /**
   * Go To Specific Route
   *
   * @param {String} route
   */
  goToRoute = route => {
    this.props.history.push(route);
  };

  /**
   * Update Process Name received from Modal
   *
   * @param {String} name
   */
  updateProcessName = name => {
    this.setState({ name });
  };

  /**
   * Set|Clear Interval to fetch status of Process execution
   *
   * @param {String} status [Process Status]
   */
  syncStatusInterval = status => {
    if (status == PROCESS_STATUS.QUEUED || status == PROCESS_STATUS.RUNNING) {
      if (this.statusTimer) return;

      this.statusTimer = setInterval(this.fetchAndSyncProcessStatus, 5000);
      return;
    }

    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
  };

  /**
   * Fetch Process Data by ID
   */
  fetchProcessById = async () => {
    try {
      const { processId } = this.state;
      this.setState({ isFetching: true });

      const url = API_URLS.GET_PROCESS_BY_ID.replace('#ID#', processId);
      const { data = {} } = await httpGet(url);

      const { steps, status, last_run_at } = getFilledStepsDataForEditMode(
        data
      );

      this.setState({
        isFetching: false,
        name: data.name,
        processStatus: status,
        lastRunAt: last_run_at,
        isStepByStep: data.execution_type == PROCESS_EXECUTION_TYPES.oneByOne,
        queuedTasks: data.queued_tasks || [],
        showStatusCard:
          status == PROCESS_STATUS.COMPLETED ||
          status == PROCESS_STATUS.FAILED ||
          status == PROCESS_STATUS.CANCELLED,
      });

      this.batchId = data.batch;
      this.setSteps(steps);

      this.syncStatusInterval(data.status);
    } catch (e) {
      this.setState({ isFetching: false });
    }
  };

  /**
   * Fetch Process status  by Process ID and Sync status
   */
  fetchAndSyncProcessStatus = async isFinish => {
    try {
      const { isFinishing, processId, isStepByStep } = this.state;
      const { history = '' } = this.props;
      const { location: { pathname = '' } = {} } = history || {};

      if (!processId || isFinishing || !this.batchId) return;

      if (isFinish === true) this.setState({ isFinishing: true });

      let url = API_URLS.GET_PROCESS_STATUS.replace('#ID#', processId);
      url += `?batch_number=${this.batchId}`;

      const { data = [] } = await httpGet(url, { hideError: true });

      let status = '';
      let lastCompleted;
      let queuedTasks;

      this.steps.map((step, i) => {
        step.runNext = false;
        step.showPreview = false;
        step.failed_reason = '';

        data.forEach(statusObj => {
          if (step.id == statusObj.task_id) {
            step.failed_reason = statusObj.failed_reason;
            step.status = statusObj.status || '';
            step.message = statusObj.messages || '';

            queuedTasks = statusObj.queued_tasks || [];

            if (statusObj.status == PROCESS_STATUS.COMPLETED) {
              lastCompleted = i;
            }

            if (status) return;

            // Sync Process status with internal tasks
            status = getStatusForSync(statusObj.status);
          }
        });

        return step;
      });

      if (!queuedTasks) queuedTasks = [];

      // Mark Run Next
      if (
        isStepByStep &&
        !status &&
        lastCompleted != undefined &&
        lastCompleted != this.steps.length - 1 &&
        queuedTasks.length > 0
      ) {
        this.steps[lastCompleted].runNext = true;
      }

      // Show Preview
      if (lastCompleted != undefined && !status) {
        this.steps[lastCompleted].showPreview = true;
      }

      if (!status) {
        status = isFinish ? PROCESS_STATUS.CREATED : PROCESS_STATUS.COMPLETED;
      }

      if (lastCompleted == this.steps.length - 1) {
        status = PROCESS_STATUS.COMPLETED;
      }

      if (queuedTasks.length > 0 && status != PROCESS_STATUS.FAILED) {
        status = PROCESS_STATUS.QUEUED;
      }

      this.setState({
        processStatus: status || PROCESS_STATUS.CREATED,
        queuedTasks,
        isFinishing: false,
        showStatusCard:
          status == PROCESS_STATUS.COMPLETED ||
          status == PROCESS_STATUS.FAILED ||
          status == PROCESS_STATUS.CANCELLED,
      });

      this.setSteps(this.steps);
      this.syncStatusInterval(status);

      if (
        APP_ROUTES.CREATE_PROCESS == pathname &&
        status == PROCESS_STATUS.COMPLETED
      ) {
        history.push(APP_ROUTES.EDIT_PROCESS.replace(':id', processId));
      }

      if (isFinish) {
        this.setState(this.defaultState);
        this.props.clearData();

        if (this.statusTimer) clearInterval(this.statusTimer);

        setTimeout(this.fetchProcessSteps, 500);
      }
    } catch (e) {
      console.error(e);
      this.setState({ isFinishing: false });
    }
  };

  /**
   * Toggle visibility of status card in header
   */
  toggleStatusCard = () => {
    this.setState({ showStatusCard: !this.state.showStatusCard });
  };

  /**
   * Re-order Steps
   */
  onDragEndReOrderCards = ({ source, destination }) => {
    if (isExecutionMode(this.state.processStatus)) return;

    if (!source || !destination) return;

    const { steps, setSteps } = this;

    const { index: sourceIndex } = source || {};
    const { index: destinationIndex } = destination || {};

    const result = [...steps];
    const [removed] = result.splice(sourceIndex, 1);

    result.splice(destinationIndex, 0, removed);

    setSteps(result);
  };

  /**
   * Add New Step in Process
   *
   * @param {Object} step
   */
  addNewStep = step => {
    const { steps, setSteps } = this;

    const labelKey = `${step.label}-${Math.random()
      .toString(36)
      .substring(7)}`.replace(/\s|\//gi, '');

    const newStep = {
      ...STEP_STRUCTURE,
      ...step,
      name: step.label,
      isExpand: true,
      labelKey,
    };

    steps.push(newStep);
    setSteps(steps);
    debounce(() => scrollTo(`#step-${labelKey}`), 200)();
  };

  /**
   * Remove Step from Process
   *
   * @param {Number} stepIndex
   */
  removeStep = stepIndex => () => {
    const { steps, setSteps } = this;

    // Deselecting checkboxes while clicking on DELETE Icon on step card
    this.handleSelectUnselectStep(false)();

    steps.splice(stepIndex, 1);

    setSteps(steps);
  };

  /**
   * Update step data in Process
   *
   * @param {Number} index
   * @param {Object} data
   */
  updateStepData = (index, data) => {
    this.steps[index] = data;

    this.setState({ toggle: !this.state.toggle });
  };

  /**
   * Handle click on Cancel
   */
  handleCancel = () => {
    logAmplitudeEvent('Cancel build process');

    this.goToRoute(APP_ROUTES.PROCESS_BUILDER);
  };

  /**
   * Handle click on cancel process > API call
   */
  handleCancelProcess = async () => {
    logAmplitudeEvent('Cancel processing');

    try {
      const { isCancelingProcess, processId } = this.state;

      if (isCancelingProcess) return;

      this.setState({ isCancelingProcess: true });

      const url = API_URLS.CANCEL_PROCESS.replace('#ID#', processId);

      await httpPost(url, {});

      this.setState({ isCancelingProcess: false });
      showSuccessMsg(PROCESS_MANAGER_MSG.executed_cancel);

      this.syncStatusInterval(PROCESS_STATUS.CREATED);

      debounce(() => this.fetchAndSyncProcessStatus(true), 500)();
    } catch (e) {
      console.error(e);
      this.setState({ isCancelingProcess: false });
    }
  };

  /**
   * Handle Save Process
   *
   * @param {Object}
   */
  handleSave = async ({ callback, isSaveAs, askForSaveAs, name }) => {
    logAmplitudeEvent('Save process');

    try {
      const { isSaving, isRunning, processId } = this.state;
      if (isSaving || isRunning) return;

      const url = API_URLS.SAVE_PROCESS;
      const params = getParamsToSaveProcess(this.state, this.steps, {
        isSaveAs,
      });

      if (typeof params == 'string') {
        // Mark as Submit
        const { steps, setSteps } = this;
        setSteps(steps.map(step => ({ ...step, isSubmit: true })));

        showErrorMsg(params);
        return;
      }

      if (askForSaveAs) {
        this.askForSaveAs();
        return;
      }

      if (isSaveAs) params.name = name;

      params.process_id = (!isSaveAs && processId) || null;

      this.setState({ isSaving: true });

      const { data } = await httpPost(url, params);

      const { process_tasks, id = '' } = data;
      const { steps } = this;

      if (!isSaveAs) {
        // Update task id's into steps object
        const updatedSteps = insertTaskIdIntoSteps(steps, process_tasks);
        this.setSteps(updatedSteps);
      }

      let newProcessId = processId;
      if (!isSaveAs) newProcessId = data.id;

      this.setState({
        isSaving: false,
        processId: newProcessId,
        isSaveAsModal: false,
      });

      if (typeof callback == 'function') {
        callback(data);
        return;
      }

      if (isSaveAs) {
        this.goToRoute(APP_ROUTES.EDIT_PROCESS.replace(':id', id));
        this.fetchProcessSteps();
      }

      showSuccessMsg(PROCESS_MANAGER_MSG.process_saved);
    } catch (e) {
      console.error(e);
      this.setState({ isSaving: false, isRunning: false });
    }
  };

  /**
   * Handle > Save As > Process
   */
  handleSaveAs = () => {
    this.handleSave({ askForSaveAs: true });
  };

  /**
   * Ask to user for Process Name to Save As
   */
  askForSaveAs = () => {
    this.setState({ isSaveAsModal: true });
  };

  /**
   * Handle Confirmation|Name > Save As Process
   *
   * @param {String} name
   */
  handleSaveAsConfirmation = name => {
    if (!name) {
      this.setState({ isSaveAsModal: false });
      return;
    }

    this.handleSave({ isSaveAs: true, name });
  };

  /**
   * Handle Run Process [Also with one by one]
   *
   * @param {Event|Boolean} isStepByStep [Useable if === true]
   */
  handleRunProcess = async (isStepByStep = false) => {
    const handleSaveResponse = async ({ id }) => {
      logAmplitudeEvent('Run process');

      try {
        this.setState({
          isRunning: true,
          isStepByStep: isStepByStep === true,
        });

        const { steps } = this;
        const { isSelectionEnable } = this.state;

        const url = API_URLS.RUN_PROCESS_BY_ID.replace('#ID#', id);
        const params = getParamsToRunProcess(steps, {
          isSelectionEnable,
          isStepByStep,
        });

        const { data = {} } = await httpPost(url, params);

        this.setState({ isRunning: false });

        steps.map(step => {
          step.isExpand = false;

          if (step.id == params.tasks[0]) {
            step.status = PROCESS_STATUS.QUEUED;
            this.setState({ processStatus: PROCESS_STATUS.QUEUED });
            this.syncStatusInterval(PROCESS_STATUS.QUEUED);
          } else if (params.tasks.includes(step.id)) {
            step.status = PROCESS_STATUS.CREATED;
          }

          return step;
        });

        this.batchId = data.batch;
        this.setSteps(steps);
      } catch (e) {
        console.error(e);
        this.setState({ isSaving: false, isRunning: false });
      }
    };

    this.handleSave({ callback: handleSaveResponse });
  };

  /**
   * Handle > Run next step
   */
  runNextStep = async () => {
    try {
      this.setState({ isRunning: true });

      const { steps } = this;
      const { processId, queuedTasks } = this.state;

      const stepId = queuedTasks[0];
      const nextQueued = queuedTasks.filter((_, i) => i > 0);

      let url = API_URLS.RUN_NEXT_STEP_PROCESS;
      url = url.replace('#ID#', processId);
      url = url.replace('#STEP_ID#', stepId);

      const params = {
        batch_number: this.batchId,
        queued_task: nextQueued,
      };

      const { data = {} } = await httpPost(url, params);

      this.batchId = data.batch;
      this.setState({ isRunning: false });

      steps.map(step => {
        step.runNext = false;
        step.showPreview = false;

        if (step.id == data.task_id) {
          step.status = data.status;
          this.syncStatusInterval(data.status);
        }

        return step;
      });

      this.setSteps(steps);
    } catch (e) {
      console.error(e);
      this.setState({ isRunning: false });
    }
  };

  /**
   * Handle > Finish Process Execution
   */
  handleFinish = async () => {
    logAmplitudeEvent('Finish processing');

    // Deselecting checkboxes while clicking on FINISH Button after execution of Steps
    this.handleSelectUnselectStep(false)();

    try {
      const { isFinishing, processId } = this.state;

      if (isFinishing) return;

      this.setState({ isFinishing: true });

      const url = API_URLS.FINISH_PROCESS.replace('#ID#', processId);

      const formData = new FormData();
      formData.append('batch_number', this.batchId);

      await httpPost(url, formData);

      this.setState({ isFinishing: false, showStatusCard: false });
      this.syncStatusInterval(PROCESS_STATUS.CREATED);

      debounce(() => this.fetchAndSyncProcessStatus(true), 500)();
    } catch (e) {
      console.error(e);
      this.setState({ isFinishing: false });
    }
  };

  /**
   * Handle selection of Steps
   *
   * @param {Number} index
   */
  handleStepSelection = index => event => {
    const { steps, setSteps } = this;

    steps[index].isSelected = event.target.checked;

    if (!event.target.checked) {
      const selectedSteps = getSelectedSteps(steps);

      if (selectedSteps.length === 0) {
        this.setState(
          {
            isSelectionEnable: false,
          },
          () => setSteps(steps)
        );
        return;
      }
    }

    this.setState(
      {
        isSelectionEnable: true,
      },
      () => setSteps(steps)
    );
  };

  /**
   *
   * Handle Update inLine edit Name
   */
  handleUpdateInline = value => {
    this.setState({ isBlockDone: value });
  };

  /**
   * Handle Select|Clear all steps [Selection]
   *
   * @param {Boolean} action
   */
  handleSelectUnselectStep = action => () => {
    const { steps, setSteps } = this;

    steps.map(step => {
      step.isSelected = action;

      return step;
    });

    this.setState({ isSelectionEnable: action });

    setSteps(steps);
  };

  /**
   * Render View
   */
  render() {
    const {
      name,
      isSaving,
      isRunning,
      isFetching,
      isEditMode,
      isSaveAsModal,
      isSelectionEnable,
      processStatus,
      lastRunAt,
      isFinishing,
      isCancelingProcess,
      showStatusCard,
      isBlockDone,
      processId,
    } = this.state;

    const isProcessRunning = isExecutionMode(processStatus);

    return (
      <>
        <AppHeader
          header={
            <EditProcessNameHeader
              name={name}
              handleNewName={this.updateProcessName}
              onChangeEditingState={this.handleUpdateInline}
              id={processId}
            />
          }
          headerActions={
            <ProcessHeaderActions
              isButtonBlockDone={isBlockDone}
              showLoader={isSaving || isRunning}
              onCancel={this.handleCancel}
              onCancelProcess={this.handleCancelProcess}
              onSave={this.handleSave}
              isEditMode={isEditMode}
              onSaveAs={this.handleSaveAs}
              onRun={this.handleRunProcess}
              isProcessRunning={isProcessRunning}
              processStatus={processStatus}
              lastRunAt={lastRunAt}
              onFinish={this.handleFinish}
              isFinishing={isFinishing}
              showStatusCard={showStatusCard}
              toggleStatusCard={this.toggleStatusCard}
            />
          }
        />

        <UploadLoader
          isVisible={isSaving || isRunning || isFetching}
          savingText={
            (isRunning && 'Running...') ||
            (isSaving && 'Saving...') ||
            (isFetching && 'Loading...') ||
            ''
          }
          uploadPercentage={100}
        />

        {(isFinishing || isCancelingProcess) && <Spinner />}

        <CreateProcessMenus
          onAddNew={this.addNewStep}
          isProcessRunning={isProcessRunning}
        />

        {isSelectionEnable && !isProcessRunning && (
          <Box pl={3} className="select-option" position="absolute">
            <Link>
              <Typography
                className="cursor-pointer"
                variant="caption"
                onClick={this.handleSelectUnselectStep(true)}
              >
                Select All
              </Typography>
            </Link>
            <Typography variant="caption">&nbsp;/&nbsp;</Typography>
            <Link>
              <Typography
                className="cursor-pointer"
                variant="caption"
                onClick={this.handleSelectUnselectStep(false)}
              >
                Clear All
              </Typography>
            </Link>
          </Box>
        )}

        {!isFetching && (
          <div className="builder-process-container">
            <DragDropContext onDragEnd={this.onDragEndReOrderCards}>
              {this.steps.map((step, i) => {
                return (
                  <Droppable
                    key={`step-card-${step.labelKey}`}
                    droppableId={`droppable-${step.labelKey}`}
                  >
                    {(droppableProvided, { isDraggingOver }) => (
                      <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className="step-selection"
                      >
                        <Draggable
                          key={`step-card-${step.labelKey}`}
                          draggableId={`step-card-${step.labelKey}`}
                          index={i}
                        >
                          {(
                            draggableProvided,
                            { isDragging, draggingOver }
                          ) => (
                            <Grid container id={`step-${step.labelKey}`}>
                              <ProcessStepIcon
                                stepStatus={step.status}
                                isProcessRunning={isProcessRunning}
                                isSelectionEnable={isSelectionEnable}
                                icon={step.icon}
                                isSelected={step.isSelected}
                                onChange={this.handleStepSelection(i)}
                                failReason={step.failed_reason || ''}
                              />
                              <ProcessBuilderStepCard
                                step={step}
                                stepNumber={i}
                                onRemoveStep={this.removeStep(i)}
                                updateStepData={this.updateStepData}
                                dragProvider={draggableProvided}
                                isDragging={isDragging}
                                isDraggingOver={isDraggingOver}
                                processStatus={processStatus}
                                runNextStep={this.runNextStep}
                                isProcessRunning={isProcessRunning}
                              />
                            </Grid>
                          )}
                        </Draggable>
                        {droppableProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </DragDropContext>
          </div>
        )}

        {isSaveAsModal && (
          <RenameProcessModal
            isOpen
            showLoader={isSaving}
            title="Save As"
            doneText="Done"
            processName={name}
            handleClose={this.handleSaveAsConfirmation}
            handleUpdatedName={this.handleSaveAsConfirmation}
          />
        )}
      </>
    );
  }
}

CreateProcess.propTypes = {
  clearData: func.isRequired,
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, { clearData })(
  withRouter(CreateProcess)
);
