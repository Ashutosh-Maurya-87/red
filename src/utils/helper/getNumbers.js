/**
 * Get Only Numbers from String
 *
 * @param {String|Number} value
 * @param {Boolean} isDecimal [Allow to accept Decimal]
 *
 * @return {Number|String}
 */
export default function getNumbers(value, isDecimal = false) {
  if (!value) return '';

  let stringValue = String(value);

  if (isDecimal && stringValue.startsWith('.')) {
    stringValue = `0${stringValue}`;
  }

  stringValue = stringValue.replace(/,/g, '');

  if (isDecimal) {
    const n = /[-]?\d+(?:\.\d*)?/g.exec(stringValue);

    return n ? n[0] : '';
  }

  let d = stringValue.match(/\d/g);
  d = d ? d.join('') : '';
  d = d === 0 ? '' : d;

  return d;
}
