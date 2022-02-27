/**
 * Capitalize the first letter of given word
 *
 * @param {String} string
 */
export default function capitalize(string) {
  string = String(string);

  return string.charAt(0).toUpperCase() + string.slice(1);
}
