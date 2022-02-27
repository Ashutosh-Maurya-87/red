/* eslint-disable react/prop-types */
import React from 'react';
import { Box } from '@material-ui/core';

import HeaderCell from '../HeaderCell';

/**
 * Render Sheet (Headings Section)
 *
 * @param {Object} props
 */
const SheetRenderer = props => {
  const { className, columns } = props;

  return (
    <Box>
      <div className={className}>
        {/* This section is only used to detect table offset width */}
        <div
          className="data-header"
          id="data-header"
          style={{ width: '100%', height: 0 }}
        >
          {columns.map((column, colIndex) => (
            <HeaderCell
              {...props}
              key={`${column.label}-${colIndex}`}
              column={column}
              colIndex={colIndex}
            />
          ))}
        </div>

        <div className="data-body">{props.children}</div>
      </div>
    </Box>
  );
};

SheetRenderer.defaultProps = {
  tableHeight: 40,
  handleScrollEvent: () => {},
};

export default SheetRenderer;
