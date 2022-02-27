/**
 * Get Only Letters (Alphabets) from String
 *
 * @param {String|Number} value
 *
 * @return {String}
 */
export default function getLetters(value) {
  if (!value) return '';

  const matches = String(value).match(/[a-zA-Z]+/g);

  if (matches) return matches.join('');

  return '';
}
