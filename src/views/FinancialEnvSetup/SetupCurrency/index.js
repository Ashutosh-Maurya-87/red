import React from 'react';
import { func } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Box, Typography, Button } from '@material-ui/core';

import FinancialEnvSetupFooter from '../Footer';
import HelpGuideInfo from '../Footer/HelpGuideInfo';
import Spinner from '../../../components/Spinner';
import ImgRenderer from '../../../components/ImgRenderer';

import {
  setActiveTab,
  setGLAccounts,
  setGLAccountsMeta,
} from '../../../reducers/FinancialEnvSetup/actions';
import { getGLAccounts } from '../../../reducers/FinancialEnvSetup/selectors';

import { CURRENCY_STEPS } from './configs';
import { FINANCIAL_ENV_SETUP_MENU_KEYS } from '../configs';
import { API_URLS } from '../../../configs/api';
import { httpGet } from '../../../utils/http';

class SetupCurrency extends React.Component {
  state = {
    activeStep: CURRENCY_STEPS.selectLocation,
    showLoader: false,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {}

  /**
   * Fetch GL Accounts List from API
   */
  fetchGLAccounts = async () => {
    try {
      this.setState({ showLoader: true });

      const res = await httpGet(API_URLS.LIST_GL_ACCOUNT);

      this.props.setGLAccounts(res.data);
      this.props.setGLAccountsMeta(res.metadata);

      this.setState({ showLoader: false });
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
    switch (this.state.activeStep) {
      case CURRENCY_STEPS.selectLocation:
        this.props.setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.complete);
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
      case CURRENCY_STEPS.selectLocation:
        this.props.setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts);
        break;

      default:
        break;
    }
  };

  render() {
    const { showLoader } = this.state;

    if (showLoader) return <Spinner />;

    return (
      <>
        <Box className="gl-header">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box>
              <Box mb={1}>
                <Typography variant="caption" color="textSecondary">
                  Setup Currency
                </Typography>
              </Box>
              <Typography variant="h2">
                How you are dealing with Currency?
              </Typography>
            </Box>
            <Box display="flex">
              <Box pr={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ImgRenderer src="export.svg" />}
                >
                  Export
                </Button>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ImgRenderer src="import.svg" />}
              >
                Import
              </Button>
            </Box>
          </Box>
        </Box>
        <Box
          className="full-height-container import-selected-table import-gl-accounts-sheet"
          style={{ overflow: 'hidden' }}
        >
          <ImgRenderer src="test-table.svg" />
        </Box>
        <FinancialEnvSetupFooter
          activeTab={FINANCIAL_ENV_SETUP_MENU_KEYS.setupCurrency}
          prevTab={FINANCIAL_ENV_SETUP_MENU_KEYS.setupGLAccounts}
          onNext={this.handleNext}
          onPrev={this.handlePrev}
          helperText={<HelpGuideInfo />}
        />
      </>
    );
  }
}

SetupCurrency.propTypes = {
  // glAccounts: arrayOf(shape({})),
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
})(SetupCurrency);
