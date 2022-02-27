/**
 * Validate String
 *
 * @param {Any} str
 * @param {String} r [Return value if invalid string]
 *
 * @return {String}
 */
export default function validateString(str, r = '') {
  const trimString = String(str).trim();

  if (trimString == 'undefined') return r;
  if (trimString == 'null') return r;

  return trimString || r;
}
