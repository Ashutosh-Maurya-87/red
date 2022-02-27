/**
 * Get Formatted Headers
 *
 * @param {Object} options
 * @return {Array}
 */
export const getFormattedHeaders = ({ metaData }) => {
  const headers = metaData.map(header => {
    const {
      is_unique = false,
      data_type = '',
      date_format = '',
      display_name = '',
      name = '',
    } = header || {};

    const newHeader = {
      isUnique: is_unique,
      dataType: data_type,
      dateFormat: date_format,
      label: display_name,
      name,
    };

    return newHeader;
  });

  return headers;
};

/**
 * Create default header state of add/edit Dimension
 *
 * @param {Object} options
 * @returns {Array}
 */
export const getInitialHeaders = ({ headers: metaHeaders = [], data }) => {
  const headers = getFormattedHeaders({ metaData: metaHeaders });

  const updatedHeaders = [];

  const { dimension_identifier_col = '' } = data || {};

  headers.forEach((header, headerIndex) => {
    const { name = '' } = header || {};

    if (name == dimension_identifier_col) {
      header = {
        ...header,
        isUnique: true,
      };
    }
    updatedHeaders.push(header);
  });

  return updatedHeaders;
};

/**
 * Getting isUnique key
 *
 * @param {Array} headers
 * @param {Object} record
 * @returns {Bool}
 */
export const isValidForm = (headers, record) => {
  const indexOfUniqueEle = headers.findIndex(
    ({ isUnique = false, name = '' }) => isUnique && !record[name]
  );

  return indexOfUniqueEle > -1;
};
