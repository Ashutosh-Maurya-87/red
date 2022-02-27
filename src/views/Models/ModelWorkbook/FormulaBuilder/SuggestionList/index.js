import React, { useCallback, useEffect, useRef, useState } from 'react';
import { string, func, shape } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { get } from 'lodash';

import {
  Box,
  CircularProgress,
  ListItem,
  List,
  Paper,
} from '@material-ui/core';

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

function SuggestionList({ type, onClose, selectedItem, match, rowId }) {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState(PAGINATION);
  const [activeIndex, setListIndex] = useState(0);
  const scrollRef = useRef();

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
    onClose(selectedOpt, selectedItem);
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
  const getOptions = async paginate => {
    try {
      if (isLoading) return;

      setIsLoading(true);
      const optionPagination = paginate ? paginate : pagination;
      const { page } = optionPagination;
      const id = get(match, 'params.id');

      const {
        data = [],
        pagination: { total = 1 } = {},
      } = await getSugeestionOptions(id, type, optionPagination);

      let list =
        page == 1 ? data : [...options, ...removeExistingRow(rowId, data)];

      if (type == FORMULA_KEYS.ROW.toLowerCase()) {
        list = list.filter(({ value }) => value != rowId);
      }

      setOptions(list);
      setPagination({
        ...optionPagination,
        total,
      });
      setIsLoading(false);

      if (selectedItem) {
        const indexOfSelectedItem = list.findIndex(
          ({ value }) => value == selectedItem.value
        );

        if (indexOfSelectedItem != -1) {
          setListIndex(indexOfSelectedItem);
        }
      }
    } catch (error) {
      setIsLoading(false);

      setPagination({
        ...pagination,
        page: pagination.page == 1 ? 1 : pagination.page - 1,
      });
    }
  };

  /**
   * Load more option > Pagination
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

  /*
   **
   * Callback > Cancel Existing HttpRequests
   */
  const callbackExistingHttpRequests = useCallback(
    cancelExistingHttpRequests,
    []
  );

  /*
   **
   * Callback > GetOptions
   */
  const callbackGetOptions = useCallback(getOptions, []);

  /**
   * Component Did Unmount
   */
  useEffect(() => {
    callbackGetOptions();

    return () => {
      callbackExistingHttpRequests();
    };
  }, [callbackExistingHttpRequests, callbackGetOptions]);

  const moveUp = () => {
    if (activeIndex > 0) {
      setListIndex(activeIndex - 1);
    }
  };

  const moveDown = () => {
    if (activeIndex < options.length - 1) {
      setListIndex(activeIndex + 1);
    }
  };

  const manageScrolling = () => {
    const amountToScroll = 36 * (activeIndex - 8 / 2 + 1);
    scrollRef.current.scrollTop(amountToScroll);
  };

  const onKeyPressed = e => {
    if (e.keyCode == '38') {
      moveUp();
      manageScrolling();
    } else if (e.keyCode == '40') {
      moveDown();
      manageScrolling();
    } else if (e.keyCode == 13) {
      onClose(options[activeIndex], selectedItem);
    } else if (e.keyCode == 27) {
      onClose();
    }
  };

  const callbackMoveDown = useCallback(onKeyPressed, [options, activeIndex]);

  useEffect(() => {
    document.addEventListener('keydown', callbackMoveDown);

    return () => {
      document.removeEventListener('keydown', callbackMoveDown);
    };
  }, [callbackMoveDown]);

  return (
    <Paper>
      <List>
        <CustomScrollbars
          forwardRef={scrollRef}
          style={{ width: 350, height: 285 }}
          onScroll={handleScrollEvent}
        >
          {options.map((opt, index) => {
            const { signature, params, value } = opt;
            const { value: selectedVal = '' } = selectedItem || {};

            return (
              <ListItem
                button
                key={index}
                selected={value == selectedVal ? true : activeIndex === index}
                disabled={isLoading}
                title={signature}
                onClick={handleSelection(opt)}
              >
                {getFilledSignature(signature, params)}
              </ListItem>
            );
          })}

          {!isLoading && options.length == 0 && (
            <Box display="flex" justifyContent="center" padding={2}>
              {' '}
              No Record Found
            </Box>
          )}

          {/* Loader */}
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
      </List>
    </Paper>
  );
}

SuggestionList.propTypes = {
  onClose: func.isRequired,
  rowId: string.isRequired,
  selectedItem: shape({}),
  type: string.isRequired,
};

SuggestionList.defaultTypes = {
  type: 'row',
  rowId: '',
  onClose: func.isRequired,
};

export default withRouter(SuggestionList);
