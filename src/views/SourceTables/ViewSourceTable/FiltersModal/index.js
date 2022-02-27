import React, { useState } from 'react';
import moment from 'moment';
import { shape, string, func, bool } from 'prop-types';

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

import MomentUtils from '@date-io/moment';

import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowRightAltRounded as ArrowRightAltRoundedIcon,
  FilterList as FilterListIcon,
} from '@material-ui/icons';

import ImgRenderer from '../../../../components/ImgRenderer';
import {
  COLUMN_DATA_TYPES_KEYS,
  DATE_COMPARE_FORMAT,
} from '../../../../configs/app';
import getNumbers from '../../../../utils/helper/getNumbers';

import './styles.scss';

const SortDirection = {
  ASC: 'asc',
  DESC: 'desc',
};

function ViewSourceTableFiltersModal({
  state,
  label,
  lableForView,
  handleDoneAction,
  handleSortAction,
  handleResetAction,
  tableMetaData,
  rangeData,
  hideFilters,
}) {
  let numberRange = [0, 100000];
  if (rangeData[label]) {
    numberRange = [
      rangeData[label].min_range || 0,
      rangeData[label].max_range || 1,
    ];
  }

  const { selectedRange, selectedDateRange, search } = state;

  const dataType =
    (tableMetaData[label] && String(tableMetaData[label].data_type)) ||
    COLUMN_DATA_TYPES_KEYS.alphanumeric;

  const defaultDateRange = selectedDateRange[label] || {
    start: '',
    end: '',
  };

  const defaultRangeValue =
    selectedRange[label] && selectedRange[label].length == 2
      ? [...selectedRange[label]]
      : [numberRange[0], numberRange[1]];

  const [filtersEl, setFiltersEl] = useState(null);
  const [searchInput, setSearch] = useState(search[label]);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [rangeValue, setRangeValue] = React.useState(defaultRangeValue);

  const openPopover = ({ currentTarget }) => {
    setFiltersEl(currentTarget);
  };

  const closePropover = () => {
    setFiltersEl(null);
  };

  const handleReset = () => {
    setRangeValue([numberRange[0], numberRange[1]]);
    setDateRange({ start: '', end: '' });
    handleResetAction({
      label,
      rangeValue: undefined,
      dateRange: { start: '', end: '' },
      searchInput: '',
    });
  };

  const handleCancel = () => {
    setRangeValue(defaultRangeValue);
    setDateRange(defaultDateRange);
    setSearch(search[label]);
    closePropover(null);
  };

  const handleDone = evt => {
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
    closePropover(null);
  };

  const onChangeSearch = ({ target }) => {
    setSearch(target.value);
  };

  const handleSort = sortDirection => () => {
    setRangeValue(defaultRangeValue);
    setDateRange(defaultDateRange);
    setSearch(search[label]);
    handleSortAction({ sortBy: label, sortDirection });
    closePropover(null);
  };

  const handleChangeRangeValue = (event, newValue) => {
    let [start, end] = newValue;

    if (start < numberRange[0]) {
      start = numberRange[0];
    }

    if (end > numberRange[1]) {
      end = numberRange[1];
    }

    setRangeValue([start, end]);
  };

  const handleChangeRangeInput = ({ target }) => {
    const { name, value } = target;

    let validValue = getNumbers(value, true);
    if (!validValue) validValue = 0;

    if (name == 'rangeStart') {
      setRangeValue([validValue, rangeValue[1]]);
    }

    if (name == 'rangeEnd') {
      setRangeValue([rangeValue[0], validValue]);
    }
  };

  const handleChangeDateRange = name => date => {
    let validaDate = moment(date);
    validaDate = validaDate.isValid()
      ? validaDate.format(DATE_COMPARE_FORMAT)
      : '';

    setDateRange({ ...dateRange, [name]: validaDate });
  };

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
          <Tooltip title={lableForView} placement="top">
            <span>{lableForView}</span>
          </Tooltip>
        </Typography>
        {!hideFilters && (
          <Box align="right" onClick={openPopover} className="cursor-pointer">
            {dataType ? (
              <ImgRenderer src={`${dataType}.svg`} alt="" />
            ) : (
              <FilterListIcon fontSize="small" />
            )}
            <ArrowDropDownIcon />
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
                <Typography>
                  <Link
                    href="#"
                    variant="body2"
                    className="sort-link"
                    color="inherit"
                    onClick={handleSort(SortDirection.ASC)}
                  >
                    Sort A<ArrowRightAltRoundedIcon className="sort-icon" />Z
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
                    Sort Z<ArrowRightAltRoundedIcon className="sort-icon" />A
                  </Link>
                </Typography>
                <Box mt={2} mb={2}>
                  <Divider />
                </Box>
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
                    value={(dateRange.start && moment(dateRange.start)) || null}
                    onChange={handleChangeDateRange('start')}
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
                    value={(dateRange.end && moment(dateRange.end)) || null}
                    onChange={handleChangeDateRange('end')}
                    helperText=""
                    error={false}
                    inputProps={{ disabled: true }}
                  />
                </MuiPickersUtilsProvider>
              </>
            )}

            {dataType == COLUMN_DATA_TYPES_KEYS.amount && (
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
                <Box mb={1}>
                  <Typography variant="body2" color="primary">
                    Amount Range
                  </Typography>
                  <RangeSlider
                    aria-labelledby="amount-range-slider"
                    step={1}
                    min={
                      rangeValue[0] < numberRange[0]
                        ? Number(rangeValue[0])
                        : Number(numberRange[0])
                    }
                    max={
                      rangeValue[1] > numberRange[1]
                        ? Number(rangeValue[1])
                        : Number(numberRange[1])
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
                        value={String(rangeValue[0])}
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
                        value={String(rangeValue[1])}
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

ViewSourceTableFiltersModal.propTypes = {
  handleDoneAction: func,
  handleResetAction: func,
  handleSortAction: func,
  hideFilters: bool,
  label: string,
  lableForView: string,
  rangeData: shape({}),
  state: shape({}),
  tableMetaData: shape({}),
};

ViewSourceTableFiltersModal.defaultProps = {
  handleDoneAction: () => {},
  handleResetAction: () => {},
  handleSortAction: () => {},
  label: '',
  lableForView: '',
  rangeData: {},
  state: {},
  tableMetaData: {},
  hideFilters: false,
};

export default ViewSourceTableFiltersModal;
