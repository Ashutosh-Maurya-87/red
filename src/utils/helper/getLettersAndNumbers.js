/**
 * Get Only Letters (Alphabets) and Numbers from String
 *
 * @param {String|Number} value
 *
 * @return {String}
 */
export default function getLettersAndNumbers(
  value,
  { withSpace = false } = {}
) {
  if (!value) return '';

  const matches = String(value).match(/[a-zA-Z0-9 ]+/g);

  let validString = '';

  if (matches) validString = matches.join('');

  if (validString && !withSpace) validString = validString.replace(/ /gi, '');

  return validString;
}
