import moment from 'moment';
import { getGridDensity } from '../../../../utils/localStorage';
import {
  DEFAULT_DENSITY,
  RECORD_DENSITY_SIZES_KEYS,
} from '../../../../configs/density';

/**
 * Date Format for Header
 */
export const HEADER_DATE_FORMAT = 'MMM';

/**
 * Get Header column width
 */
export const getHeadersWidth = () => {
  let density = getGridDensity();

  if (!density) {
    density = DEFAULT_DENSITY;
  }

  return RECORD_DENSITY_SIZES_KEYS[density?.toLocaleLowerCase()];
};

/**
 * Horizontal Headers
 *
 * @param {String} fiscalMonth
 */
export const getGridHeaders = fiscalMonth => {
  let month = 0;
  if (fiscalMonth) month = moment(fiscalMonth, 'MMM YYYY').month();

  const width = getHeadersWidth();

  const headers = [
    '',
    ...Array.apply(0, Array(12)).map((_, i) => {
      return moment()
        .month(month + i)
        .format(HEADER_DATE_FORMAT);
    }),
    'Fiscal Year',
  ].map(month => ({ value: month, label: month, width }));

  return headers;
};

/**
 * Vertical Headers
 */
const YEARS = Array.apply(0, Array(4)).map((_, i) => {
  const month = moment()
    .year(moment().year() - 3 + i)
    .format('YYYY');

  return { value: month, label: month, readOnly: true };
});

/**
 * Default Cell Value Object
 */
const DEFAULT_CELL = {
  value: 'x',
  readOnly: true,
};

/**
 * Prepare Initial data for Grid
 */
const prepareInitialData = headers => {
  const DATA = [];

  YEARS.forEach((year, i) => {
    if (!DATA[i]) DATA[i] = [];

    headers.forEach((header, j) => {
      if (!DATA[i][j]) DATA[i][j] = {};

      if (j == 0) DATA[i][j] = year;
      if (j != 0) DATA[i][j] = { ...DEFAULT_CELL };
    });
  });

  return DATA;
};

export { YEARS, DEFAULT_CELL, prepareInitialData };
