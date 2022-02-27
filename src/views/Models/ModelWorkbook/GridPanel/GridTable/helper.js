import { DEFAULT_MAX_CHARS_AFTER_DECIMAL } from '../../../../../configs/app';
import getNumbers from '../../../../../utils/helper/getNumbers';
import { mathJSInstance } from '../../../../../utils/helper/mathCalculation';
import { ROW_TYPES_KEYS } from '../../configs';
import {
  ASSUMPTION_PREFIX,
  DEFAULT_ERROR_TEXT,
  FIELD_TYPE_KEYS,
  REGX_TO_FIND_CELL_INDEXS_IN_GRID,
} from '../configs';

import { getPercentageFieldValue, getColumnAbsolutePath } from '../../helper';

/**
 * Validate expression
 *
 * @param {String} trailKeys
 * @param {STring} expr
 * @returns {Boolean}
 */
export const validateExp = (trailKeys, expr, scope) => {
  let valid = true;

  try {
    const matches = expr
      ? expr?.toString().match(/([A-Z]{1,3}[0-9]{1,5})+/g) || []
      : [];

    matches.forEach(match => {
      if (trailKeys.indexOf(match) > -1) {
        valid = false;
      } else {
        valid = validateExp([...trailKeys, match], scope[match].expr, scope);
      }
    });
  } catch (error) {
    console.error(error);
  }

  return valid;
};

/**
 * Validate expression in scope
 *
 * @param {Object} scope
 * @param {String} assumptionSet
 *
 * @returns {Boolean}
 */
export const isAssumptionExist = ({ scope = {}, assumptionSet = '' }) => {
  try {
    const result = mathJSInstance.parse(assumptionSet, scope);
    const { args = [] } = result || {};
    const [firstArg] = args || [];
    const { value = '', name = '' } = firstArg || {};

    const valueToMatch = name ? name : value;

    return [valueToMatch] in scope;
  } catch (error) {
    return false;
  }
};

/**
 * Validate Assumption in expression
 *
 * @param {Object} scope
 * @param {String} expr
 *
 * @returns {object}
 */
export const validateExprForAssumptions = ({ scope = {}, expr = '' }) => {
  const updatedExpr = expr.replaceAll(
    REGX_TO_FIND_CELL_INDEXS_IN_GRID,
    matched => {
      if (
        matched.includes(ASSUMPTION_PREFIX) &&
        !isAssumptionExist({ scope, assumptionSet: matched })
      ) {
        return DEFAULT_ERROR_TEXT;
      }

      return matched;
    }
  );

  return { updatedExpr: updatedExpr || '' };
};

/**
 * Calculate the valid mathematical expression or manual input
 *
 * @param {String} key
 * @param {String} expr
 * @param {Object} scope
 * @returns {Object}
 */
export const computeExpr = (key, expr, scope) => {
  let value = null;

  // return empty string
  if (expr && expr.length == 0) {
    return {
      className: '',
      value: '',
      expr: '',
      scope,
    };
  }

  // return empty string
  if (!expr && String(expr).length > 0 == 0) {
    return {
      className: '',
      value: '',
      expr: '',
      scope,
    };
  }

  if (expr && String(expr).length > 0 && expr == '=ERROR') {
    return { className: 'cell-formula-error', value: null, expr, scope };
  }

  // In case of string which not include =
  if (expr && String(expr).length > 0 && String(expr).charAt(0) != '=') {
    expr = getNumbers(expr, true);

    const value = expr
      ? Number(expr).toFixed(DEFAULT_MAX_CHARS_AFTER_DECIMAL)
      : '';

    scope[key] = {
      ...scope[key],
      value,
    };

    return {
      className: '',
      value,
      expr: '',
      scope,
    };
  }

  try {
    const actualExpr = expr.replaceAll(
      REGX_TO_FIND_CELL_INDEXS_IN_GRID,
      matched => {
        if (matched.includes(ASSUMPTION_PREFIX)) {
          return matched;
        }

        return `${matched}.value`;
      }
    );

    // if assumption is not in scope object
    const { updatedExpr = '' } = validateExprForAssumptions({ scope, expr });

    expr = updatedExpr;

    value = mathJSInstance.evaluate(actualExpr.substring(1), scope);

    if (value && value.isError) {
      return { className: 'cell-formula-error', value: null, expr, scope };
    }

    if (key && scope[key]) {
      scope[key].value = value;
      scope[key].expr = expr;
    }

    return {
      className: '',
      value: Number(value).toFixed(DEFAULT_MAX_CHARS_AFTER_DECIMAL),
      expr,
      scope,
    };
  } catch (e) {
    value = null;
  }

  scope[key].value = '';
  return { className: 'cell-formula-error', value: null, expr, scope };
};

/**
 * Recompile Grid Data
 *
 * @param {Object} props
 * @param {Object} scope
 */
export const reCompileDataOfGrid = (props, scope) => {
  const {
    data,
    gridData,
    rowConfigs,
    gridDataTable,
    handleGridUpdated,
    formulaCells,
    setGridData,
  } = props;

  const localScope = scope || { ...gridDataTable };

  if (formulaCells.length > 0) {
    const {
      data: updatedRecords,
      newChanges: newChangesRows,
    } = reCompileGridData(
      data ? data : gridData,
      localScope,
      {},
      formulaCells,
      rowConfigs
    );

    setGridData(updatedRecords);
    handleGridUpdated(newChangesRows, { isNewRow: false });
  }
};

/**
 *
 *
 * @param {Array} data
 * @param {Object} scope
 * @param {Object} newChanges
 * @returns {Object}
 */
export const reCompileGridData = (
  data,
  scope,
  newChanges,
  formulaCells,
  rowConfigs
) => {
  try {
    /**
     * compare cell values
     *
     * @param {String} a
     * @param {String} b
     * @returns {Number}
     */
    const sortCells = (a, b) => {
      if (a.cellIndex < b.cellIndex) {
        return -1;
      }
      if (a.cellIndex > b.cellIndex) {
        return 1;
      }
      return 0;
    };

    formulaCells = formulaCells.sort(sortCells);

    formulaCells.forEach(cell => {
      const { row, col, cellIndex } = cell;
      const { value = '', expr = '' } = data[row][col] || {};
      const trailKey = cellIndex;

      const {
        className = '',
        expr: computedExpr = '',
        value: computedVal = '',
        scope: updatedScope,
      } = computeExpr(trailKey, expr ? expr : value, scope);

      const { row_id = '', fieldType = '', rowType = '' } =
        rowConfigs[row] || {};
      let validValue = String(getNumbers(computedVal, true));

      if (
        validValue &&
        fieldType === FIELD_TYPE_KEYS.percentage &&
        rowType !== ROW_TYPES_KEYS.formula
      ) {
        // If row field type is percentage then multiplicate real value by 100
        validValue = getPercentageFieldValue(fieldType, validValue, true);
      }

      const valueToCompare = validValue;

      if (Math.abs(value) != Math.abs(valueToCompare)) {
        data[row][col] = {
          ...data[row][col],
          value: validValue,
          expr: computedExpr,
          className,
        };

        scope = updatedScope;

        if (row_id) {
          newChanges[`${row_id}--${col}`] = validValue;
        }
      }

      data[row][col] = {
        ...data[row][col],
        className,
        expr: computedExpr,
      };
    });
  } catch (error) {
    console.error(error);
  }

  return { data, newChanges, scope };
};

/**
 * Filter Array of "A1, B1" Cell from Sting "=A1+B1"
 *
 * @param {string} expr
 * @returns {Array}
 */
export const filterCellIndexs = expr => {
  if (!expr) return [];

  // Multiple regx example to split formula expr
  // 1. '/([A-Z]+[0-9]+)|([+-/*])|([0-9]+)/g' extract Cell address, operator, number. example:["a1", "+", "10"]
  // 2. '/([A-Z]+[0-9]+)|([+-/*])/g' extract Cell address, operator. example:["a1", "+"]
  // 3. '/([A-Z]+[0-9]+)/g' extract Cell address. Example["a1", "B1"]
  // 4. '/(?:)(assumption\(+)([a-zA-z0-9]*)(?:\)+)/g' Select Assumption(#ASSUMPTION_SET#)

  const resultExpr = expr.replaceAll(
    /(?:)(ASSUMPTION\(+)([a-zA-z0-9]*)(?:\)+)/g,
    '#'
  );

  return resultExpr.match(/([A-Z]+[0-9]+)/g) || [];
};

/**
 * Get cell axis
 *
 * @param {Object} data
 * @returns {Array}
 */
export const getCellAxis = ({ expr, row, col }) => {
  let cells = filterCellIndexs(expr);

  cells = cells.map(cell => getColumnAbsolutePath({ letter: cell, row, col }));

  return cells;
};
