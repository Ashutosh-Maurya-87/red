import moment from 'moment';
import { RBM_FORECAST_DATE_FORMAT } from '../../../configs/app';

// Tabs --> Data overview, Forecasting
export const TABS = ['Data Overview', 'Forecast', 'Configurations'];

// Constants
export const COL_WIDTH = 150;
export const LABEL_COL_WIDTH = 50;
export const MAX_ROWS = 1000000;

// Filter type will decide data on grid will filter by BE or FE
export const FILTER_TYPES = {
  online: 'online',
  offline: 'offline',
};

export const DEFAULT_FILTER_TYPE = FILTER_TYPES.online;

/**
 * Default Pagination
 */
export const INITIAL_PAGINATION = {
  total: 0,
  limit: 100,
  page: 1,
};

// Start Date and End Date text
export const startDate = 'start';
export const endDate = 'end';

// Static Forecast Date "Jan 2020" - Format 'YYYY-MM-DD'
const StaticDate = '2020-01-01';

// Default Start date --> 01-Jan-2020
export const defaultStartDate = moment(StaticDate).format(
  RBM_FORECAST_DATE_FORMAT
);

// Default End date --> 31-Dec-2021
export const defaultEndDate = moment(defaultStartDate)
  .add({ y: 2 })
  .subtract({ d: 1 })
  .format(RBM_FORECAST_DATE_FORMAT);

// Default sort config
export const DEFAULT_SORT_CONFIG = {
  sortBy: '',
  sortDirection: '',
};

// Default Filter config
export const DEFAULT_FILTER_CONFIG = {
  rangeValue: undefined,
  dateRange: { start: '', end: '' },
  searchInput: '',
};

// Setup Wizard actions
export const SETUP_WIZARD_ACTIONS = {
  selectCalculation: 'selectCalculation',
  newFieldColumn: 'newFieldColumn',
  onSave: 'onSave',
};

// Row action keys
export const ROW_ACTIONS_KEYS = {
  ADD_RECORD: 'ADD_ROW',
  UPDATE_RECORD: 'UPDATE_ROW',
  DELETE_RECORD: 'DELETE_ROW',
};

// Overview context menu option
export const ROW_ACTIONS = {
  UPDATE_RECORD: {
    label: 'Edit',
    value: 'UPDATE_RECORD',
    action: ROW_ACTIONS_KEYS.UPDATE_RECORD,
  },
  DELETE_RECORD: {
    label: 'Delete',
    value: 'DELETE_RECORD',
    action: ROW_ACTIONS_KEYS.DELETE_RECORD,
  },
};
