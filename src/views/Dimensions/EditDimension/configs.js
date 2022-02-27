export const TABS = [
  'Edit View',
  'Hierarchy',
  'Relationship',
  'Configurations',
];

export const TYPES = ['custom', 'gl_account', 'time_hierarchy', 'currency'];

export const MAX_DIMENSION_NAME = 50; // Max characters length

export const getSystemDimensionName = ({ type, defaultName }) => {
  switch (type) {
    case TYPES[1]:
      return GL_ACCOUNT_STR.display_name;

    case TYPES[2]:
      return 'time_hierarchy';

    default:
      return defaultName || '';
  }
};

export const GL_ACCOUNT_STR = {
  display_name: 'Chart of Accounts',
  id: 'gl_account',
  type: 'gl_account',
};
