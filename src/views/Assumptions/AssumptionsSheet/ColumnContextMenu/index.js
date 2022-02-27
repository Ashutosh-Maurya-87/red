import React from 'react';
import { shape, func, number, arrayOf } from 'prop-types';

import { Box, MenuItem, Typography } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';

import {
  COL_CONTEXT_MENU_ACTIONS,
  COL_CONTEXT_MENU_ACTIONS_KEYS,
  ROW_FIELD_TYPES,
  FIELD_TYPE_KEYS,
} from '../configs';

function ColumnContextMenu({ state, ...props }) {
  const {
    handleColContextMenuAction,
    colsCount,
    activeColIndex,
    headers,
    setGridHeaders,
    setGridData,
    data,
  } = props;

  const cell = headers[activeColIndex - 1] || {};
  const type = cell.type || '';

  /**
   * Is Action Disabled
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case COL_CONTEXT_MENU_ACTIONS_KEYS.insertAfter:
      case COL_CONTEXT_MENU_ACTIONS_KEYS.insertBefore:
      case COL_CONTEXT_MENU_ACTIONS_KEYS.duplicate:
        return false;

      case COL_CONTEXT_MENU_ACTIONS_KEYS.delete:
        return colsCount <= 4;

      default:
        return true;
    }
  };

  /**
   * Handle Field Type
   *
   * @param {String} opt
   * @param {String} value
   */
  const handleFieldType = (opt, value) => {
    if (!value) return;

    // Convert/Format percentage field value
    if (
      value == FIELD_TYPE_KEYS.percentage ||
      headers[activeColIndex - 1].type === FIELD_TYPE_KEYS.percentage
    ) {
      const newData = ([...data] || []).map((row, rowIndex) => {
        if (data.length === rowIndex + 1) return row;

        const index = activeColIndex;

        // case 1: when user try to change Data type to percentage field type(ex: Dataype other => percentage)
        if (value == FIELD_TYPE_KEYS.percentage) {
          row[index].value = String(row[index].value * 100);
        }

        // case 2: when user already seleted percentage in Data type settings(ex: Dataype percentage => other)
        if (headers[activeColIndex - 1].type === FIELD_TYPE_KEYS.percentage) {
          row[index].value = String(row[index].value / 100);
        }

        return row;
      });

      setGridData(newData);
    }

    headers[activeColIndex - 1].type = value;
    setGridHeaders(headers);
  };

  return (
    <Box p={2}>
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2">Field Type</Typography>
        <ToggleButtonGroup
          value={type}
          exclusive
          size="small"
          className="hierarchy-toggle toggle-group"
          onChange={handleFieldType}
        >
          {ROW_FIELD_TYPES.map((opt, index) => (
            <ToggleButton value={opt.value} key={index}>
              {opt.symbol}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Typography variant="subtitle2">Actions</Typography>

      {COL_CONTEXT_MENU_ACTIONS.map(action => (
        <MenuItem
          key={action}
          disabled={isActionDisabled(action)}
          onClick={handleColContextMenuAction(action)}
        >
          {action}
        </MenuItem>
      ))}
    </Box>
  );
}

ColumnContextMenu.propTypes = {
  activeColIndex: number,
  colsCount: number.isRequired,
  data: arrayOf(arrayOf(shape({}))).isRequired,
  handleColContextMenuAction: func.isRequired,
  headers: arrayOf(shape({})).isRequired,
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
  state: shape({}).isRequired,
};

ColumnContextMenu.defaultProps = {
  activeColIndex: -1,
};

export default ColumnContextMenu;
