import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
  DEFAULT_DATE_FORMAT,
} from '../../../../configs/app';
import { getFormattedNumberWithNegative } from '../../../../utils/helper/getFormattedNumber';
import { getValueAsPerType } from '../../../SourceTables/ProcessImportedTable/helper';

/**
 * Get Formatted Cell value (date: YYYY-MM-DD, value: number)
 *
 * @returns {string}
 */
export const getFormattedCellValue = (
  dataType,
  dateFormat = DEFAULT_DATE_FORMAT,
  value
) => {
  if (dataType != COLUMN_DATA_TYPES_KEYS.amount) {
    return getValueAsPerType({ value, dataType, dateFormat });
  }

  return getFormattedNumberWithNegative({
    value: Number(value),
    decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
  });
};
