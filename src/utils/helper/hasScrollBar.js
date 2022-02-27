/**
 * Function to identify window has scrollbar or not
 *
 * @returns {boolean}
 */
export const isHasScrollBar = () => {
  return window.innerWidth > document.documentElement.clientWidth;
};
