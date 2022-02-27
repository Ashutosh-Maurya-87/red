/* eslint-disable react/prop-types */
import React from 'react';
import { Box } from '@material-ui/core';
import { func, shape, arrayOf, string } from 'prop-types';

import CustomScrollbars from '../../../../components/ScrollBars';
import HeaderCell from './HeaderCell';
import FilterCell from './FilterCell';

/**
 * Render Sheet (Headings Section)
 *
 * @param {Object} props
 */
const SheetRenderer = props => {
  const {
    className,
    columns,
    index,
    tableHeight,
    data,
    yearsShown,
    updateState,
  } = props;
  const id = `data-header-${index}`;

  const handleScroll = ({ target }) => {
    const { scrollLeft } = target;

    document.getElementById(id).scrollLeft = scrollLeft;
  };

  return (
    <Box mb={2}>
      <div className={className}>
        <CustomScrollbars style={{ width: '100%', height: '30px' }}>
          <div className="data-header" id={id}>
            <div className="flex-fill" style={{ height: '30px' }}>
              {columns.map((column, colIndex) =>
                colIndex == 0 ? (
                  <FilterCell
                    key={`${colIndex}`}
                    data={data}
                    column={column}
                    yearsShown={yearsShown}
                    updateState={updateState}
                  />
                ) : (
                  <>
                    <HeaderCell
                      {...props}
                      key={`${column.label}-${colIndex}`}
                      column={column}
                      colIndex={colIndex}
                    />
                  </>
                )
              )}
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

SheetRenderer.propTypes = {
  columns: arrayOf(shape({})),
  data: arrayOf(arrayOf(shape({}))),

  updateState: func,
  yearsShown: arrayOf(string),
};

SheetRenderer.defaultProps = {
  tableHeight: 40,

  updateState: () => {},
  yearsShown: [],
  headers: [],
  data: [],
};

export default SheetRenderer;
