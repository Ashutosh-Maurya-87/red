/**
 * Get formatted hierarchy data from API
 *
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const getFormattedHierarchyList = hierarchy => {
  const map = {};

  hierarchy.forEach((obj, i) => {
    if (obj.affa_parent_folder_id == null && obj.affa_record_id !== 1) {
      obj.affa_parent_folder_id = 1;
    }

    obj.children = [];
    map[obj.affa_record_id] = obj;

    const parent = obj.affa_parent_folder_id || null;
    if (!map[parent]) map[parent] = { children: [] };

    map[parent].children.push(obj);
  });

  return [map[1]];
};

/**
 *
 * @param {Array} extract
 * @param {Array} posting
 * @param {Number/String} id
 *
 * @return {Object}
 */
export const getFormattedMappingParams = (extract, posting, id) => {
  const formattedExtract = extract.map(item => {
    const { affa_record_id, affa_record_type } = item || {};

    return {
      member_id: affa_record_id,
      member_type: affa_record_type == 'folder' ? affa_record_type : 'leaf',
    };
  });

  const extractMappings = {
    dimension_id: id,
    mappings: formattedExtract,
  };

  return {
    read_mappings: extract.length > 0 ? [extractMappings] : [],
    write_mappings: extract.length > 0 ? [extractMappings] : [],
  };
};

/**
 * Find selected dimension in all grid rows
 *
 * @param {Array} mappings
 * @param {Object} dimension
 *
 * @return {Boolean}
 */
export const isDimensionBindedToRow = (mappings, { id } = {}) => {
  let isExist = false;

  mappings.forEach(({ readMappings = [], writeMappings = [] } = {}) => {
    const readWriteMapping = [...readMappings, ...writeMappings];

    readWriteMapping.forEach(item => {
      if (item.dimension.id == id) isExist = true;
    });
  });

  return isExist;
};
