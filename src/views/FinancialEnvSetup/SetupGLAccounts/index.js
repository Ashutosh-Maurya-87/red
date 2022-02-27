import React from 'react';
import { func, bool } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Typography } from '@material-ui/core';
import { Info as InfoIcon } from '@material-ui/icons';

import FinancialEnvSetupFooter from '../Footer';
import ImportExportGLAccount from './ImportExportGLAccount';
import GLAccountHierarchy from './GLAccountHierarchy';
import ViewGLAccount from './ViewGLAccount';
import HelpGuideInfo from '../Footer/HelpGuideInfo';
import Spinner from '../../../components/Spinner';

import {
  setActiveTab,
  setGLAccounts,
  setGLAccountsMeta,
} from '../../../reducers/FinancialEnvSetup/actions';
import { getGLAccounts } from '../../../reducers/FinancialEnvSetup/selectors';

import { fetchDimension } from '../../../services/Dimensions';
import { FINANCIAL_ENV_SETUP_MENU_KEYS } from '../configs';
import { API_URLS } from '../../../configs/api';
import { FINANCIAL_SETUP_MSG } from '../../../configs/messages';

import { httpGet } from '../../../utils/http';
import { showErrorMsg } from '../../../utils/notifications';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const GL_ACCOUNTS_STEPS = {
  importExport: 'importExport',
  view: 'view',
  hierarchy: 'hierarchy',
};

class SetupGLAccounts extends React.Component {
  state = {
    activeStep: GL_ACCOUNTS_STEPS.importExport,
    dimension: null,
    showLoader: true,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    setTimeout(() => {
      if (!this.props.isNextDirection) {
        this.setState({
          showLoader: false,
          activeStep: GL_ACCOUNTS_STEPS.hierarchy,
        });
        return;
      }

      this.fetchGLAccounts(this.fetchDimension);
    }, 200);
  }

  /**
   * Fetch GL Accounts List from API
   */
  fetchGLAccounts = async callback => {
    try {
      this.setState({ showLoader: true });

      let url = API_URLS.LIST_GL_ACCOUNT;
      url += `?type=gl_account`;

      const res = await httpGet(url, { hideError: true });

      this.props.setGLAccounts(res.data);
      this.props.setGLAccountsMeta(res.metadata);

      this.setState({ showLoader: false });

      if (res.data.length > 0) {
        this.setState({ activeStep: GL_ACCOUNTS_STEPS.view });
      }

      if (callback) {
        callback();
      }
    } catch (e) {
      this.props.setGLAccounts([]);
      this.props.setGLAccountsMeta([]);

      this.setState({ showLoader: false });
    }
  };

  /**
   * Fetch GL Accounts dimension
   */
  fetchDimension = async () => {
    try {
      this.setState({ showLoader: true });

      const { data = {} } = await fetchDimension('gl_account');

      this.setState({ showLoader: false, dimension: data });
    } catch (e) {
      this.props.setGLAccounts([]);
      this.props.setGLAccountsMeta([]);

      this.setState({ showLoader: false });
    }
  };

  /**
   * Handle > Go To Next Step
   */
  handleNext = () => {
    const {
      glAccounts = [],
      setGLAccounts,
      setGLAccountsMeta,
      setActiveTab = '',
    } = this.props || {};

    switch (this.state.activeStep) {
      case GL_ACCOUNTS_STEPS.importExport:
        logAmplitudeEvent(
          'Financial Env. Setup: next on GL account import/export'
        );

        if (glAccounts && glAccounts.length === 0)
          this.fetchGLAccounts(this.fetchDimension);
        this.setState({ activeStep: GL_ACCOUNTS_STEPS.view });
        break;

      case GL_ACCOUNTS_STEPS.view:
        logAmplitudeEvent(
          'Financial Env. Setup: next on loaded GL account template'
        );

        if (glAccounts.length == 0) {
          showErrorMsg(FINANCIAL_SETUP_MSG.gl_account_required);
          return;
        }

        setGLAccounts([]);
        setGLAccountsMeta([]);

        this.setState({ activeStep: GL_ACCOUNTS_STEPS.hierarchy });
        break;

      case GL_ACCOUNTS_STEPS.hierarchy:
        logAmplitudeEvent('Financial Env. Setup: next on GL account hierarchy');

        setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.complete);
        break;

      default:
        break;
    }
  };

  /**
   * Handle > Go To Previous Step
   */
  handlePrev = () => {
    switch (this.state.activeStep) {
      case GL_ACCOUNTS_STEPS.importExport:
      case GL_ACCOUNTS_STEPS.view:
        logAmplitudeEvent(
          'Financial Env. Setup: back on loaded GL account template'
        );

        this.props.setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.configureActuals);
        break;

      case GL_ACCOUNTS_STEPS.hierarchy:
        logAmplitudeEvent(
          'Financial Env. Setup: back on loaded GL account hierarchy'
        );

        this.setState({ activeStep: GL_ACCOUNTS_STEPS.view });
        break;

      default:
        break;
    }
  };

  /**
   * Render View
   */
  render() {
    const { showLoader, activeStep, dimension } = this.state;
    const { id = '', display_name = '' } = dimension || {};

    if (showLoader) return <Spinner />;

    return (
      <>
        {activeStep == GL_ACCOUNTS_STEPS.importExport && (
          <ImportExportGLAccount onNext={this.handleNext} />
        )}

        {activeStep == GL_ACCOUNTS_STEPS.view && (
          <ViewGLAccount
            onSetDimension={dimension => this.setState({ dimension })}
          />
        )}

        {activeStep == GL_ACCOUNTS_STEPS.hierarchy && dimension && (
          <GLAccountHierarchy dimensionId={id} rootName={display_name} />
        )}

        <FinancialEnvSetupFooter
          activeTab={FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts}
          prevTab={FINANCIAL_ENV_SETUP_MENU_KEYS.loadActuals}
          onNext={
            activeStep == GL_ACCOUNTS_STEPS.importExport
              ? undefined
              : this.handleNext
          }
          onPrev={this.handlePrev}
          helperText={getHelpeText(activeStep)}
        />
      </>
    );
  }
}

/**
 * Get Informational Text for Footer
 *
 * @param {String} activeStep
 *
 * @return {String|Object}
 */
function getHelpeText(activeStep) {
  switch (activeStep) {
    case GL_ACCOUNTS_STEPS.importExport:
      return <HelpGuideInfo />;

    case GL_ACCOUNTS_STEPS.view:
      return 'You can edit your GL Account directly in the screen or you can export, make your changes and then import it back.';

    case GL_ACCOUNTS_STEPS.hierarchy:
      return (
        <>
          <InfoIcon fontSize="small" />
          &nbsp;
          <Typography variant="caption">
            You can group members into hierarchy levels by adding a level on the
            left and dragging members into the hierarchy level. Those levels
            will be available in reporting.
          </Typography>
        </>
      );

    default:
      return '';
  }
}

SetupGLAccounts.propTypes = {
  isNextDirection: bool.isRequired,
  setActiveTab: func.isRequired,
  setGLAccounts: func.isRequired,
  setGLAccountsMeta: func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  glAccounts: getGLAccounts(),
});

export default connect(mapStateToProps, {
  setActiveTab,
  setGLAccounts,
  setGLAccountsMeta,
})(SetupGLAccounts);
