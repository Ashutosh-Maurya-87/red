import { API_URLS } from '../../configs/api';
import { httpGet, httpPost } from '../../utils/http';

/**
 * Fetch Dimension Details
 *
 * @param {String} id
 *
 * @return {Object}
 */
export const fetchDimension = async id => {
  const url = API_URLS.GET_DIMENSION_BY_ID.replace('#ID#', id);
  const response = await httpGet(url, { hideError: true });
  return response;
};

/**
 * Fetch Hierarchy Levels
 *
 * @param {String} id
 *
 * @return {Object}
 */
export const fetchLevelsConfigs = async id => {
  const url = API_URLS.GET_DIMENSION_LEVELS.replace('#ID#', id);
  const response = await httpGet(url, { hideError: true });
  return response;
};

/**
 * Handle File > Reload Source Table / Dimension
 *
 * @param {Object} file
 * @param {Number} tableId
 *
 */
export const handleFileForReloadTable = async (file, tableId) => {
  try {
    let url = API_URLS.GET_RELOAD_SOURCE_TABLE_PREVIEW;
    url = url.replace('#ID#', tableId);

    const params = { file_url: file };

    const { data } = await httpPost(url, params);

    const meta = data.meta.meta || data.meta || {};

    const previewFieldsWithKeys = {};
    const columnsWithDisplayNames = {};

    const columns = data.columns.map(tableCol => {
      const previewCol = (meta.preview_fields || []).find(field => {
        return tableCol.display_name == field.display_name;
      });

      const updatedTableCol = {
        ...tableCol,
        ...(previewCol || {}),
      };

      columnsWithDisplayNames[updatedTableCol.display_name] = updatedTableCol;

      if (previewCol) {
        previewFieldsWithKeys[previewCol.cell_key] = previewCol;
      }

      return updatedTableCol;
    });

    meta.previewFieldsWithKeys = previewFieldsWithKeys;

    const sourceTableObj = {
      id: tableId,
      file,
      fileName: data.item.display_name,
      fileUrl: file,

      totalRows: data.file_response.total,
      totalColumns: (data.file_response.items[0] || []).length,

      data: data.file_response.items || [],
      dimension: data.dimension || null,
      ruleModel: data.rule_model || null,
      columns,
      columnsWithDisplayNames,
      meta,
    };

    return sourceTableObj;
  } catch (e) {
    console.error(e);
    return null;
  }
};
