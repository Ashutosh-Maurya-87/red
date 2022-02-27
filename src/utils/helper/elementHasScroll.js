/**
 * Function to identify window has scrollbar or not
 *
 * @returns {boolean}
 */
export const isElementHasScroll = element => {
  return element.scrollHeight > element.clientHeight;
};
