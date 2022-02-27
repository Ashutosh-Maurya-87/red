import React, { useState } from 'react';
import { withRouter, useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { func, shape } from 'prop-types';

import { Box, Button } from '@material-ui/core';

import { APP_ROUTES } from '../../../../configs/routes';
import { RULE_BASED_MODELS_API } from '../../../../configs/api';
import {
  SYNC_CONFIRMATION,
  SYNC_OPTIONS,
  SYNC_SCENARIO_OPTIONS,
} from '../../configs';

import SplitButton from '../../../../components/SplitButton';
import SelectTableModal from '../../../../components/SelectTableModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';

import {
  SYNC_TABS_ACTIONS_KEYS,
  TABS_ACTIONS,
} from '../../../../components/SelectTableModal/helper';

import { httpPost } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';

const RBMHeaderActions = ({ singleRBM = {}, setSingleRBM, setLoader }) => {
  const history = useHistory();

  // States
  const [isScenarioSelectionOpen, setScenarioSelectionOpen] = useState(false);
  const [isChangeSyncConfirm, setChangeSyncConfirm] = useState(false);
  const [tempScenarioId, setTempScenarioId] = useState(null);
  const [isSyncForecastConfirmation, setIsSyncForecastConfirmation] = useState(
    null
  );

  const { id = '', scenario_id: scenarioId = '' } = singleRBM || {};

  /**
   * handle Click Of Sync ForeCast Button
   */
  const handleClickSyncForecast = () => {
    const { configuration = {} } = singleRBM || {};
    const { rules = [] } = configuration || {};

    const index = rules.findIndex(({ gl_id }) => !gl_id);
    if (index > -1) {
      setIsSyncForecastConfirmation('sync');
      return;
    }

    syncScenario();
  };

  /**
   * Handle confirmation of sync forecast
   */
  const handleSyncForecastConfirmation = action => {
    setIsSyncForecastConfirmation(null);

    if (action) {
      syncScenario();
      return;
    }

    setLoader(false);
  };

  /**
   * Goto setup wizard/ Exit / To listing page
   */
  const onExit = () => {
    history.push(APP_ROUTES.RULE_BASED_MODEL_LIST);
  };

  /**
   * Syncing Forecast to selected Scenario (API Request)
   */
  const handleSyncToScenario = () => {
    // When Scenario is not linked
    if (scenarioId) {
      handleClickSyncForecast();
      return;
    }

    if (!scenarioId) {
      openScenarioSelection();

      return;
    }

    syncScenario(); // Sync scenario if we already have scenario to sync
  };

  /**
   * Syncing Forecast to selected Scenario (API Request)
   */
  const syncScenario = async () => {
    try {
      setLoader(true);

      if (!id) return;

      const url = RULE_BASED_MODELS_API.SYNC_FCT_TO_SCENARIO.replace(
        '#ID#',
        id
      );

      const { message = '' } = await httpPost(url);

      if (message) showSuccessMsg(message);

      setLoader(false);
    } catch (error) {
      console.error(error);
      setLoader(false);
    }
  };

  /**
   * To rollback/remove sync Scenario
   *
   * @returns {String} Message
   */
  const getRollBackScenario = async () => {
    const url = RULE_BASED_MODELS_API.ROLL_BACK_SCENARIO.replace('#ID#', id);
    const response = await httpPost(url);

    return response;
  };

  /**
   * To Switch Scenario
   *
   * @returns {String} Message
   */
  const getSwitchScenario = async ({
    scenarioIdToSwitch = scenarioId,
    isClearData = false,
  }) => {
    const url = RULE_BASED_MODELS_API.SWITCH_SCENARIO.replace('#ID#', id);

    const request = {
      scenario_id: scenarioIdToSwitch,
      clear_data: isClearData,
    };

    const response = await httpPost(url, request);

    return response;
  };

  /**
   * Handling Split button
   *
   * @param {String} value
   */
  const handleSplitButtonOptions = async value => {
    try {
      if (!id) return;

      setLoader(true);

      // To remove synced Scenario
      if (value == SYNC_OPTIONS.removeSync) {
        const { message = '' } = await getRollBackScenario();

        if (message) {
          showSuccessMsg(message);
        }
      }

      // To change linked or synced Scenario
      if (value == SYNC_OPTIONS.changeScenario) {
        openScenarioSelection();
      }

      setLoader(false);
    } catch (error) {
      console.error(error);
      setLoader(false);
    }
  };

  /**
   * Open popup to select scenario
   */
  const openScenarioSelection = async () => {
    setScenarioSelectionOpen(true);
  };

  /**
   * To close Scenario Selection
   */
  const onCloseScenarioSelection = () => {
    setScenarioSelectionOpen(false);
  };

  /**
   * Handling selected scenario from selection
   * @param {Object} data
   */
  const handleScenarioSelection = async data => {
    try {
      setLoader(true);

      const { scenario: { id: scenarioIdFromSelection = '' } = {} } =
        data || {};

      // When user hasn't selected scenario and there is no data in forecast
      if (!scenarioId) {
        try {
          onCloseScenarioSelection();

          const { data = '' } = await getSwitchScenario({
            scenarioIdToSwitch: scenarioIdFromSelection,
            isClearData: false,
          });

          setSingleRBM(data);
          handleClickSyncForecast();
        } catch (error) {
          setLoader(false);
        }

        return;
      }

      // When selected Scenario
      if (scenarioIdFromSelection == scenarioId) {
        onCloseScenarioSelection();
      }

      // When current scenario is same as selected selected
      if (scenarioIdFromSelection != scenarioId) {
        setTempScenarioId(scenarioIdFromSelection);
        setChangeSyncConfirm(true);
      }

      setLoader(false);
    } catch (error) {
      console.error(error);
      setChangeSyncConfirm(false);
      setLoader(false);
    }
  };

  /**
   * Handle close Sync confirmation Popup
   */
  const handleSyncConfirm = async res => {
    try {
      // Im case of close button click
      if (!res) {
        setChangeSyncConfirm(false);
        return;
      }

      setChangeSyncConfirm(false);
      onCloseScenarioSelection();

      setLoader(true);
      // When user Selects Rollback
      if (res == SYNC_CONFIRMATION.continueRollback) {
        try {
          await getRollBackScenario();
        } catch (error) {
          setLoader(false);

          return;
        }
      }

      try {
        const { data = '', message = '' } = await getSwitchScenario({
          scenarioIdToSwitch: tempScenarioId,
          isClearData: res == SYNC_CONFIRMATION.continueRollback ? true : false,
        });

        setSingleRBM(data);

        if (message) showSuccessMsg(message);
      } catch (error) {
        console.error(error);
      }

      setLoader(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="end">
      <Button
        variant="outlined"
        color="primary"
        className="title-button"
        onClick={onExit}
      >
        Exit
      </Button>

      {/* Split button to sync scenario */}

      <SplitButton
        className="title-button run-split-btn"
        buttonLabel="Sync To Scenario"
        options={Object.keys(SYNC_SCENARIO_OPTIONS).map(
          key => SYNC_SCENARIO_OPTIONS[key].label
        )}
        onButtonClick={handleSyncToScenario}
        onOptionClick={handleSplitButtonOptions}
        isSplitEnabled={Boolean(scenarioId)}
        name={singleRBM?.scenario?.name}
        additionOption={SYNC_OPTIONS.changeScenario}
        buttonColor={'secondary'}
      />

      {/* opening/Closing Scenario Selection  */}
      {isScenarioSelectionOpen && (
        <SelectTableModal
          isOpen
          onClose={onCloseScenarioSelection}
          activeTabName={SYNC_TABS_ACTIONS_KEYS.scenarioTab}
          tabs={TABS_ACTIONS(SYNC_TABS_ACTIONS_KEYS)}
          handleData={handleScenarioSelection}
          title="Select Scenario"
          isActualEnabled={false}
          areTabsVisible={false}
        />
      )}

      {/* opening/Closing Sync confirmation  */}
      {isChangeSyncConfirm && scenarioId && (
        <ConfirmationModal
          isOpen
          handleClose={handleSyncConfirm}
          action={String(SYNC_CONFIRMATION.continue)}
          actionForCancel={String(SYNC_CONFIRMATION.continueRollback)}
          msg={SYNC_CONFIRMATION.msg}
          noText={SYNC_CONFIRMATION.continueRollback}
          title={SYNC_CONFIRMATION.title}
          yesText={SYNC_CONFIRMATION.continue}
          // showLoader={showLoader}
        />
      )}

      {/* Confirmation popup for Sync Forecast */}
      {isSyncForecastConfirmation && (
        <ConfirmationModal
          handleClose={handleSyncForecastConfirmation}
          isOpen
          action={String(isSyncForecastConfirmation)}
          msg={RULE_BASED_MODELS_MSG.rbm_sync_confirmation}
        />
      )}

      {/* <Button
        variant="contained"
        color="primary"
        className="title-button"
        onClick
      >
        Add Data
      </Button> */}
    </Box>
  );
};

RBMHeaderActions.propTypes = {
  setLoader: func,
  setSingleRBM: func,
  singleRBM: shape({}),
};

RBMHeaderActions.defaultProps = {
  singleRBM: {},
  setSingleRBM: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {})(withRouter(RBMHeaderActions));
