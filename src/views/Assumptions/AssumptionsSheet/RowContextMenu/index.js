import React from 'react';
import { shape, func, number } from 'prop-types';

import { Box, MenuItem } from '@material-ui/core';

import {
  ROW_CONTEXT_MENU_ACTIONS,
  ROW_CONTEXT_MENU_ACTIONS_KEYS,
} from '../configs';

function RowContextMenu({ state, ...props }) {
  const { handleRowContextMenuAction, rowsCount, activeRowIndex } = props;

  /**
   * Is Action Disabled
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertAbove:
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertBelow:
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.duplicate:
        return false;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.moveAbove:
        return activeRowIndex <= 0;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.moveBelow:
        return activeRowIndex == rowsCount - 1;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.delete:
        return rowsCount <= 1;

      default:
        return true;
    }
  };

  return (
    <Box p={1}>
      {ROW_CONTEXT_MENU_ACTIONS.map(action => (
        <MenuItem
          key={action}
          disabled={isActionDisabled(action)}
          onClick={handleRowContextMenuAction(action)}
        >
          {action}
        </MenuItem>
      ))}
    </Box>
  );
}

RowContextMenu.propTypes = {
  activeRowIndex: number,
  handleRowContextMenuAction: func.isRequired,
  rowsCount: number.isRequired,
  state: shape({}).isRequired,
};

RowContextMenu.defaultProps = {
  activeRowIndex: -1,
};

export default RowContextMenu;
