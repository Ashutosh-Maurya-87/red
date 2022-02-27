import React from 'react';

import { arrayOf, bool, func, shape, string } from 'prop-types';
import { AutoSizer } from 'react-virtualized';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Box,
  MenuItem,
  Select,
  FormControl,
  Tab,
  Tabs,
} from '@material-ui/core';

import { VIEW_MODES } from '../../../reducers/SourceTables/constants';
import {
  getTablesList,
  getViewMode,
} from '../../../reducers/SourceTables/selectors';

import SourceTablesThumbnailView from './ThumbnailView';
import NoSourceTables from '../NoSourceTables';

import { SORT_OPTIONS } from '..';

import CustomScrollbars from '../../../components/ScrollBars';
import { SELECT_TABLE_TABS } from './ThumbnailView/configs';

import './styles.scss';

function SourceTablesList({
  viewMode,
  sortBy,
  handleSortBy,
  onActionCompleted,
  showLoader,
  onTabChange,
  tablesList,
  pagination,
  onLoadMore,
}) {
  const [, thumbnailMode] = VIEW_MODES;

  const [activeTab, setActiveTab] = React.useState(0);
  let lastScrollTop = null;

  /**
   * Handle Selection og tabs
   *
   * @param {Object} event
   * @param {Number} tabIndex
   */
  const handleTabChange = (event, tabIndex) => {
    setActiveTab(tabIndex);

    onTabChange(Object.values(SELECT_TABLE_TABS)[tabIndex].value);
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  const handleScrollEvent = ({ target }) => {
    if (!target || showLoader) return;

    const { limit, page, total } = pagination;

    if (page > total / limit) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    const height = scrollTop + clientHeight;

    if (scrollTop > lastScrollTop && height >= scrollHeight - 10) {
      onLoadMore();
    }

    lastScrollTop = scrollTop;
  };

  return (
    <>
      <div
        style={{
          textAlign: 'right',
          minWidth: '200px',
          position: 'absolute',
          marginTop: '8px',
          right: '0',
          zIndex: '1',
        }}
      >
        <Box mx={3}>
          <FormControl variant="standard">
            <Select
              id="sort-sourcetabled"
              value={sortBy}
              name="sortBy"
              onChange={handleSortBy}
              defaultValue=""
            >
              <MenuItem disabled value="">
                <em>Sort By</em>
              </MenuItem>

              {SORT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </div>

      <Box height="calc(100vh - 170px)" display="flex" flexDirection="column">
        <Box mb={2} mx={3}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            className="select-table-tab source-table-tab"
          >
            {Object.values(SELECT_TABLE_TABS).map((sourceTab, tabIndex) => {
              const { label = '' } = sourceTab || {};

              return <Tab key={`${label}+${tabIndex}`} label={label} />;
            })}
          </Tabs>
        </Box>

        <AutoSizer>
          {({ width, height }) => (
            <CustomScrollbars
              id="source-table-list"
              style={{ width, height }}
              onScroll={handleScrollEvent}
            >
              {viewMode == thumbnailMode && tablesList.length > 0 && (
                <SourceTablesThumbnailView
                  onActionCompleted={onActionCompleted}
                  showLoader={showLoader}
                />
              )}

              {!showLoader && tablesList.length == 0 && <NoSourceTables />}
            </CustomScrollbars>
          )}
        </AutoSizer>
      </Box>
    </>
  );
}

SourceTablesList.propTypes = {
  handleSortBy: func.isRequired,
  onActionCompleted: func.isRequired,
  onLoadMore: func.isRequired,
  onTabChange: func.isRequired,
  pagination: shape({}),
  showLoader: bool,
  sortBy: string.isRequired,
  tablesList: arrayOf(shape({})),
  viewMode: string.isRequired,
};

SourceTablesList.defaultProps = {
  onActionCompleted: () => {},
  onLoadMore: () => {},
  tablesList: [],
  pagination: {},
};

const mapStateToProps = createStructuredSelector({
  viewMode: getViewMode(),
  tablesList: getTablesList(),
});

export default connect(mapStateToProps, {})(SourceTablesList);
