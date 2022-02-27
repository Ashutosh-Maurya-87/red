/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Box, IconButton, Typography } from '@material-ui/core';

import ImgRenderer from '../../../../components/ImgRenderer';

/**
 * Render Header Cell
 */
const HeaderCell = ({
  column,
  colIndex,
  rowIndex,
  toggleColContextMenu,
  updateHeaderValue,
  updateState,
}) => {
  const [isEditing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.label);

  const { label, width } = column;

  let className = 'cell header-cell';
  if (rowIndex == 0 && column.error) className += ' error';

  /**
   * Toggle > Editing Header Cell
   */
  const toggleEditing = () => {
    if (colIndex > 1 && colIndex % 2 == 0) {
      setEditing(!isEditing);
      updateState({ selected: {} });
    }
  };

  /**
   * Update Header Cell Value after Done
   *
   * @param {Event} evt
   */
  const updateCellValue = evt => {
    if (evt) evt.preventDefault();

    setEditing(false);

    const validValue = editValue.trim();
    setEditValue(validValue);

    if (updateHeaderValue) {
      updateHeaderValue({ value: validValue, rowIndex, colIndex });
    }
  };

  /**
   * Handle > On change input value
   *
   * @param {Event}
   */
  const changeInputValue = ({ target }) => {
    setEditValue(target.value);
  };

  const styles = {
    width,
    minWidth: width,
    maxWidth: width,
  };

  if (rowIndex == 0 && colIndex > 1) {
    if (colIndex % 2) {
      styles.borderLeft = 0;
    } else {
      styles.borderRight = 0;
    }
  }

  if (isEditing) {
    return (
      <div className={className} style={styles}>
        <form onSubmit={updateCellValue}>
          <input
            className="data-editor"
            value={editValue}
            autoFocus
            onChange={changeInputValue}
            onBlur={updateCellValue}
          />
        </form>
      </div>
    );
  }

  return (
    <div className={className} style={styles} onDoubleClick={toggleEditing}>
      <Typography noWrap variant="body2">
        {label}
      </Typography>

      {toggleColContextMenu && (
        <Box textAlign="right" width="100%">
          <IconButton
            size="small"
            onClick={toggleColContextMenu({ col: colIndex })}
            disabled={false}
          >
            <Box my={1} />
            <ImgRenderer
              src="content-menu.svg"
              style={{ width: '22px', padding: '2px' }}
            />
          </IconButton>
        </Box>
      )}
    </div>
  );
};

export default HeaderCell;
