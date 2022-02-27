import React, { useCallback, useEffect, useState } from 'react';
import { HTMLElementType, string, func, oneOfType, shape } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { get } from 'lodash';

import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  TextField,
} from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';

import CustomScrollbars from '../../../../../components/ScrollBars';

import {
  cancelExistingHttpRequests,
  getSugeestionOptions,
  removeExistingRow,
} from '../../../../../services/FormulaBuilder';

import { FORMULA_KEYS } from '../config';
import { getFilledSignature } from './helper';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

function FieldDropdown({ type, menuEle, onClose, selectedItem, match, rowId }) {
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState(PAGINATION);

  /**
   * Store last scroll value
   */
  let lastScrollTop = 0;

  /**
   * Close dropdown list
   *
   * @param {Object} selectedOpt
   */
  const handleSelection = selectedOpt => () => {
    onClose(selectedOpt);
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  const handleScrollEvent = ({ target }) => {
    if (!target || isLoading) return;

    const { limit, page, total } = pagination;

    if (page > total / limit) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    const height = scrollTop + clientHeight;

    if (scrollTop > lastScrollTop && height >= scrollHeight - 10) {
      loadMore();
    }

    lastScrollTop = scrollTop;
  };

  /*
   **
   * Get option as per type > API CALL
   */
  const getOptions = async pagination => {
    try {
      if (isLoading) return;
      setIsLoading(true);

      const { page } = pagination;
      const id = get(match, 'params.id');

      const {
        data = [],
        pagination: { total = 1 } = {},
      } = await getSugeestionOptions(id, type, pagination, search);

      let list =
        page == 1 ? data : [...options, ...removeExistingRow(rowId, data)];

      if (type == FORMULA_KEYS.ROW.toLowerCase()) {
        list = list.filter(({ value }) => value != rowId);
      }

      setOptions(list);
      setPagination({
        ...pagination,
        total,
      });

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);

      setPagination({
        ...pagination,
        page: pagination.page == 1 ? 1 : pagination.page - 1,
      });
    }
  };

  /**
   * Load more options > Pagination
   */
  const loadMore = () => {
    if (isLoading) return;

    let paginate = JSON.parse(JSON.stringify(pagination));
    paginate = {
      ...paginate,
      page: paginate.page + 1,
    };

    setPagination(paginate);
    setTimeout(getOptions(paginate), 500);
  };

  /**
   * Filter data for search
   *
   * @param {String} search
   */
  const onSearch = () => {
    setPagination(PAGINATION);
    setOptions([]);

    cancelExistingHttpRequests();
    setTimeout(getOptions(PAGINATION), 200);
  };

  /*
   **
   * Callback > For searching
   */
  const onSearchCallback = useCallback(onSearch, [search]);

  /**
   * Clear Search Inout
   */
  const clearSearch = () => {
    setSearch('');
    setOptions([]);
  };

  /**
   * UseEffect to debounce search
   */
  useEffect(() => {
    const timer = setTimeout(onSearchCallback, !search ? 0 : 800);

    return () => clearTimeout(timer);
  }, [onSearchCallback, search]);

  /**
   * Handle Search Input
   *
   * @param {Event}
   */
  const handleSearch = ({ target: { value } }) => setSearch(value);
  /*
   **
   * Callback > Cancel Existing HttpRequests
   */
  const callbackExistingHttpRequests = useCallback(
    cancelExistingHttpRequests,
    []
  );

  /**
   * Component Did Unmount
   */
  useEffect(() => {
    return () => {
      callbackExistingHttpRequests();
    };
  }, [callbackExistingHttpRequests]);

  return (
    <Popover
      id="menu-fields"
      anchorEl={menuEle}
      open={Boolean(menuEle)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Box m={2}>
        <TextField
          name="search"
          fullWidth
          placeholder="Search..."
          value={search}
          onChange={handleSearch}
          variant="outlined"
          size="small"
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch} edge="end">
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <CustomScrollbars
        style={{ width: 350, height: 300 }}
        onScroll={handleScrollEvent}
      >
        {options.map((opt, index) => {
          const { signature, params, value } = opt;
          const { value: selectedVal } = selectedItem || {};

          return (
            <MenuItem
              key={index}
              selected={value == selectedVal}
              disabled={isLoading}
              title={signature}
              onClick={handleSelection(opt)}
            >
              {getFilledSignature(signature, params)}
            </MenuItem>
          );
        })}

        {!isLoading && options.length == 0 && (
          <Box display="flex" justifyContent="center" padding={2}>
            {' '}
            No Record Found
          </Box>
        )}

        {isLoading && (
          <Box
            display="flex"
            paddingTop={2}
            paddingBottom={2}
            justifyContent="center"
          >
            <CircularProgress size={24} />
          </Box>
        )}
      </CustomScrollbars>
    </Popover>
  );
}

FieldDropdown.propTypes = {
  menuEle: oneOfType([HTMLElementType, func]),
  onClose: func.isRequired,
  rowId: string,
  selectedItem: shape({}),
  type: string.isRequired,
};

FieldDropdown.defaultTypes = {
  type: 'row',
  rowId: '',
  onClose: func.isRequired,
};

export default withRouter(FieldDropdown);
