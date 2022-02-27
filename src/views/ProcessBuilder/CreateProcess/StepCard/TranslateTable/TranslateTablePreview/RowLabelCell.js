import React from 'react';
import { func, number, shape } from 'prop-types';
import { Box, IconButton } from '@material-ui/core';

import ImgRenderer from '../../../../../../components/ImgRenderer';

function RowLabelCell({ children, toggleRowContextMenu, rowIndex }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      className="label-cell"
    >
      <Box maxWidth="95%" width="100%" pl={5} pr={1}>
        <Box className="row-index" title={rowIndex + 1}>
          {rowIndex + 1}
        </Box>
        {children}
      </Box>

      <Box className="mapping-actions">
        <IconButton size="small" onClick={toggleRowContextMenu}>
          <Box title="Settings" width="22px">
            <ImgRenderer
              src="content-menu.svg"
              style={{ width: '22px', padding: '2px' }}
            />
          </Box>
        </IconButton>
      </Box>
    </Box>
  );
}

RowLabelCell.propTypes = {
  children: shape({}).isRequired,
  rowIndex: number.isRequired,
  toggleRowContextMenu: func,
};

RowLabelCell.defaultProps = {
  toggleRowContextMenu: () => {},
};

export default RowLabelCell;
