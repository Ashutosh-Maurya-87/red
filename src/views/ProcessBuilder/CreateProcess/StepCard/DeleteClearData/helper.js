import { COLUMN_DATA_TYPES_KEYS } from '../../../../../configs/app';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { COMPARE_FIELD_KEYS, DELETE_TYPE_ACTION_KEYS } from '../../configs';

const getQueryForDelete = step => {
  const {
    colsToDelete = [],
    actionType,
    dropColumns = [],
    targetTable: { columns = [] },
  } = step;

  let query = '';
  let error = '';

  if (actionType == DELETE_TYPE_ACTION_KEYS.clearAll) {
    return { query, error };
  }

  if (actionType == DELETE_TYPE_ACTION_KEYS.dropTable) {
    // Validate primary columns
    const { is_primary = false, targetTable: { display_name = '' } = {} } =
      step || {};

    if (is_primary)
      error = PROCESS_MANAGER_MSG.primary_table_within_step
        .replace('#TABLE_NAME#', display_name)
        .replace('#STEP#', step.name);

    return { query, error };
  }

  if (
    actionType == DELETE_TYPE_ACTION_KEYS.dropColumns ||
    actionType == DELETE_TYPE_ACTION_KEYS.clearColumns
  ) {
    if (!error && dropColumns.length == 0) {
      error = PROCESS_MANAGER_MSG.select_cols_to_delete
        .replace(
          '#ACTION#',
          actionType == DELETE_TYPE_ACTION_KEYS.dropColumns ? 'delete' : 'clear'
        )
        .replace('#STEP#', step.name);
    }

    // Validate Primary columns for Delete Columns
    if (
      dropColumns.length > 0 &&
      (actionType == DELETE_TYPE_ACTION_KEYS.dropColumns ||
        actionType == DELETE_TYPE_ACTION_KEYS.clearColumns)
    ) {
      const filterPrimaryCols = columns
        .filter(
          ({ name, is_primary }) => dropColumns.includes(name) && is_primary
        )
        .map(({ display_name }) => display_name)
        .join(',');

      if (filterPrimaryCols.length > 0) {
        error = PROCESS_MANAGER_MSG.system_configure_columns_within_step
          .replace('#COLUMNS#', filterPrimaryCols)
          .replace('#STEP#', step.name);
      }
    }

    query = dropColumns.map(c => `\`${c}\``).join(',');
    return { query, error };
  }

  const getStringOfQuery = (
    { name, display_name, operator, value, data_type, ...other },
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
      case COMPARE_FIELD_KEYS.greaterThan:
      case COMPARE_FIELD_KEYS.lessThan:
        if (data_type !== COLUMN_DATA_TYPES_KEYS.date) {
          query += ` \`${name}\` ${operator} "${value}"`;
        }

        if (data_type === COLUMN_DATA_TYPES_KEYS.date) {
          query += ` date_format(\`${name}\`, "%Y-%m-%d") ${operator} "${value}"`;
        }

        if (!error && !value) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.notEqualTo:
        query += ` !(\`${name}\` <=> "${value}")`;

        if (!error && !value) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.contains:
      case COMPARE_FIELD_KEYS.notConatins:
        query += ` \`${name}\` ${operator} "%${value}%"`;

        if (!error && !value) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.between:
        if (data_type !== COLUMN_DATA_TYPES_KEYS.date) {
          query += ` \`${name}\` ${operator} "${value[0]}" AND "${value[1]}"`;
        }

        if (data_type === COLUMN_DATA_TYPES_KEYS.date) {
          query += ` date_format(\`${name}\`, "%Y-%m-%d") ${operator} "${value[0]}" AND "${value[1]}"`;
        }

        if (!error && (!value[0] || !value[1])) {
          error = PROCESS_MANAGER_MSG.value_required_in_query
            .replace('#FIELD#', display_name)
            .replace('#STEP#', step.name);
        }
        break;

      case COMPARE_FIELD_KEYS.isNull:
        query += `COALESCE(\`${name}\`, '') = ''`;
        break;
      case COMPARE_FIELD_KEYS.isNotNull:
        query += `COALESCE(\`${name}\`, '') != ''`;
        break;

      default:
        break;
    }
  };

  const { relation = 'AND' } = colsToDelete;

  (colsToDelete.data || []).forEach((group, groupIndex) => {
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

export const getDataForDeleteStep = (step, i, setError) => {
  let error = '';
  const { targetTable = {}, dropColumns = [], actionType } = step;

  if (!targetTable.id || !targetTable.display_name) {
    error = PROCESS_MANAGER_MSG.target_tbl_required.replace(
      '#STEP#',
      step.name
    );
  }

  if (!error && !step.actionType) {
    error = PROCESS_MANAGER_MSG.action_type_required.replace(
      '#STEP#',
      step.name
    );
  }

  const { columns = [] } = targetTable;
  if (
    !error &&
    actionType == DELETE_TYPE_ACTION_KEYS.dropColumns &&
    dropColumns.length == columns.length
  ) {
    setError(PROCESS_MANAGER_MSG.all_columns_drop);
    return null;
  }

  if (
    !error &&
    actionType == DELETE_TYPE_ACTION_KEYS.clearColumns &&
    dropColumns.length == columns.length
  ) {
    setError(PROCESS_MANAGER_MSG.all_columns_clear);
    return null;
  }

  const { query, error: queryError } = getQueryForDelete(step);
  if (!error && queryError) error = queryError;

  if (error) {
    setError(error);
    return null;
  }

  return {
    id: (!step.isSaveAs && step.id) || null,
    sequence: i + 1,
    type: step.action, // Menu Action
    name: step.name,
    action: step.actionType, // Delete Selected or All
    table_id: targetTable.id,
    query,
    query_meta: step.colsToDelete || {},
  };
};
