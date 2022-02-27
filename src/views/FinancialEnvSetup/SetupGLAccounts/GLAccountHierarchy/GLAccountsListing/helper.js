export function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;

  if (b[orderBy] > a[orderBy]) return 1;

  return 0;
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);

    if (order !== 0) return order;

    return a[1] - b[1];
  });

  return stabilizedThis.map(el => el[0]);
}

export const getSelectedNodes = (nodes, data) => {
  if (!data) return [];

  const ids = [];
  for (const [, value] of Object.entries(nodes)) {
    ids.push(value);
  }

  const hierarchies = [];
  data.forEach(element => {
    const isMatched = ids.includes(element.affa_record_id);
    if (isMatched) {
      hierarchies.push(element);
    }
  });

  return { ...hierarchies };
};

export const CHECKBOX_HEADER = [
  {
    name: 'checkbox_gl_hierarchy',
    display_name: '',
    info: '',
    numeric: false,
    disablePadding: false,
    width: 60,
  },
];

export const HEADERS = [
  ...CHECKBOX_HEADER,
  ...[
    {
      name: 'identifier',
      display_name: 'GL Account ID',
      info: '',
      numeric: false,
      disablePadding: false,
      width: 300,
    },
    {
      name: 'affa_h_key_name',
      display_name: 'Name',
      info: false,
      numeric: false,
      disablePadding: false,
      width: 300,
    },
    {
      name: 'rollup_op',
      display_name: 'Rollup Operator',
      info: 'Rollup Operator',
      numeric: false,
      disablePadding: false,
      width: 300,
    },
    // {
    //   name: 'reverse_sign',
    //   display_name: 'Reverse Sign',
    //   info: 'Reverse Sign',
    //   numeric: false,
    //   disablePadding: false,
    //   width: 300,
    // },
    {
      name: 'math_type',
      display_name: 'Math Type',
      info: 'Math Type',
      numeric: false,
      disablePadding: false,
      width: 300,
    },
    // {
    //   name: 'positive_variance',
    //   display_name: 'Positive Variance',
    //   info: 'Positive Variance',
    //   numeric: false,
    //   disablePadding: false,
    //   width: 300,
    // },
  ],
];

export const SETTINGS_HEADER = [
  {
    name: 'settings_gl_hierarchy',
    display_name: '',
    info: '',
    numeric: false,
    disablePadding: false,
    width: 70,
  },
];
