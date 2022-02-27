import { ROW_TYPES_KEYS } from '../../../configs';

// Final allocation of read only
export const isCellEditable = ({ cell, rowConfig }) => {
  if (cell.readOnly) return false;

  const { isForecast } = cell;
  const { rowType, postingFormula, writeMappings, isPostingEnable } = rowConfig;

  switch (rowType) {
    case ROW_TYPES_KEYS.freeform:
      if (
        isPostingEnable &&
        postingFormula &&
        postingFormula.length > 0 &&
        isForecast
      )
        return false;

      return true;

    case ROW_TYPES_KEYS.extract:
      if (
        isPostingEnable &&
        postingFormula &&
        postingFormula.length == 0 &&
        writeMappings &&
        writeMappings.length > 0 &&
        isForecast
      )
        return true;

      return false;

    case ROW_TYPES_KEYS.formula:
      return false;

    default:
      return false;
  }
};
