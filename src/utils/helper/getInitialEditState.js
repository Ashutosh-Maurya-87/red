/**
 * Get initial state as false for editing on each input as Array
 *
 * @param {Object} options
 * @returns {Object} state
 */
export const getAllValuesFalseInArr = ({ data }) => {
  const state = {};

  data.forEach((header, headerIndex) => {
    if (headerIndex == 0) return;

    const { name = '' } = header || {};

    state[name] = false;
  });

  return state;
};

/**
 * Get initial state as false for editing on each input in Object
 *
 * @param {Object} options
 * @returns {Object} state
 */
export const getAllValuesFalseInObj = ({ data }) => {
  const state = { ...data };

  Object.keys(data).forEach(key => {
    state[key] = false;
  });

  return state;
};
