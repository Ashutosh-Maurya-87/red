import getNumbers from '../../../utils/helper/getNumbers';
import { FIELD_TYPE_KEYS, regxToFindNumber } from './configs';

/**
 * Make Copy
 *
 * @param {Any} data
 *
 * @param {Any}
 */
export const makeCopy = data => {
  return JSON.parse(JSON.stringify(data));
};

export const DEFAULT_COL_HEADER = [
  { label: 'Column', width: 125, colSpan: 2, type: FIELD_TYPE_KEYS.number },
  { label: '', width: 125 },
];

/**
 * Get Initial Headers
 *
 * @return {Array}
 */
export const getInitialHeaders = () => {
  const firstRow = [
    { width: 50 },
    { label: 'Description', width: 250, rowSpan: 2 },
    ...makeCopy(DEFAULT_COL_HEADER),
  ];

  return firstRow;
};

/**
 * Get formatted headers
 *
 * @param {Array} apiHeaders
 *
 * @return {Array}
 */
export const getFormattedHeaders = (apiHeaders = []) => {
  const firstRow = [
    { width: 50 },
    { label: 'Description', width: 250, rowSpan: 2 },
    ...makeCopy(DEFAULT_COL_HEADER),
    // ...makeCopy(DEFAULT_COL_HEADER),
    // ...makeCopy(DEFAULT_COL_HEADER),
    // ...makeCopy(DEFAULT_COL_HEADER),
    // ...makeCopy(DEFAULT_COL_HEADER),
    // ...makeCopy(DEFAULT_COL_HEADER),
  ];

  return firstRow;
};

/**
 * Get Empty Row
 *
 * @param {Number} colsCount
 *
 * @param {Array}
 */
export const getEmptyRowOnLoad = colsCount => {
  const emptyRow = [];

  for (let i = 0; i < colsCount; i++) {
    let testValue = '';

    let random = Math.random().toString(36).substring(7);

    if (i == 1) testValue = 'Description - ';
    if (i % 2 == 0) testValue = 'Label';
    if (i > 1 && i % 2 == 1) random = getNumbers(random) || '0';

    testValue += random;

    emptyRow.push({ value: testValue });
  }

  return emptyRow;
};

/**
 * Get formatted sheet data
 *
 * @return {Array}
 */
export const getFormattedData = colsCount => {
  const rows = [];

  for (let i = 0; i < 50; i++) {
    rows.push(getEmptyRowOnLoad(colsCount));
  }

  // Adding Empty Row
  rows.push(getEmptyGridRow(colsCount));

  return rows;
};

/**
 * Get Empty Row
 */
export const getEmptyGridRow = colsCount => {
  const row = [...Array.apply(0, Array(colsCount))].map((_, i) => {
    return { value: '' };
  });

  return row;
};

/**
 * Validate label Pattern
 */
export const validateLabelPattern = value => {
  return value.length > 0 && value.charAt(0).match(regxToFindNumber);
};
