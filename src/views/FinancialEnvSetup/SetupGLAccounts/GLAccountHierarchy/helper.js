/**
 * Add Hierarchy Keys
 *
 * @param {Array} hierarchyArr
 *
 * @return {Array}
 */
export const addHierarchyKeys = hierarchyArr => {
  return hierarchyArr.map(hierarchy => {
    hierarchy.isCollapse = false;
    hierarchy.isLoading = false;

    return hierarchy;
  });
};

/**
 * Remove Hierarchy
 *
 * @param {Number|String} id
 * @param {Array} hierarchy
 * @param {Object|Array} childToPush
 *
 * @return {Array}
 */
export const addChild = (id, hierarchy, childToPush) => {
  const mapped = hierarchy.map(item => {
    if (item.children) {
      addChild(id, item.children, childToPush);
    }

    if (item.affa_record_id == id) {
      if (!item.children) {
        item.children = [...[childToPush]];
      } else {
        item.children.unshift(childToPush);
      }
    }

    return item;
  });

  return mapped;
};

/**
 * Remove Hierarchy
 *
 * @param {Number|String} id
 * @param {String} key
 * @param {Any} value
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const findAndReplaceKey = (id, key, value, hierarchy) => {
  hierarchy.forEach(item => {
    if (item.children) {
      findAndReplaceKey(id, key, value, item.children);
    }

    if (item.affa_record_id == id) item[key] = value;
  });

  return hierarchy;
};

/**
 * Update Levels
 *
 * @param {Number|String} level
 * @param {String} levelName
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const updateLevel = (level, levelName, hierarchy) => {
  hierarchy.forEach(item => {
    if (item.children) {
      updateLevel(level, levelName, item.children);
    }

    if (item.affa_level && item.affa_level === level)
      item.affa_level_name = levelName;
  });

  return hierarchy;
};

/**
 * Update Levels
 *
 * @param {Number|String} level
 * @param {String} levelName
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const updateChild = (id, data, hierarchy) => {
  if (!hierarchy) return hierarchy;

  hierarchy = hierarchy.map(item => {
    if (item.children) {
      updateChild(id, data, item.children);
    }

    if (item.affa_record_id == id) {
      const updatedObj = { ...item, ...data };
      item = updatedObj;
    }

    return item;
  });

  return hierarchy;
};

/**
 * Remove Hierarchy
 *
 * @param {Number|String} id
 * @param {String} key
 * @param {Array} itemsToRemove
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const removeChild = (id, key, itemsToRemove, hierarchy) => {
  let indexToRemove = [];

  hierarchy.forEach((item, index) => {
    if (item.children) {
      removeChild(id, key, itemsToRemove, item.children);
    }

    if (
      itemsToRemove.some(
        itemToRemove => item.affa_record_id == itemToRemove.affa_record_id
      )
    ) {
      indexToRemove.unshift(index);
    }
  });

  if (indexToRemove.length > 0) {
    indexToRemove.map(index => hierarchy.splice(index, 1));
    indexToRemove = [];
  }

  return hierarchy;
};

/**
 * Move Hierarchy
 *
 * @param {Number|String} id
 * @param {String} key
 * @param {Array} itemsToRemove
 * @param {Array} hierarchy
 *
 * @return {Array}
 */
export const moveChild = (id, key, itemsToMove, hierarchy) => {
  hierarchy.forEach(item => {
    if (item.children) {
      moveChild(id, key, itemsToMove, item.children);
    }

    if (item.children && item.affa_record_id == id) {
      item[key] = [...itemsToMove, ...item.children];
    }

    if (!item.children && item.affa_record_id == id) {
      item[key] = itemsToMove;
    }
  });

  return hierarchy;
};

export function createData(
  account_id,
  name,
  rollup_opt,
  rev_sign,
  math_type,
  pos_var,
  type
) {
  return { account_id, name, rollup_opt, rev_sign, math_type, pos_var, type };
}
