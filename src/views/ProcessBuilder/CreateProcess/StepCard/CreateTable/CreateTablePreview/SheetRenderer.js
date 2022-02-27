/* eslint-disable react/prop-types */
import React from 'react';
import { Box } from '@material-ui/core';
import CustomScrollbars from '../../../../../../components/ScrollBars';
import HeaderCell from './HeaderCell';

/**
 * Render Sheet (Headings Section)
 *
 * @param {Object} props
 */
const SheetRenderer = props => {
  const { className, columns, stepNumber, tableHeight } = props;
  const id = `data-header-${stepNumber}`;

  const handleScroll = ({ target }) => {
    const { scrollLeft } = target;

    document.getElementById(id).scrollLeft = scrollLeft;
  };

  return (
    <Box mb={2}>
      <div className={className}>
        <CustomScrollbars style={{ width: '100%', height: '34px' }}>
          <div className="data-header" id={id}>
            <div className="flex-fill">
              {columns.map((column, colIndex) => (
                <HeaderCell
                  key={`${column.label}-${column.dataType}-${colIndex}`}
                  {...props}
                  column={column}
                  colIndex={colIndex}
                />
              ))}
            </div>
          </div>
        </CustomScrollbars>
        <CustomScrollbars
          style={{ width: '100%', height: tableHeight }}
          onScroll={handleScroll}
        >
          <div className="data-body">{props.children}</div>
        </CustomScrollbars>
      </div>
    </Box>
  );
};

export default SheetRenderer;
