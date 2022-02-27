/**
 * Scroll to Specific element by class name
 *
 * @param {String} sourceElementSelector [Class name with dot(.) prefix]
 * @param {String} targetElementSelector [Class name with dot(.) prefix]
 *
 * @return {Boolean}
 */
export default function scrollTo(
  sourceElementSelector,
  targetElementSelector = ''
) {
  const sourceElement = document.querySelector(sourceElementSelector);

  if (!sourceElement) return false;

  const targetElement =
    targetElementSelector && document.querySelector(targetElementSelector);

  const options = {
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  };

  if (targetElement) {
    targetElement.scrollIntoView(options);
  } else {
    sourceElement.parentElement.scrollIntoView(options);
  }

  return true;
}
