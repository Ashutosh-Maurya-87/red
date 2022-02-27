const DOMAIN_PREFIX = window.location.href.startsWith('https')
  ? 'https'
  : 'https';

const BASE_URLS = {
  development: `${DOMAIN_PREFIX}://api.dev.alterflo.com/api`,
  qa: `${DOMAIN_PREFIX}://api.qa.alterflo.com/api`,
  staging: `${DOMAIN_PREFIX}://api.staging.alterflo.com/api`,
  production: `${DOMAIN_PREFIX}://api.openfpa.com/api`,
};

const API_BASE_URL = BASE_URLS[process.env.REACT_APP_ENV];

/**
 * APIs for Assumptions Module
 */
const ASSUMPTIONS_API = {
  GET_ASSUMPTIONS: `${API_BASE_URL}/assumptions/set`,
  GET_ASSUMPTION: `${API_BASE_URL}/assumptions/set/#ID#`,
  GET_ASSUMPTION_Listing: `${API_BASE_URL}/assumptions/listing?model_id=#ID#`,
  CREATE_ASSUMPTION: `${API_BASE_URL}/assumptions/set`,
  UPDATE_ASSUMPTION: `${API_BASE_URL}/assumptions/set/#ID#`,
  DELETE_ASSUMPTION: `${API_BASE_URL}/assumptions/set/#ID#`,
  RENAME_ASSUMPTION: `${API_BASE_URL}/assumptions/set/#ID#/rename`,
};

/**
 * APIs for Models Module
 */
const MODELS_API = {
  HAS_DRAFT_CHANGES: `${API_BASE_URL}/workbook/#ID#/has-draft-changes`,
  GET_WORKBOOKS: `${API_BASE_URL}/workbooks`,
  GET_WORKBOOK: `${API_BASE_URL}/workbook/#ID#`,
  SAVE_WORKBOOK: `${API_BASE_URL}/workbook/#ID#/save`,
  RUN_WORKBOOK: `${API_BASE_URL}/workbook/#ID#/run`,
  GET_GRID_DATA: `${API_BASE_URL}/workbook/#ID#/sheet/#SHEET_ID#`,

  CREATE_WORKBOOK: `${API_BASE_URL}/workbook`,
  DUPLICATE_WORKBOOK: `${API_BASE_URL}/workbook/#ID#/copy`,
  SCENARIO_ACTUAL_YEARS: `${API_BASE_URL}/scenario/actual-years?scenario_id=#ID#`,

  VALIDATE_NAME: `${API_BASE_URL}/workbook/exist?name=#NAME#`,
  RENAME_WORKBOOK: `${API_BASE_URL}/workbook/#ID#`,
  DELETE_WORKBOOK: `${API_BASE_URL}/workbook/#ID#`,
  EXPORT_WORKBOOK: `${API_BASE_URL}/workbook/#ID#/export`,

  GET_WORKSHEETS: `${API_BASE_URL}/workbook/#ID#/sheets`,
  CREATE_WORKSHEET: `${API_BASE_URL}/workbook/#ID#/sheet`,
  UPDATE_WORKSHEET: `${API_BASE_URL}/workbook/#ID#/sheet/#WORKSHEET_ID#`,
  DELETE_WORKSHEET: `${API_BASE_URL}/workbook/#ID#/sheet/#WORKSHEET_ID#`,
  REORDER_WORKSHEET: `${API_BASE_URL}/workbook/#ID#/sheets/reorder`,
  GET_HIERARCHY: `${API_BASE_URL}/mapping/hierarchy`,

  SAVE_SHARED_MAPPING: `${API_BASE_URL}/workbook/#ID#/sheet/#WORKSHEET_ID#/mappings`,
  DELETE_SHARED_MAPPING: `${API_BASE_URL}/workbook/#ID#/sheet/#WORKSHEET_ID#/mapping/#MAPPING_ID#`,

  SYNC_RECORDS: `${API_BASE_URL}/snapshot/#WORKBOOK_ID#/sheet/#WORKSHEET_ID#`,
  DISCARD_RECORDS: `${API_BASE_URL}/workbook/#ID#/discard-draft`,

  GET_FORMULA_BUILDER_OPTS: `${API_BASE_URL}/masters/#TYPE#/listing`,
  GET_MODEL_DIMENSIONS: `${API_BASE_URL}/workbook/#ID#/dimensions`,

  UPDATE_WIDTH: `${API_BASE_URL}/workbooks/#ID#/sheets/#SHEET_ID#/update-config`,
};

/**
 * APIs for Rule Based Model(#RBM)
 */
const RULE_BASED_MODELS_API = {
  GET_RBM_LIST: `${API_BASE_URL}/rule_models`,
  UPDATE_RBM_CONFIG: `${API_BASE_URL}/rule_model/#ID#/config`,
  CREATE_NEW_RBM: `${API_BASE_URL}/rule_model`,
  GET_SINGLE_RBM: `${API_BASE_URL}/rule_model/#ID#`,
  RENAME_RBM: `${API_BASE_URL}/rule_model/#ID#/rename`,
  DELETE_RBM: `${API_BASE_URL}/rule_model/#ID#/delete`,

  GET_FORECASTING: `${API_BASE_URL}/rule_model/#ID#/view_forecast`,
  GET_OVERVIEW: `${API_BASE_URL}/rule_model/#ID#/overview`,
  EXPORT_TEMPLATE_RBM: `${API_BASE_URL}/rule_model/#ID#/excel_template`,
  EXPORT_FORECAST_RBM: `${API_BASE_URL}/rule_model/#ID#/export_forecast`,
  EXPORT_OVERVIEW_RBM: `${API_BASE_URL}/rule_model/#ID#/export`,
  GET_MIN_MAX_RANGE: `${API_BASE_URL}/source/#SOURCE_ID#/field/#FIELD_ID#/range`,
  GET_RBM_TEMPLATES: `${API_BASE_URL}/rule_models/templates`,

  SYNC_FCT_TO_SCENARIO: `${API_BASE_URL}/rule_model/#ID#/sync_forecast`,
  COPY_RBM: `${API_BASE_URL}/rule_model/copy/#ID#`,
  ROLL_BACK_SCENARIO: `${API_BASE_URL}/rule_model/#ID#/sync/rollback`,
  SWITCH_SCENARIO: `${API_BASE_URL}/rule_model/#ID#/switch_scenario`,
};

const API_URLS = {
  LOGIN: `${API_BASE_URL}/login`,
  SIGN_UP: `${API_BASE_URL}/register`,
  LOGOUT: `${API_BASE_URL}/logout`,
  CONFRIM_EMAIL: `${API_BASE_URL}/confirm/#CODE#`,

  FORGET_PASSWORD: `${API_BASE_URL}/forget-password`,
  RESET_PASSWORD: `${API_BASE_URL}/reset-password/#CODE#`,
  UPDATE_PASSWORD: `${API_BASE_URL}/update-password`,

  GET_PROFILE: `${API_BASE_URL}/profile/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/profile/me`,

  UPLOAD_IMAGE: `${API_BASE_URL}/uploads`,
  UPLOAD_FILE: `${API_BASE_URL}/uploads`,

  SAVE_IMPORTED_TABLE: `${API_BASE_URL}/upload/source-tables`,
  READ_FILE: `${API_BASE_URL}/read-data?file_url=`,
  GET_SOURCE_TABLES: `${API_BASE_URL}/upload/source-tables`,
  GET_SOURCE_TABLE_BY_ID: `${API_BASE_URL}/upload/source-tables/#ID#`,
  RENAME_SOURCE_TABLE: `${API_BASE_URL}/upload/source-tables/#ID#`,
  GET_RELOAD_SOURCE_TABLE_PREVIEW: `${API_BASE_URL}/source/#ID#/reload-preview`,
  SAVE_RELOAD_SOURCE_TABLE: `${API_BASE_URL}/source/#ID#/reload`,
  DELETE_SOURCE_TABLE: `${API_BASE_URL}/upload/source-tables/#ID#`,
  EXPORT_SOURCE_TABLE: `${API_BASE_URL}/export/source-table/#ID#`,
  COPY_SOURCE_TABLE: `${API_BASE_URL}/source-tables/copy/#ID#`,
  GET_COLUMNS_OF_SOURCE_TABLE: `${API_BASE_URL}/upload/table-columns/#ID#`,
  GET_COLUMNS_OF_SOURCE_TABLES: `${API_BASE_URL}/upload/source-tables`,
  CREATE_SOURCE_TABLE: `${API_BASE_URL}/create-table`,
  VALIDATE_TABLE_NAME: `${API_BASE_URL}/user-table/is-exists`,
  REPLICATE_SOURCE_TABLE: `${API_BASE_URL}/source/#SOURCE_ID#/modify`,

  SAVE_PROCESS: `${API_BASE_URL}/process/save`,
  UPDATE_PROCESS: `${API_BASE_URL}/process/update/#ID#`,
  GET_PROCESS_LIST: `${API_BASE_URL}/process/listings`,
  GET_PROCESS_BY_ID: `${API_BASE_URL}/process/#ID#`,
  FINISH_PROCESS: `${API_BASE_URL}/process/#ID#/finish`,
  CANCEL_PROCESS: `${API_BASE_URL}/process/#ID#/cancel`,
  RENAME_PROCESS: `${API_BASE_URL}/process/#ID#/rename`,
  DELETE_PROCESS: `${API_BASE_URL}/process/#ID#`,
  RUN_PROCESS_BY_ID: `${API_BASE_URL}/process/#ID#/execution`,
  RUN_NEXT_STEP_PROCESS: `${API_BASE_URL}/process/#ID#/tasks/#STEP_ID#/step-up`,
  GET_PROCESS_STATUS: `${API_BASE_URL}/process/#ID#/tasks/status`,
  VALIDATE_PROCESS_NAME: `${API_BASE_URL}/user-table/is-exists?process_name=#PROCESS_NAME#`,

  GET_FINANCIAL_ENV_DATA: `${API_BASE_URL}/actual/scenario`,

  EXPORT_GL_ACCOUNT: `${API_BASE_URL}/gl-account/export`,
  IMPORT_GL_ACCOUNT: `${API_BASE_URL}/gl-account/import`,
  SAVE_GL_ACCOUNT: `${API_BASE_URL}/`,
  LIST_GL_ACCOUNT: `${API_BASE_URL}/gl-account/list`,
  LIST_TIME_DIMENSION: `${API_BASE_URL}/dimensions/time/flat`,
  UPDATE_GL_ACCOUNT: `${API_BASE_URL}/gl-account/update`,
  ADD_GL_ACCOUNT: `${API_BASE_URL}/gl-account/save`,
  SAVE_CONFIG_ACTUALS: `${API_BASE_URL}/scenario/save`,

  SAVE_DIMENSION: `${API_BASE_URL}/dimensions/save`,
  GET_DIMENSION_LIST: `${API_BASE_URL}/dimensions/all-info`,
  UPDATE_DIMENSION_RECORD: `${API_BASE_URL}/dimensions/#ID#/records/#RECORD_ID#`,
  ADD_DIMENSION_RECORD: `${API_BASE_URL}/dimensions/#ID#/data`,
  GET_DIMENSION_BY_ID: `${API_BASE_URL}/dims/#ID#`,
  GET_DIMENSION_DATA_BY_ID: `${API_BASE_URL}/dimensions/data?id=#ID#`,
  RENAME_DIMENSION: `${API_BASE_URL}/dimensions/#ID#/rename`,
  DELETE_DIMENSION: `${API_BASE_URL}/dimension?id=#ID#`,
  EXPORT_DIMENSION: `${API_BASE_URL}/dimensions/export?id=#ID#`,
  IMPORT_DIMENSION: `${API_BASE_URL}/dimensions/import`,
  GET_COLUMNS_OF_DIMENSION: `${API_BASE_URL}/dimensions/table/columns?type=#TYPE#&id=#ID#`,
  SAVE_DIMENSION_CONFIGS: `${API_BASE_URL}/dimension/#ID#/config`,
  SAVE_DIMENSION_RELATION: `${API_BASE_URL}/relationship`,
  GET_DIMENSION_RELATION_BY_ID: `${API_BASE_URL}/relationship/#ID#`,

  SAVE_SCENARIO: `${API_BASE_URL}/scenario/save`,
  UPDATE_SCENARIO: `${API_BASE_URL}/scenario/update/#ID#`,
  GET_SCENARIO_LIST: `${API_BASE_URL}/scenario/list`,
  GET_SCENARIO_BY_ID: `${API_BASE_URL}/scenario/#ID#`,
  RENAME_SCENARIO: `${API_BASE_URL}/scenario/#ID#/rename`,
  DELETE_SCENARIO: `${API_BASE_URL}/scenario/#ID#/delete`,
  ARCHIVE_SCENARIO: `${API_BASE_URL}/scenario/#ID#/archive`,
  RESTORE_SCENARIO: `${API_BASE_URL}/scenario/#ID#/restore`,
  SAVE_SCENARIO_RELATION: `${API_BASE_URL}/relations`,
  GET_SCENARIOI_SRC_PERIODS: `${API_BASE_URL}/scenario/#ID#/date-range`,
  VALIDATE_SCENARIO_NAME: `${API_BASE_URL}/scenario/exist?name=#NAME#`,
  EXPORT_SCENARIO: `${API_BASE_URL}/scenario/#ID#/export`,
  SCENARIO_VALIDATION: `${API_BASE_URL}/scenario_validation/#ID#`,

  ADD_HIERARCHY: `${API_BASE_URL}/gl-account-folder`,
  UPDATE_HIERARCHY: `${API_BASE_URL}/gl-account/update`,
  GET_HIERARCHY: `${API_BASE_URL}/gl-account-folders`,
  MOVE_HIERARCHY: `${API_BASE_URL}/move-gl-account`,
  UPDATE_LEVEL: `${API_BASE_URL}/gl-account/folder/#ID#`,
  DELETE_Level: `${API_BASE_URL}/gl-account/delete?id=#ID#`,

  DIMENSION_GET_HIERARCHY: `${API_BASE_URL}/dimensions/folders`,
  DIMENSION_ADD_HIERARCHY: `${API_BASE_URL}/dimensions/folder`,
  DIMENSION_MOVE_HIERARCHY: `${API_BASE_URL}/dimension/#ID#/move-records`,
  DIMENSION_UPDATE_LEVEL: `${API_BASE_URL}/dimensions/#ID#/folder/#FOLDER_ID#`,
  DIMENSION_DELETE_Level: `${API_BASE_URL}/dimension/#ID#/record/#FOLDER_ID#`,
  VALIDATE_DIMENSION_NAME: `${API_BASE_URL}/dimension/exist?name=#NAME#`,
  TIME_DIMENSION_SAVE: `${API_BASE_URL}/dimensions/time/save`,
  TIME_DIMENSION_UPDATE: `${API_BASE_URL}/dimensions/time/update`,
  CLEAR_DIMENSION: `${API_BASE_URL}/dimension/#ID#/clear`,

  GET_LABELS: `${API_BASE_URL}/labels`,
  ADD_LABEL: `${API_BASE_URL}/label`,
  UPDATE_LABEL: `${API_BASE_URL}/label/#ID#`,
  DELETE_LABEL: `${API_BASE_URL}/label/#ID#`,
  ASSIGN_LABEL: `${API_BASE_URL}/scenario/#ID#/add/label`,
  UNASSIGN_LABEL: `${API_BASE_URL}/scenario/#ID#/remove/label`,

  SAVE_RECORD_EDITOR: `${API_BASE_URL}/record-editor`,
  UPDATE_RECORD_EDITOR: `${API_BASE_URL}/record-editor/#ID#`,
  GET_RECORD_EDITORS: `${API_BASE_URL}/record-editors`,
  GET_RECORD_EDITOR_BY_ID: `${API_BASE_URL}/record-editor/#ID#`,
  RENAME_RECORD_EDITOR: `${API_BASE_URL}/record-editor/#ID#/rename`,
  DELETE_RECORD_EDITOR: `${API_BASE_URL}/record-editor/#ID#`,
  ARCHIVE_RECORD_EDITOR: `${API_BASE_URL}/record-editors/#ID#/archive`,
  RESTORE_RECORD_EDITOR: `${API_BASE_URL}/record-editors/#ID#/restore`,
  GET_COLUMNS_BY: `${API_BASE_URL}/source/#ID#/columns`,
  GET_RECORD_FOR_EDIT: `${API_BASE_URL}/record-editor/#ID#/fields/data`,
  COPY_RECORD_EDITOR: `${API_BASE_URL}/record-editor/#ID#/duplicate`,
  ADD_NEW_RECORD_RE: `${API_BASE_URL}/record-editor/#ID#/fields/data/create`,
  UPDATE_RECORD_RE: `${API_BASE_URL}/record-editor/#ID#/fields/data/save`,
  GET_RELATED_FIELD_OPTIONS_RE: `${API_BASE_URL}/table/#ID#/list`,
  GET_VALUES_LIST_OF_COLUMN_IN_TABLE: `${API_BASE_URL}/#SOURCE_TYPE#/#TABLE_ID#/field/#COL_ID#/listing`,

  GET_DIMENSION_LEVELS: `${API_BASE_URL}/dimension-level/#ID#`,
  SAVE_DIMENSION_LEVELS: `${API_BASE_URL}/dimension-level/#ID#`,

  MODELS_API,
};

export {
  API_BASE_URL,
  API_URLS,
  MODELS_API,
  ASSUMPTIONS_API,
  RULE_BASED_MODELS_API,
};
