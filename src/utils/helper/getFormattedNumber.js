export const MAX_CHARS_AFTER_DECIMAL = 2;

/**
 * Get Formatted Number
 *
 * Ex: 1234567 -> 1,234,567
 *
 * @param {String|Number} n
 *
 * @return {String}
 */
export default function getFormattedNumber(
  n,
  { isMaxChars = true, maxChars, fixedDecimal } = {}
) {
  if (!n) return n;

  let validNumber = '';

  const numberArray = String(n).split('.');
  if (numberArray[0]) {
    validNumber += numberArray[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  let afterDecimal = '';

  const beforeDecimal = validNumber.split(',').join('');
  if (validNumber && Number(beforeDecimal) == 0) validNumber = '0';

  if (numberArray[1]) {
    if (isMaxChars) {
      if (maxChars == undefined) maxChars = MAX_CHARS_AFTER_DECIMAL;
      // if (maxChars === 0 && fixedDecimal) n.;
      if (maxChars > 0) {
        if (fixedDecimal) {
          afterDecimal = Number(`0.${numberArray[1]}`)
            .toFixed(maxChars)
            .substring(2);

          validNumber += `.${afterDecimal}`;
          Number(validNumber).toFixed(maxChars);
        } else {
          afterDecimal = numberArray[1].substring(0, maxChars);
          if (Number(afterDecimal) == 0) afterDecimal = 0;
          if (afterDecimal) validNumber += `.${afterDecimal}`;
        }
      }
    } else {
      validNumber += `.${numberArray[1]}`;
    }
  }

  return validNumber;
}

/**
 * Formatting Number with decimal and with negative number
 * @param {Number} value
 * @param {Boolean} decimalPlaceValue
 *
 * @returns
 */
export const getFormattedNumberWithNegative = ({
  value,
  decimalPlaceValue = 2,
}) => {
  if (typeof value == 'string' && value === '') return '';

  const numValue = Number(value).toLocaleString(undefined, {
    maximumFractionDigits: decimalPlaceValue,
  });

  return numValue;
};
