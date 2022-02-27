import { AI_MODULES_DISPLAY_NAME, RBM_DISPLAY_NAME } from './app';

const APP_BASE_URL = '';

const APP_ROUTES = {
  LOGIN: `${APP_BASE_URL}/login`,
  SIGN_UP: `${APP_BASE_URL}/signup`,
  FORGET_PASSOWRD: `${APP_BASE_URL}/forget-password`,
  COMPLETE_SIGN_UP: `${APP_BASE_URL}/complete-signup`,
  CONFIRM_ACCOUNT: `${APP_BASE_URL}/confirm/account/:code`,
  UPDATE_PASSWORD: `${APP_BASE_URL}/update-password`,
  RESET_PASSWORD: `${APP_BASE_URL}/reset-password/:code`,
  TERMS_OF_SERVICE: `${APP_BASE_URL}/terms-of-service`,

  DASHBOARD: `${APP_BASE_URL}/dashboard`,
  FINANCIAL_ENV_SETUP: `${APP_BASE_URL}/dashboard/financial-env-setup`,

  SOURCE_TABLES: `${APP_BASE_URL}/dashboard/source-tables`,
  IMPORT_TABLE: `${APP_BASE_URL}/dashboard/source-tables/import-table`,
  CREATE_SOURCE_TABLE: `${APP_BASE_URL}/dashboard/source-tables/create`,
  VIEW_SOURCE_TABLE: `${APP_BASE_URL}/dashboard/source-tables/:id/view`,
  VIEW_RELOAD_TABLE: `${APP_BASE_URL}/dashboard/source-tables/reload-table`,
  PIVOTS: `${APP_BASE_URL}/dashboard/pivots`,
  REPORTS: `${APP_BASE_URL}/dashboard/reports`,

  PROCESS_BUILDER: `${APP_BASE_URL}/dashboard/process-builder`,
  CREATE_PROCESS: `${APP_BASE_URL}/dashboard/process-builder/create`,
  EDIT_PROCESS: `${APP_BASE_URL}/dashboard/process-builder/edit/:id`,

  DIMENSIONS: `${APP_BASE_URL}/dashboard/linked-lookups`,
  CREATE_DIMENSION: `${APP_BASE_URL}/dashboard/linked-lookups/create`,
  EDIT_DIMENSION: `${APP_BASE_URL}/dashboard/linked-lookups/edit/:id`,
  VIEW_DIMENSIONS_RELOAD_TABLE: `${APP_BASE_URL}/dashboard/linked-lookups/reload-table`,

  SCENARIOS: `${APP_BASE_URL}/dashboard/scenarios`,
  ARCHIVED_SCENARIOS: `${APP_BASE_URL}/dashboard/scenarios/archived`,
  CREATE_SCENARIO: `${APP_BASE_URL}/dashboard/scenarios/create`,
  EDIT_SCENARIO: `${APP_BASE_URL}/dashboard/scenarios/edit/:id`,
  VIEW_SCENARIO: `${APP_BASE_URL}/dashboard/scenarios/view/:id`,

  RECORD_EDITORS: `${APP_BASE_URL}/dashboard/record-editors`,
  CREATE_RECORD_EDITOR: `${APP_BASE_URL}/dashboard/record-editors/create`,
  EDIT_RECORD_EDITOR: `${APP_BASE_URL}/dashboard/record-editors/edit/:id`,

  ASSUMPTIONS: `${APP_BASE_URL}/dashboard/assumptions`,

  MODELS_LIST: `${APP_BASE_URL}/dashboard/models`,
  CREATE_MODEL: `${APP_BASE_URL}/dashboard/models/create`,
  DUPLICATE_MODEL: `${APP_BASE_URL}/dashboard/models/duplicate/:id`,
  MODELS_WORKBOOK: `${APP_BASE_URL}/dashboard/models/workbook/:id`,

  // Rule Based Model
  RULE_BASED_MODEL_LIST: `${APP_BASE_URL}/dashboard/${RBM_DISPLAY_NAME.value}`,
  CREATE_RULE_BASED_MODEL: `${APP_BASE_URL}/dashboard/${RBM_DISPLAY_NAME.value}/config`,
  RULE_BASED_MODEL: `${APP_BASE_URL}/dashboard/${RBM_DISPLAY_NAME.value}/edit/:id`,
  VIEW_RULE_BASED_MODEL: `${APP_BASE_URL}/dashboard/${RBM_DISPLAY_NAME.value}/reload-table`,
};

const APP_ROUTES_BREADCRUMBS = {
  [APP_ROUTES.DASHBOARD]: [],
  [APP_ROUTES.SOURCE_TABLES]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Source Tables',
      url: '',
    },
  ],
  [APP_ROUTES.VIEW_SOURCE_TABLE]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Source Tables',
      url: APP_ROUTES.SOURCE_TABLES,
    },
    {
      name: 'View Table',
      url: '',
    },
  ],
  [APP_ROUTES.VIEW_RELOAD_TABLE]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Source Tables',
      url: APP_ROUTES.SOURCE_TABLES,
    },
    {
      name: 'Reload Table',
      url: '',
    },
  ],
  [APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
      url: APP_ROUTES.DIMENSIONS,
    },
    {
      name: 'Reload Table',
      url: '',
    },
  ],
  [APP_ROUTES.IMPORT_TABLE]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Source Tables',
      url: APP_ROUTES.SOURCE_TABLES,
    },
    {
      name: 'Import Table',
      url: '',
    },
  ],
  [APP_ROUTES.CREATE_SOURCE_TABLE]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Source Tables',
      url: APP_ROUTES.SOURCE_TABLES,
    },
    {
      name: 'Create Table',
      url: '',
    },
  ],
  [APP_ROUTES.PROCESS_BUILDER]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Process Builder',
      url: '',
    },
  ],
  [APP_ROUTES.CREATE_PROCESS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Process Builder',
      url: APP_ROUTES.PROCESS_BUILDER,
    },
    {
      name: 'Create Process',
      url: '',
    },
  ],
  [APP_ROUTES.EDIT_PROCESS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Process Builder',
      url: APP_ROUTES.PROCESS_BUILDER,
    },
    {
      name: 'Edit Process',
      url: '',
    },
  ],
  [APP_ROUTES.PIVOTS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Pivots',
      url: '',
    },
  ],
  [APP_ROUTES.PIVOT_DEMO]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Pivot Demo',
      url: '',
    },
  ],
  [APP_ROUTES.REPORTS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Reports',
      url: '',
    },
  ],
  [APP_ROUTES.DIMENSIONS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
      url: '',
    },
  ],
  [APP_ROUTES.CREATE_DIMENSION]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
      url: APP_ROUTES.DIMENSIONS,
    },
    {
      name: `New ${AI_MODULES_DISPLAY_NAME.dimension}`,
      url: '',
    },
  ],
  [APP_ROUTES.EDIT_DIMENSION]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
      url: APP_ROUTES.DIMENSIONS,
    },
    {
      name: `Edit ${AI_MODULES_DISPLAY_NAME.dimension}`,
      url: '',
    },
  ],
  [APP_ROUTES.SCENARIOS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Scenarios',
      url: '',
    },
  ],
  [APP_ROUTES.ARCHIVED_SCENARIOS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Scenarios',
      url: APP_ROUTES.SCENARIOS,
    },
    {
      name: 'Archived',
      url: '',
    },
  ],
  [APP_ROUTES.CREATE_SCENARIO]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Scenarios',
      url: APP_ROUTES.SCENARIOS,
    },
    {
      name: 'New Scenario',
      url: '',
    },
  ],
  [APP_ROUTES.EDIT_SCENARIO]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Scenarios',
      url: APP_ROUTES.SCENARIOS,
    },
    {
      name: 'Edit Scenario',
      url: '',
    },
  ],
  [APP_ROUTES.VIEW_SCENARIO]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Scenarios',
      url: APP_ROUTES.SCENARIOS,
    },
    {
      name: 'View Scenario',
      url: '',
    },
  ],
  [APP_ROUTES.RECORD_EDITORS]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Record Editor',
      url: '',
    },
  ],
  [APP_ROUTES.CREATE_RECORD_EDITOR]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Record Editor',
      url: APP_ROUTES.RECORD_EDITORS,
    },
    {
      name: 'New Record Editor',
      url: '',
    },
  ],
  [APP_ROUTES.EDIT_RECORD_EDITOR]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Record Editor',
      url: APP_ROUTES.RECORD_EDITORS,
    },
    {
      name: 'Edit Record Editor',
      url: '',
    },
  ],
  [APP_ROUTES.MODELS_LIST]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Modeling',
      url: '',
    },
  ],
  [APP_ROUTES.CREATE_MODEL]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Modeling',
      url: APP_ROUTES.MODELS_LIST,
    },
    {
      name: 'Create',
      url: '',
    },
  ],
  [APP_ROUTES.DUPLICATE_MODEL]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Modeling',
      url: APP_ROUTES.MODELS_LIST,
    },
    {
      name: 'Copy Model',
      url: '',
    },
  ],
  [APP_ROUTES.MODELS_WORKBOOK]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: 'Modeling',
      url: APP_ROUTES.MODELS_LIST,
    },
    {
      name: 'Edit Model',
      url: '',
    },
  ],

  // Rule Based Model bread-crumb
  [APP_ROUTES.RULE_BASED_MODEL_LIST]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: RBM_DISPLAY_NAME.rbmBreadcrumb,
      url: '',
    },
  ],

  [APP_ROUTES.CREATE_RULE_BASED_MODEL]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: RBM_DISPLAY_NAME.label,
      url: APP_ROUTES.RULE_BASED_MODEL_LIST,
    },
    {
      name: 'Create',
      url: '',
    },
  ],
  [APP_ROUTES.RULE_BASED_MODEL]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: RBM_DISPLAY_NAME.rbmBreadcrumb,
      url: APP_ROUTES.RULE_BASED_MODEL_LIST,
    },
    {
      name: `View ${RBM_DISPLAY_NAME.label}`,
      url: '',
    },
  ],
  [APP_ROUTES.VIEW_RULE_BASED_MODEL]: [
    {
      name: 'Dashboard',
      url: APP_ROUTES.DASHBOARD,
    },
    {
      name: RBM_DISPLAY_NAME.rbmBreadcrumb,
      url: APP_ROUTES.RULE_BASED_MODEL_LIST,
    },
    {
      name: 'Reload Table',
      url: '',
    },
  ],
};

export { APP_BASE_URL, APP_ROUTES, APP_ROUTES_BREADCRUMBS };
