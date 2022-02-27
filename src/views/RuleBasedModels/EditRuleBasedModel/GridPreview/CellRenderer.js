/* eslint-disable react/prop-types */
import {
  Card,
  ClickAwayListener,
  Grow,
  MenuItem,
  Paper,
  Popper,
} from '@material-ui/core';
import React, { useState } from 'react';
import { DEFAULT_DATE_FORMAT } from '../../../../configs/app';
import { COL_WIDTH, LABEL_COL_WIDTH } from '../configs';
import { getFormattedCellValue } from './helper';

/**
 * Render Single Cell
 */
const CellRenderer = props => {
  const [menuEle, setMenuEle] = useState(null);

  const {
    cell,
    row,
    col,
    columns,
    attributesRenderer,
    selected,
    editing,
    updated,
    style,
    handleRowAction,
    className,
    handleUpdateCell,
    totalRows,
    stepNumber,
    as: Tag = 'div',
    isContextMenuEnable,
    contextMenuOptions,
    onUpdateSelection,
    onClickRowAction,
    selection,
    ...rest
  } = props;

  let styles = className;

  const { dataType, dateFormat = DEFAULT_DATE_FORMAT } = columns[col] || {};

  const attributes = cell.attributes || {};

  let width;
  if (columns[col]) ({ width } = columns[col]);
  if (col == 0) width = LABEL_COL_WIDTH;
  if (col > 1) width = COL_WIDTH;

  if (col == 0) {
    width = 50;
  }

  cell.readOnly = true;
  attributes.style = {
    width,
    minWidth: width,
    maxWidth: width,
    minHeight: '32px',
  };

  /**
   * Get Styles for Cell
   *
   * @return {String}
   */
  const getCellStyles = props => {
    if (col == 0) {
      styles += ' header-cell serial-number text-center cursor-pointer';
    }

    if (col > 0) {
      styles += ' text-right';
    }

    if (col > 0 && cell.readOnly) {
      styles += ' disabled readonly-color';
    }

    return styles;
  };

  const handleRightClick = evt => {
    evt.stopPropagation();
    evt.preventDefault();

    evt.currentTarget.click();

    const selected = {
      end: { i: row, j: 0 },
      start: { i: row, j: 0 },
    };

    onUpdateSelection(selected);

    if (isContextMenuEnable) {
      setMenuEle(evt.currentTarget);
    }
  };

  /**
   * Close Context Menu
   */
  const closeContextMenu = () => {
    setMenuEle(null);
  };

  /**
   * Handle Row Actions
   * @param {Object} data
   * @returns
   */
  const handleRowActions = data => () => {
    onClickRowAction(data);
    closeContextMenu();
  };

  return (
    <>
      <Tag
        {...attributes}
        {...rest}
        className={getCellStyles()}
        title={getFormattedCellValue(dataType, dateFormat, cell?.value)}
        onContextMenu={handleRightClick}
      >
        {col === 0 && row + 1}
        {col > 0 && props.children}
      </Tag>

      <Popper
        open={Boolean(menuEle)}
        anchorEl={menuEle}
        transition
        placement="bottom-start"
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
                  {contextMenuOptions.map((option, index) => {
                    const { label = '' } = option || {};
                    return (
                      <MenuItem
                        key={index}
                        onClick={handleRowActions({
                          action: contextMenuOptions[index].value,
                          row,
                        })}
                      >
                        {label}
                      </MenuItem>
                    );
                  })}
                </Card>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default CellRenderer;
