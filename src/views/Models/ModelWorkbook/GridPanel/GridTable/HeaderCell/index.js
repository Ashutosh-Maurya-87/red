/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Box, IconButton, MenuItem, Popover } from '@material-ui/core';
import {
  ArrowRightAlt as ArrowRightAltIcon,
  MoreVert as MoreVertIcon,
} from '@material-ui/icons';

import ResizeColumnDialog from '../ResizeColumnDialog';
import {
  FIXED_ROWS,
  FIXED_COLUMNS,
  HEADER_CONTEXT_MENU_ACTIONS,
  HEADER_CONTEXT_MENU_ACTIONS_KEYS,
} from '../../configs';
import { getAlphabetColumnName } from '../../../helper';

/**
 * Render Header Cell
 */
const HeaderCell = ({
  column,
  totalCols,
  totalRows,
  rowIndex,
  colIndex,
  updateHeader,
  tableWidth,
  updateState,
  handleDoubleClick,
}) => {
  const [contextEle, setContextEle] = useState(false);
  const [isColumnResize, setIsColumnResize] = useState(false);
  const { label, width, isForecast, isLastActual, isFirstForecast } = column;

  let className = 'cell header-cell';
  if (isForecast) className += ` forecast-color`;

  const styles = {
    width,
    minWidth: width,
    maxWidth: width,
    height: '60px',
    minHeight: '60px',
  };

  let updatedLabel = <>{String(label || '')}</>;

  if (FIXED_ROWS == 2 && rowIndex == 1) {
    styles.padding = 0;
    styles.height = '90px';
    styles.minHeight = '90px';
  }

  if (FIXED_ROWS == 2 && rowIndex == 0) {
    styles.fontSize = '12px';
    styles.height = '24px';
    styles.minHeight = '24px';
    styles.paddingTop = 2;
    styles.paddingBottom = 0;

    if (colIndex > FIXED_COLUMNS) styles.borderLeft = 0;
    if (colIndex >= FIXED_COLUMNS && colIndex < totalCols - 1) {
      styles.borderRight = 0;
    }

    if (!isForecast && colIndex >= FIXED_COLUMNS) {
      styles.justifyContent = 'flex-end';
      updatedLabel = isLastActual ? (
        <Box display="flex">
          <ArrowRightAltIcon className="rotate-180" />
          <Box ml={1}>Actual</Box>
        </Box>
      ) : (
        <></>
      );
    }

    if (isForecast) {
      updatedLabel = isFirstForecast ? (
        <Box display="flex">
          <Box className="forecast-text" mr={1}>
            Forecast
          </Box>
          <ArrowRightAltIcon />
        </Box>
      ) : (
        <></>
      );
    }
  }

  /**
   * Open Context Menu
   *
   * @param {Event} evt
   */
  const openContextMenu = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    if (rowIndex == 0 || colIndex == 0) return;

    setContextEle(evt.currentTarget);
  };

  /**
   * Close Context Menu
   */
  const closeContextMenu = () => {
    setContextEle(null);
  };

  /**
   * Handle Context Menu Action
   *
   * @param {String} action
   */
  const handleContextMenuAction = action => () => {
    setContextEle(null);

    switch (action) {
      case HEADER_CONTEXT_MENU_ACTIONS_KEYS.resizeAbove:
        setTimeout(() => {
          updateState({ selected: {} });
        }, 100);

        setIsColumnResize(true);
        break;

      default:
        break;
    }
  };

  /**
   * Update Column Width
   *
   * @param {Number} newWidth
   */
  const updateWidth = newWidth => {
    setIsColumnResize(false);

    updateHeader({ ...column, width: newWidth });
  };

  /**
   * Handle Click on Label
   */
  const handleClick = () => {
    if (!updateState) return;

    const selected = {
      start: { i: 0, j: colIndex == 0 ? 1 : colIndex },
      end: { i: totalRows - 1, j: colIndex == 0 ? totalCols - 1 : colIndex },
    };

    updateState({ selected });
  };

  return (
    <>
      <div style={styles} className={className} onClick={handleClick}>
        <Box
          display="flex"
          justifyContent="center"
          flexDirection="column"
          style={{ width: '100%' }}
        >
          {rowIndex == 1 && colIndex > 1 && (
            <>
              <Box
                display="flex"
                justifyContent="center"
                padding="4px 15px"
                border={1}
                borderColor="secondary.stepBorderColor"
                borderLeft={0}
                borderRight={0}
                borderTop={0}
              >
                {getAlphabetColumnName(colIndex - 1)}
              </Box>
              <span
                style={{
                  height: '100%',
                  width: '4px',
                  cursor: 'w-resize',
                  position: 'absolute',
                  right: 0,
                }}
                onDoubleClick={handleDoubleClick}
              />
            </>
          )}

          <Box
            padding="4px 15px"
            minHeight="60px"
            display="flex"
            alignItems="center"
            position="relative"
          >
            <Box paddingRight="15px">{updatedLabel}</Box>
            {rowIndex == 1 && colIndex > 0 && (
              <Box className="header-context-menu">
                <IconButton size="small" onClick={openContextMenu}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        <Popover
          open={Boolean(contextEle)}
          anchorEl={contextEle}
          onClose={closeContextMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            style: { width: '160px' },
          }}
        >
          <Box p={0.5}>
            {HEADER_CONTEXT_MENU_ACTIONS.map(action => (
              <MenuItem key={action} onClick={handleContextMenuAction(action)}>
                {action}
              </MenuItem>
            ))}
          </Box>
        </Popover>
      </div>

      {isColumnResize && (
        <ResizeColumnDialog
          handleCancel={() => setIsColumnResize(false)}
          updateWidth={updateWidth}
          width={width}
          tableWidth={tableWidth}
        />
      )}
    </>
  );
};

export default HeaderCell;
