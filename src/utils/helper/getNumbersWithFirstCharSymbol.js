/**
 * Get Only Numbers from String and on first character allow only '+' and '-'
 *
 * @param {String|Number} value
 * @param {Boolean} isDecimal [Allow to accept Decimal]
 *
 * @return {Number|String}
 */
export default function getNumbersWithFirstCharSymbol(
  value,
  isDecimal = false
) {
  if (!value) return '';

  let stringValue = String(value);

  let firstChar = '';

  if (
    stringValue.length > 0 &&
    (stringValue.charAt(0) == '+' || stringValue.charAt(0) == '-')
  ) {
    firstChar = stringValue.charAt(0);

    stringValue = stringValue.substring(1);
  }

  if (isDecimal && stringValue.startsWith('.')) {
    stringValue = `0${stringValue}`;
  }

  stringValue = stringValue.replace(/,/g, '');

  if (isDecimal) {
    const n = /\d+(?:\.\d*)?/g.exec(stringValue);

    let finalString = n ? n[0] : '';

    if (firstChar.length > 0) {
      finalString = firstChar + finalString;
    }

    return finalString;
  }

  let d = stringValue.match(/\d/g);
  d = d ? d.join('') : '';
  d = d === 0 ? '' : d;

  if (!isDecimal && firstChar.length > 0) {
    d = firstChar + d;
  }

  return d;
}
