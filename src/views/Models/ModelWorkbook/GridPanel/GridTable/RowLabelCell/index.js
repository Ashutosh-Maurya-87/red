import React from 'react';
import { func, number, shape, bool } from 'prop-types';
import { Box, IconButton, Tooltip } from '@material-ui/core';
import { Error as ErrorIcon } from '@material-ui/icons';
// import LoopIcon from '@material-ui/icons/Loop';

import ImgRenderer from '../../../../../../components/ImgRenderer';
import { ROW_TYPES_KEYS } from '../../../configs';

function RowLabelCell({
  children,
  rowConfig,
  isViewMode,
  row,
  cell,
  toggleSetupRow,
  toggleRowContextMenu,
  totalRows,
}) {
  const { rowType, isPostingEnable, error } = rowConfig;

  return (
    <Box display="flex" justifyContent="space-between" className="label-cell">
      <Box maxWidth="95%" width="100%" className="cell-with-right-action">
        {totalRows == row + 1 ? (
          <Box style={{ opacity: '0.5' }}>Type Row Name here</Box>
        ) : (
          children
        )}
      </Box>
      {error && (
        <Tooltip title={error} placement="top" arrow interactive>
          <Box
            display="flex"
            alignItems="center"
            className="cursor-pointer"
            mr={0.5}
          >
            <ErrorIcon fontSize="small" className="error" />
            {/* <LoopIcon fontSize="small" className="refresh" /> */}
          </Box>
        </Tooltip>
      )}

      <Box
        className="mapping-actions"
        style={{ display: totalRows == row + 1 ? 'none' : 'flex' }}
      >
        {isPostingEnable && (
          <Box
            title="Posting Enabled"
            display="inline-flex"
            style={{ verticalAlign: 'middle' }}
          >
            <ImgRenderer
              src="database-edit-icon.svg"
              style={{ height: '22px', padding: '3px' }}
            />
          </Box>
        )}

        {cell.value && !isViewMode && (
          <>
            <IconButton
              size="small"
              onClick={toggleSetupRow({ row })}
              disabled={!cell.value || isViewMode}
            >
              {rowType == ROW_TYPES_KEYS.freeform && (
                <Box title="Freeform Row" height="22px">
                  <ImgRenderer
                    src="edit.svg"
                    style={{ height: '22px', padding: '3px' }}
                  />
                </Box>
              )}

              {rowType == ROW_TYPES_KEYS.extract && (
                <Box title="Extract Row" height="22px">
                  <ImgRenderer
                    src="database.svg"
                    style={{ height: '22px', padding: '3px' }}
                  />
                </Box>
              )}

              {rowType == ROW_TYPES_KEYS.formula && (
                <Box title="Formula Row" height="22px">
                  <ImgRenderer
                    src="fx-sign.svg"
                    style={{ height: '22px', padding: '3px' }}
                  />
                </Box>
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={toggleRowContextMenu({ row })}
              disabled={!cell.value || isViewMode}
            >
              <Box title="Settings" width="22px">
                <ImgRenderer
                  src="content-menu.svg"
                  style={{ width: '22px', padding: '2px' }}
                />
              </Box>
            </IconButton>
          </>
        )}

        {error && (
          <Tooltip title={error} placement="top" arrow interactive>
            <Box
              display="inline-flex"
              alignItems="center"
              className="cursor-pointer"
            >
              <ErrorIcon fontSize="small" className="error" />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

RowLabelCell.propTypes = {
  cell: shape({}),
  children: shape({}).isRequired,
  isViewMode: bool.isRequired,
  row: number.isRequired, // Row Index
  rowConfig: shape({}),
  toggleRowContextMenu: func,
  toggleSetupRow: func,
  totalRows: number,
};

RowLabelCell.defaultProps = {
  isViewMode: false,
  rowConfig: {},
  cell: {},
  toggleRowContextMenu: () => {},
  toggleSetupRow: () => {},
};

export default RowLabelCell;
