import React from 'react';
import { arrayOf, func, number, shape } from 'prop-types';

import { Grid, Box } from '@material-ui/core';
import { FilterList as FilterListIcon } from '@material-ui/icons';

import { isHideFilter } from '../DataOverview/helper';

import { COL_WIDTH, DEFAULT_SORT_CONFIG, LABEL_COL_WIDTH } from '../configs';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';

import CustomColumnsFilters from '../../../../components/CustomFilters';

/**
 * Render Header Cell
 */
const HeaderCell = ({
  selectableRef = null,
  column,
  columns,
  colIndex,
  handleResizeClick,
  onHeadersUpdate,
}) => {
  /**
   * Header cell Styling
   *
   * @return {String} styles
   */
  const getHeaderCellStyles = () => {
    const styles = 'cell header-cell text-center';

    return styles;
  };

  /**
   * Handle Reset Filters Action
   *
   * @param {Object} params
   */
  const handleResetAction = (params = {}) => {
    const headers = [...columns];
    headers[colIndex].filter = params;
    headers[colIndex].sort = DEFAULT_SORT_CONFIG;

    onHeadersUpdate(headers);
  };

  /**
   * Apply Filters
   *
   * @param {Object} props
   */
  const handleDoneAction = (props = {}) => {
    const {
      dataType = '',
      filter: { searchInput = '', dateRange = {}, rangeValue = [] } = {},
    } = column || {};

    const {
      searchInput: searchInputProps,
      rangeValue: rangeValueProps,
      dateRange: dateRangeProps,
    } = props || {};

    // Return props if the filter values are same
    if (
      dataType == COLUMN_DATA_TYPES_KEYS.alphanumeric &&
      searchInputProps == searchInput
    ) {
      return;
    }

    if (
      dataType == COLUMN_DATA_TYPES_KEYS.amount &&
      rangeValue &&
      JSON.stringify(rangeValueProps) == JSON.stringify(rangeValue)
    ) {
      return;
    }

    if (
      dataType == COLUMN_DATA_TYPES_KEYS.date &&
      JSON.stringify(dateRangeProps) == JSON.stringify(dateRange)
    ) {
      return;
    }

    // Store filters in headers object
    const headers = [...columns];
    headers[colIndex].filter = props;

    onHeadersUpdate(headers);
  };

  /**
   * Apply Sorting
   *
   * @param {Object} props
   */
  const handleSortAction = (props = {}) => {
    const headers = [...columns];

    headers[colIndex].sort = props;

    onHeadersUpdate(headers);
  };

  /**
   * Default Filter States
   *
   * @returns {Object} state
   */
  const getFilterState = () => {
    const selectedRange = {};
    const selectedDateRange = {};
    const search = {};
    const {
      name = '',
      filter: { searchInput = '', dateRange = {}, rangeValue = [] } = {},
    } = column || {};

    search[name] = searchInput;
    selectedRange[name] = dateRange;
    selectedDateRange[name] = rangeValue;

    const state = {
      selectedRange,
      selectedDateRange,
      search,
    };

    return state;
  };

  // Providing width to header cells
  let width;

  if (column) ({ width } = column);
  if (colIndex == 0) width = LABEL_COL_WIDTH;
  if (colIndex > 0) width = COL_WIDTH;

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

  const {
    value = '',
    name = '',
    isFilterEnable = false,
    isSortingEnable = false,
    rangeData = {},
  } = column || {};

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
        <CustomColumnsFilters
          state={getFilterState()}
          label={name}
          hideFilters={!isFilterEnable}
          hideSorting={!isSortingEnable}
          filterIcon={
            <FilterListIcon
              className={isHideFilter(column) ? 'data-overview-filter' : ''}
              fontSize="small"
            />
          }
          labelForView={value}
          rangeData={rangeData}
          tableMetaData={column}
          handleSortAction={handleSortAction}
          handleDoneAction={handleDoneAction}
          handleResetAction={handleResetAction}
        />

        <Box align="right" mr={1}>
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

// Prop type Validation
HeaderCell.propTypes = {
  colIndex: number,
  column: shape({}),
  columns: arrayOf(shape({})),
  handleResizeClick: func,
  onHeadersUpdate: func,
  selectableRef: shape({}),
};

// default Prop type
HeaderCell.defaultProps = {
  handleResizeClick: () => {},
  onHeadersUpdate: () => {},
};

export default HeaderCell;
