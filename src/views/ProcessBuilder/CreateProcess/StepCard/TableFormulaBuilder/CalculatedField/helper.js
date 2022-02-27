import { PROCESS_MANAGER_MSG } from '../../../../../../configs/messages';
import { FORMULA_KEYS } from './config';

const FormulaParser = require('hot-formula-parser').Parser;

const parser = new FormulaParser();

export const validateFormula = col => {
  const { formula = [] } = col;
  let error = '';

  const str = formula
    .map(fx => {
      switch (fx.key) {
        case FORMULA_KEYS.INPUT:
          const inputValue = String(fx.value == undefined ? '' : fx.value);

          if (!inputValue) {
            error = PROCESS_MANAGER_MSG.add_valid_input_fx.replace(
              '#FIELD#',
              col.display_name
            );
          }

          return inputValue;

        case FORMULA_KEYS.FIELD:
          if (!fx.name) {
            error = PROCESS_MANAGER_MSG.add_valid_field_fx.replace(
              '#FIELD#',
              col.display_name
            );
          }

          if (fx.operation && fx.operation.key) {
            return `${fx.operation.key}(${FORMULA_KEYS.FIELD})`;
          }

          return FORMULA_KEYS.FIELD;

        case FORMULA_KEYS.BRACKET:
        case FORMULA_KEYS.OPERATOR:
          return fx.operator;

        default:
          return null;
      }
    })
    .filter(Boolean)
    .join(' ')
    .replace(/FIELD/g, 1);

  if (error) return { error };

  const res = parser.parse(str);

  if (
    formula &&
    formula.length > 0 &&
    formula[formula.length - 1].key == FORMULA_KEYS.OPERATOR
  ) {
    return { error: PROCESS_MANAGER_MSG.process_formula_not_valid };
  }

  if (res.error == '#DIV/0!') {
    PROCESS_MANAGER_MSG.fx_not_divided_by_zero.replace(
      '#FIELD#',
      col.display_name
    );
    return { error };
  }

  if (res.error) {
    error = PROCESS_MANAGER_MSG.fx_not_divided_by_zero.replace(
      '#FIELD#',
      col.display_name
    );
  }

  return { error };
};
