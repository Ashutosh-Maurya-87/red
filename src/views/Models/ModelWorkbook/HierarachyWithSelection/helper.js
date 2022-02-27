/**
 * Get formatted flat data
 *
 * @param {Array} hierarchy
 * @param {Array} formattedArray
 *
 * @return {Array}
 */
const formatFlatData = (hierarchy, formattedArray) => {
  hierarchy.map(item => {
    if (item.affa_level != 1) {
      formattedArray.push(item);
    }

    if (item.children) {
      formatFlatData(item.children, formattedArray);
    }

    return formattedArray;
  });

  delete hierarchy.children;

  return formattedArray;
};

/**
 * Get flat list data
 *
 * @param {Array} list
 *
 * @return {Array}
 */
export const getFlatListData = list => {
  if (!list || (list && list.length === 0)) return [];

  const formattedArray = [];

  formatFlatData(list, formattedArray);

  return formattedArray;
};

/**
 * Get childs
 *
 * @param {String|Number} id
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const getChilds = (id, hierarchy) => {
  let node = [];

  hierarchy.forEach(n => {
    if (n.affa_record_id == id) {
      node = [...node, ...n.children];
    }

    if (n.children) {
      const listOfIds = getChilds(id, n.children);
      node = [...node, ...listOfIds];
      return node;
    }

    return n;
  });

  return node || [];
};

/**
 * Get children Ids
 *
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const getChildsIds = hierarchy => {
  let ids = [];

  hierarchy.forEach(n => {
    ids.push(n.affa_record_id);

    if (n.children) {
      const listOfIds = getChildsIds(n.children);
      ids = [...ids, ...listOfIds];
      return ids;
    }

    return n;
  });

  return ids || [];
};

/**
 * Get formatted flat data with ID
 *
 * @param {String|Number} id
 * @param {Array} hierarchy
 * @param {Array} formattedArray
 *
 * @return {Array}
 */
export const formatFlatDataWithId = (id, hierarchy, formattedArray) => {
  hierarchy.map(item => {
    formattedArray.push(item);

    if (item.affa_record_id == id) {
      item.children = [];
    }

    if (item.children) {
      formatFlatDataWithId(id, item.children, formattedArray);
    }

    return formattedArray;
  });

  return formattedArray;
};
