import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@material-ui/core';
import { arrayOf, func, shape } from 'prop-types';
import { connect } from 'react-redux';
import { AutoSizer } from 'react-virtualized';
import { createStructuredSelector } from 'reselect';

import Spinner from '../../../../components/Spinner';
import NoGridDataFound from '../NoGridDataFound';

import { RULE_BASED_MODELS_API } from '../../../../configs/api';
import { customMetaHeaders } from './configs';
import {
  defaultEndDate,
  defaultStartDate,
  FILTER_TYPES,
  INITIAL_PAGINATION,
} from '../configs';
import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';
import { httpPost } from '../../../../utils/http';

import {
  setDateRange,
  setForecastingGridData,
  setForecastingGridHeaders,
  setForecastingData,
  setClearForecastingData,
} from '../../../../reducers/RuleBasedModels/actions';
import {
  getSingleRBM,
  getForecastingGridData,
  getForecastingGridHeaders,
  getDateRange,
} from '../../../../reducers/RuleBasedModels/selectors';

import { getAmountRangeForHeaders, getFormattedPayload } from '../helper';
import {
  applyOfflineFiltering,
  getFormattedGridData,
  getFormattedGridHeaders,
} from './helper';

import GridPreview from '../GridPreview';

const DataForecasting = ({
  singleRBM: { id = 0, source_table_id = '' },
  forecastingGridData,
  forecastingGridHeaders,
  setForecastingGridData,
  setForecastingGridHeaders,
  setForecastingData,
  setDateRange,
  dateRange,
  setClearForecastingData,
}) => {
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ ...INITIAL_PAGINATION });

  /**
   * Fetch Data Forecasting > API CALL
   *
   * @param {Object} paginate
   */
  const fetchForeCasting = async paginate => {
    try {
      if (isLoading) return;
      setIsLoading(true);

      const url = RULE_BASED_MODELS_API.GET_FORECASTING.replace('#ID#', id);
      const { start = '', end = '' } = dateRange || {};

      const optionPagination = paginate ? paginate : pagination;
      const { page = INITIAL_PAGINATION.page } = optionPagination || {};

      // Params with filters
      const { params = {} } = getFormattedPayload({
        pagination: optionPagination,
        headers: forecastingGridHeaders,
        forecastDateRange: dateRange,
        filterType: FILTER_TYPES.online,
      });

      const {
        data = [],
        forecast_metadata: forecastMetadata,
        metadata = {},
        forecast_range,
        pagination: { total = 0 } = {},
      } = await httpPost(url, params);

      const { filteredData = [] } = applyOfflineFiltering({
        data,
        pagination: optionPagination,
        headers: forecastingGridHeaders,
        forecastDateRange: dateRange,
        filterType: FILTER_TYPES.online,
      });

      const { start_date = '', end_date = '' } = forecast_range || {};

      let formattedHeaders = getFormattedGridHeaders({
        forecastMetadata,
        metaData: metadata,
        customMetaData: customMetaHeaders,
      });

      const formattedData = getFormattedGridData({
        forecastMetadata,
        metaData: metadata,
        customMetaData: customMetaHeaders,
        data: filteredData,
      });
      const list =
        page == 1 ? formattedData : [...forecastingGridData, ...formattedData];

      // Set Forecasting data
      setForecastingGridData(list);

      // Set Headers only on first Load
      if (forecastingGridHeaders && forecastingGridHeaders.length === 0) {
        formattedHeaders = await getAmountRangeForHeaders({
          formattedHeaders,
          sourceTableID: source_table_id,
        });

        setForecastingGridHeaders(formattedHeaders);
      }

      setForecastingData({
        forecastMetadata,
        metadata,
        customMetaData: customMetaHeaders,
        data: filteredData,
      });

      // Set date range only once
      if (!start && !end) {
        setDateRange({
          start: start_date || defaultStartDate,
          end: end_date || defaultEndDate,
        });
      }

      setPagination({
        ...optionPagination,
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

  /*
   **
   * Callback > fetch Forecasting
   */
  const callbackFetchForeCasting = useCallback(fetchForeCasting, [dateRange]);

  /**
   *  Update headers configuration
   *
   * @param {Array} headers
   *
   */
  const handleHeaderUpdate = (headers = []) => {
    setForecastingGridHeaders(headers);

    setPagination(INITIAL_PAGINATION);
    setTimeout(fetchForeCasting(INITIAL_PAGINATION), 500);
  };

  /**
   * Component will mount
   */
  useEffect(() => {
    callbackFetchForeCasting();
  }, [callbackFetchForeCasting]);

  /**
   * Component will unmount
   */
  useEffect(() => {
    return () => {
      setClearForecastingData();
    };
  }, [setClearForecastingData]);

  /**
   * ON Loading more forecasting
   */
  const onLoadMore = () => {
    const paginate = {
      ...pagination,
      page: pagination.page + 1,
    };

    setPagination(paginate);
    setTimeout(fetchForeCasting(paginate), 500);
  };

  // Checking pages for more loading
  const hasMoreLoads = pagination.page < pagination.total / pagination.limit;

  return (
    <>
      {isLoading && <Spinner />}

      {forecastingGridHeaders && forecastingGridHeaders.length > 0 && (
        <Box display="flex" flex="1 1" pb={4} width="100%">
          <Box p={2} width="100%">
            <AutoSizer disableWidth>
              {({ height }) => (
                <GridPreview
                  columns={forecastingGridHeaders}
                  grid={forecastingGridData}
                  pagination={pagination}
                  tableHeight={height}
                  onLoadMore={onLoadMore}
                  hasLoadMore={hasMoreLoads}
                  onHeaderUpdate={handleHeaderUpdate}
                />
              )}
            </AutoSizer>
          </Box>
        </Box>
      )}

      {/* Blank screen message */}
      {!isLoading &&
        forecastingGridData &&
        forecastingGridData.length === 0 && (
          <NoGridDataFound
            msg={RULE_BASED_MODELS_MSG.rbm_no_forecast_data_found}
            subTitle=""
            onImport={null}
            onExport={null}
          />
        )}
    </>
  );
};

// Props validation
DataForecasting.propTypes = {
  dateRange: shape({}),
  forecastingGridData: arrayOf(arrayOf(shape({}))),
  forecastingGridHeaders: arrayOf(shape({})),
  setClearForecastingData: func,
  setDateRange: func,
  setForecastingData: func,
  setForecastingGridData: func,
  setForecastingGridHeaders: func,
  singleRBM: shape({}),
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
  forecastingGridData: getForecastingGridData(),
  forecastingGridHeaders: getForecastingGridHeaders(),
  dateRange: getDateRange(),
});

export default connect(mapStateToProps, {
  setForecastingGridData,
  setForecastingGridHeaders,
  setForecastingData,
  setDateRange,
  setClearForecastingData,
})(DataForecasting);
