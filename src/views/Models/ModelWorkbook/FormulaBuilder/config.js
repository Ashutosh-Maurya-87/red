export const FORMULA_KEYS = {
  ROW: 'ROW',
  ASSUMPTION: 'ASSUMPTION',
  CONSTANT: 'CONSTANT',
  OPERATOR: 'OPERATOR',
  GROUP: 'GROUP',
};

export const FIELD_OPERATIONS = [
  {
    key: '',
    label: 'None',
    func: '',
  },
  {
    key: 'MIN',
    func: 'MIN',
    label: 'Min',
  },
  {
    key: 'MAX',
    func: 'MAX',
    label: 'Max',
  },
  {
    key: 'AVERAGE', // For JS
    func: 'AVG', // For API
    label: 'Average',
  },
  {
    key: 'SUM',
    func: 'SUM',
    label: 'Sum',
  },
  {
    key: 'COUNT',
    func: 'COUNT',
    label: 'Count',
  },
];

export const BUILDER_OPTIONS = [
  {
    key: FORMULA_KEYS.ROW,
    label: 'Add Row',
  },
  {
    key: FORMULA_KEYS.ASSUMPTION,
    label: 'Add Assumption',
  },
  // { // NO NEED in Typing support
  //   key: FORMULA_KEYS.CONSTANT,
  //   label: 'Add Input',
  // },
  {
    key: FORMULA_KEYS.OPERATOR,
    label: '+',
    operator: '+',
  },
  {
    key: FORMULA_KEYS.OPERATOR,
    label: '-',
    operator: '-',
  },
  {
    key: FORMULA_KEYS.OPERATOR,
    label: '*',
    operator: '*',
  },
  {
    key: FORMULA_KEYS.OPERATOR,
    label: '/',
    operator: '/',
  },
  // {
  //   key: FORMULA_KEYS.OPERATOR,
  //   label: '%',
  //   operator: '%',
  // },
  {
    key: FORMULA_KEYS.GROUP,
    label: '(',
    operator: '(',
  },
  {
    key: FORMULA_KEYS.GROUP,
    label: ')',
    operator: ')',
  },
];

export const BUILDER_OPT_CONFIGS = {
  [FORMULA_KEYS.OPERATOR]: {
    type: FORMULA_KEYS.OPERATOR,
    value: '',
    value_source: '',
    signature: '',
    function_name: 'operator',
    params: [],
  },
  [FORMULA_KEYS.CONSTANT]: {
    type: FORMULA_KEYS.CONSTANT,
    value: '',
    value_source: '',
    signature: '',
    function_name: 'constant',
    params: [],
  },
  [FORMULA_KEYS.GROUP]: {
    type: FORMULA_KEYS.GROUP,
    value: '',
    value_source: '',
    signature: '',
    function_name: 'group',
    params: [],
  },
};
