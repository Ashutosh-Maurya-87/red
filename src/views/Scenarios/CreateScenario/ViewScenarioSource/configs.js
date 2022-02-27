import moment from 'moment';

/**
 * Initial Pagination State
 */
export const INITIAL_PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

export const TABLE_CONFIGS = {
  headerCellHeight: 40,
  firstColWidth: 40,
  headerDateFormat: 'MMM YYYY',
};

export const DEFAULT_HEADERS = [
  '',
  'Period',
  ...Array.apply(0, Array(12)).map((_, i) => {
    return moment().month(i).format(TABLE_CONFIGS.headerDateFormat);
  }),
];

export const DEFAULT_DATA = [
  [
    {
      label: 1,
    },
    {
      label: 'Source',
    },
  ],
  [
    {
      label: 2,
    },
    {
      label: 'Source Period',
    },
  ],
];
