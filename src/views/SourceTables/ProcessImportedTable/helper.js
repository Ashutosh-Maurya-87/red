import moment from 'moment';

import {
  MAX_COLS_FOR_IMPORT,
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
} from '../../../configs/app';
import { API_URLS } from '../../../configs/api';
import { IMPORT_RELOAD_TYPES_MSG } from '../../../configs/messages';

import { httpPost } from '../../../utils/http';
import validateString from '../../../utils/helper/validateString';
import getNumberFromAlphabet from '../../../utils/helper/getNumberFromAlphabet';
import getNumbers from '../../../utils/helper/getNumbers';

/**
 * To get dynamic array of import types
 *
 * @param {Object} reloadObj
 * @returns {Array}
 */
export const getReloadImportTypes = reloadObj => {
  const { dimension = '', ruleModel = '' } = reloadObj || {};

  return [
    dimension || ruleModel
      ? IMPORT_RELOAD_TYPES_MSG.update_existing_members
      : IMPORT_RELOAD_TYPES_MSG.paste_append_below,
    IMPORT_RELOAD_TYPES_MSG.delete_and_replace,
  ];
};

// regx to identify space in string
export const regxToIdentifySpace = /[^a-zA-Z0-9]/g;

/**
 * Get Valid Data Cell Value
 *
 * Maybe String, Date, Number
 *
 * @return {String}
 */
export const getValidDateCellValue = cellValue => {
  if (
    cellValue &&
    typeof cellValue == 'object' &&
    moment(cellValue).isValid()
  ) {
    return moment(cellValue).format(DEFAULT_DATE_FORMAT);
  }

  return validateString(cellValue);
};

/**
 * Get Valid Header Name
 *
 * @param {String} str
 *
 * @return {String}
 */
export const getValidHeaderName = (str = '') => {
  if (!str) return '';

  return String(str).replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Get Error Message for max imported columns
 *
 * @param {Number}
 *
 * @return {String}
 */
export const getMaxColsMessage = count => {
  return MAX_COLS_FOR_IMPORT.max_cols_imported
    .replace('#MAX_COLS_FOR_IMPORT#', MAX_COLS_FOR_IMPORT)
    .replace('#COUNT#', count);
};

/**
 * Get Column Index via Cell Address
 *
 * @param {String} cellKey
 *
 * @return {Number}
 */
const getColIndex = cellKey => {
  return getNumberFromAlphabet(cellKey.replace(/[^a-zA-Z]+/g, '')) - 1;
};

/**
 * Get Row Index via Cell Address
 *
 * @param {String} cellKey
 *
 * @return {Number}
 */
const getRowIndex = cellKey => {
  return Number(cellKey.replace(/^\D+/g, '')) - 1;
};

/**
 * Get formatted params to save imported table
 *
 * @param {Object} state
 * @param {Object} props
 */
export function formatParamsToImportTable(state, props, jexcel) {
  const {
    sourceTable: { fileName, data },
  } = props;

  const {
    headers,
    transposedHeaders = [],
    importedHeadersXY,
    multiTransposedHeadersXY,
  } = state;

  const getSkipRowsCount = () => {
    let skipRows = importedHeadersXY.y1;

    if (
      multiTransposedHeadersXY.y1 != undefined &&
      importedHeadersXY.y1 > multiTransposedHeadersXY.y1
    ) {
      skipRows = multiTransposedHeadersXY.y1;
    }

    return skipRows;
  };

  const skip_rows = getSkipRowsCount();

  // To Do: Multi Transpose

  const previewFields = [];
  const selectedFields = [];

  let previewField;
  let selectedField;

  const apiColumnNames = [];

  const getDuplicateNameIndex = name => {
    return apiColumnNames.filter(n => n == name).lastIndexOf(name);
  };

  const getImportType = () => {
    if (transposedHeaders.length > 0) {
      return 'with_transpose';
    }

    return 'without_transpose';
  };

  headers.forEach((col, index) => {
    // Prepare Import Headers
    if (col.forImport) {
      const rowIndex = getRowIndex(col.cellKey);
      const colIndex = getColIndex(col.cellKey);

      let name = String(data[rowIndex][colIndex]);

      const duplicateNameIndex = getDuplicateNameIndex();
      if (duplicateNameIndex >= 0) name += `.${duplicateNameIndex + 1}`;

      previewField = {
        original_name: name,
        display_name: col.label,
        data_type: col.newDataType ? col.newDataType : col.dataType,
        date_format: col.dateFormat || '',
        cell_key: col.cellKey,
        is_transpose: false,
      };

      selectedField = {
        name,
        cell_key: col.cellKey,
        index: getColIndex(col.cellKey),
        is_transpose: false,
      };

      selectedFields.push(selectedField);
      previewFields.push(previewField);
    }

    if (col.forTranspose) {
      previewField = {
        original_name: col.label,
        display_name: col.label,
        data_type: col.dataType,
        date_format: col.dateFormat || '',
        cell_key: '',
        index,
        is_transpose: true,
      };

      previewFields.push(previewField);
    }
  });

  // Prepare Transpose Headers
  transposedHeaders.forEach((cellKey, index) => {
    const rowIndex = getRowIndex(cellKey);
    const colIndex = getColIndex(cellKey);
    const cellValue = data[rowIndex][colIndex];

    selectedField = {
      name: cellValue,
      cell_key: cellKey,
      index: colIndex,
      is_transpose: true,
    };

    selectedFields.push(selectedField);
  });

  const meta = {
    name: fileName,
    preview_fields: previewFields,
    selected_fields: selectedFields,
    skip_rows,
    import_type: getImportType(),
  };

  return { meta };
}

/**
 * Get formatted params to save reload table
 *
 * @param {Object} state
 * @param {Object} props
 */
export function formatParamsToReloadTable(state, props) {
  const {
    sourceTable: { data },
  } = props;

  const { headers, reloadImportType } = state;

  const importParams = formatParamsToImportTable(state, props);

  const getSourceFieldName = header => {
    const { cellKey, forTranspose } = header;

    if (forTranspose) return header.label;

    const rowIndex = getRowIndex(cellKey);
    const colIndex = getColIndex(cellKey);
    const cellValue = data[rowIndex][colIndex];

    return cellValue;
  };

  const getMappings = () => {
    return headers.map(header => ({
      source_field_name: getSourceFieldName(header),
      destination_field_name: header.newLabel || header.label,
      destination_field_id: header.id || '',
      data_type: header.newDataType || header.dataType,
      date_format: header.dateFormat,
    }));
  };

  return {
    ...importParams,
    mappings: getMappings(),
    data_append: reloadImportType == getReloadImportTypes()[0],
    file_type: 'new',
  };
}

/**
 * Get Value for Preview as per selected Data Type
 *
 * @param {Object}
 */
export const getValueAsPerType = ({ value, dataType, dateFormat }) => {
  switch (dataType) {
    case COLUMN_DATA_TYPES_KEYS.alphanumeric:
      return value;

    case COLUMN_DATA_TYPES_KEYS.amount:
      return getNumbers(value, true);

    case COLUMN_DATA_TYPES_KEYS.date:
      return value ? moment(value).format(dateFormat) : '';

    default:
      return value;
  }
};

/**
 * Validate table name is already exist or not
 *
 * @param {String} tableName
 */
export const validateTableName = async (tableName, tableId = '') => {
  const params = {
    name: tableName,
    source_id: tableId,
  };

  const url = API_URLS.VALIDATE_TABLE_NAME;

  return httpPost(url, params);
};

/**
 * format header array from API result
 *
 * @param {Array} headers
 */
export const getFormattedHeader = headers => {
  const formattedHeaders = [];

  headers.map(header => {
    const { data_type, display_name, width } = header;

    const customHeaders = {
      dataType: data_type,
      disableEvents: true,
      forImport: true,
      label: display_name,
      oldLabel: display_name,
      readOnly: true,
      width,
    };

    formattedHeaders.push(customHeaders);

    return header;
  });

  return formattedHeaders;
};

/**
 * format table rows array from API result
 *
 * @param {Array} headers
 * @param {Array} rows
 */
export const getFormattedRows = (headers, rows) => {
  const formattedRows = [];

  rows.map(row => {
    const rowAsArray = [];

    Object.values(row).map((value, index) => {
      const { data_type, width } = headers[index];
      const customHRow = {
        dataType: data_type,
        disableEvents: true,
        readOnly: true,
        realValue: value,
        value,
        width,
      };

      rowAsArray.push(customHRow);
      return value;
    });

    formattedRows.push(rowAsArray);
    return row;
  });

  return formattedRows;
};

/**
 * Identify the duplicate column name
 *
 * @param {Array} headers
 * @param {String} name
 */
export const isDuplicateColumnExist = (headers, name) => {
  const result = headers.filter(header => header.label === name);

  return result.length > 0 ? true : false;
};

/**
 * Generate new column name
 *
 * @param {Array} headers
 * @param {Number} Count
 *
 * @return {Object}
 */
export const generateColumnName = (headers, count) => {
  const id = count + 1;
  const name = `Column ${id}`;

  if (isDuplicateColumnExist(headers, name)) {
    return generateColumnName(headers, id);
  }

  return name;
};
