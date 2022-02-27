import React from 'react';
import qs from 'query-string';
import { withRouter } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Button,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import { get, cloneDeep } from 'lodash';

import AppHeader from '../../../components/AppHeader';
import Spinner from '../../../components/Spinner';
import ImgRenderer from '../../../components/ImgRenderer';
import ConfirmationModal from '../../../components/ConfirmationModal';
import NoScenario from '../NoScenario';
import ViewSourceTable from '../../SourceTables/ViewSourceTable';
import ConfigureScenario from '../CreateScenario/ConfigureScenario';
import ScenarioRelationship from '../CreateScenario/DefineRelationship';
import ViewScenarioSource from '../CreateScenario/ViewScenarioSource';
import ConfigureActualTable from '../../FinancialEnvSetup/ConfigureActualTable';
import CreateScenarioFooter from '../CreateScenario/Footer';

import { PRE_DEFINED_LABELS } from '../../../configs/app';
import { API_URLS } from '../../../configs/api';
import { SCENARIOS_MSG } from '../../../configs/messages';
import { httpGet, httpPost } from '../../../utils/http';
import programmaticallyLoadByUrl from '../../../utils/helper/programmaticallyLoadByUrl';
import { SCENARIO_SRC_TYPES, VIEW_TABS } from '../CreateScenario/configs';

import { getColumnsOfSourceTable } from '../../ProcessBuilder/CreateProcess/helper';
import { fillFinancialEnvData } from '../../FinancialEnvSetup/helper';
import { showSuccessMsg } from '../../../utils/notifications';
import { getColumnValue, getformatDate } from '../CreateScenario/helper';
import {
  SCENARIO_EXPORT_KEYS,
  EXPORT_OPTIONS_ARRAY,
} from '../ScenariosList/configs';
import ScenarioValidation from './ScenarioValidation';

class ViewScenario extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    bodyHeight: 0,
    activeTab: 0,

    scenario: {},
    table: {},

    scenarioInputs: {},
    relation: {},
    srcScenarioMapping: [],

    srcType: SCENARIO_SRC_TYPES[0],

    confirmAction: false,
    exportOptions: [],
  };

  configureActualsRef = React.createRef();

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
    const query = new URLSearchParams(this.props.location.search);
    const tab = Number(query.get('tab')) || 0;

    let activeTab = 0;
    if (tab > 0 && tab <= 3) activeTab = tab;

    const bodyHeight = this.getBodyHeight();

    this.setState({ activeTab, bodyHeight });
    this.fetchScenario();
  };

  /**
   * Get Calculated Body Height
   *
   * @param {Number}
   */
  getBodyHeight = () => {
    try {
      const [appHeaderEle] = document.getElementsByClassName('app-header');

      // Header = 65px
      // Tabs = 105px
      return window.innerHeight - appHeaderEle.offsetHeight - 65 - 105 - 52;
    } catch {
      return window.innerHeight;
    }
  };

  /**
   * Get Scenario from API
   */
  fetchScenario = async () => {
    try {
      this.setState({ showLoader: true });

      const { match: { params: { id } = {} } = {} } = this.props;
      let url = API_URLS.GET_SCENARIO_BY_ID;
      url = url.replace('#ID#', id);

      let { data } = await httpGet(url);
      if (!data) data = {};

      let table = {};
      if (data.source_id) {
        const { tableData, columns } = await getColumnsOfSourceTable(
          data.source_id
        );

        table = { ...tableData, columns };
      }

      const { actualTableInputs: scenarioInputs } = fillFinancialEnvData({
        actual_data: data,
      });

      scenarioInputs.scenarioName = scenarioInputs.actualName;

      const relation = data.relation || {};
      delete data.relation;

      let { activeTab } = this.state;
      if (data.label == SCENARIO_EXPORT_KEYS.Actuals && activeTab == 2)
        activeTab = 0;

      this.setState({
        scenario: data,
        scenarioInputs,
        table,
        relation,
        showLoader: false,
        activeTab,
        srcType: data.source_type || SCENARIO_SRC_TYPES[0],
        srcScenarioMapping: data.source_scenario_mapping || [],
      });
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Handle > On Change Tab
   *
   * @param {Object}
   * @param {Number} activeTab
   */
  onChangeTab = (evt, activeTab) => {
    const {
      history,
      location: { pathname, search },
    } = this.props;

    const searchObj = qs.parse(search);
    searchObj.tab = activeTab;
    const searchStr = qs.stringify(searchObj);

    this.setState({ activeTab });
    history.push({ pathname, search: searchStr });
  };

  /**
   * Handle Scenario Inputs
   *
   * @param {Object} scenarioInputs
   */
  handleScenarioInputs = scenarioInputs => {
    this.setState({ scenarioInputs }, this.saveScenario);
  };

  /**
   * Save Relationship
   *
   * @param {Object} relation
   */
  saveRelationship = ({ relation }) => {
    this.setState({ relation }, this.saveScenario);
  };

  /**
   * Save New Scenario
   */
  saveScenario = async () => {
    try {
      const {
        scenario,
        relation,
        table,
        scenarioInputs,
        srcType,
        srcScenarioMapping,
      } = this.state;

      const label = scenario.label || null;
      const label_id = scenario.label || null;

      const {
        scenarioName,
        dateColumn,
        dateFormat,
        forecastStartDate,
        amountColumn,
      } = scenarioInputs;

      let meta = {
        dataset_name: scenarioName,
        forecast_start_date: forecastStartDate,
      };

      if (srcType == SCENARIO_SRC_TYPES[0]) {
        meta = {
          ...meta,
          date_col_name: getColumnValue(table.columns, dateColumn),
          date_col_format: getformatDate(dateFormat),
          amt_col_name: getColumnValue(table.columns, amountColumn),
        };
      }

      /**
       * Format relation data
       *
       * @returns {Object}
       */
      const getRelationData = () => {
        const relationData = get(relation, 'colsToCompare.data') || [];

        const formattedRelationData = relationData.map(col => {
          const { user_table_id: tableId, compareField } = col;

          const startCol = table.id == tableId ? compareField : col;
          const endCol = table.id == tableId ? col : compareField;

          startCol.operator = '=';
          startCol.compareType = 'Column';

          return {
            ...startCol,
            compareField: endCol,
          };
        });

        return {
          colsToCompare: {
            data: formattedRelationData,
            relation: 'AND',
          },
        };
      };

      const params = {
        id: scenario.id,
        source_id: table.id,
        source_type: srcType,
        label,
        label_id,
        relation: getRelationData(),
        meta,
        source_scenario_mapping: srcScenarioMapping,
      };

      this.setState({ showLoader: true });

      const { data } = await httpPost(API_URLS.SAVE_SCENARIO, params);

      delete data.relation;
      delete data.source_scenario_mapping;

      this.setState({ showLoader: false, scenario: data });

      showSuccessMsg(SCENARIOS_MSG.scenario_saved);
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Verify > Is Tab Allowed
   *
   * @param {String} tab
   */
  isTabAllowed = tab => {
    const { scenario = {} } = this.state;

    if (scenario.label == SCENARIO_EXPORT_KEYS.Actuals && tab == VIEW_TABS[2]) {
      return false;
    }

    return true;
  };

  /**
   * Save Configurations > Actual Scenario
   */
  saveActualScenario = () => {
    if (!this.configureActualsRef || !this.configureActualsRef.current) return;

    const {
      current: { handleNext },
    } = this.configureActualsRef;

    handleNext();
  };

  /**
   * Show Success Message > Scenario Saved
   */
  scenarioSavedSuccess = () => {
    showSuccessMsg(SCENARIOS_MSG.scenario_saved);
  };

  /**
   * setting of check boxes
   */
  handleExportOptionsClick = index => event => {
    const { exportOptions } = this.state;
    const options = [...exportOptions];

    options[index].isSelected = event.target.checked;
    this.setState({ exportOptions: [...options] });
  };

  /**
   * Disabling specific labels
   */
  isScenarioDisabled = optionLabel => {
    const { scenario: { label = '' } = {} } = this.state;

    if (
      label == SCENARIO_EXPORT_KEYS.Actuals &&
      optionLabel == PRE_DEFINED_LABELS.actuals.label
    )
      return true;

    return false;
  };

  /**
   * Exporting Scenario Button Click
   */
  exportScenarioButton = async () => {
    this.setState({
      exportOptions: cloneDeep(EXPORT_OPTIONS_ARRAY),
      confirmAction: 'EXPORT',
    });
  };

  /**
   * Exporting Scenario close
   */
  handleCloseConfModal = res => {
    if (res) this.exportScenario();

    this.setState({ confirmAction: false, exportOptions: [] });
  };

  /**
   * Exporting Scenario
   */
  exportScenario = async () => {
    try {
      const { scenario, exportOptions } = this.state;

      this.setState({ showLoader: true });
      if (this.state.showLoader) return;

      const url = API_URLS.EXPORT_SCENARIO.replace('#ID#', scenario.id);

      const params = {
        include: [],
      };

      exportOptions.forEach(({ isSelected = '', value }) => {
        if (isSelected) params.include.push(value);
      });

      const { data: { file = '' } = {} } = await httpPost(url, params);

      programmaticallyLoadByUrl(file, {
        target: '_blank',
        name: `${scenario.name}.xlsx`,
      });

      this.setState({ showLoader: false });
      showSuccessMsg(SCENARIOS_MSG.scenario_exported);
    } catch {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const {
      showLoader,
      activeTab,
      bodyHeight,

      scenario,
      table,
      relation,
      scenarioInputs,
      srcType,
      exportOptions,
      confirmAction,
    } = this.state;

    const scenario_meta = scenario.scenario_meta || {};
    table.display_name = scenario_meta?.dataset_name;

    const isActual = scenario.label == PRE_DEFINED_LABELS.actuals.label;

    return (
      <>
        <AppHeader header={scenario_meta.dataset_name || 'View Scenario'} />

        {showLoader && <Spinner />}

        <Box px={3} mb={3}>
          {scenario.id && (
            <Box textAlign="center" mt={1} fontSize={24}>
              <Tabs
                value={activeTab}
                indicatorColor="primary"
                textColor="primary"
                className="select-table-tab"
                onChange={this.onChangeTab}
              >
                {VIEW_TABS.map(tab => {
                  if (!this.isTabAllowed(tab)) return null;

                  return <Tab key={tab} label={tab} />;
                })}
              </Tabs>
            </Box>
          )}

          {confirmAction && (
            <ConfirmationModal
              maxWidth="sm"
              handleClose={this.handleCloseConfModal}
              isOpen
              action={confirmAction}
              title="Export Scenario"
              yesText="Export"
              noText="Cancel"
              msg=""
            >
              <Box
                px={2}
                py={1}
                my={-4}
                display="flex"
                flexDirection="column"
                border={1}
                borderColor="secondary.stepBorderColor"
                borderRadius={5}
              >
                {exportOptions.map((option, index) => {
                  const { isSelected = false, label = '' } = option || {};
                  return (
                    <FormControlLabel
                      key={index}
                      control={
                        <Checkbox
                          checked={isSelected}
                          disabled={this.isScenarioDisabled(label)}
                          onChange={this.handleExportOptionsClick(index)}
                          color="primary"
                        />
                      }
                      label={label}
                    />
                  );
                })}
              </Box>
            </ConfirmationModal>
          )}
        </Box>

        {activeTab == 0 && scenario.id && scenario.source_id && (
          <>
            <Box display="flex" justifyContent="flex-end" px={3} pb={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ImgRenderer src="export.svg" />}
                onClick={this.exportScenarioButton}
              >
                Export
              </Button>
            </Box>
            <ViewSourceTable
              hideFilters={false}
              hideHeader
              scrollHeight={bodyHeight}
              tableId={scenario.source_id || ''}
            />
          </>
        )}

        <Box px={3}>
          {activeTab == 1 &&
            scenario.id &&
            scenario.label != SCENARIO_EXPORT_KEYS.Actuals && (
              <ConfigureScenario
                table={table}
                handleNext={this.handleScenarioInputs}
                scenarioInputs={scenarioInputs}
                nextText="Save"
                backText=""
                fromScenario={srcType == SCENARIO_SRC_TYPES[1]}
                viewMode
              />
            )}

          {activeTab == 1 &&
            scenario.id &&
            scenario.label == SCENARIO_EXPORT_KEYS.Actuals &&
            table.columns && (
              <Box mb={4} className="configure-actuals-data">
                <ConfigureActualTable
                  ref={this.configureActualsRef}
                  scenarioTable={table}
                  scenarioInputs={scenarioInputs}
                  subTitle=""
                  title=""
                  hideTable
                  onSaveSuccess={this.scenarioSavedSuccess}
                />

                <CreateScenarioFooter
                  backText=""
                  nextText="Save"
                  onNext={this.saveActualScenario}
                />
              </Box>
            )}
        </Box>

        {activeTab == 2 && scenario.id && !isActual && (
          <ScenarioRelationship
            table={table}
            showLoader={showLoader}
            apiRelationData={relation}
            onNext={this.saveRelationship}
            isAutoSave={true}
            backText=""
            nextText=""
            tableHeight={bodyHeight - 20}
          />
        )}

        {false &&
          activeTab == 2 &&
          scenario.id &&
          srcType == SCENARIO_SRC_TYPES[1] && (
            <ViewScenarioSource
              scenario={scenario}
              scenarioInputs={scenarioInputs}
              showLoader={showLoader}
              onNext={() => {}}
              backText=""
              nextText="Save"
              viewMode
            />
          )}

        {/* Validation Tab */}
        {(activeTab == 3 || (activeTab == 2 && isActual)) && scenario?.id && (
          <ScenarioValidation key={activeTab} scenarioId={scenario?.id} />
        )}

        {!showLoader && !scenario.id && <NoScenario />}
      </>
    );
  }
}

ViewScenario.propTypes = {};

ViewScenario.defaultProps = {};

export default withRouter(ViewScenario);
