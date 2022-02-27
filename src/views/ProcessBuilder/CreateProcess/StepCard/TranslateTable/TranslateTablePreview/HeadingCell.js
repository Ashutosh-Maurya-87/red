/* eslint-disable react/prop-types */
import React from 'react';
import { Typography, Grid, Box } from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon } from '@material-ui/icons';
import { LABEL_COL_WIDTH } from '..';

/**
 * Render Header Cell
 */
const HeadingCell = props => {
  const {
    selectableRef = null,
    column,
    headingCol,
    colIndex,
    openColumnsSeletion,
    isCompareCol,
    isUpdateCol,
    isFirstCompareCol,
    isFirstUpdateCol,
  } = props;

  const getHeaderCellStyles = () => {
    let styles = 'cell header-cell';

    if (colIndex == 0) return styles;

    if (isCompareCol) styles += ' col-compare';

    if (isUpdateCol) styles += ' col-update';

    return styles;
  };

  if (colIndex == 0) {
    return (
      <div
        ref={selectableRef}
        style={{
          width: LABEL_COL_WIDTH,
          minWidth: LABEL_COL_WIDTH,
          maxWidth: LABEL_COL_WIDTH,
        }}
        className={getHeaderCellStyles()}
      />
    );
  }

  const styles = {
    width: column.width,
    minWidth: column.width,
    maxWidth: column.width,
  };

  if (colIndex > 1 && !isFirstUpdateCol) {
    styles.borderLeftColor = 'transparent';
  }

  let className = 'table-header';
  if (
    (isCompareCol && props.headersToCompare.length > 1) ||
    (isUpdateCol && props.headersToUpdate.length > 1)
  ) {
    className += ' table-heading-header';
  }

  return (
    <div ref={selectableRef} style={styles} className={getHeaderCellStyles()}>
      <Grid
        container
        justify="space-between"
        alignItems="center"
        className="cursor-pointer"
        onClick={openColumnsSeletion}
      >
        {(isFirstCompareCol || isFirstUpdateCol) && (
          <Box
            display="flex"
            className={className}
            position="relative"
            alignItems="center"
          >
            <Typography
              variant="subtitle2"
              // className={className}
              color="textSecondary"
            >
              {headingCol.label || ''}
            </Typography>
            <ArrowDropDownIcon color="primary" />
          </Box>
        )}
      </Grid>
    </div>
  );
};

export default HeadingCell;
