import { API_URLS } from '../../../configs/api';
import { EXCEL_DATE_FORMATS } from '../../../configs/app';
import { httpGet } from '../../../utils/http';

/**
 * Get value of column
 *
 * @param {Array} tableColumns
 * @param {String} columnLabel
 */
export const getColumnValue = (tableColumns, label) => {
  const col = tableColumns.filter(({ display_name }) => display_name === label);

  if (col.length > 0) {
    const { name } = col[0];

    return name;
  }

  return label;
};

/**
 * Get format date value
 *
 * @param {String} dateFormat
 */
export const getformatDate = dateFormat => {
  const selectedFormat = EXCEL_DATE_FORMATS.filter(
    ({ label }) => label === dateFormat
  );

  if (selectedFormat.length > 0) {
    const { value } = selectedFormat[0];

    return value;
  }

  return dateFormat;
};

/**
 * Validate Scenario name is already exist or not
 *
 * @param {String} name
 * @param {String || Number} tableId
 */
export const validateScenarioName = async (name, tableId = '') => {
  const encodedTableName = encodeURIComponent(name);
  let url = API_URLS.VALIDATE_SCENARIO_NAME.replace('#NAME#', encodedTableName);

  if (tableId) {
    url += `&source_id=${tableId}`;
  }

  return httpGet(url);
};
