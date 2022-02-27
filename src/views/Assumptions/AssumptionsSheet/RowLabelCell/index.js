import React from 'react';
import { func, number, shape } from 'prop-types';
import { Box, IconButton } from '@material-ui/core';

import ImgRenderer from '../../../../components/ImgRenderer';

function RowLabelCell({
  children,
  rowConfig,
  row,
  toggleSetupRow,
  toggleRowContextMenu,
  totalRows,
}) {
  return (
    <Box display="flex" justifyContent="space-between">
      <Box maxWidth="170px">{children}</Box>
      {row < totalRows - 1 && (
        <IconButton
          size="small"
          onClick={toggleRowContextMenu({ row })}
          disabled={false}
        >
          <Box py={1} />
          <ImgRenderer
            src="content-menu.svg"
            style={{ width: '22px', padding: '2px' }}
          />
        </IconButton>
      )}
    </Box>
  );
}

RowLabelCell.propTypes = {
  children: shape({}).isRequired,
  row: number.isRequired, // Row Index
  rowConfig: shape({}),
  toggleRowContextMenu: func,
  toggleSetupRow: func,
  totalRows: number,
};

RowLabelCell.defaultProps = {
  rowConfig: {},
  toggleRowContextMenu: () => {},
  toggleSetupRow: () => {},
};

export default RowLabelCell;
