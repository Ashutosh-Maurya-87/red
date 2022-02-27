/**
 * Identify the duplicate Group name
 *
 * @param {Array} headers
 * @param {String} name
 */
export const isDuplicateGroupExist = (headers, name) => {
  const result = headers.filter(header => header === name);

  return result.length > 0 ? true : false;
};

/**
 * Generate new Group name
 *
 * @param {Array} headers
 * @param {Number} Count
 * @param {String} groupName
 *
 * @return {Object}
 */
export const generateGroupName = (headers, count, groupName) => {
  const id = count + 1;
  const name = `Copy of ${id} - ${groupName}`;

  if (isDuplicateGroupExist(headers, name)) {
    return generateGroupName(headers, id, groupName);
  }

  return name;
};
