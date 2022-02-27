export const MAX_RECORDS_TO_SHOW = 100;

export const SUPPORTED_MIME_TYPES = [
  '',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/wps-office.xlsx',
];

export const SUPPORTED_FILE_TYPES = ['csv', 'xls', 'xlsx'];

export const ROLLUP_OPERATORS = ['+', '-'];

// export const REVERSE_SIGN = [
//   { label: 'YES', value: 'yes' },
//   { label: 'NO', value: 'no' },
// ];

export const MATH_TYPE = [
  { label: 'SUM', value: 'sum' },
  { label: 'AVG', value: 'avg' },
  { label: 'EOP', value: 'eop' },
];

// export const POSITIVE_VARIANCE = [
//   { label: 'GOOD', value: 'good' },
//   { label: 'BAD', value: 'bad' },
// ];

export const GL_ACCOUNT_HEADER_NAMES = [
  'GL Account ID',
  'Name',
  'Rollup Operator',
  // 'Reverse Sign',
  'Math Type',
  // 'Positive Variance',
];

export const GL_ACCOUNT_HEADERS_VALUES = {
  math_type: 'math_type',
  // positive_variance: 'positive_variance',
  // reverse_sign: 'reverse_sign',
};

export const GL_HEADER_TYPES = {
  dropdown: 'dropdown',
  text: 'text',
};

export const GL_ACCOUNT_HEADERS = [
  {
    type: GL_HEADER_TYPES.text,
    title: GL_ACCOUNT_HEADER_NAMES[0],
    width: 150,
  },
  {
    type: GL_HEADER_TYPES.text,
    title: GL_ACCOUNT_HEADER_NAMES[1],
    width: 150,
  },
  {
    type: GL_HEADER_TYPES.dropdown,
    title: GL_ACCOUNT_HEADER_NAMES[2],
    width: 150,
    source: [...ROLLUP_OPERATORS],
  },
  // {
  //   type: 'dropdown',
  //   title: GL_ACCOUNT_HEADER_NAMES[3],
  //   width: 150,
  //   source: [...REVERSE_SIGN.map(({ label }) => label)],
  // },
  {
    type: GL_HEADER_TYPES.dropdown,
    title: GL_ACCOUNT_HEADER_NAMES[3],
    width: 150,
    source: [...MATH_TYPE.map(({ label }) => label)],
  },
  // {
  //   type: 'dropdown',
  //   title: GL_ACCOUNT_HEADER_NAMES[5],
  //   width: 150,
  //   source: [...POSITIVE_VARIANCE.map(({ label }) => label)],
  // },
];
