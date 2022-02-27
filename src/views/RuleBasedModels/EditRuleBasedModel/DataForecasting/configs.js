import { FILTER_TYPES } from '../configs';

// Custom header to add in Forecasting Grid
export const customMetaHeaders = [
  {
    name: 'gl_display',
    display_name: 'GL Account',
    data_type: 'alphanumeric',
    date_format: '',
    width: '150px',
    filterType: FILTER_TYPES.offline,
  },
  {
    name: 'rule_display',
    display_name: 'Calculations',
    data_type: 'alphanumeric',
    date_format: '',
    width: '150px',
    filterType: FILTER_TYPES.offline,
  },
];
