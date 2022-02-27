/* eslint-disable react/prop-types */
import React from 'react';
import { Typography, Grid, Box } from '@material-ui/core';

import ImgRenderer from '../../../../../../components/ImgRenderer';

import { COLUMN_DATA_TYPES_KEYS } from '../../../../../../configs/app';
import { COL_WIDTH, LABEL_COL_WIDTH } from '..';

/**
 * Render Header Cell
 */
const HeaderCell = props => {
  const {
    selectableRef = null,
    column,
    colIndex,
    headersToCompare,
    handleResizeClick,
  } = props;

  const getHeaderCellStyles = () => {
    let styles = 'cell header-cell';

    if (colIndex == 0) return styles;

    if (colIndex <= headersToCompare.length) styles += ' col-compare-heading';

    if (colIndex > headersToCompare.length) styles += ' col-update-heading';

    return styles;
  };

  let width;
  if (column) ({ width } = column);
  if (colIndex == 0) width = LABEL_COL_WIDTH;
  if (!width) width = COL_WIDTH;

  if (colIndex == 0) {
    return (
      <div
        ref={selectableRef}
        style={{
          width,
          minWidth: width,
          maxWidth: width,
        }}
        className={getHeaderCellStyles()}
      />
    );
  }

  return (
    <div
      ref={selectableRef}
      style={{
        width,
        minWidth: width,
        maxWidth: width,
      }}
      className={getHeaderCellStyles()}
    >
      <Grid
        container
        justify="space-between"
        alignItems="center"
        className="flex-fill"
      >
        <Typography
          variant="subtitle2"
          className="table-header"
          color="textSecondary"
          title={column.display_name || ''}
        >
          {column.display_name || ''}
        </Typography>

        <Box align="right" mr={1}>
          <ImgRenderer
            src={`${
              column.data_type || COLUMN_DATA_TYPES_KEYS.alphanumeric
            }.svg`}
            alt=""
          />
          <span
            style={{
              height: '100%',
              width: '4px',
              cursor: 'w-resize',
              position: 'absolute',
              right: 0,
            }}
            onDoubleClick={handleResizeClick({ column, colIndex })}
          />
        </Box>
      </Grid>
    </div>
  );
};

export default HeaderCell;
