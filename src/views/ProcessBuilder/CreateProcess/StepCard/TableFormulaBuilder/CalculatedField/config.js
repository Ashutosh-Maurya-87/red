export const FORMULA_KEYS = {
  INPUT: 'INPUT',
  FIELD: 'FIELD',
  OPERATOR: 'OPERATOR',
  IF_OPERATOR: 'IF_OPERATOR',
  BRACKET: 'BRACKET',
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

export const OPERATORS = [
  // {
  //   key: FORMULA_KEYS.INPUT,
  //   label: 'Add Input',
  // },
  {
    key: FORMULA_KEYS.FIELD,
    label: 'Add Field',
  },
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
  {
    key: FORMULA_KEYS.OPERATOR,
    label: '%',
    operator: '%',
  },
  {
    key: FORMULA_KEYS.BRACKET,
    label: '(',
    operator: '(',
  },
  {
    key: FORMULA_KEYS.BRACKET,
    label: ')',
    operator: ')',
  },
  // {
  //   key: FORMULA_KEYS.IF_OPERATOR,
  //   label: 'if',
  //   operator: 'if',
  // },
];
