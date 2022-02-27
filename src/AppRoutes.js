import React from 'react';
import { Switch, withRouter } from 'react-router-dom';
import { string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { SnackbarProvider } from 'notistack';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { Close } from '@material-ui/icons';

import { APP_ROUTES } from './configs/routes';
import { getUserSession } from './utils/localStorage';

import { getTheme } from './reducers/Theme/selectors';

import AppSideBar from './components/AppSidebar';
import AppFooter from './components/AppFooter';
import SnackBar from './SnackBar';
import PrivateRoute from './PrivateRoute';

import Dashboard from './views/Dashboard';

import Signup from './views/Signup';
import ConfirmAccount from './views/Signup/ConfirmAccount';
import CompleteSignup from './views/Signup/CompleteSignup';
import TermsOfService from './views/Signup/TermsOfService';

import Login from './views/Login';
import ForgetPassword from './views/ForgetPassword';
import UpdatePassword from './views/UpdatePassword';

import SourceTables from './views/SourceTables';
import CreateSourceTable from './views/SourceTables/CreateSourceTable';
import ViewSourceTable from './views/SourceTables/ViewSourceTable';
import ViewReloadTable from './views/SourceTables/ViewReloadTable';
import ProcessImportedTable from './views/SourceTables/ProcessImportedTable';

import ProcessList from './views/ProcessBuilder/ProcessList';
import CreateProcess from './views/ProcessBuilder/CreateProcess';

import FinancialEnvSetup from './views/FinancialEnvSetup';

import DimensionsList from './views/Dimensions/DimensionsList';
import EditDimension from './views/Dimensions/EditDimension';
import CreateDimension from './views/Dimensions/CreateDimension';

import ScenariosList from './views/Scenarios/ScenariosList';
import CreateScenario from './views/Scenarios/CreateScenario';
import ViewScenario from './views/Scenarios/ViewScenario';

import RecordEditors from './views/RecordEditors/RecordEditors';
import CreateRecordEditor from './views/RecordEditors/CreateRecordEditor';

import RuleBasedModelsList from './views/RuleBasedModels/RuleBasedModelsList/index';
import RBMSetupWizard from './views/RuleBasedModels/RBMSetupWizard';
import EditRuleBasedModel from './views/RuleBasedModels/EditRuleBasedModel';

import ModelsList from './views/Models/ModelsList';
import CreateModel from './views/Models/CreateModel';
import ModelWorkbook from './views/Models/ModelWorkbook';

import { getThemeConfigs } from './theme';

/**
 * Add action to all snackBars
 */
const notistackRef = React.createRef();
const onClickDismiss = key => () => {
  notistackRef.current.closeSnackbar(key);
};

/**
 * App Routes Component
 */
function AppRoutes({ theme, location }) {
  const isAuthenticated = Boolean(getUserSession());

  const isShowSideBar =
    isAuthenticated && location.pathname != '/complete-signup';

  const themeStore = React.useMemo(
    () =>
      createMuiTheme({
        ...getThemeConfigs({
          theme,
          isAuthenticated: isShowSideBar,
        }),
      }),
    [theme, isShowSideBar]
  );

  let bodyClass = `theme-${theme}`;
  if (location.pathname == APP_ROUTES.FINANCIAL_ENV_SETUP) {
    bodyClass += ' env-container';
  }

  document.body.classList = [bodyClass];

  return (
    <ThemeProvider theme={themeStore}>
      <SnackbarProvider
        preventDuplicate
        maxSnack={50}
        ref={notistackRef}
        action={key => (
          <Close
            fontSize="small"
            className="cursor-pointer"
            onClick={onClickDismiss(key)}
          />
        )}
        classes={{
          variantSuccess: 'custom-snackbar-success',
          variantError: 'custom-snackbar-error',
          variantWarning: 'custom-snackbar-warning',
          variantInfo: 'custom-snackbar-info',
        }}
        iconVariant={{
          success: (
            <svg
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeInherit"
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z"></path>
            </svg>
          ),
          error: (
            <svg
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeInherit"
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
            </svg>
          ),
          warning: (
            <svg
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeInherit"
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"></path>
            </svg>
          ),
          info: (
            <svg
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeInherit"
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z"></path>
            </svg>
          ),
        }}
      >
        <SnackBar />
      </SnackbarProvider>

      <div className={isAuthenticated ? 'marginBase' : ''}>
        {isShowSideBar && <AppSideBar />}

        <Switch>
          {/* Login */}
          <PrivateRoute
            exact
            path={APP_ROUTES.LOGIN}
            isAuthenticated={isAuthenticated}
            component={Login}
          />

          {/* Signup */}
          <PrivateRoute
            exact
            path={APP_ROUTES.SIGN_UP}
            isAuthenticated={isAuthenticated}
            component={Signup}
          />

          {/* Terms of Service */}
          <PrivateRoute
            exact
            path={APP_ROUTES.TERMS_OF_SERVICE}
            isAuthenticated={isAuthenticated}
            component={TermsOfService}
          />

          {/* Complete Sign Up */}
          <PrivateRoute
            exact
            path={APP_ROUTES.COMPLETE_SIGN_UP}
            isAuthenticated={isAuthenticated}
            component={CompleteSignup}
          />

          {/* Confirm Account */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CONFIRM_ACCOUNT}
            isAuthenticated={isAuthenticated}
            component={ConfirmAccount}
          />

          {/* Forget Password */}
          <PrivateRoute
            exact
            path={APP_ROUTES.FORGET_PASSOWRD}
            isAuthenticated={isAuthenticated}
            component={ForgetPassword}
          />

          {/* Reset Password */}
          <PrivateRoute
            exact
            path={APP_ROUTES.RESET_PASSWORD}
            isAuthenticated={isAuthenticated}
            component={UpdatePassword}
          />

          {/* Update Password */}
          <PrivateRoute
            exact
            path={APP_ROUTES.UPDATE_PASSWORD}
            isAuthenticated={isAuthenticated}
            component={UpdatePassword}
          />

          {/* Dashboard */}
          <PrivateRoute
            exact
            path={APP_ROUTES.DASHBOARD}
            isAuthenticated={isAuthenticated}
            component={Dashboard}
          />

          {/* Source Tables */}
          <PrivateRoute
            exact
            path={APP_ROUTES.SOURCE_TABLES}
            isAuthenticated={isAuthenticated}
            component={SourceTables}
          />

          {/* Source Tables */}
          <PrivateRoute
            exact
            path={APP_ROUTES.VIEW_SOURCE_TABLE}
            isAuthenticated={isAuthenticated}
            component={ViewSourceTable}
          />

          {/* Source Reload Tables */}
          <PrivateRoute
            exact
            path={APP_ROUTES.VIEW_RELOAD_TABLE}
            isAuthenticated={isAuthenticated}
            component={ViewReloadTable}
          />

          {/* Dimension Reload Tables */}
          <PrivateRoute
            exact
            path={APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE}
            isAuthenticated={isAuthenticated}
            component={ViewReloadTable}
          />

          {/* Import Table */}
          <PrivateRoute
            exact
            path={APP_ROUTES.IMPORT_TABLE}
            isAuthenticated={isAuthenticated}
            component={ProcessImportedTable}
          />

          {/* Create Table */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_SOURCE_TABLE}
            isAuthenticated={isAuthenticated}
            component={CreateSourceTable}
          />

          {/* Process Builder */}
          <PrivateRoute
            exact
            path={APP_ROUTES.PROCESS_BUILDER}
            isAuthenticated={isAuthenticated}
            component={ProcessList}
          />

          {/* Create Process */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_PROCESS}
            isAuthenticated={isAuthenticated}
            component={CreateProcess}
          />

          {/* Edit Process */}
          <PrivateRoute
            exact
            path={APP_ROUTES.EDIT_PROCESS}
            isAuthenticated={isAuthenticated}
            component={CreateProcess}
          />

          {/* Pivots */}
          <PrivateRoute
            exact
            path={APP_ROUTES.PIVOTS}
            isAuthenticated={isAuthenticated}
            component={Dashboard}
          />

          {/* Reports */}
          <PrivateRoute
            exact
            path={APP_ROUTES.REPORTS}
            isAuthenticated={isAuthenticated}
            component={Dashboard}
          />

          {/* Financial Env Setup */}
          <PrivateRoute
            exact
            path={APP_ROUTES.FINANCIAL_ENV_SETUP}
            isAuthenticated={isAuthenticated}
            component={FinancialEnvSetup}
          />

          {/* Dimensions */}
          <PrivateRoute
            exact
            path={APP_ROUTES.DIMENSIONS}
            isAuthenticated={isAuthenticated}
            component={DimensionsList}
          />

          {/* Create Dimension */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_DIMENSION}
            isAuthenticated={isAuthenticated}
            component={CreateDimension}
          />

          {/* Edit Dimension */}
          <PrivateRoute
            exact
            path={APP_ROUTES.EDIT_DIMENSION}
            isAuthenticated={isAuthenticated}
            component={EditDimension}
          />

          {/* Scenarios */}
          <PrivateRoute
            exact
            path={APP_ROUTES.SCENARIOS}
            isAuthenticated={isAuthenticated}
            component={ScenariosList}
          />

          {/* Create Scenario */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_SCENARIO}
            isAuthenticated={isAuthenticated}
            component={CreateScenario}
          />

          {/* View Scenario */}
          <PrivateRoute
            exact
            path={APP_ROUTES.VIEW_SCENARIO}
            isAuthenticated={isAuthenticated}
            component={ViewScenario}
          />

          {/* Record Editors */}
          <PrivateRoute
            exact
            path={APP_ROUTES.RECORD_EDITORS}
            isAuthenticated={isAuthenticated}
            component={RecordEditors}
          />

          {/* Create Record Editor */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_RECORD_EDITOR}
            isAuthenticated={isAuthenticated}
            component={CreateRecordEditor}
          />

          {/* Edit Record Editor */}
          <PrivateRoute
            exact
            path={APP_ROUTES.EDIT_RECORD_EDITOR}
            isAuthenticated={isAuthenticated}
            component={CreateRecordEditor}
          />

          {/* Models List */}
          <PrivateRoute
            exact
            path={APP_ROUTES.MODELS_LIST}
            isAuthenticated={isAuthenticated}
            component={ModelsList}
          />

          {/* Create Model */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_MODEL}
            isAuthenticated={isAuthenticated}
            component={CreateModel}
          />

          {/* Duplicate Model */}
          <PrivateRoute
            exact
            path={APP_ROUTES.DUPLICATE_MODEL}
            isAuthenticated={isAuthenticated}
            component={CreateModel}
          />

          {/* Model WorkBook */}
          <PrivateRoute
            exact
            path={APP_ROUTES.MODELS_WORKBOOK}
            isAuthenticated={isAuthenticated}
            component={ModelWorkbook}
          />

          {/* Rule Based  */}
          <PrivateRoute
            exact
            path={APP_ROUTES.RULE_BASED_MODEL_LIST}
            isAuthenticated={isAuthenticated}
            component={RuleBasedModelsList}
          />

          {/* Rule Based - Set-up Wizard */}
          <PrivateRoute
            exact
            path={APP_ROUTES.CREATE_RULE_BASED_MODEL}
            isAuthenticated={isAuthenticated}
            component={RBMSetupWizard}
          />

          {/* Edit Rule Based Model */}
          <PrivateRoute
            exact
            path={APP_ROUTES.RULE_BASED_MODEL}
            isAuthenticated={isAuthenticated}
            component={EditRuleBasedModel}
          />

          {/* Reload Rule Based Model */}
          <PrivateRoute
            exact
            path={APP_ROUTES.VIEW_RULE_BASED_MODEL}
            isAuthenticated={isAuthenticated}
            component={ViewReloadTable}
          />

          {/* Default */}
          <PrivateRoute
            exact
            path="/"
            isAuthenticated={isAuthenticated}
            component={Dashboard}
          />
        </Switch>

        {isShowSideBar && <AppFooter />}
      </div>
    </ThemeProvider>
  );
}

AppRoutes.propTypes = {
  theme: string.isRequired,
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, null)(withRouter(AppRoutes));
