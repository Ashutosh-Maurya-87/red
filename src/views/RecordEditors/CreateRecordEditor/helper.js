import { RECORD_EDITOR_MSG } from '../../../configs/messages';

/**
 * Get params to save Structure
 *
 * @param {Object} state
 * @param {Object} props
 *
 * @return {Object}
 */
export const getParamsToSaveStrucure = (state, props) => {
  const { name, selectedFields, amountColumns, dateColumns, tables } = state;

  const tablesMeta = {};
  tables.forEach(({ id, src_type, src_type_id }) => {
    tablesMeta[id] = { src_type, src_type_id };
  });

  const {
    selectedTable: { selectionType, id: refId },
  } = props;

  const allFields = [...selectedFields, ...amountColumns, ...dateColumns];

  if (allFields.length == 0) {
    return { err: RECORD_EDITOR_MSG.add_field_for_structure };
  }

  const fieldsList = allFields.map(field => {
    const { user_table_id, id, is_editable } = field;

    // Delete extra keys
    delete field.created_at;
    delete field.updated_at;
    delete field.isAdded;

    const meta = tablesMeta[user_table_id] || {};

    return {
      table_id: user_table_id,
      table_col_id: id,
      is_editable: is_editable ? 1 : 0,
      config: {
        ...field,
        is_editable: is_editable ? 1 : 0,
      },
      ...meta,
    };
  });

  const params = {
    name,
    ref_type: selectionType,
    ref_id: refId,
    is_grid_disabled: amountColumns.length ? 0 : 1,
    fields_list: fieldsList,
  };

  return { params };
};
