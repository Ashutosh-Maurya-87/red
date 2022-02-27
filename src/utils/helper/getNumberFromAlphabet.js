/**
 * Get Number from Alphabet
 *
 * @param {String} val [Ex: A, AZ, AAZ]
 */
export default function getNumberFromAlphabet(val) {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let i;
  let j;
  let result = 0;

  for (i = 0, j = val.length - 1; i < val.length; i += 1, j -= 1) {
    result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
  }

  return result;
}
