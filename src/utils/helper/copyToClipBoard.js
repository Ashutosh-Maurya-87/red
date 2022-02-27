/**
 * Copy Value to Clip Board
 *
 * @param {String|Number} value
 */
const copyToClipBoard = async value => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export default copyToClipBoard;
