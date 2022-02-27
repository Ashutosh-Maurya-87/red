/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Menu, MenuItem } from '@material-ui/core';
import { Draggable } from 'react-beautiful-dnd';

import { ROW_ACTIONS } from '../index';
import { DEFAULT_COL_WIDTH } from '../../../../../SourceTables/ImportSourceTable';

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
    firstColWidth,
    ...rest
  } = props;

  const attributes = cell.attributes || {};

  let width = DEFAULT_COL_WIDTH;
  if (!rest.className) rest.className = '';

  if (col == 0) {
    cell.readOnly = true;
    width = firstColWidth;

    rest.className += ' header-cell serial-number';
  }

  attributes.style = {
    width,
    minWidth: width,
    maxWidth: width,
  };

  const handleRightClick = evt => {
    try {
      evt.preventDefault();
      setMenuEle(evt.currentTarget);
    } catch (e) {
      console.error(e);
    }
  };

  const onClickRowAction = (action, row) => () => {
    setMenuEle(null);
    handleRowAction({ action, row });
  };

  return (
    <div
      {...rest}
      {...attributes}
      onContextMenu={col == 0 ? handleRightClick : undefined}
    >
      {col != 0 && props.children}

      {col == 0 && (
        <>
          <Draggable
            key={`cell-${row}-${col}`}
            draggableId={`cell-${row}-${col}`}
            isDragDisabled
            index={row}
          >
            {draggableProvided => (
              <div
                className="dragable-cell cursor-pointer"
                ref={draggableProvided.innerRef}
                {...draggableProvided.draggableProps}
                {...draggableProvided.dragHandleProps}
              >
                {row + 1}
              </div>
            )}
          </Draggable>

          <Menu
            id={`row-menu-${row}`}
            anchorEl={menuEle}
            open={Boolean(menuEle)}
            onClose={() => setMenuEle(null)}
          >
            {Object.keys(ROW_ACTIONS).map(action => (
              <MenuItem
                key={action}
                onClick={onClickRowAction(ROW_ACTIONS[action], row)}
              >
                {ROW_ACTIONS[action]}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </div>
  );
};

export default CellRenderer;
