import { COMPARE_FIELD_KEYS } from '../../configs';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../../configs/app';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { FORMULA_KEYS } from './CalculatedField/config';
import { validateFormula } from './CalculatedField/helper';

export const getDataForFormulaBuilder = (step, i, setError) => {
  let error = '';
  const {
    targetTable = {},
    relatedTables = [],
    colsToCompare = {},
    formulaType = '',
  } = step;

  const { data = [] } = colsToCompare;

  if (data && data.length > 0 && formulaType == 'multi') {
    const index = data.findIndex(({ compareType }) => compareType == 'Column');

    if (index == -1) {
      error = PROCESS_MANAGER_MSG.relationship_required_in_query.replace(
        '#STEP#',
        step.name
      );
    }
  }

  if (step.formulaType == 'multi' && relatedTables.length == 0) {
    error = PROCESS_MANAGER_MSG.related_tbl_required.replace(
      '#STEP#',
      step.name
    );
    setError(error);
    return null;
  }

  if (!targetTable.id) {
    error = PROCESS_MANAGER_MSG.target_tbl_required.replace(
      '#STEP#',
      step.name
    );
    setError(error);
    return null;
  }

  const { query, error: queryError, newColumns = [] } = getQuery(step);
  if (!error && queryError) error = queryError;

  if (error) {
    setError(error);
    return null;
  }

  const { colsToUpdate = [] } = step;

  return {
    id: (!step.isSaveAs && step.id) || null,
    sequence: i + 1,
    name: step.name,
    type: step.action, // Menu Action
    action: step.formulaType == 'single' ? 'single' : 'multi',
    table_id: targetTable.id,
    source_table_id: targetTable.id,
    destination_table_id: targetTable.id,
    new_columns: newColumns,
    table_alias: 't',
    formula_meta: null,
    query,
    query_meta: {
      colsToUpdate,
      colsToCompare,
      formulaType,
      targetTable: targetTable.id,
      relatedTables: relatedTables.map(({ id }) => id),
    },
  };
};

const getQuery = step => {
  const { targetTable = {}, colsToUpdate = [], relatedTables = [] } = step;

  const { query: whereQuery = '', error: whereError } =
    step.formulaType == 'multi' ? getWhereQuery(step) : {};

  if (whereError) return { query: '', error: whereError };

  let query = '';
  let error = '';
  const newColumns = [];

  let selectQuery = '';
  let setQuery = 'SET';

  colsToUpdate.forEach((col, i) => {
    if (col.isNewCol) {
      newColumns.push({
        display_name: col.display_name,
        name: col.name,
        data_type: COLUMN_DATA_TYPES_KEYS.amount,
      });
    }

    if (!col.display_name) {
      error = PROCESS_MANAGER_MSG.field_required_to_update_fx.replace(
        '#STEP#',
        step.name
      );
    } else {
      const { error: formulaError } = validateFormula(col);
      if (!error && formulaError) error = formulaError;
    }

    if (!error && (!col.formula || col.formula.length == 0)) {
      error = PROCESS_MANAGER_MSG.add_valid_fx_in_step
        .replace('#FIELD#', col.display_name)
        .replace('#STEP#', step.name);
    }

    if (!error) {
      setQuery += ` \`${col.tableName}\`.\`${col.name}\` =`;

      ({ selectQuery, setQuery } = getFormula({
        step,
        col,
        selectQuery,
        setQuery,
        i,
      }));

      if (i < step.colsToUpdate.length - 1) setQuery += ',';
    }
  });

  const relatedTablesName = relatedTables
    .map(({ name }) => `\`${name}\``)
    .join(', ');

  query += `UPDATE \`${targetTable.name}\``;
  query += ` ${relatedTablesName ? `, ${relatedTablesName}` : ''}`;
  query += ` ${selectQuery} ${setQuery}`;
  query += ` ${whereQuery ? `WHERE ${whereQuery}` : ''}`;

  return { query: query.trim(), error, newColumns };
};

export const getFormula = ({ col, selectQuery, setQuery, i }) => {
  const { formula = [] } = col;

  formula.forEach((fx, fi) => {
    switch (fx.key) {
      case FORMULA_KEYS.INPUT:
        setQuery += ` ${Number(fx.value)}`;
        break;

      case FORMULA_KEYS.BRACKET:
      case FORMULA_KEYS.OPERATOR:
        setQuery += ` ${fx.operator}`;
        break;

      case FORMULA_KEYS.FIELD:
        if (fx.operation && fx.operation.func) {
          setQuery += ` t${i}${fi}.placeholder${i}${fi}`;
          selectQuery += `, (SELECT ${fx.operation.func}(\`${fx.name}\`) as placeholder${i}${fi} from \`${fx.tableName}\`) t${i}${fi}`;
        } else {
          setQuery += ` \`${fx.tableName}\`.\`${fx.name}\``;
        }
        break;

      default:
        break;
    }
  });

  return { selectQuery, setQuery };
};

const getWhereQuery = step => {
  const { colsToCompare = [] } = step;

  let query = '';
  let error = '';

  const getStringOfQuery = (
    {
      name,
      display_name,
      operator,
      value,
      tableName,
      compareField = {},
      compareType,
    },
    { relation = 'AND', groupIndex, conditionColIndex } = {}
  ) => {
    if (
      groupIndex > 0 &&
      (conditionColIndex == !undefined || conditionColIndex > 0)
    ) {
      query += ` ${relation}`;
    }

    if (!error) {
      if (!name) {
        error = PROCESS_MANAGER_MSG.name_required_in_query.replace(
          '#STEP#',
          step.name
        );
      } else if (!operator) {
        error = PROCESS_MANAGER_MSG.operator_required_in_query
          .replace('#FIELD#', display_name)
          .replace('#STEP#', step.name);
      }
    }

    switch (operator) {
      case COMPARE_FIELD_KEYS.equalTo:
        if (!compareType || compareType == 'Value') {
          query += ` \`${tableName}\`.\`${name}\` ${operator} "${value}"`;

          if (!error && !value) {
            error = PROCESS_MANAGER_MSG.value_required_in_query
              .replace('#FIELD#', display_name)
              .replace('#STEP#', step.name);
          }
        }

        if (compareType == 'Column') {
          query += ` \`${tableName}\`.\`${name}\` ${operator} \`${compareField.tableName}\`.\`${compareField.name}\``;

          if (!error && !compareField.name) {
            error = PROCESS_MANAGER_MSG.value_required_in_query
              .replace('#FIELD#', display_name)
              .replace('#STEP#', step.name);
          }
        }
        break;

      case COMPARE_FIELD_KEYS.notEqualTo:
      case COMPARE_FIELD_KEYS.greaterThan:
      case COMPARE_FIELD_KEYS.lessThan:
        query += ` \`${tableName}\`.\`${name}\` ${operator} "${value}"`;

        if (!error && !value) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.contains:
      case COMPARE_FIELD_KEYS.notConatins:
        query += ` \`${tableName}\`.\`${name}\` ${operator} "%${value}%"`;

        if (!error && !value) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.between:
        query += ` \`${tableName}\`.\`${name}\` ${operator} "${value[0]}" AND "${value[1]}"`;
        if (!error && (!value[0] || !value[1])) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.isNull:
        query += `( \`${tableName}\`.\`${name}\` ${operator} or \`${tableName}\`.\`${name}\` = '' )`;
        break;
      case COMPARE_FIELD_KEYS.isNotNull:
        query += `( \`${tableName}\`.\`${name}\` ${operator} or \`${tableName}\`.\`${name}\` != '' )`;
        break;

      default:
        break;
    }
  };

  const { relation = 'AND' } = colsToCompare;

  (colsToCompare.data || []).forEach((group, groupIndex) => {
    if (query && groupIndex > 0) query += ` ${relation} (`;

    if (Array.isArray(group.data)) {
      group.data.forEach((conditionCol, conditionColIndex) => {
        getStringOfQuery(conditionCol, {
          relation: group.relation,
          groupIndex,
          conditionColIndex,
        });
      });
    } else {
      getStringOfQuery(group, { relation, groupIndex });
    }

    if (query && groupIndex > 0) query += ' )';
  });

  return { query: query.trim(), error };
};
