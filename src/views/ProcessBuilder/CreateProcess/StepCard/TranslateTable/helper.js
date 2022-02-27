import moment from 'moment';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../../configs/app';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { DATE_FORMAT } from '../../configs';
import { filterTranslateHeader } from '../../helper';
import { getFormula } from '../TableFormulaBuilder/helper';

/**
 * Get Formtted params to create table
 *
 * @param {Object} step
 * @param {Number} i
 * @param {Function} setError
 *
 * @return {Object}
 */
export const getDataForTranslateTable = (step, i, setError) => {
  let error = '';
  const { targetTable, headersToCompare = [], headersToUpdate = [] } = step;

  if (!targetTable.id) {
    error = PROCESS_MANAGER_MSG.target_tbl_required.replace(
      '#STEP#',
      step.name
    );
  }

  const header = filterTranslateHeader(step);

  if (header && header.length > 0) {
    error = PROCESS_MANAGER_MSG.translate_column_not_found
      .replace(
        '#COLUMNS#',
        header.map(({ display_name = '' }) => display_name).join(' ')
      )
      .replace('#STEP#', step.label);
  }

  if (error) {
    setError(error);
    return null;
  }

  const colsForMapping = {};
  const colsForUpdate = {};
  const { rules, err: rulesError } = getFormattedRulesData(step);

  if (rulesError) {
    if (error) {
      setError(error);
      return null;
    }
  }

  headersToCompare.forEach(col => {
    colsForMapping[col.name] = col.display_name;
  });

  headersToUpdate.forEach(col => {
    colsForUpdate[col.name] = col.display_name;
  });

  return {
    id: (!step.isSaveAs && step.id) || null,
    sequence: i + 1,
    type: step.action, // Menu Action
    action: step.action,
    name: step.name,
    new_columns: null,
    query: null,
    query_meta: {},
    source_table_id: targetTable.id,
    destination_table_id: targetTable.id,
    translate_meta: {
      cols_for_mapping: colsForMapping,
      cols_for_update: colsForUpdate,
      rules,
    },
  };
};

/**
 * Get Formatted Rules param data
 *
 * @param {Object} step
 *
 * @return {Object}
 */
const getFormattedRulesData = step => {
  const {
    targetTable = {},
    data = [],
    headersToCompare = [],
    headersToUpdate = [],
  } = step;

  const rules = [];
  const err = '';

  data.forEach((row, i) => {
    const rule = {
      name: '',
      cols_value_for_mapping: [],
      cols_value_for_update: [],
      query: '',
    };

    let query = '';
    let selectQuery = '';
    let setQuery = '';
    let whereQuery = '';

    row.forEach((cell, j) => {
      let validValue = cell.value;

      if (j == 0) {
        rule.name = cell.value || '';
        return;
      }

      if (j > 0 && j <= headersToCompare.length) {
        const headerCompare = headersToCompare[j - 1] || {};
        if (
          validValue &&
          headerCompare.data_type == COLUMN_DATA_TYPES_KEYS.date
        ) {
          validValue = moment(validValue).format(DATE_FORMAT);
        }

        rule.cols_value_for_mapping.push(validValue);

        if (whereQuery) whereQuery += ' AND';
        whereQuery += ` \`${headerCompare.name}\` = '${validValue}'`;

        return;
      }

      if (j > headersToCompare.length) {
        const headerUpdate =
          headersToUpdate[j - headersToCompare.length - 1] || {};

        if (
          validValue &&
          headerUpdate.data_type == COLUMN_DATA_TYPES_KEYS.date
        ) {
          validValue = moment(validValue).format(DATE_FORMAT);
        }

        if (setQuery) setQuery += ',';

        if (
          !validValue &&
          headerUpdate.data_type == COLUMN_DATA_TYPES_KEYS.amount &&
          cell.formula &&
          cell.formula.length > 0
        ) {
          setQuery += ` \`${headerUpdate.name}\` = `;

          ({ selectQuery, setQuery } = getFormula({
            col: cell,
            selectQuery,
            setQuery,
            i,
          }));
        } else {
          cell.formula = undefined;
          setQuery += ` \`${headerUpdate.name}\` = '${validValue}'`;
        }

        rule.cols_value_for_update.push({
          value: validValue,
          formula: cell.formula,
        });
      }
    });

    query += `UPDATE \`${targetTable.name}\``;
    query += ` ${selectQuery}`;
    query += ` SET${setQuery}`;
    query += ` WHERE ${whereQuery}`;

    rule.query = query;
    rules.push(rule);
  });

  return { rules, err };
};
