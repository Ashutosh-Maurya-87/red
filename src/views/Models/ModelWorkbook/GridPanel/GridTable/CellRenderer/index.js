/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import {
  MenuItem,
  Popper,
  Grow,
  Paper,
  Card,
  ClickAwayListener,
} from '@material-ui/core';
import RowLabelCell from '../RowLabelCell';

import { ROW_TYPES_KEYS } from '../../../configs';
import {
  CELL_CONTEXT_MENU_ACTIONS,
  CELL_CONTEXT_MENU_ACTIONS_KEYS,
} from '../../configs';

import { isCellEditable } from './helper';
import { getFormattedCellValue } from '../../helper';
import copyToClipBoard from '../../../../../../utils/helper/copyToClipBoard';

/**
 * Render Single Cell
 */
const CellRenderer = (props = {}) => {
  const [contextEle, setContextEle] = useState(null);

  const {
    cell,
    row, // Row Index
    col, // Column Index
    headers,
    attributesRenderer,
    selected,
    editing,
    updated,
    style,
    children,
    toggleSetupRow,
    toggleRowContextMenu,
    rowConfigs,
    isViewMode,
    labelCell,
    updateCellProgrammatically,
    pasteDataProgrammatically,
    handleCopyCells,
    onUpdateSelection,
    selection,
    ...restProps
  } = props;

  cell.isForecast = (headers[col] || {}).isForecast || false;
  const rowConfig = rowConfigs[row] || {};

  const { width } = headers[col];
  const attributes = cell.attributes || {};

  attributes.style = {
    ...(cell.styles || {}),
    width,
    minWidth: width,
    maxWidth: width,
    // textAlign: col == 1 ? 'left' : 'end',
  };

  if (
    col > 1 &&
    (!labelCell.value ||
      !rowConfig.rowType ||
      rowConfig.rowType == ROW_TYPES_KEYS.formula ||
      (rowConfig.rowType == ROW_TYPES_KEYS.extract && !cell.isForecast))
  ) {
    cell.readOnly = true;
  } else {
    cell.readOnly = false;
  }

  if (isViewMode) cell.readOnly = true;

  if (rowConfig.isRowUseAsHeading && col >= 1) {
    if (col > 1) cell.readOnly = true;

    attributes.style = {
      ...attributes.style,
      borderLeft: 0,
      borderRight: 0,
    };

    restProps.className += ' row-use-as-heading';
  }

  if (cell.error || rowConfig.error) {
    restProps.className += ' error';
  }

  if (col == 0) {
    restProps.className +=
      ' header-cell serial-number text-center cursor-pointer';
    attributes.style.justifyContent = 'center';

    if (rowConfig.error) {
      restProps.className += ' sr-error';
    }
  }

  if (col == 1) {
    restProps.className += ' model-label';
  }

  if (col != 1) {
    cell.readOnly = !isCellEditable({ cell, rowConfig });
    restProps.className += ' text-right';
  }

  if (col > 1 && cell.readOnly) {
    restProps.className += ' disabled readonly-color';
  }

  /**
   * Open Context Menu
   *
   * @param {Event} evt
   */
  // const openContextMenu = evt => {
  //   evt.stopPropagation();
  //   evt.preventDefault();

  //   if (col < 2) return;

  //   onUpdateSelection(selection);

  //   // Trigger to close other contect menus
  //   evt.currentTarget.click();

  //   setContextEle(evt.currentTarget);
  // };

  /**
   * Close Context Menu
   */
  const closeContextMenu = () => {
    setContextEle(null);
  };

  /**
   * Verify > Is Context Menu Action Disabled
   *
   * @param {String} action
   *
   * @param {Boolean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case CELL_CONTEXT_MENU_ACTIONS_KEYS.copyValue:
      case CELL_CONTEXT_MENU_ACTIONS_KEYS.copyReference:
      case CELL_CONTEXT_MENU_ACTIONS_KEYS.resetStyles:
        return false;

      case CELL_CONTEXT_MENU_ACTIONS_KEYS.paste:
      case CELL_CONTEXT_MENU_ACTIONS_KEYS.cutValue:
        return cell.readOnly;

      default:
        return true;
    }
  };

  /**
   * Handle Context Menu Action
   *
   * @param {String} action
   */
  const handleContextMenuAction = action => () => {
    switch (action) {
      case CELL_CONTEXT_MENU_ACTIONS_KEYS.copyValue:
        handleCopyCells({ isCopyValue: true });
        break;

      case CELL_CONTEXT_MENU_ACTIONS_KEYS.copyReference:
        handleCopyCells({ isCopyFormula: true });
        break;

      case CELL_CONTEXT_MENU_ACTIONS_KEYS.cutValue:
        const cutValue = getFormattedCellValue({
          col,
          value: cell.value,
          rowConfig,
        });
        copyToClipBoard(cutValue);
        updateCellProgrammatically({ row, col, isCut: true });
        break;

      case CELL_CONTEXT_MENU_ACTIONS_KEYS.paste:
        pasteDataProgrammatically();
        break;

      case CELL_CONTEXT_MENU_ACTIONS_KEYS.resetStyles:
        updateCellProgrammatically({ row, col, styles: {} });
        break;

      default:
        break;
    }

    setContextEle(null);
  };

  /**
   * Render Cell
   */
  const renderCellItem = () => {
    switch (col) {
      case 0:
        return row + 1;

      case 1:
        if (editing) return children;

        return (
          <RowLabelCell
            rowConfig={rowConfig}
            totalRows={rowConfigs.length}
            isViewMode={isViewMode}
            row={row}
            toggleSetupRow={toggleSetupRow}
            toggleRowContextMenu={toggleRowContextMenu}
            cell={cell}
          >
            {children}
          </RowLabelCell>
        );

      default:
        return children;
    }
  };
  let { value = '' } = cell || {};

  if (value != '' && col != 1) {
    value = value?.noExponents();
  }

  return (
    <React.Fragment>
      <div
        {...restProps}
        {...attributes}
        title={value}
        // Temporary comment ContextMenu due to unstable of copy/Paste formula Cell using mouse(PAI-515).
        // onContextMenu={openContextMenu}
      >
        {renderCellItem()}
      </div>

      <Popper
        open={Boolean(contextEle)}
        anchorEl={contextEle}
        transition
        placement="top-end"
        onClose={closeContextMenu}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'left bottom' }}>
            <Paper elevation={16}>
              <ClickAwayListener
                mouseEvent="onMouseDown"
                touchEvent="onTouchStart"
                onClickAway={closeContextMenu}
              >
                <Card p={0.5}>
                  {CELL_CONTEXT_MENU_ACTIONS.map(action => (
                    <MenuItem
                      key={action}
                      onClick={handleContextMenuAction(action)}
                      disabled={isActionDisabled(action)}
                    >
                      {action}
                    </MenuItem>
                  ))}
                </Card>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};

CellRenderer.defaultProps = {
  cell: {},
  toggleSetupRow: () => () => {},
  toggleRowContextMenu: () => () => {},
  handleCopyCells: () => {},
};

export default CellRenderer;
