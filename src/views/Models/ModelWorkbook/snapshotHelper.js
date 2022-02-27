import { MODELS_MSG } from '../../../configs/messages';
import { RETRY_SYNC_ROW, ROW_TYPES_KEYS } from './configs';
import { getPercentageFieldValue } from './helper';

/**
 * Get formatted params to sync records of workbook
 *
 * @param {Object} this
 *
 * @return {Object}
 */
export const getFormattedParamsToSyncRecords = that => {
  const { rowConfigsChanges, gridChanges } = that;

  const rowConfigsChangesKeys = Object.keys(rowConfigsChanges);
  const gridChangesKeys = Object.keys(gridChanges);

  if (rowConfigsChangesKeys.length == 0 && gridChangesKeys.length == 0) {
    return {};
  }

  const params = {};

  let rowConfigsChangesParam;
  let gridChangesParam;

  // Row Configs
  if (rowConfigsChangesKeys.length > 0) {
    rowConfigsChangesParam = getFormattedRowConfigsChangesToSync(that, {
      rowConfigsChangesKeys,
      rowConfigsChanges,
    });
  }

  // Grid Data
  if (gridChangesKeys.length > 0) {
    gridChangesParam = getFormattedGridChangesToSync(that, {
      rowConfigsChangesParam,
      gridChangesKeys,
      rowConfigsChanges,
    });
  }

  if (gridChangesParam || rowConfigsChangesParam) {
    params.rows = gridChangesParam || Object.values(rowConfigsChangesParam);
  }

  if (Object.keys(params).length == 0) return {};

  return { params };
};

/**
 * Get Row Index via Row ID
 *
 * @param {Object}
 *
 * @return {Number}
 */
export const getRowIndexViaRowId = ({ rowConfigs, rowId }) => {
  const rowIndex = rowConfigs.findIndex(({ row_id }) => row_id == rowId);

  return rowIndex;
};

/**
 * Get formatted `Row Configs` changes params to sync
 *
 * @param {Object} that
 * @param {Object}
 *
 * @return {Object|Undefined}
 */
const getFormattedRowConfigsChangesToSync = (
  that,
  { rowConfigsChangesKeys, rowConfigsChanges }
) => {
  const {
    props: { rowConfigs = [], gridData },
  } = that;

  let hasChanges = false;
  const rows = {};

  rowConfigsChangesKeys.forEach(rowId => {
    const rowIndex = getRowIndexViaRowId({ rowConfigs, rowId });
    if (rowIndex < 0) return;

    const rowData = gridData[rowIndex];
    const rowConfig = rowConfigs[rowIndex];

    hasChanges = true;

    // Row Configs
    if (!rows[rowId]) {
      rows[rowId] = getRowConfigsParam({
        rowConfig,
        rowData,
        rowIndex,
        rowId,
        rowConfigsChanges,
        rowConfigs,
      });
      delete that.rowConfigsChanges[rowId];
    }
  });

  if (!hasChanges) return undefined;

  return rows;
};

/**
 * Get formatted `Grid` changes params to sync
 *
 * @param {Object} that
 * @param {Object}
 *
 * @return {Array|Undefined}
 */
const getFormattedGridChangesToSync = (
  that,
  { gridChangesKeys, rowConfigsChangesParam: rows = {}, rowConfigsChanges }
) => {
  const {
    gridChanges,
    props: { rowConfigs = [], gridData, gridHeaders },
  } = that;

  let hasChanges = false;

  gridChangesKeys.forEach(key => {
    let value = gridChanges[key] || '';

    const [rowId, colIndex] = key.split('--');
    const rowIndex = getRowIndexViaRowId({ rowConfigs, rowId });
    if (rowIndex < 0) return;

    const rowData = gridData[rowIndex] || {};
    const rowConfig = rowConfigs[rowIndex] || {};

    // if (rowConfig.isRowUseAsHeading) return;

    hasChanges = true;

    // Row Configs
    if (!rows[rowId]) {
      rows[rowId] = getRowConfigsParam({
        rowConfig,
        rowData,
        rowId,
        rowIndex,
        rowConfigsChanges,
        rowConfigs,
      });
    }

    if (!colIndex) {
      delete that.gridChanges[rowId];
    }

    // Delete Gid Changes if only change Row Label
    if (colIndex == 1) {
      delete that.gridChanges[rowId];
      delete that.gridChanges[key];
    }

    // Cell Value
    if (colIndex > 1) {
      const header = gridHeaders[colIndex];

      const dataCell = that.props.gridData[rowIndex][colIndex] || {};

      // If row fiels type is percentage then Divide real value by 100
      value = getPercentageFieldValue(rowConfig.fieldType, value, false);

      const cell = {
        cellIndex: colIndex,
        label: header.label,
        key: header.value,
        value: value || null,
        options: {
          styles: dataCell.styles || {},
          formula: dataCell.expr || '',
        },
      };

      rows[rowId].cells.push(cell);

      delete that.gridChanges[key];
    }
  });

  if (!hasChanges) return undefined;

  return Object.values(rows);
};

/**
 * Get formatted Row Configs Object
 *
 * @param {Object}
 *
 * @return {Object}
 */
const getRowConfigsParam = ({
  rowData,
  rowConfig,
  rowId,
  rowIndex,
  rowConfigsChanges,
  rowConfigs,
}) => {
  const [, labelCell] = rowData;

  const {
    isPostingEnable,
    isRowUseAsHeading,
    rowType,
    isSameExtractPostMappings,
  } = rowConfig;

  const hasNewRowId = isNewRowId(rowConfig.row_id);

  const getMoveParams = () => {
    if (hasNewRowId) {
      const aboveRow = rowConfigs[rowIndex - 1] || null;
      if (aboveRow) {
        return {
          move_after: aboveRow.row_id,
          move_before: null,
        };
      }

      const bolowRow = rowConfigs[rowIndex + 1] || null;
      if (bolowRow) {
        return {
          move_after: null,
          move_before: bolowRow.row_id,
        };
      }
    }

    return {};
  };

  return {
    is_dirty: true,
    row_id: hasNewRowId ? undefined : rowConfig.row_id,

    title: labelCell.value,
    type: rowType,
    data_type: rowConfig.fieldType,

    round_off: Boolean(rowConfig.isRoundOff),
    round_off_digits: Number(rowConfig.roundingDigits) || 0,

    is_posting_enabled: isPostingEnable,
    is_same_extract_post_mappings: isSameExtractPostMappings,

    is_heading: isRowUseAsHeading,

    read_mappings:
      rowType == ROW_TYPES_KEYS.extract
        ? formatReadWriteMappingsParam(rowConfig.readMappings)
        : [],

    write_mappings: isPostingEnable
      ? formatReadWriteMappingsParam(rowConfig.writeMappings)
      : [],

    extract_formula:
      rowType == ROW_TYPES_KEYS.formula
        ? setOrderingAndFormatting(rowConfig.extractFormula)
        : {},

    posting_formula: isPostingEnable
      ? setOrderingAndFormatting(rowConfig.postingFormula)
      : {},

    cells: [],

    row_options: {
      styles: getLabelCellStyle(rowData),
      tempRowId: hasNewRowId ? rowId : undefined,
    },

    ...getMoveParams(),
    ...(rowConfigsChanges[rowConfig.row_id] || {}),
  };
};

/**
 * Get Styles object for label cell Grid
 *
 * @param {Array} rowData
 * @returns {Object}
 */
export const getLabelCellStyle = rowData => {
  let styles = {};
  if (rowData && rowData.length < 1) return styles;

  const { styles: labelCellStyles = {} } = rowData[1];
  styles = { ...labelCellStyles };

  return styles;
};

/**
 * Set ordering for formula key
 *
 * @param {Array} formula
 *
 * @return {Array}
 */
export const setOrderingAndFormatting = formula => {
  const formattedFormula = {
    tokens: [],
  };

  if (formula && formula.length == 0) return formattedFormula;

  formula.forEach((formulaObj, index) => {
    formulaObj.display_order = index + 1;
  });

  formattedFormula.tokens = formula;

  return formattedFormula;
};

/**
 * Get formatted params to save Read|Wrire Mappings for Row
 *
 * @param {Array} mappings
 *
 * @return {Array}
 */
export const formatReadWriteMappingsParam = mappings => {
  let formattedMappings = [];

  formattedMappings = mappings.map(item => {
    const { dimension, selectedHierarchies = [] } = item || {};

    const mapping = {
      dimension_id: dimension.id || '',
    };

    const formattedHierarchies = selectedHierarchies.map(hierarchy => {
      const { affa_record_id, affa_record_type } = hierarchy;

      return {
        member_id: affa_record_id,
        member_type: affa_record_type == 'folder' ? affa_record_type : 'leaf',
      };
    });

    mapping.mappings = formattedHierarchies;

    return mapping;
  });

  return formattedMappings;
};

/**
 * Re-assign failed Synced Changes to changes object
 *
 * @param {Object} this
 * @param {Object} params
 */
export const reAssignFailedChanges = (that, params) => {
  if (!params.rows) return;

  const { rowConfigs, setRowConfigs } = that.props;

  params.rows.forEach(row => {
    let { row_options } = row;
    if (typeof row_options == 'string') {
      row_options = JSON.parse(JSON.parse(row_options));
    }

    const { tempRowId = row.row_id } = row_options;

    if (!that.rowConfigsChanges[tempRowId]) {
      that.rowConfigsChanges[tempRowId] = {};
    }

    if (!that.errorRows[tempRowId]) {
      that.errorRows[tempRowId] = { retry: 1 };
    }

    const { retry } = that.errorRows[tempRowId];
    that.errorRows[tempRowId].retry = retry + 1;

    const rowIndex = getRowIndexViaRowId({ rowConfigs, rowId: tempRowId });
    if (rowConfigs[rowIndex]) {
      rowConfigs[rowIndex].error = MODELS_MSG.row_error;
    }

    if (retry >= RETRY_SYNC_ROW) {
      delete that.rowConfigsChanges[tempRowId];
    }

    row.cells.forEach(cell => {
      const key = `${tempRowId}--${cell.cellIndex}`;

      if (!that.gridChanges[key]) {
        that.gridChanges[key] = cell.value;
      }

      if (retry >= RETRY_SYNC_ROW) {
        delete that.gridChanges[key];
      }
    });
  });

  setRowConfigs(rowConfigs);
};

/**
 * Verify > Is Row ID new or exist in Database
 *
 * @param {String}
 *
 * @return {Boolean}
 */
const isNewRowId = rowId => {
  return String(rowId).startsWith('NEW');
};
