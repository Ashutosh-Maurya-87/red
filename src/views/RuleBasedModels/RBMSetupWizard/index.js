import React from 'react';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { Prompt } from 'react-router-dom';
import { func, string } from 'prop-types';
import { cloneDeep } from 'lodash';

import { Box } from '@material-ui/core';

// import Calculations from './Calculations';
import ImportExport from './ImportExport';
import FieldConfigs from './FieldConfigs';
import RuleBasedModelSideBar from './SideBar';

import Spinner from '../../../components/Spinner';
import UnsavedChangesBase from '../../../components/UnsavedChangesDialog/base';
import UnsavedChangesDialog from '../../../components/UnsavedChangesDialog';
import { withRouterForwardRef } from '../../../components/WithRouterForwardRef';

import { APP_ROUTES } from '../../../configs/routes';
import { RULE_BASED_MODELS_API } from '../../../configs/api';
import { RULE_BASED_MODEL_SETUP_MENU_KEYS } from '../configs';

import { httpGet } from '../../../utils/http';

import {
  setActiveTab,
  setClearData,
  setSingleRBM,
} from '../../../reducers/RuleBasedModels/actions';
import { getActiveTab } from '../../../reducers/RuleBasedModels/selectors';

import Calculations from './Calculations';

class RBMSetupWizard extends UnsavedChangesBase {
  /**
   * States
   */
  state = {
    showLoader: true,
    isUnsavedStructure: false,
    isVisibleUnsavedChanges: false,
    backOfSingleRBM: null,
    discardAction: null,
  };

  /**
   * Inner Child Ref
   */
  innerChildRef = React.createRef();

  /**
   * When component did mount -LifeCycle
   */
  componentDidMount() {
    // Manually changing Tab/Step
    const {
      location: { search = '' },
    } = this.props.history;

    let activeTab = 0;

    const query = new URLSearchParams(search);
    const tab = query.get('activeTab');

    if (tab > 0 && tab <= 2) activeTab = tab;

    const keys = Object.keys(RULE_BASED_MODEL_SETUP_MENU_KEYS);

    this.props.setActiveTab(
      RULE_BASED_MODEL_SETUP_MENU_KEYS[keys[Number(activeTab)]]
    );

    this.subscribeConfirmLeavePage();
    this.loadInitialData();
  }

  /**
   * Handle user action to discard unsaved changes
   * @param {Boolean} isDiscard
   * @returns
   */
  handleUnsavedConf = isDiscard => () => {
    if (!isDiscard) {
      this.setState({ isVisibleUnsavedChanges: false });
      return;
    }

    const doAction = () => {
      const { discardAction, backOfSingleRBM } = this.state;
      const { setSingleRBM } = this.props;
      const action = discardAction;

      setSingleRBM(backOfSingleRBM); // reset Single RBM state

      this.setState({ discardAction: '', backOfSingleRBM: null }, () => {
        if (action && typeof action == 'function') {
          discardAction();
        }
      });
    };

    this.setState(
      {
        isUnsavedStructure: false,
        isVisibleUnsavedChanges: false,
      },
      doAction
    );
  };

  /**
   * Set State for unsaved state
   */
  setUnsavedState = (state = false) => {
    this.setState({ isUnsavedStructure: state });
  };

  /**
   * Verify > Has Unsaved Changes
   *
   * @return {Boolean}
   */
  hasUnsavedChanges = () => {
    const { isUnsavedStructure } = this.state;

    if (isUnsavedStructure) return true;

    return false;
  };

  /**
   * Load Initial Data
   */
  loadInitialData = async () => {
    try {
      const { setSingleRBM, history } = this.props;

      this.setState({ showLoader: true });

      const {
        location: { search = '' },
      } = history;

      const query = new URLSearchParams(search);
      const id = query.get('id');

      if (
        !String(id) ||
        String(id) == String(null) ||
        String(id) == String(undefined)
      ) {
        return history.push(APP_ROUTES.RULE_BASED_MODEL_LIST);
      }

      // Loading single RBM
      const getSingleRBM = RULE_BASED_MODELS_API.GET_SINGLE_RBM.replace(
        '#ID#',
        id
      );
      const { data } = await httpGet(getSingleRBM);

      setSingleRBM(data);

      this.setState({ showLoader: false });
    } catch (e) {
      console.error(e);
      this.setState({ showLoader: false });
    }

    return false;
  };

  /**
   * When component Did update - LifeCycle
   *
   */
  componentDidUpdate(nextProps) {
    const {
      location: { search = '' },
    } = this.props.history;

    const query = new URLSearchParams(search);
    const activeTab = query.get('activeTab');

    const {
      location: { search: nextSearch = '' },
    } = nextProps;

    const query1 = new URLSearchParams(nextSearch);
    const nextActiveTab = query1.get('activeTab');

    if (activeTab !== nextActiveTab) {
      const keys = Object.keys(RULE_BASED_MODEL_SETUP_MENU_KEYS);

      this.props.setActiveTab(
        RULE_BASED_MODEL_SETUP_MENU_KEYS[keys[Number(activeTab)]]
      );
    }
  }

  /**
   * When Component will unmount -LifeCycle
   *
   * Purpose:- It will clear All Data from store
   */
  componentWillUnmount() {
    this.unsubscribeConfirmLeavePage();

    const { type = '' } = this.props;

    if (!type) {
      this.props.setClearData();
    }
  }

  render() {
    const { activeTab, type = '', ref } = this.props;
    const { showLoader = false, isVisibleUnsavedChanges } = this.state || {};

    if (showLoader) return <Spinner />;

    const {
      calculations,
      fieldConfigs,
      importExport,
    } = RULE_BASED_MODEL_SETUP_MENU_KEYS;

    return (
      <>
        <Prompt when message={this.handleBlockedNavigation} />

        <Box ref={ref} display="flex" className="configure-tab-container">
          <RuleBasedModelSideBar activeTab={activeTab} type={type} />

          {isVisibleUnsavedChanges && (
            <UnsavedChangesDialog handleUnsavedConf={this.handleUnsavedConf} />
          )}

          <Box
            className="env-content-area"
            display=" block"
            width="100%"
            pb={0}
          >
            {activeTab == calculations && (
              <Calculations
                ref={this.innerChildRef}
                activeTab={activeTab}
                onSetUnsavedChanges={this.setUnsavedState}
                onLoadComponent={data => {
                  this.setState({
                    backOfSingleRBM: cloneDeep(data),
                  });
                }}
              />
            )}

            {activeTab == fieldConfigs && (
              <FieldConfigs activeTab={activeTab} ref={this.innerChildRef} />
            )}

            {activeTab == importExport && (
              <ImportExport activeTab={activeTab} isFinishEnable={true} />
            )}
          </Box>
        </Box>
      </>
    );
  }
}
RBMSetupWizard.propTypes = {
  activeTab: string.isRequired,
  setActiveTab: func.isRequired,
  setClearData: func.isRequired,
  setSingleRBM: func,
};

const mapStateToProps = createStructuredSelector({
  activeTab: getActiveTab(),
});

export default connect(
  mapStateToProps,
  {
    setActiveTab,
    setClearData,
    setSingleRBM,
  },
  null,
  { forwardRef: true }
)(withRouterForwardRef(RBMSetupWizard));
