/* eslint-disable react/prop-types */
import React from 'react';
import { Box } from '@material-ui/core';

/**
 * Render Sheet (Headings Section)
 *
 * @param {Object} props
 */
const SheetRenderer = ({ children, className }) => {
  return (
    <Box>
      <div className={className}>
        <div className="data-body">{children}</div>
      </div>
    </Box>
  );
};

SheetRenderer.defaultProps = {
  tableHeight: 40,
  handleScrollEvent: () => {},
};

export default SheetRenderer;
