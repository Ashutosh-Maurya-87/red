import React, { useState } from 'react';
import { shape, string, func, bool, node } from 'prop-types';
import MomentUtils from '@date-io/moment';
import moment from 'moment';

import {
  Popover,
  TextField,
  Box,
  Grid,
  Button,
  Typography,
  Link,
  Divider,
  Slider as RangeSlider,
  Tooltip,
} from '@material-ui/core';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import {
  ArrowRightAltRounded as ArrowRightAltRoundedIcon,
  FilterList as FilterListIcon,
} from '@material-ui/icons';

import {
  COLUMN_DATA_TYPES_KEYS,
  DATE_COMPARE_FORMAT,
  getMaxGridInputValue,
} from '../../configs/app';
import {
  endDate,
  startDate,
} from '../../views/RuleBasedModels/EditRuleBasedModel/configs';
import { rangeEnd, rangeStart, SortDirection } from './configs';
import getNumbers from '../../utils/helper/getNumbers';

import ImgRenderer from '../ImgRenderer';

import './styles.scss';

/**
 * Custom Columns Filters
 */
function CustomColumnsFilters({
  state,
  label,
  labelForView,
  handleDoneAction,
  handleSortAction,
  handleResetAction,
  tableMetaData,
  rangeData,
  hideFilters,
  hideSorting,
  filterIcon,
}) {
  let numberRange = [0, getMaxGridInputValue()];

  if (rangeData[label]) {
    numberRange = [
      rangeData[label].min_range || 0,
      rangeData[label].max_range || getMaxGridInputValue(),
    ];
  }
  const [firstNumberRange = '', secondNumberRange = ''] = numberRange || [];

  const { selectedRange = {}, selectedDateRange = {}, search = {} } =
    state || {};

  const dataType =
    (tableMetaData && String(tableMetaData?.dataType)) ||
    COLUMN_DATA_TYPES_KEYS.alphanumeric;

  // Default Date Range
  const defaultDateRange = selectedDateRange[label] || {
    start: '',
    end: '',
  };

  // Default Range value
  const defaultRangeValue =
    selectedRange[label] && selectedRange[label].length == 2
      ? [...selectedRange[label]]
      : [firstNumberRange, secondNumberRange];

  // States
  const [filtersEl, setFiltersEl] = useState(null);
  const [searchInput, setSearch] = useState(search[label]);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [rangeValue, setRangeValue] = React.useState(defaultRangeValue);

  const [firstRangeValue = '', secondRangeValue = ''] = rangeValue || [];

  /**
   * Open Filter Popover
   *
   * @param {Object} currentTarget
   */
  const handleOpenFilter = ({ currentTarget = {} }) => {
    setFiltersEl(currentTarget);
  };

  /**
   * Close Filter Popover
   */
  const handleCloseFilter = () => {
    setFiltersEl(null);
  };

  /**
   * Handle Reset Button
   */
  const handleReset = () => {
    setRangeValue([firstNumberRange, secondNumberRange]);
    setDateRange({ start: '', end: '' });
    setSearch('');

    handleResetAction({
      label,
      rangeValue: undefined,
      dateRange: { start: '', end: '' },
      searchInput: '',
    });
    handleCloseFilter(null);
  };

  /**
   * Handle Cancel Button
   */
  const handleCancel = () => {
    setRangeValue(defaultRangeValue);
    setDateRange(defaultDateRange);
    setSearch(search[label]);

    handleCloseFilter(null);
  };

  /**
   * Apply Filters on Done
   *
   * @param {Object} evt
   */
  const handleDone = (evt = {}) => {
    if (evt) evt.preventDefault();

    let validRangeValue = rangeValue;

    if (
      dataType == COLUMN_DATA_TYPES_KEYS.amount &&
      numberRange.toString() == rangeValue.toString()
    ) {
      validRangeValue = undefined;
    }

    handleDoneAction({
      label,
      rangeValue: validRangeValue,
      dateRange,
      searchInput,
    });
    handleCloseFilter(null);
  };

  /**
   * Handle Search Input
   *
   * @param {String} value
   */
  const onChangeSearch = ({ target: { value = '' } = {} }) => {
    setSearch(value);
  };

  /**
   * Handle Sort Filters
   *
   * @param {String} sortDirection
   */
  const handleSort = (sortDirection = '') => () => {
    setRangeValue(defaultRangeValue);
    setDateRange(defaultDateRange);
    setSearch(search[label]);

    handleSortAction({ sortBy: label, sortDirection });
    handleCloseFilter(null);
  };

  /**
   * Handle Range values
   *
   * @param {object} e
   * @param {Array} newValue
   *
   */
  const handleChangeRangeValue = (e, newValue = []) => {
    let [start = '', end = ''] = newValue || [];

    if (start < firstNumberRange) {
      start = firstNumberRange;
    }

    if (end > secondNumberRange) {
      end = secondNumberRange;
    }

    setRangeValue([start, end]);
  };

  /**
   * Handle Range Input
   *
   * @param {Object} target
   *
   */
  const handleChangeRangeInput = ({
    target: { name = '', value = '' } = {},
  }) => {
    let validValue = getNumbers(value, true);

    if (!validValue) validValue = 0;

    if (name == rangeStart) {
      setRangeValue([validValue, secondRangeValue]);
    }

    if (name == rangeEnd) {
      setRangeValue([firstRangeValue, validValue]);
    }
  };

  /**
   * Handle Date Range
   *
   * @param {String} name
   * @param {String} date
   *
   */
  const handleChangeDateRange = (name = '') => (date = '') => {
    let validateDate = moment(date);

    validateDate = validateDate.isValid()
      ? validateDate.format(DATE_COMPARE_FORMAT)
      : '';

    setDateRange({ ...dateRange, [name]: validateDate });
  };

  const { start: startDateRange = '', end: endDateRange = '' } =
    dateRange || {};

  return (
    <>
      <Grid container justify="space-between" alignItems="center">
        <Typography
          variant="body2"
          color="textSecondary"
          className="table-header"
          align="left"
          style={{ width: hideFilters ? '100%' : '60%' }}
        >
          <Tooltip title={labelForView} placement="top">
            <span>{labelForView}</span>
          </Tooltip>
        </Typography>
        {!hideFilters && (
          <Box
            align="right"
            onClick={handleOpenFilter}
            className="cursor-pointer"
          >
            {filterIcon ? filterIcon : null}
            {!filterIcon && dataType && (
              <ImgRenderer src={`${dataType}.svg`} alt="" />
            )}
            {!filterIcon && !dataType && <FilterListIcon fontSize="small" />}
          </Box>
        )}
      </Grid>

      {filtersEl && (
        <Popover
          id="mouse-over-popover"
          open={Boolean(filtersEl)}
          anchorEl={filtersEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          onClose={handleDone}
          disableRestoreFocus
        >
          <Box className="transpose-popover">
            {dataType == COLUMN_DATA_TYPES_KEYS.alphanumeric && (
              <>
                {!hideSorting && (
                  <>
                    <Typography>
                      <Link
                        href="#"
                        variant="body2"
                        className="sort-link"
                        color="inherit"
                        onClick={handleSort(SortDirection.ASC)}
                      >
                        Sort A<ArrowRightAltRoundedIcon className="sort-icon" />
                        Z
                      </Link>
                    </Typography>
                    <Typography>
                      <Link
                        href="#"
                        variant="body2"
                        className="sort-link"
                        color="inherit"
                        onClick={handleSort(SortDirection.DESC)}
                      >
                        Sort Z<ArrowRightAltRoundedIcon className="sort-icon" />
                        A
                      </Link>
                    </Typography>
                    <Box mt={2} mb={2}>
                      <Divider />
                    </Box>
                  </>
                )}
                <form onSubmit={handleDone}>
                  <TextField
                    name="search"
                    value={searchInput || ''}
                    onChange={onChangeSearch}
                    autoComplete="off"
                    color="primary"
                    size="small"
                    className="search-input"
                    placeholder="Search"
                    variant="outlined"
                  />
                </form>
              </>
            )}

            {dataType == COLUMN_DATA_TYPES_KEYS.date && (
              <>
                {!hideSorting && (
                  <>
                    <Typography>
                      <Link
                        href="#"
                        variant="body2"
                        className="sort-link"
                        color="inherit"
                        onClick={handleSort(SortDirection.ASC)}
                      >
                        Sort Ascending
                      </Link>
                    </Typography>
                    <Typography>
                      <Link
                        href="#"
                        variant="body2"
                        className="sort-link"
                        color="inherit"
                        onClick={handleSort(SortDirection.DESC)}
                      >
                        Sort Descending
                      </Link>
                    </Typography>
                    <Box mt={2} mb={2}>
                      <Divider />
                    </Box>
                  </>
                )}
                <Box mb={1}>
                  <Typography variant="body2" color="primary">
                    Start Date
                  </Typography>
                </Box>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                  <KeyboardDatePicker
                    autoOk
                    name="startDate"
                    id="start-date-picker"
                    size="small"
                    variant="outlined"
                    inputVariant="outlined"
                    format={DATE_COMPARE_FORMAT}
                    value={(startDateRange && moment(startDateRange)) || null}
                    onChange={handleChangeDateRange(startDate)}
                    helperText=""
                    error={false}
                    inputProps={{ disabled: true }}
                  />
                </MuiPickersUtilsProvider>
                <Box mb={1} mt={2}>
                  <Typography variant="body2" color="primary">
                    End Date
                  </Typography>
                </Box>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                  <KeyboardDatePicker
                    autoOk
                    size="small"
                    name="endDate"
                    id="end-date-picker"
                    variant="outlined"
                    inputVariant="outlined"
                    format={DATE_COMPARE_FORMAT}
                    value={(endDateRange && moment(endDateRange)) || null}
                    onChange={handleChangeDateRange(endDate)}
                    helperText=""
                    error={false}
                    inputProps={{ disabled: true }}
                  />
                </MuiPickersUtilsProvider>
              </>
            )}

            {dataType == COLUMN_DATA_TYPES_KEYS.amount && (
              <>
                {!hideSorting && (
                  <>
                    <Typography>
                      <Link
                        href="#"
                        variant="body2"
                        className="sort-link"
                        color="inherit"
                        onClick={handleSort(SortDirection.ASC)}
                      >
                        Sort Low to High
                      </Link>
                    </Typography>
                    <Typography>
                      <Link
                        href="#"
                        variant="body2"
                        className="sort-link"
                        color="inherit"
                        onClick={handleSort(SortDirection.DESC)}
                      >
                        Sort High to Low
                      </Link>
                    </Typography>
                    <Box my={2}>
                      <Divider />
                    </Box>
                  </>
                )}
                <Box mb={1}>
                  <Typography variant="body2" color="primary">
                    Amount Range
                  </Typography>
                  <RangeSlider
                    aria-labelledby="amount-range-slider"
                    step={1}
                    min={
                      firstRangeValue < firstNumberRange
                        ? Number(firstRangeValue)
                        : Number(firstNumberRange)
                    }
                    max={
                      secondRangeValue > secondNumberRange
                        ? Number(secondRangeValue)
                        : Number(secondNumberRange)
                    }
                    value={rangeValue}
                    onChange={handleChangeRangeValue}
                  />
                  <Box display="flex" justifyContent="space-between">
                    <form onSubmit={handleDone}>
                      <TextField
                        name="rangeStart"
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                        placeholder="Min"
                        value={String(firstRangeValue)}
                        onChange={handleChangeRangeInput}
                        style={{ width: '110px' }}
                      />
                    </form>
                    <form onSubmit={handleDone}>
                      <TextField
                        name="rangeEnd"
                        size="small"
                        variant="outlined"
                        placeholder="Max"
                        autoComplete="off"
                        value={String(secondRangeValue)}
                        onChange={handleChangeRangeInput}
                        style={{ width: '110px' }}
                      />
                    </form>
                  </Box>
                </Box>
              </>
            )}

            <Box mt={2} mb={1}>
              <Divider />
            </Box>
            <Grid container justify="space-between" alignItems="center">
              <Button onClick={handleReset}>Reset</Button>
              <Box>
                <Button color="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleDone}>
                  Done
                </Button>
              </Box>
            </Grid>
          </Box>
        </Popover>
      )}
    </>
  );
}

// Prop type Validation
CustomColumnsFilters.propTypes = {
  filterIcon: node,
  handleDoneAction: func,
  handleResetAction: func,
  handleSortAction: func,
  hideFilters: bool,
  hideSorting: bool,
  label: string,
  labelForView: string,
  rangeData: shape({}),
  state: shape({}),
  tableMetaData: shape({}),
};

// Prop type Default values
CustomColumnsFilters.defaultProps = {
  handleDoneAction: () => {},
  handleResetAction: () => {},
  handleSortAction: () => {},
  label: '',
  labelForView: '',
  rangeData: {},
  state: {},
  tableMetaData: {},
  hideFilters: false,
  hideSorting: true,
};

export default CustomColumnsFilters;
