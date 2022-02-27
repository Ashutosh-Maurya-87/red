import React from 'react';
import { arrayOf, shape, func, bool } from 'prop-types';

import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';

import {
  Grid,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  ClickAwayListener,
  Paper,
  Popover,
  Chip,
  withStyles,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';

import {
  Close as CloseIcon,
  FilterList as FilterListIcon,
} from '@material-ui/icons';

import {
  getActiveWorksheet,
  getIsViewMode,
  getRowConfigs,
  getSharedMappings,
  getWorkbook,
} from '../../../../reducers/Models/selectors';
import {
  setSharedMappings,
  setSystemDimensions,
} from '../../../../reducers/Models/actions';

import Spinner from '../../../../components/Spinner';
import ConfirmationModal from '../../../../components/ConfirmationModal';

import HierarchyWithSelection from '../HierarachyWithSelection';
import VListWithPagination from './VListWithPagination';
import { getFormattedMappingParams, isDimensionBindedToRow } from './helper';

import { API_URLS } from '../../../../configs/api';
import { MODELS_MSG } from '../../../../configs/messages';
import { httpDelete, httpGet, httpPost } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';

import { styles } from './styles';
import './styles.scss';
import { MODEL_RUN_STATUS } from '../../ModelsList/helper';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

const PAGINATION = {
  total: 0,
  limit: 100,
  page: 1,
};

class SharedMappings extends React.Component {
  defaultState = {
    dimensionsList: [],
    dimension: {},
    pagination: { ...PAGINATION },

    hierarchy: [],
    search: '',
    postSearch: '',
    hierarchyPagination: { ...PAGINATION },

    postHierarchy: [],
    postHierarchyPagination: { ...PAGINATION },
    extract: [],
    posting: [],

    isFetchingHierarchy: false,
    isFetchingPostHierarchy: false,
    isFetchingDimensions: false,

    confirmAction: false,
    confirmMsg: false,
    isMapToRow: true,

    menuEle: null,
    isVisible: false,
    isLoading: false,
    isSubmit: false,
  };

  /**
   * Store cancel tokens
   */
  cancelToken = [];

  /**
   * State
   */
  state = { ...this.defaultState };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fetchDimensionsList();
  }

  /**
   * Fetch list of Dimensions from API
   */
  fetchDimensionsList = async () => {
    try {
      const { isFetchingDimensions, pagination, dimensionsList } = this.state;
      const { limit, page } = pagination;
      const {
        workbook: { id: workbookId = '' } = {},
        setSystemDimensions,
      } = this.props;

      if (isFetchingDimensions) return;

      this.setState({ isFetchingDimensions: true });

      let url = API_URLS.MODELS_API.GET_MODEL_DIMENSIONS.replace(
        '#ID#',
        workbookId
      );
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&include_related_dimension=1`;
      url += `&include_system_dimension=1`;

      const {
        data: {
          dimensions_table_info: {
            data = [],
            pagination: { count = 1 } = {},
          } = {},
          gl_account = [],
        },
      } = await httpGet(url);

      setSystemDimensions(gl_account);

      const list = page == 1 ? data : [...dimensionsList, ...data];

      this.setState({
        isFetchingDimensions: false,
        dimensionsList: list,
        pagination: {
          ...pagination,
          total: count,
        },
      });
    } catch (e) {
      const { pagination } = this.state;

      this.setState({
        isFetchingDimensions: false,
        pagination: {
          ...pagination,
          page: pagination.page == 1 ? 1 : pagination.page - 1,
        },
      });
    }
  };

  /**
   * Load more Dimensions List
   */
  loadMoreDimensionsList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchDimensionsList
    );
  };

  /**
   * Show|Hide List of Dimension in Popover to Select
   */
  toggleSelectDimensionView = evt => {
    logAmplitudeEvent('Add shared mapping');

    try {
      if (evt) evt.preventDefault();

      if (this.state.menuEle) {
        this.setState({ menuEle: null });
      } else {
        this.setState({ menuEle: evt.currentTarget });
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Hide List of Dimension in Popover to Select
   */
  closeSelectDimensionView = () => {
    this.setState({ menuEle: null });
  };

  /**
   * Handle Selected Dimension for Shared Mappings
   *
   * @param {Object} dimension
   */
  handleSelectedDimension = dimension => () => {
    const { rowConfigs = [] } = this.props;

    if (isDimensionBindedToRow(rowConfigs, dimension)) {
      const { display_name } = dimension || {};

      const confirmAction = 'ADD_SHARED_MAPPING';
      const confirmMsg = MODELS_MSG.delete_row_mapping_confirmation.replace(
        '#DIMENSION_NAME#',
        display_name
      );

      this.setState({ dimension, confirmAction, confirmMsg, menuEle: null });
      return;
    }

    this.setState({ dimension, menuEle: null, isVisible: true }, () => {
      this.getHierarchy();
      this.getHierarchy('posting');
    });
  };

  /**
   * Toggle > Modal Visibility
   */
  toggleModal = () => {
    const { isVisible } = this.state;

    isVisible
      ? this.setState({
          isVisible: false,
          search: '',
          postSearch: '',
          hierarchy: [],
          hierarchyPagination: { ...PAGINATION },
          postHierarchy: [],
          postHierarchyPagination: { ...PAGINATION },
          extract: [],
          posting: [],
        })
      : this.setState({ isVisible: !this.state.isVisible });
  };

  /**
   * Get GL Account Listing
   *
   * @param {String} type
   */
  getHierarchy = async type => {
    const loader =
      type == 'posting' ? 'isFetchingPostHierarchy' : 'isFetchingHierarchy';

    const paginationType =
      type == 'posting' ? 'postHierarchyPagination' : 'hierarchyPagination';

    try {
      const {
        isFetchingHierarchy,
        isFetchingPostHierarchy,
        dimension,
        hierarchy,
        postSearch,
        search,
        postHierarchy,
        hierarchyPagination,
        postHierarchyPagination,
      } = this.state;

      const { limit, page } =
        type == 'posting' ? postHierarchyPagination : hierarchyPagination;
      const { id: dimensionId } = dimension || {};

      if (isFetchingHierarchy || isFetchingPostHierarchy) return;

      this.setState({
        [loader]: true,
      });

      const { workbook: { scenario_id: scenarioId = '' } = {} } = this.props;

      let url = API_URLS.MODELS_API.GET_HIERARCHY;
      url += `?id=${dimensionId}&limit=${limit}&page=${page}&scenario_id=${scenarioId}`;

      if ((type != 'posting' && search) || (type == 'posting' && postSearch)) {
        url += `&name=${type == 'posting' ? postSearch : search}`;
      }

      const { data = [], pagination: { total = 1 } = {} } = await httpGet(url, {
        hideError: true,
        callback: this.pushCancelToken,
      });

      const list =
        page == 1
          ? data
          : [...(type == 'posting' ? postHierarchy : hierarchy), ...data];

      this.setState({
        [type == 'posting' ? 'postHierarchy' : 'hierarchy']: list,
        [loader]: false,
        [paginationType]: {
          ...(type == 'posting'
            ? postHierarchyPagination
            : hierarchyPagination),
          total,
        },
      });
    } catch (error) {
      const { hierarchyPagination, postHierarchyPagination } = this.state;

      const pagination =
        type == 'posting' ? postHierarchyPagination : hierarchyPagination;

      this.setState({
        [loader]: false,
        [paginationType]: {
          ...pagination,
          page: pagination.page == 1 ? 1 : pagination.page - 1,
        },
      });
    }
  };

  /**
   * Push cancel tokens of API calls
   *
   * @param {Object} token
   */
  pushCancelToken = token => {
    this.cancelToken.push(token);
  };

  /**
   * Cancel existing API Requests
   */
  cancelExistingHttpRequests = () => {
    this.cancelToken.forEach(cancelFunc => cancelFunc());
  };

  /**
   * Load more Hierarchy List
   *
   * @param {String} type
   */
  loadMoreHierarchyList = type => {
    const { hierarchyPagination, postHierarchyPagination } = this.state;

    const pagination =
      type == 'posting' ? postHierarchyPagination : hierarchyPagination;

    this.setState(
      {
        [type == 'posting'
          ? 'postHierarchyPagination'
          : 'hierarchyPagination']: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      () => this.getHierarchy(type)
    );
  };

  /**
   * Search Hierarchy
   *
   * @param {String} type
   * @param {Srting} search
   */
  onSeachHierarchy = (type, search) => {
    this.cancelExistingHttpRequests();
    this.setState(
      {
        [type == 'posting' ? 'postSearch' : 'search']: search,
        [type == 'posting'
          ? 'postHierarchyPagination'
          : 'hierarchyPagination']: PAGINATION,
      },
      () => {
        setTimeout(() => {
          this.getHierarchy(type);
        }, 300);
      }
    );
  };

  /**
   * Handle callback > When any hierarchy selected
   *
   * @param {Array} selectedHierarchies
   * @param {Boolean} isMulti
   */
  handleHierarchySelection = (selectedHierarchies, isMulti) => {
    const keyToModify = isMulti ? 'extract' : 'posting';

    this.setState({ [keyToModify]: selectedHierarchies });
  };

  /**
   * Handle Done button click > API Request
   */
  handleSaveSharedMapping = async () => {
    try {
      const { isSavingMapping, extract, posting, dimension } = this.state;
      const {
        workbook,
        activeWorksheet,
        handleSharedMappingsUpdated,
        setSharedMappings,
      } = this.props;
      const { id } = dimension || {};

      if (isSavingMapping) return;

      this.setState({ isSubmit: true });

      const params = getFormattedMappingParams(extract, posting, id);

      this.setState({ isSavingMapping: true });

      let url = API_URLS.MODELS_API.SAVE_SHARED_MAPPING;
      url = url.replace('#ID#', workbook.id);
      url = url.replace('#WORKSHEET_ID#', activeWorksheet.id);

      const {
        data,
        data: { shared_mappings = [] },
      } = await httpPost(url, params);

      showSuccessMsg(MODELS_MSG.shared_mapping_added);
      setSharedMappings(shared_mappings);
      handleSharedMappingsUpdated(data);

      this.setState({ isSavingMapping: false }, () => {
        this.toggleModal();
      });
    } catch (error) {
      console.info(error);

      this.setState({ isSavingMapping: false });
    }
  };

  /**
   * Store selected dimension and open confirmation
   *
   * @param {String/Number} dimensionId
   */
  handleDeleteSharedMapping = mapping => () => {
    const { dimension_name } = mapping || {};

    const confirmAction = 'DELETE_SHARED_MAPPING';
    const confirmMsg = MODELS_MSG.shared_mapping_deletion_confirmation.replace(
      '#DIMENSION_NAME#',
      dimension_name
    );

    this.setState({
      dimension: mapping,
      confirmAction,
      confirmMsg,
      isMapToRow: true,
    });
  };

  /**
   * Edit Selected Dimension
   *
   * @param {Object} dimension
   */
  handleMappingClick = dimension => () => {
    const extract = [];
    const posting = [];

    const { mappings, dimension_id: id, dimension_name } = dimension;

    const formattedDimension = {
      id,
      display_name: dimension_name,
    };

    mappings.map(item => {
      const { member_id, member_name, member_type, mapping_type } = item || {};

      const formattedItem = {
        affa_record_id: member_id,
        affa_h_key_name: member_name,
        affa_record_type: member_type,
      };

      mapping_type == 'READ_MAPPING'
        ? extract.push(formattedItem)
        : posting.push(formattedItem);

      return item;
    });

    this.setState(
      {
        extract,
        posting,
        dimension: formattedDimension,
        isVisible: true,
      },
      () => {
        this.getHierarchy();
        this.getHierarchy('posting');
      }
    );
  };

  /**
   * Delete Shared Mapping > API CALL
   */
  deleteSharedMapping = async () => {
    try {
      const { dimension, isMapToRow } = this.state;
      const {
        workbook,
        activeWorksheet,
        sharedMappings,
        setSharedMappings,
        handleSharedMappingsUpdated,
      } = this.props;

      const { dimension_id: dimensionId } = dimension || {};

      if (!dimensionId) return;

      this.setState({ isLoading: true });

      let url = API_URLS.MODELS_API.DELETE_SHARED_MAPPING;
      url = url.replace('#ID#', workbook.id);
      url = url.replace('#WORKSHEET_ID#', activeWorksheet.id);
      url = url.replace('#MAPPING_ID#', dimensionId);

      url += `?assign_with_rows=${isMapToRow}`;

      await httpDelete(url);

      showSuccessMsg(MODELS_MSG.shared_mapping_deleted);

      const filteredMapping = [...sharedMappings].filter(
        mapping => mapping.dimension_id != dimensionId
      );

      setSharedMappings(filteredMapping);
      handleSharedMappingsUpdated(filteredMapping);

      this.setState({ isLoading: false, isMapToRow: true });
    } catch (error) {
      console.info(error);

      this.setState({ isLoading: false });
    }
  };

  /**
   * Handle Response of Confirmation Modal
   *
   * @param {String|Boolean} res
   */
  handleCloseConfModal = res => {
    switch (res) {
      case 'DELETE_SHARED_MAPPING':
        this.deleteSharedMapping();
        break;

      case 'ADD_SHARED_MAPPING':
        this.setState(
          { confirmAction: false, confirmMsg: false, isVisible: true },
          () => {
            this.getHierarchy();
            this.getHierarchy('posting');
          }
        );
        break;

      default:
        break;
    }

    this.setState({ confirmAction: false, confirmMsg: false });
  };

  /**
   * Render View
   */
  render() {
    const { sharedMappings = [], isViewMode, classes, workbook } = this.props;

    const {
      menuEle,
      isVisible,
      dimensionsList,
      confirmAction,
      confirmMsg,
      isMapToRow,
      dimension,
      hierarchy,

      pagination,
      isFetchingHierarchy,
      isSavingMapping,
      isLoading,
      isFetchingDimensions,
      hierarchyPagination,

      extract,
    } = this.state;

    const { page, total, limit } = pagination || {};
    const {
      page: hierarchyPage,
      total: hierarchyToatal,
      limit: hierarchylimit,
    } = hierarchyPagination || {};

    const { statusIcon: StatusIcon, statusClassName, run_status } = workbook;

    return (
      <>
        {isLoading && <Spinner />}

        <Box px={2} py={2} id="shared-mappings-section">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Box display="flex" alignItems="center">
              <Box mr={1}>
                <Typography color="textSecondary">
                  <FilterListIcon />
                </Typography>
              </Box>
              <Box style={{ marginTop: '-4px' }}>
                <Typography variant="body1">Shared Row Mapping</Typography>
              </Box>
            </Box>
            {StatusIcon && run_status == MODEL_RUN_STATUS.inProcess && (
              <Typography
                display="block"
                variant="caption"
                noWrap
                color="textSecondary"
              >
                <Box display="flex" alignItems="center">
                  <span
                    fontSize="14px"
                    className={`last-executed-status animate-icon ${statusClassName}`}
                  >
                    <StatusIcon />
                  </span>
                  <Box
                    ml={0.5}
                    fontSize="16px"
                    className={`last-executed-status ${statusClassName}`}
                  >
                    Model execution is in process
                  </Box>
                </Box>
              </Typography>
            )}
          </Box>

          <Box display="flex" alignItems="center">
            <Box className={classes.root}>
              {sharedMappings.map((mapping, index) => (
                <Chip
                  className="mapping-chip"
                  key={index}
                  label={mapping.dimension_name || ''}
                  onClick={this.handleMappingClick(mapping)}
                  onDelete={this.handleDeleteSharedMapping(mapping)}
                />
              ))}
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={{ borderRadius: '20px' }}
              onClick={this.toggleSelectDimensionView}
            >
              Add Shared Mapping
            </Button>
          </Box>

          {isViewMode && <Box mx={-2} className="read-only-mode" />}
        </Box>

        <Popover
          open={Boolean(menuEle)}
          anchorEl={menuEle}
          onClose={this.closeSelectDimensionView}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            style: { width: '250px' },
          }}
        >
          <Paper>
            <ClickAwayListener onClickAway={this.closeSelectDimensionView}>
              <VListWithPagination
                id="shared-mapping-dropdown"
                isLoading={isFetchingDimensions}
                page={page}
                totalPages={total / limit}
                onClickItem={this.handleSelectedDimension}
                loadMore={this.loadMoreDimensionsList}
                list={dimensionsList}
                selectedList={sharedMappings}
              />
            </ClickAwayListener>

            {isFetchingDimensions && <Spinner />}
          </Paper>
        </Popover>

        <Dialog
          className="customized-rename-modal"
          maxWidth="md"
          fullWidth
          disableBackdropClick
          onClose={this.toggleModal}
          aria-labelledby="customized-dialog-title"
          open={isVisible}
        >
          <DialogTitle
            id="customized-dialog-title"
            onClose={this.toggleModal}
            className="modal-title"
          >
            <Grid
              container
              direction="row"
              justify="space-between"
              alignItems="center"
            >
              <Box>Shared Mapping for {dimension.display_name}</Box>
              <Box mr={-1}>
                <IconButton onClick={this.toggleModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Grid>
          </DialogTitle>

          <DialogContent>
            {isSavingMapping && <Spinner />}

            <Box minHeight="150px">
              <Box mb={1}>
                <Grid direction="row" container>
                  <Grid
                    item
                    xs={12}
                    container
                    direction="row"
                    alignItems="center"
                  >
                    <Typography variant="body1" color="textSecondary">
                      Extract Data From
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <HierarchyWithSelection
                key={1}
                list={hierarchy}
                isMulti
                isLoading={isFetchingHierarchy}
                hasMore={hierarchyPage < hierarchyToatal / hierarchylimit}
                loadMore={this.loadMoreHierarchyList}
                onSelection={this.handleHierarchySelection}
                onSearch={search => this.onSeachHierarchy('', search)}
                selectedHierarchies={extract}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Box px={3} py={2} display="flex" alignItems="center">
              <Box mr={1}>
                <Button color="primary" onClick={this.toggleModal}>
                  Cancel
                </Button>
              </Box>
              <Button
                type="submit"
                variant="contained"
                onClick={this.handleSaveSharedMapping}
                color="primary"
                disabled={false}
              >
                Done
                {false && <CircularProgress size={24} />}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {confirmAction && (
          <ConfirmationModal
            maxWidth="sm"
            handleClose={this.handleCloseConfModal}
            isOpen
            action={confirmAction}
            msg={confirmMsg}
            className="delete-shared-mapping"
          >
            {confirmAction == 'DELETE_SHARED_MAPPING' && (
              <Box mt={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isMapToRow}
                      onChange={() =>
                        this.setState({ isMapToRow: !isMapToRow })
                      }
                      name="waring"
                      color="primary"
                    />
                  }
                  label={MODELS_MSG.shared_mapping_deletion_confirmation_checkbox_text.replace(
                    '#DIMENSION_NAME#',
                    dimension.dimension_name
                  )}
                />
              </Box>
            )}
          </ConfirmationModal>
        )}
      </>
    );
  }
}

SharedMappings.propTypes = {
  activeWorksheet: shape({}).isRequired,
  handleSharedMappingsUpdated: func.isRequired,
  isViewMode: bool.isRequired,
  rowConfigs: arrayOf(shape({})).isRequired,
  setSharedMappings: func.isRequired,
  setSystemDimensions: func.isRequired,
  sharedMappings: arrayOf(shape({})).isRequired,
  workbook: shape({}).isRequired,
};

SharedMappings.defaultProps = {
  activeWorksheet: {},
  handleSharedMappingsUpdated: () => {},
  sharedMappings: [],
  workbook: {},
};

const mapStateToProps = createStructuredSelector({
  activeWorksheet: getActiveWorksheet(),
  rowConfigs: getRowConfigs(),
  sharedMappings: getSharedMappings(),
  workbook: getWorkbook(),
  isViewMode: getIsViewMode(),
});

export default connect(mapStateToProps, {
  setSharedMappings,
  setSystemDimensions,
})(withStyles(styles)(SharedMappings));
