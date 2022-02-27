import React from 'react';
import { FORMULA_KEYS } from '../TableFormulaBuilder/CalculatedField/config';

export const getFx = fx => {
  switch (fx.key) {
    case FORMULA_KEYS.FIELD:
      const fieldName = fx.display_name || `<Field>`;
      const tableName = fx.tableDisplayName || '<Table>';

      let label = `${fieldName} [${tableName}]`;

      if (fx.operation && fx.operation.key) {
        label = `${fx.operation.label}( ${label} )`;
      }

      return <span>{label}</span>;

    case FORMULA_KEYS.OPERATOR:
    case FORMULA_KEYS.BRACKET:
      return <span>{fx.label}</span>;

    case FORMULA_KEYS.INPUT:
      return <span>{String(fx.value || '')}</span>;

    case FORMULA_KEYS.IF_OPERATOR:
    default:
      return null;
  }
};
