import { MAX_CHARS_AFTER_DECIMAL } from './getFormattedNumber';

/**
 * Get Formatting Decimal Number for Grid cells
 *
 * Ex: 123.8567 -> 123.857, 123.86, 123.9, 124
 * Impacted Area:- Model Grid, Assumptions
 *
 * @param {String|Number} value
 * @param {Object} roundOffConfigs
 * @returns {Number}
 */
export const getFormattedDecimalNumber = (
  value,
  { isMaxChars = true, maxChars, fixedDecimal } = {}
) => {
  if (!value) return value;

  let validNumber = '';

  // Rounding off of whole values
  if (isMaxChars) {
    if (maxChars == undefined) maxChars = MAX_CHARS_AFTER_DECIMAL;
    if (maxChars >= 0 && fixedDecimal) {
      validNumber += Number(value).toFixed(maxChars);
    }
  }

  // Number formatting
  const numberArray = validNumber.toString().split('.');
  if (numberArray && numberArray.length > 0) {
    numberArray[0] = numberArray[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    validNumber = numberArray.join('.');
  }

  return validNumber;
};
