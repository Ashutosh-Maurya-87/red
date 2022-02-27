import { DEFAULT_COL_WIDTH } from '../../../../../configs/app';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { COMPARE_FIELD_KEYS } from '../../configs';

const getWhereQueryForLookup = step => {
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
          query += ` IFNULL(\`${tableName}\`.\`${name}\`, '--NULL--') ${operator} IFNULL(\`${compareField.tableName}\`.\`${compareField.name}\`, '--NULL--')`;

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

const getUpdateQueryForLookup = step => {
  const { colsToUpdate = [], targetTable = {} } = step;

  let query = '';
  let error = '';
  const newColumns = [];

  colsToUpdate.forEach(
    ({ tableName, name, data_type, target = {}, ...other }) => {
      if (!error && !target.name) {
        error = PROCESS_MANAGER_MSG.field_required_to_update_lookup.replace(
          '#STEP#',
          step.name
        );
      }

      if (!error && (!tableName || !name)) {
        error = PROCESS_MANAGER_MSG.lookup_field_required_to_update.replace(
          '#STEP#',
          step.name
        );
      }

      if (query) query += ', ';

      query += ` \`${targetTable.name}\`.\`${target.name}\` = \`${tableName}\`.\`${name}\``;

      if (target.isNewCol) {
        newColumns.push({
          width: `${DEFAULT_COL_WIDTH}px`,
          name: target.name,
          display_name: target.display_name,
          data_type,
          default_value: other.default,
        });
      }
    }
  );

  return { query: query.trim(), error, newColumns };
};

export const getDataForLookupStep = (step, i, setError) => {
  let error = '';
  const { targetTable = {}, lookupTables = [], colsToCompare = {} } = step;
  const { data = [] } = colsToCompare;

  const index = data.findIndex(({ compareType }) => compareType == 'Column');

  if (index == -1) {
    error = PROCESS_MANAGER_MSG.relationship_required_in_query.replace(
      '#STEP#',
      step.name
    );
  }

  if (lookupTables.length == 0) {
    error = PROCESS_MANAGER_MSG.lookup_tbl_required.replace(
      '#STEP#',
      step.name
    );
  }

  if (!error && !targetTable.id) {
    error = PROCESS_MANAGER_MSG.destination_tbl_required.replace(
      '#STEP#',
      step.name
    );
  }

  const { query: whereQuery, error: whereQueryError } = getWhereQueryForLookup(
    step
  );
  if (!error && whereQueryError) error = whereQueryError;

  if (error) {
    setError(error);
    return null;
  }

  const {
    query: updateQuery,
    error: updateQueryError,
    newColumns,
  } = getUpdateQueryForLookup(step);
  if (!error && updateQueryError) error = updateQueryError;

  if (error) {
    setError(error);
    return null;
  }

  const tables = [...lookupTables, targetTable].map(
    ({ name }) => `\`${name}\``
  );

  let query = `UPDATE ${tables.toString()}`;
  query += ` SET ${updateQuery}`;
  query += ` WHERE ${whereQuery}`;

  return {
    id: (!step.isSaveAs && step.id) || null,
    sequence: i + 1,
    type: step.action, // Menu Action
    action: step.action, // Delete Selected or All
    name: step.name,
    query,
    destination_table_id: targetTable.id,
    new_columns: newColumns,
    query_meta: {
      lookupType: step.lookupType,
      colsToCompare: step.colsToCompare || {},
      colsToUpdate: step.colsToUpdate || [],
      loolupTables: lookupTables.map(({ id }) => id),
      targetTable: targetTable.id,
    },
  };
};
