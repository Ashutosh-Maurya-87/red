import { DEFAULT_COL_WIDTH } from '../../../../../configs/app';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { DATE_FORMAT } from '../../configs';
import { convertStringToSQLColumn } from '../../helper';
import { validateName } from '../../../../../utils/helper/validateName';

export const getDataForCopyPasteStep = (step, i, setError) => {
  let error = '';

  const { sourceTable = {}, targetTable = {}, isNewTable } = step;

  if (!sourceTable.id) {
    error = PROCESS_MANAGER_MSG.copy_from_required.replace('#STEP#', step.name);
  }

  if (!error && !targetTable.id) {
    error = PROCESS_MANAGER_MSG.paste_into_required.replace(
      '#STEP#',
      step.name
    );
  }

  if (!validateName(targetTable.display_name)) {
    error = PROCESS_MANAGER_MSG.paste_into_invalid_name.replace(
      '#STEP#',
      step.name
    );
  }

  const index = sourceTable.columns.findIndex(
    ({ display_name, targetFieldLabel }) => !display_name || !targetFieldLabel
  );

  if (index > -1) {
    error = PROCESS_MANAGER_MSG.copy_paste_required_field.replace(
      '#STEP#',
      step.name
    );
  }

  if (error) {
    setError(error);
    return null;
  }

  const newColumns = [];
  const newRows = [];
  let mappedColumns = {};

  sourceTable.columns.forEach((col, i) => {
    let targetName = col.targetField;

    if (!col.isMatched) {
      targetName = convertStringToSQLColumn(col.targetField);

      if (targetName) {
        // Create new field with user input
        newColumns.push({
          name: targetName,
          new_name: col.targetFieldLabel,
          display_name: col.targetFieldLabel,
          data_type: col.newDataType || col.data_type,
          width: col.width || DEFAULT_COL_WIDTH,
          date_format: col.dateFormat || DATE_FORMAT,
        });
      } else {
        // Create new field with selected source column
        newColumns.push({
          name: col.name,
          new_name: col.display_name,
          display_name: col.display_name,
          data_type: col.newDataType || col.data_type,
          width: col.width || DEFAULT_COL_WIDTH,
          date_format: col.dateFormat || DATE_FORMAT,
        });
      }
    }

    if (col.isNewRow) {
      newRows.push({
        source_value: col.display_name || '',
        source_field: `custom_val_${i}`,
        column_name: targetName || col.name,
        display_name: col.targetFieldLabel,
        data_type: col.newDataType || col.data_type,
        width: col.width || DEFAULT_COL_WIDTH,
        date_format: col.dateFormat || DATE_FORMAT,
      });

      mappedColumns = {
        ...mappedColumns,
        [`custom_val_${i}`]: targetName || col.name,
      };
    } else {
      mappedColumns[col.name] = targetName || col.name;
    }
  });

  let new_table;
  if (targetTable.id == 'NEW') {
    new_table = {
      name: targetTable.display_name,
      display_name: targetTable.display_name,
      create_table: isNewTable ? 1 : 0,
    };
  }

  return {
    id: (!step.isSaveAs && step.id) || null,
    sequence: i + 1,
    name: step.name,
    type: step.action, // Menu Action
    action: 'copy',
    query: '',
    query_meta: [],
    source_table_id: sourceTable.id,
    destination_table_id: targetTable.id == 'NEW' ? '' : targetTable.id,
    new_columns: newColumns,
    new_rows: newRows,
    data_mapping: mappedColumns,
    new_table,
  };
};
