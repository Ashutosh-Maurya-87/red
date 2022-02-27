import React, { useCallback, useEffect, useState } from 'react';
import { arrayOf, func, shape } from 'prop-types';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { AutoSizer } from 'react-virtualized';

import { Box } from '@material-ui/core';

import NoGridDataFound from '../NoGridDataFound';

import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';
import { API_URLS, RULE_BASED_MODELS_API } from '../../../../configs/api';
import { INITIAL_PAGINATION, ROW_ACTIONS } from '../configs';
import Spinner from '../../../../components/Spinner';
import { httpPost } from '../../../../utils/http';

import {
  setOverViewGridData,
  setOverViewGridHeaders,
} from '../../../../reducers/RuleBasedModels/actions';
import {
  getSingleRBM,
  getOverViewGridData,
  getOverViewGridHeaders,
} from '../../../../reducers/RuleBasedModels/selectors';

import GridPreview from '../GridPreview';

import {
  getFormattedGridData,
  getFormattedGridHeaders,
  isHideFilter,
} from './helper';
import { getAmountRangeForHeaders, getFormattedPayload } from '../helper';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { showSuccessMsg } from '../../../../utils/notifications';
import AddEditRecord from './AddEditRecord';

const DataOverview = ({
  singleRBM = {},
  overViewGridData = [],
  overViewGridHeaders = [],
  setOverViewGridData,
  setOverViewGridHeaders,
  onExport,
  onImport,
}) => {
  // States
  const [isDeleteConf, setDeleteConf] = useState(false);
  const [index, setIndex] = useState('');
  const [isEditDraw, setIsEditDraw] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ ...INITIAL_PAGINATION });
  const { id = '', source_table_id = '' } = singleRBM || {};

  /**
   *  Fetch Data Overview > API CALL
   *
   * @param {Object} paginate
   */
  const fetchDataOverview = async paginate => {
    try {
      if (isLoading) return;

      setIsLoading(true);

      const optionPagination = paginate ? paginate : pagination;
      const { page = INITIAL_PAGINATION.page } = optionPagination;

      const url = RULE_BASED_MODELS_API.GET_OVERVIEW.replace('#ID#', id);

      // Params with filters
      const { params = {} } = getFormattedPayload({
        pagination: optionPagination,
        headers: overViewGridHeaders,
      });

      const {
        data = [],
        metadata = [],
        pagination: { total = 0 } = {},
      } = await httpPost(url, params);

      let formattedHeaders = getFormattedGridHeaders({
        headersApi: metadata,
      });

      const formattedData = getFormattedGridData({
        headers: metadata,
        data,
      });

      const list =
        page == 1 ? formattedData : [...overViewGridData, ...formattedData];

      setOverViewGridData(list);

      // Set Headers only on first Load
      if (overViewGridHeaders && overViewGridHeaders.length === 0) {
        formattedHeaders = await getAmountRangeForHeaders({
          formattedHeaders,
          sourceTableID: source_table_id,
        });

        setOverViewGridHeaders(formattedHeaders);
      }

      setPagination({
        ...optionPagination,
        page,
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
   * Callback > fetchDataOverview
   */
  const callbackFetchDataOverview = useCallback(fetchDataOverview, []);

  /**
   * Component Did Mount
   */
  useEffect(() => {
    callbackFetchDataOverview();
  }, [callbackFetchDataOverview]);

  /**
   * ON Load more data --> through pagination
   */
  const onLoadMore = () => {
    let paginate = JSON.parse(JSON.stringify(pagination));

    paginate = {
      ...paginate,
      page: paginate.page + 1,
    };

    setPagination(paginate);
    setTimeout(fetchDataOverview(paginate), 500);
  };

  /**
   *  Update headers configuration
   *
   * @param {Array} headers
   *
   */
  const handleHeaderUpdate = (headers = []) => {
    setOverViewGridHeaders(headers);

    setPagination(INITIAL_PAGINATION);
    setTimeout(fetchDataOverview(INITIAL_PAGINATION), 500);
  };

  // Checking Pages for loading
  const hasLoadMore = pagination.page < pagination.total / pagination.limit;

  /**
   * Component Did unmount
   */
  useEffect(() => {
    return () => {
      setOverViewGridData([]);
      setOverViewGridHeaders([]);
    };
  }, [setOverViewGridData, setOverViewGridHeaders]);

  /**
   * Identify if filter is applied to any header or not
   *
   * @returns {Boolean}
   */
  const isFilterApplied = () => {
    const index = overViewGridHeaders.findIndex(
      column => !isHideFilter(column)
    );

    if (index > -1) {
      return false;
    }

    return true;
  };

  /**
   * Handle Delete Confirmation
   *
   * @param {Any}
   */
  const handleDeleteConf = async row => {
    try {
      if (!row) {
        setDeleteConf(false);
        return;
      }

      setDeleteConf(false);
      setIsLoading(true);

      const url = API_URLS.REPLICATE_SOURCE_TABLE.replace(
        '#SOURCE_ID#',
        source_table_id
      );

      const [first] = overViewGridData[row];

      const { recordId = '' } = first;

      const data = {
        data: [
          {
            action: ROW_ACTIONS.DELETE_RECORD.action,
            data: [
              {
                affa_record_id: recordId,
              },
            ],
          },
        ],
      };

      await httpPost(url, data);

      const copyOfOverViewGridData = [...overViewGridData];
      copyOfOverViewGridData.splice(row, 1);

      setOverViewGridData(copyOfOverViewGridData);
      setIsLoading(false);
      showSuccessMsg(RULE_BASED_MODELS_MSG.rbm_overView_delete_record);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * On open Edit Draw
   *
   * @param {Any}
   */
  const onOpenEditDraw = res => {
    setIsEditDraw(true);
    setIndex(res);
  };

  /**
   * Handle Update Record
   *
   * @param {Any}
   */
  const handleUpdateRecord = props => {
    setIsLoading(true);

    const { record = {}, index = '' } = props || {};
    const { affa_record_id = '' } = record || {};

    const copyOfOverViewGridData = [...overViewGridData];

    const result = getFormattedGridData({
      data: [{ ...record }],
      headers: overViewGridHeaders,
      affa_record_id,
    });

    if (result.length > 0) {
      const [firstChild] = result || [];
      firstChild.shift();

      copyOfOverViewGridData.splice(index, 1, firstChild);

      setOverViewGridData([...copyOfOverViewGridData]);
    }

    setIsLoading(false);
  };

  /**
   * Handle close draw
   *
   */
  const onCloseEditDraw = () => {
    setIsEditDraw(false);
  };

  /**
   * Handle Context Menu Action
   *
   * @param {String} action
   */
  const handleContextMenuAction = props => {
    const { action = '', row = '' } = props || {};

    switch (action) {
      case ROW_ACTIONS.DELETE_RECORD.value:
        setDeletingGroup(row);
        setDeleteConf(true);

        break;

      case ROW_ACTIONS.UPDATE_RECORD.value:
        onOpenEditDraw(row);
        break;

      default:
        break;
    }
  };

  return (
    <>
      {isLoading && <Spinner />}
      {overViewGridHeaders && overViewGridHeaders.length > 0 && (
        <Box display="flex" flex="1 1" pb={4} width="100%">
          <Box p={2} width="100%">
            <AutoSizer disableWidth>
              {({ height }) => (
                <GridPreview
                  columns={overViewGridHeaders}
                  grid={overViewGridData}
                  pagination={pagination}
                  tableHeight={height}
                  hasLoadMore={hasLoadMore}
                  onLoadMore={onLoadMore}
                  onHeaderUpdate={handleHeaderUpdate}
                  isContextMenuEnable={true}
                  contextMenuOptions={Object.values(ROW_ACTIONS)}
                  onClickRowAction={handleContextMenuAction}
                />
              )}
            </AutoSizer>
          </Box>
        </Box>
      )}

      {isEditDraw && (
        <AddEditRecord
          isOpen={isEditDraw}
          onClose={onCloseEditDraw}
          headers={overViewGridHeaders}
          data={overViewGridData}
          index={index}
          sourceId={source_table_id}
          handleUpdateRecord={handleUpdateRecord}
        />
      )}

      {isDeleteConf && (
        <ConfirmationModal
          isOpen
          handleClose={handleDeleteConf}
          action={String(deletingGroup)}
          msg={RULE_BASED_MODELS_MSG.rbm_overview_delete_confirmation}
        />
      )}

      {/* Blank screen message */}
      {!isLoading && overViewGridData && overViewGridData.length === 0 && (
        <NoGridDataFound
          subTitle={
            isFilterApplied()
              ? RULE_BASED_MODELS_MSG.rbm_no_overview_data_found
              : ''
          }
          onImport={isFilterApplied() ? onImport : null}
          onExport={isFilterApplied() ? onExport : null}
        />
      )}
    </>
  );
};

DataOverview.propTypes = {
  onExport: func,
  onImport: func,
  overViewGridData: arrayOf(arrayOf(shape({}))),
  overViewGridHeaders: arrayOf(shape({})),
  setOverViewGridData: func,
  setOverViewGridHeaders: func,
  singleRBM: shape({}),
};

DataOverview.defaultProps = {
  overViewGridData: [],
  overViewGridHeaders: [],
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
  overViewGridData: getOverViewGridData(),
  overViewGridHeaders: getOverViewGridHeaders(),
});

export default connect(mapStateToProps, {
  setOverViewGridData,
  setOverViewGridHeaders,
})(DataOverview);
