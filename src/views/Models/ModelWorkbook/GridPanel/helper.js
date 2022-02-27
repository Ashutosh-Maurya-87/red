import { getFormattedDecimalNumber } from '../../../../utils/helper/getFormattedDecimalNumber';
import getFormattedNumber from '../../../../utils/helper/getFormattedNumber';
import { FIELD_TYPE_KEYS } from './configs';

/**
 * Get Formatted Cell Value for Grid Cell
 *
 * @param {Object}
 *
 * @return {String|Number}
 */
export const getFormattedCellValue = ({
  col,
  value,
  rowConfig = {},
  isAssumption = false,
} = {}) => {
  if (col <= 1) return value;

  const { fieldType = '' } = rowConfig || {};

  if (rowConfig.isRowUseAsHeading) return '';

  const roundOffConfigs = {};
  if (Number(rowConfig.roundingDigits) > -1) {
    roundOffConfigs.isMaxChars = true;
    roundOffConfigs.maxChars = Number(rowConfig.roundingDigits);
    roundOffConfigs.fixedDecimal = true;
  } else {
    roundOffConfigs.isMaxChars = true;
    roundOffConfigs.maxChars = 8;
  }

  let validValue = '';

  if (isAssumption) {
    validValue = getFormattedNumber(value, roundOffConfigs);
  } else {
    validValue = getFormattedDecimalNumber(value, roundOffConfigs);
  }

  // Adding $ with value and  0
  if (fieldType == FIELD_TYPE_KEYS.currency && value !== '') {
    validValue = `$${validValue}`;
  }

  // Adding % with value and 0
  if (fieldType == FIELD_TYPE_KEYS.percentage && value !== '') {
    validValue += '%';
  }

  return validValue;
};
