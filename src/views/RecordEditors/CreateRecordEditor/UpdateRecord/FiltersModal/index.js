import React, { useState, useEffect } from 'react';
import {
  shape,
  func,
  any,
  oneOfType,
  arrayOf,
  string,
  number,
} from 'prop-types';
import { Grid as VirtualGrid } from 'react-virtualized';

import {
  Popover,
  TextField,
  Box,
  Grid,
  Button,
  Typography,
  Link,
  Divider,
  Checkbox,
} from '@material-ui/core';

import { ArrowRightAltRounded as ArrowRightAltRoundedIcon } from '@material-ui/icons';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
} from '../../../../../configs/app';
import { API_URLS } from '../../../../../configs/api';

import { getValueAsPerType } from '../../../../SourceTables/ProcessImportedTable/helper';
import { httpGet } from '../../../../../utils/http';

import './styles.scss';

const SortDirection = {
  ASC: 'asc',
  DESC: 'desc',
};

const VALUE_FILTER_ROW_HEIGHT = 40;

const COL_VALUES_FILTER_STR = {
  data: [],
  isAllSelected: true,
  selectedValues: {},
  count: 0,
};

const copyObject = data => {
  return JSON.parse(JSON.stringify(data));
};

let searchTimeout;

function RecordEditorFiltersModal({
  handleDoneAction,
  handleSortAction,
  handleResetAction,
  field,
  filtersEle,
  setFiltersEle,
  search,
  selectedDateRange,
  selectedAmountRange,
  colValuesList,
  setColValuesList,
}) {
  const { id, name: fieldName, data_type: dataType } = field;

  const defaultDateRange = selectedDateRange[fieldName] || {
    start: '',
    end: '',
  };

  const defaultValuesList = copyObject({
    ...(colValuesList[id] || COL_VALUES_FILTER_STR),
  });

  const defaultAmountRange = selectedAmountRange[fieldName] || ['', ''];

  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [amountRange, setAmountRange] = useState(defaultAmountRange);

  const [isFetchingColValues, setIsFetchingColValues] = useState(false);
  const [valuesList, setValuesList] = useState({ ...defaultValuesList });
  const [searchedValuesList, setSearchedValuesList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isValuesFilterUpdated, setIsValuesFilterUpdated] = useState(false);

  /**
   * Load Values List for Selected Column
   */
  const loadColValuesList = async () => {
    if (colValuesList[id]) return;

    const { src_type, user_table_id: tableId, src_type_id } = field;

    if (!tableId || !src_type) return;

    setIsFetchingColValues(true);

    let url = API_URLS.GET_VALUES_LIST_OF_COLUMN_IN_TABLE;
    url = url.replace(
      '#SOURCE_TYPE#',
      src_type == 'gl_account' || src_type == 'dimension'
        ? 'dimensions'
        : 'sources'
    );
    url = url.replace(
      '#TABLE_ID#',
      src_type == 'gl_account' || src_type == 'dimension'
        ? src_type_id
        : tableId
    );
    url = url.replace('#COL_ID#', id);

    url += `?limit=100000`;
    url += `&type=${src_type}`;
    url += `&page=1`;

    try {
      const res = await httpGet(url);

      const list = { ...COL_VALUES_FILTER_STR, data: res.data || [] };

      setValuesList({ ...list, field });
      setColValuesList(id, copyObject({ ...list, field }));
      setIsFetchingColValues(false);
    } catch (err) {
      console.error(err);

      setValuesList(COL_VALUES_FILTER_STR);
      setIsFetchingColValues(false);
    }
  };

  useEffect(() => {
    loadColValuesList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Close Filters Popover
   */
  const closePopover = () => {
    setFiltersEle(null);
  };

  /**
   * Handle > Reset Filters
   */
  const handleReset = () => {
    const dr = { start: '', end: '' };
    const ar = ['', ''];

    setSearchInput('');
    setDateRange(dr);
    setAmountRange(ar);
    setValuesList({
      ...defaultValuesList,
      isAllSelected: true,
      selectedValues: {},
      count: 0,
    });

    if (!isValuesFilterUpdated && !defaultValuesList.isAllSelected) {
      setIsValuesFilterUpdated(true);
    }

    handleResetAction({
      fieldName,
      searchInput: '',
      dateRange: dr,
      amountRange: ar,
    });
  };

  /**
   * Handle > Cancel Filters
   */
  const handleCancel = () => {
    setSearchInput('');
    setDateRange(defaultDateRange);
    setAmountRange(defaultAmountRange);
    setValuesList({ ...defaultValuesList });

    closePopover(null);
  };

  /**
   * Handle > Apply Filters
   */
  const handleDone = evt => {
    if (evt) evt.preventDefault();

    setColValuesList(id, { ...valuesList, field });

    handleDoneAction({
      fieldName,
      searchInput,
      dateRange,
      amountRange,
      isValuesFilterUpdated,
    });

    closePopover(null);
  };

  /**
   * On Change Search Input
   *
   * @param {Event}
   */
  const onChangeSearch = ({ target }) => {
    setSearchInput(target.value);
    setIsSearching(true);

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => searchValuesFromList(target.value), 1000);
  };

  /**
   * Search in values List
   *
   * @param {Any} value
   */
  const searchValuesFromList = value => {
    const valueLoweCase = value.toLowerCase();

    const result = valuesList.data.filter(({ name }) => {
      return String(name).toLowerCase().includes(valueLoweCase);
    });

    setIsSearching(false);
    setSearchedValuesList(result);
  };

  /**
   * Handle Sort Action
   *
   * @param {String} sortDirection
   */
  const handleSort = sortDirection => () => {
    setSearchInput(search[fieldName]);
    setDateRange(defaultDateRange);
    setAmountRange(defaultAmountRange);

    handleSortAction({ sortBy: fieldName, sortDirection });
    closePopover(null);
  };

  /**
   * Get Height of Values Filter Section
   *
   * @return {Number}
   */
  const getValuesListHeight = () => {
    if (isFetchingColValues || valuesList.data.length == 0) {
      return VALUE_FILTER_ROW_HEIGHT;
    }

    if (valuesList.data.length < 5) {
      return valuesList.data.length * VALUE_FILTER_ROW_HEIGHT;
    }

    return 200;
  };

  /**
   * Handle Selection of Values
   *
   * @param {Number} rowIndex
   * @param {Any} valueObj
   */
  const handleValueSelection = (rowIndex, valueObj) => () => {
    let { count = 0 } = valuesList;

    const { selectedValues = {} } = valuesList;
    const { name } = valueObj;

    const v = selectedValues[name];

    if (v == undefined && !valuesList.isAllSelected) {
      selectedValues[name] = valueObj;
      count++;
    } else if (selectedValues[name]) {
      delete selectedValues[name];
      count--;
    } else {
      selectedValues[name] = valueObj;
      count++;
    }

    if (valuesList.isAllSelected) {
      valuesList.data.forEach(selectedObj => {
        if (selectedObj.name == name) {
          delete valuesList.selectedValues[selectedObj.name];
          count--;
        } else {
          valuesList.selectedValues[selectedObj.name] = { ...selectedObj };
          count++;
        }
      });
    } else {
      valuesList.selectedValues = selectedValues;
    }

    valuesList.isAllSelected = false;
    valuesList.count = count;

    setValuesList({ ...valuesList });
    if (!isValuesFilterUpdated) setIsValuesFilterUpdated(true);
  };

  /**
   * Handle Select|Unselect All Values
   *
   * @param {Boolean} isSelectAll
   */
  const handleSelectAll = isSelectAll => () => {
    let { count = 0 } = valuesList;

    if (searchInput) {
      if (searchedValuesList.length == 0) return;

      if (!isValuesFilterUpdated && valuesList.isAllSelected != isSelectAll) {
        setIsValuesFilterUpdated(true);
      }
      valuesList.isAllSelected = isSelectAll;

      searchedValuesList.forEach(selectedObj => {
        if (isSelectAll) {
          if (!valuesList.selectedValues[selectedObj.name]) count++;
          valuesList.selectedValues[selectedObj.name] = { ...selectedObj };
        } else {
          if (valuesList.selectedValues[selectedObj.name]) count--;
          delete valuesList.selectedValues[selectedObj.name];
        }
      });

      setValuesList({ ...valuesList, count });

      return;
    }

    if (!isValuesFilterUpdated && valuesList.isAllSelected != isSelectAll) {
      setIsValuesFilterUpdated(true);
    }

    valuesList.isAllSelected = isSelectAll;
    valuesList.selectedValues = {};

    if (isSelectAll) {
      valuesList.data.forEach(selectedObj => {
        valuesList.selectedValues[selectedObj.name] = { ...selectedObj };
      });
    }

    setValuesList({ ...valuesList, count: 0 });
  };

  // eslint-disable-next-line react/prop-types
  const renderValueFilterCell = ({ style, rowIndex, key }) => {
    const valueObj = searchInput
      ? searchedValuesList[rowIndex]
      : valuesList.data[rowIndex] || {};
    const { name = '' } = valueObj || {};

    const dateFormat = DEFAULT_DATE_FORMAT;

    return (
      <Box
        style={style}
        py={1}
        pr={1}
        key={key}
        className="vfl-value-cell-wrap"
        height={VALUE_FILTER_ROW_HEIGHT}
        onClick={handleValueSelection(rowIndex, valueObj)}
        title={name}
      >
        <Box width={24} display="flex" alignItems="center">
          <Checkbox
            checked={Boolean(
              valuesList.isAllSelected || valuesList.selectedValues[name]
            )}
            size="small"
            name="-"
            color="primary"
          />
        </Box>
        <Box ml={1.5} className="vfl-value-cell">
          {dataType != COLUMN_DATA_TYPES_KEYS.amount
            ? getValueAsPerType({ value: name, dataType, dateFormat })
            : name}
        </Box>
      </Box>
    );
  };

  const isValuesListEmpty =
    (!searchInput && valuesList.data.length == 0) ||
    (searchInput && searchedValuesList.length == 0);

  return (
    <Popover
      id="record-editor-filters"
      open={Boolean(filtersEle)}
      anchorEl={filtersEle}
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
      <Box className="record-editor-filters-popover">
        {dataType && (
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
            <Box mt={2} mb={2}>
              <Divider />
            </Box>
            <Box>
              {(isFetchingColValues || isSearching) && (
                <Box className="text-center">Loading...</Box>
              )}
              {!isFetchingColValues && !isSearching && isValuesListEmpty && (
                <Box className="text-center">
                  <i>Empty</i>
                </Box>
              )}
              {!isFetchingColValues && !isSearching && !isValuesListEmpty && (
                <Box className="values-list-filter">
                  <Box pb={1}>
                    <Box display="inline" mr={2}>
                      <Link
                        className="cursor-pointer"
                        onClick={handleSelectAll(true)}
                        variant="body2"
                      >
                        Select All
                      </Link>
                    </Box>
                    <Link
                      className="cursor-pointer"
                      onClick={handleSelectAll(false)}
                      variant="body2"
                    >
                      Clear
                    </Link>
                  </Box>
                  <VirtualGrid
                    cellRenderer={renderValueFilterCell}
                    columnWidth={222}
                    width={238}
                    height={getValuesListHeight()}
                    rowHeight={VALUE_FILTER_ROW_HEIGHT}
                    overscanColumnCount={0}
                    overscanRowCount={0}
                    columnCount={1}
                    rowCount={
                      searchInput
                        ? searchedValuesList.length
                        : valuesList.data.length
                    }
                    selectedValues={valuesList.selectedValues}
                  />
                </Box>
              )}
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
  );
}

RecordEditorFiltersModal.propTypes = {
  colValuesList: oneOfType([null, arrayOf([null, string, number])]),
  field: shape({}).isRequired,
  filtersEle: any,
  handleDoneAction: func,
  handleResetAction: func,
  handleSortAction: func,
  search: shape({}),
  selectedAmountRange: shape({}),
  selectedDateRange: shape({}),
  setColValuesList: func.isRequired,
  setFiltersEle: func.isRequired,
};

RecordEditorFiltersModal.defaultProps = {
  handleDoneAction: () => {},
  handleResetAction: () => {},
  handleSortAction: () => {},
  search: {},
  selectedDateRange: {},
  selectedAmountRange: {},
};

export default RecordEditorFiltersModal;
