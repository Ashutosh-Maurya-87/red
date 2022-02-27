import React from 'react';
import { shape, func, string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Box, Collapse } from '@material-ui/core';

import Spinner from '../../components/Spinner';
import FinancialEnvSideBar from './SideBar';
import SelectActualTable from './SelectActualTable';
import ConfigureActualTable from './ConfigureActualTable';
import FinancialEnvSetupStartModal from './SetupStartModal';
import SetupGLAccounts from './SetupGLAccounts';
import SetupCurrency from './SetupCurrency';
import FinishFinancialEnvSetup from './FinishEnvSetup';

import {
  setActiveTab,
  clearData,
  setActualTable,
  setActualTableInputs,
} from '../../reducers/FinancialEnvSetup/actions';
import { setUserProfile } from '../../reducers/UserProfile/actions';
import { getActiveTab } from '../../reducers/FinancialEnvSetup/selectors';
import { getUserProfile } from '../../reducers/UserProfile/selectors';

import { APP_ROUTES } from '../../configs/routes';
import { API_URLS } from '../../configs/api';
import { FINANCIAL_ENV_SETUP_MENU_KEYS } from './configs';
import { httpGet } from '../../utils/http';

import { fillFinancialEnvData } from './helper';
import './styles.scss';
import { logAmplitudeEvent } from '../../utils/amplitude';

class FinancialEnvSetup extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: true,
    isNextDirection: true,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.props.setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.loadActuals);

    this.fetchFinancialEnvData();
  }

  /**
   * When Component Did Update
   */
  componentDidUpdate(prevProps) {
    const { activeTab } = this.props;

    if (activeTab != FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts) return;

    const { isNextDirection } = this.state;

    if (prevProps.activeTab == FINANCIAL_ENV_SETUP_MENU_KEYS.complete) {
      if (isNextDirection) this.setState({ isNextDirection: false });
    }

    if (prevProps.activeTab == FINANCIAL_ENV_SETUP_MENU_KEYS.configureActuals) {
      if (!isNextDirection) this.setState({ isNextDirection: true });
    }
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    this.props.clearData();
  }

  /**
   * Fetch Financial ENV Setup Data from API and Fill in Inputs
   */
  fetchFinancialEnvData = async () => {
    try {
      this.setState({ showLoader: true });

      const res = await httpGet(API_URLS.GET_FINANCIAL_ENV_DATA);

      const {
        actualTable,
        actualTableInputs,
        hasGLAccount,
      } = fillFinancialEnvData(res);

      const { setActiveTab, setActualTable, setActualTableInputs } = this.props;

      setActualTable(actualTable);
      setActualTableInputs(actualTableInputs);

      if (hasGLAccount) {
        this.startSetup();
        setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts);
      } else if (actualTable.id) {
        this.startSetup();
        setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.configureActuals);
      }

      this.setState({ showLoader: false });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Start Setup after click on Modal
   */
  startSetup = () => {
    logAmplitudeEvent('Start Financial Env. setup');

    const { setUserProfile, userProfile } = this.props;

    setUserProfile({ ...userProfile, is_fin_conf_setup: true });
  };

  /**
   * Cancel Setup
   */
  cancelSetup = () => {
    logAmplitudeEvent('Cancel Financial Env. setup');

    this.props.history.push(APP_ROUTES.SOURCE_TABLES);
  };

  /**
   * Render View
   */
  render() {
    const {
      activeTab,
      userProfile: { is_fin_conf_setup },
    } = this.props;

    const { showLoader, isNextDirection } = this.state;

    if (showLoader) return <Spinner />;

    if (!is_fin_conf_setup) {
      return (
        <FinancialEnvSetupStartModal
          onSetup={this.startSetup}
          onClose={this.cancelSetup}
        />
      );
    }

    const {
      loadActuals,
      setupGLAccounts,
      configureActuals,
      setupCurrency,
      complete,
    } = FINANCIAL_ENV_SETUP_MENU_KEYS;

    return (
      <Box display="flex">
        <FinancialEnvSideBar activeTab={activeTab} />

        <Box className="env-content-area" display="block" width="100%">
          <Collapse in={activeTab == loadActuals}>
            {activeTab == loadActuals && <SelectActualTable />}
          </Collapse>

          <Collapse
            in={activeTab == configureActuals}
            className="configure-actuals-data"
          >
            {activeTab == configureActuals && <ConfigureActualTable />}
          </Collapse>

          <Collapse in={activeTab == setupGLAccounts}>
            {activeTab == setupGLAccounts && (
              <SetupGLAccounts isNextDirection={isNextDirection} />
            )}
          </Collapse>

          <Collapse in={activeTab == setupCurrency}>
            {activeTab == setupCurrency && <SetupCurrency />}
          </Collapse>

          <Collapse in={activeTab == complete}>
            {activeTab == complete && <FinishFinancialEnvSetup />}
          </Collapse>
        </Box>
      </Box>
    );
  }
}

FinancialEnvSetup.propTypes = {
  activeTab: string,
  clearData: func.isRequired,
  setActiveTab: func.isRequired,
  setActualTable: func.isRequired,
  setActualTableInputs: func.isRequired,
  setUserProfile: func.isRequired,
  userProfile: shape({}),
};

const mapStateToProps = createStructuredSelector({
  activeTab: getActiveTab(),
  userProfile: getUserProfile(),
});

export default connect(mapStateToProps, {
  clearData,
  setActiveTab,
  setUserProfile,
  setActualTable,
  setActualTableInputs,
})(FinancialEnvSetup);
