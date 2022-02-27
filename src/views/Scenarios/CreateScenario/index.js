import React from 'react';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import { get } from 'lodash';

import { Stepper, Step, StepLabel, Box } from '@material-ui/core';

import AppHeader from '../../../components/AppHeader';
import SelectTableModal from '../../../components/SelectTableModal';
import {
  TABS_ACTIONS_KEYS,
  SCENARIO_TABS_ACTIONS_KEYS,
  TABS_ACTIONS,
} from '../../../components/SelectTableModal/helper';
import SourceSelection from './SourceSelection';
import ConfigureScenario from './ConfigureScenario';
import ViewScenarioSource from './ViewScenarioSource';
import ScenarioRelationship from './DefineRelationship';
import Spinner from '../../../components/Spinner';

import { CREATE_STEPS } from './configs';
import { APP_ROUTES } from '../../../configs/routes';
import { API_URLS } from '../../../configs/api';
import { SCENARIOS_MSG } from '../../../configs/messages';

import { httpPost } from '../../../utils/http';
import { showSuccessMsg } from '../../../utils/notifications';
import { getColumnsOfSourceTable } from '../../ProcessBuilder/CreateProcess/helper';
import { getColumnValue, getformatDate } from './helper';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

class CreateScenario extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,

    activeStep: 0,
    activeSourceTab: '',

    selectedTable: {},
    selectedScenario: {},

    scenarioInputs: {},
  };

  /**
   * Handle Back
   */
  handleBack = () => {
    logAmplitudeEvent('Go back on create scenario');

    const { activeStep } = this.state;

    switch (activeStep) {
      case 1:
        this.setState({
          activeStep: 0,
          selectedTable: {},
          selectedScenario: {},
          scenarioInputs: {},
        });
        break;

      case 2:
        this.setState({ activeStep: 1 });
        break;

      default:
        break;
    }
  };

  /**
   * Handle Source Selection
   *
   * @param {String} key
   */
  handleSourceSelection = key => () => {
    let tab = '';

    switch (key) {
      case 'uploadTable':
        logAmplitudeEvent('Upload source table for scenario');
        tab = TABS_ACTIONS_KEYS.importTableTab;
        break;

      case 'selectTable':
        logAmplitudeEvent('Connect existing table for scenario');
        tab = TABS_ACTIONS_KEYS.sourceTableTab;
        break;

      case 'selectScenario':
        logAmplitudeEvent('Choose existing scenario');
        const scenario = { id: 'NEW' };
        this.setState({ activeSourceTab: TABS_ACTIONS_KEYS.scenarioTab }, () =>
          this.handleSelectedSource(scenario)
        );
        return;

      default:
        return;
    }

    this.setState({ activeSourceTab: tab });
  };

  /**
   * Close Source Selection Modal
   */
  closeSourceSelection = () => {
    this.setState({ activeSourceTab: '' });
  };

  /**
   * Handle Selected Source
   *
   * @param {Object} data
   */
  handleSelectedSource = async data => {
    try {
      const { activeSourceTab } = this.state;

      const next = {
        activeSourceTab: '',
        activeStep: 1,
      };

      switch (activeSourceTab) {
        case TABS_ACTIONS_KEYS.importTableTab:
        case TABS_ACTIONS_KEYS.sourceTableTab:
          this.setState({ showLoader: true });

          const { tableData, columns } = await getColumnsOfSourceTable(data.id);
          const selectedTable = { ...tableData, columns };

          this.setState({ showLoader: false, selectedTable, ...next });
          break;

        case TABS_ACTIONS_KEYS.scenarioTab:
          this.setState({ selectedScenario: data, ...next });
          break;

        default:
          break;
      }
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Handle Scenario Inputs
   *
   * @param {Object} scenarioInputs
   */
  handleScenarioInputs = scenarioInputs => {
    logAmplitudeEvent('Next on create scenario');
    this.setState({ scenarioInputs, activeStep: 2 });
  };

  /**
   * Save New Scenario
   */
  saveScenario = async ({ relation }) => {
    logAmplitudeEvent('Saving new scenario');

    try {
      const { selectedTable, scenarioInputs } = this.state;

      const {
        scenarioName,
        dateColumn,
        dateFormat,
        forecastStartDate,
        amountColumn,
      } = scenarioInputs;

      const params = {
        id: null,
        source_id: selectedTable.id,
        source_type: 'source_table',
        label: null,
        label_id: null,
        relation,
        meta: {
          dataset_name: scenarioName,
          date_col_name: getColumnValue(selectedTable.columns, dateColumn),
          date_col_format: getformatDate(dateFormat),
          forecast_start_date: forecastStartDate,
          amt_col_name: getColumnValue(selectedTable.columns, amountColumn),
        },
      };

      this.setState({ showLoader: true });

      await httpPost(API_URLS.SAVE_SCENARIO, params);

      this.setState({ showLoader: false });

      showSuccessMsg(SCENARIOS_MSG.scenario_saved);
      this.props.history.push(APP_ROUTES.SCENARIOS);
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Save Scenario from Scenario
   */
  saveScenarioFromScenario = async ({ headers, data }) => {
    logAmplitudeEvent('Save new scenario from existing scenario');

    try {
      const DATE_FORMAT = 'YYYY-MM-DD';

      const { scenarioInputs } = this.state;
      const { scenarioName, forecastStartDate } = scenarioInputs;

      const checkIsActual = ({ index, headerDate }) => {
        if (
          index > 1 &&
          forecastStartDate &&
          moment(headerDate)
            .startOf('month')
            .isBefore(moment(forecastStartDate).startOf('month'))
        ) {
          return true;
        }

        return false;
      };

      const scenarioMapping = headers
        .map((headerDate, index) => {
          if (index <= 1) return null;

          const isActual = checkIsActual({ index, headerDate });

          let scenarioId = null;
          let srcPeriod = headerDate;

          if (!isActual) {
            const scenarioCell = get(data, `0.${index}`) || {};
            const srcPeriodCell = get(data, `1.${index}`) || {};

            scenarioId = scenarioCell.value;
            srcPeriod = srcPeriodCell.value;
          }

          return {
            period: headerDate ? moment(headerDate).format(DATE_FORMAT) : '',
            source_period: srcPeriod
              ? moment(srcPeriod).format(DATE_FORMAT)
              : '',
            source_scenario_type: isActual ? 'actual' : null,
            source_scenario_id: scenarioId,
          };
        })
        .filter(Boolean);

      const params = {
        id: null,
        source_id: null,
        source_type: 'scenario_to_scenario',
        source_scenario_mapping: scenarioMapping,

        label: null,
        label_id: null,
        meta: {
          dataset_name: scenarioName,
          forecast_start_date: forecastStartDate,
        },
      };

      this.setState({ showLoader: true });

      await httpPost(API_URLS.SAVE_SCENARIO, params);

      this.setState({ showLoader: false });

      showSuccessMsg(SCENARIOS_MSG.scenario_saved);
      this.props.history.push(APP_ROUTES.SCENARIOS);
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const {
      showLoader,
      activeStep,

      activeSourceTab,
      selectedTable,
      selectedScenario,

      scenarioInputs,
    } = this.state;

    const fromScenario = Boolean(selectedScenario.id);

    return (
      <>
        <AppHeader header="Creating New Scenario" />

        {showLoader && <Spinner />}

        <Stepper activeStep={activeStep} className="scenario-steps">
          {CREATE_STEPS.map(({ label }, index) => (
            <Step key={index}>
              <StepLabel>{`${label}${
                index == 2 && selectedTable.id ? ' (Define Relationship)' : ''
              }${
                index == 2 && selectedScenario.id ? ' (Scenario Source)' : ''
              }`}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep == 0 && (
          <SourceSelection handleSourceSelection={this.handleSourceSelection} />
        )}

        {activeStep == 1 && (
          <Box px={4}>
            <ConfigureScenario
              table={selectedTable}
              handleNext={this.handleScenarioInputs}
              scenarioInputs={scenarioInputs}
              fromScenario={fromScenario}
              onBack={this.handleBack}
            />
          </Box>
        )}

        {activeStep == 2 && selectedTable.id && (
          <ScenarioRelationship
            table={selectedTable}
            showLoader={showLoader}
            onBack={this.handleBack}
            onNext={this.saveScenario}
            tableHeight={window.innerHeight - 370}
          />
        )}

        {activeStep == 2 && selectedScenario.id && (
          <ViewScenarioSource
            scenarioInputs={scenarioInputs}
            showLoader={showLoader}
            onBack={this.handleBack}
            onNext={this.saveScenarioFromScenario}
          />
        )}

        {activeSourceTab && (
          <SelectTableModal
            isOpen
            activeTabName={activeSourceTab}
            tabs={TABS_ACTIONS(SCENARIO_TABS_ACTIONS_KEYS)}
            handleData={this.handleSelectedSource}
            onClose={this.closeSourceSelection}
          />
        )}
      </>
    );
  }
}

CreateScenario.propTypes = {};

CreateScenario.defaultProps = {};

export default withRouter(CreateScenario);
