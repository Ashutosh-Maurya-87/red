/**
 * Get ID of Related End Table
 * Note: Scenario or Dimension ID (Not Source Table ID)
 *
 * @param {Object} table
 *
 * @return {String|Number}
 */
export const getEndTableId = table => {
  return table.type == 'actual' ? table.actual_scenario_id : table.id;
};

/**
 * Get Ref Type of Table (Dimension or Scenario)
 *
 * @param {Object} state
 * @param {Object} col
 *
 * @return {String}
 */
export const getTableRefType = (state, col) => {
  const {
    selectedTable,
    dimension: { source_table_id },
  } = state;

  const { user_table_id } = col;

  if (source_table_id == user_table_id) return 'dimension';

  if (
    selectedTable.id == user_table_id &&
    (!selectedTable.type || selectedTable.type == 'actual')
  ) {
    return 'actual';
  }

  return 'dimension';
};

/**
 * Get formatted params to save Relationship
 *
 * @param {Object} state
 *
 * @return {Object}
 */
export const getParamsToSaveRelation = state => {
  const {
    relationData,
    selectedTable,
    dimension: { id, source_table_id },
  } = state;

  const relationsArray = relationData.colsToCompare.data.map(col => {
    const { user_table_id: tableId, compareField } = col;

    const startCol = source_table_id == tableId ? col : compareField;
    const endCol = source_table_id == tableId ? compareField : col;

    return {
      start_point_ref_type: getTableRefType(state, startCol),
      start_point_id: id,
      start_point_col_id: startCol.id,

      end_point_id: getEndTableId(selectedTable),
      end_point_ref_type: getTableRefType(state, endCol),
      end_point_col_id: endCol.id,

      relation_type: 'AND',
    };
  });

  return {
    start_point_ref_type: getTableRefType(state, {}),
    start_point_id: id,
    relations: relationsArray,
  };
};
