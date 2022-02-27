import React from 'react';
import { connect } from 'react-redux';
import {
  bool,
  number,
  oneOfType,
  string,
  arrayOf,
  shape,
  func,
  any,
} from 'prop-types';
import { createStructuredSelector } from 'reselect';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Typography, Divider, Grid, Button } from '@material-ui/core';

import Spinner from '../../../../components/Spinner';
import GLAccountsListing from './GLAccountsListing';
import AddEditGLAccountModal from './AddEditGLAccount';
import GLHierarchyListing from './GLHierarchyListing';

import { HIERARCHY_COL_WIDTH } from '../../../../configs/app';
import { API_URLS } from '../../../../configs/api';
import { httpGet } from '../../../../utils/http';
import { removeChild, addChild, updateChild } from './helper';
import {
  HEADERS,
  SETTINGS_HEADER,
  CHECKBOX_HEADER,
} from './GLAccountsListing/helper';

import {
  setGLAccountListing,
  setHierarchyListing,
  setSelectedFolder,
  clearData,
} from '../../../../reducers/GLAccountHierarchy/actions';
import { setLevelsVisibilities } from '../../../../reducers/LevelsConfigs/actions';

import {
  getGLAccountListing,
  getHierarchyListing,
  getSelectedFolder,
  getHierarchyHeaders,
} from '../../../../reducers/GLAccountHierarchy/selectors';

import getNumbers from '../../../../utils/helper/getNumbers';

import './styles.scss';
import LevelsConfigs from './LevelsConfigs';
import { getLevelsVisibilities } from '../../../../reducers/LevelsConfigs/selectors';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

class GLAccountHierarchy extends React.Component {
  state = {
    isFetching: false,
    isMoving: false,

    tableHeight: '',
    selectedGLAccount: [],
    headers: [],
    search: '',
    selectedSetting: null,
    isEditGLAccountModal: false,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const tableHeight = this.getTableHeight();

    this.setState({ tableHeight });
  }

  /**
   * When Component Did Mount
   */
  componentWillUnmount() {
    this.props.clearData();
  }

  /**
   * When Component Did Update
   */
  componentDidUpdate(prevProps) {
    const {
      rootName,
      hierarchyList,
      setHierarchyListing,
      hierarchyType,
    } = this.props;

    if (hierarchyType == 'dimensions' && rootName !== prevProps.rootName) {
      if (
        rootName &&
        hierarchyList &&
        hierarchyList.length > 0 &&
        hierarchyList[0].affa_level == 0
      ) {
        const list = [...hierarchyList];
        list[0].affa_h_key_name = rootName; // Modify the root name with demension name
        setHierarchyListing(list);
      }
    }
  }

  /**
   * Get Calculated Body Height
   *
   * @param {String}
   */
  getTableHeight = () => {
    try {
      const { tableHeight } = this.props;

      if (tableHeight) return `${tableHeight - 30}px`;

      const [ele] = document.getElementsByClassName('full-height-container');

      return `${ele.offsetHeight - 10}px`;
    } catch {
      return `${window.innerHeight}`;
    }
  };

  /**
   * Get GL Account Listing
   *
   * @param {String|Number} id
   */
  getHierarchy = async id => {
    try {
      const { isFetching, search } = this.state;
      const { hierarchyType, dimensionId, setGLAccountListing } = this.props;

      if (isFetching) return;

      this.setState({ isFetching: true });

      let url = '';

      if (hierarchyType == 'GLAccounts') {
        url = API_URLS.GET_HIERARCHY;
      }

      if (hierarchyType == 'dimensions') {
        url = API_URLS.DIMENSION_GET_HIERARCHY;
        url += `?dimension_id=${dimensionId}`;
      }

      if (search) {
        url += `${hierarchyType == 'GLAccounts' ? '?' : '&'}search=${search}`;
      }

      if (id) {
        url += `${
          hierarchyType == 'dimensions' || search ? '&' : '?'
        }parent_folder_id=${id}`;
      }

      const { data = [] } = await httpGet(url);

      this.setState({
        selectedGLAccount: [],
        isFetching: false,
      });

      setGLAccountListing(data);
    } catch (error) {
      console.error(error);
      this.setState({ isFetching: false });
    }
  };

  /**
   * Get the selected Hierarchy
   */
  handleHierarchySelection = data => {
    this.props.setGLAccountListing(data);
    // this.props.setSelectedFolder(id);
    // this.getHierarchy(id);
  };

  /**
   * Manage the state of selected hierarchy
   */
  handleGLAccountSelection = ids => {
    this.setState({ selectedGLAccount: ids });
  };

  /**
   *  Update hierarchy List
   */
  handleUpdateHierarchy = hierarchyList => {
    const { setHierarchyListing } = this.props;
    setHierarchyListing(hierarchyList);
  };

  /**
   * Update Table view data
   *
   * @param {Array} children
   */
  handleUpdateChilds = children => {
    const { setGLAccountListing } = this.props;
    setGLAccountListing(children);
  };

  /**
   *  Update table headers
   */
  handleUpdateHeaders = headers => {
    this.setState({ headers });
  };

  /**
   * Handle Click on Settings
   *
   * @param {Object} row
   */
  handleSettingsClick = row => event => {
    this.setState({
      isEditGLAccountModal: true,
      selectedSetting: row,
    });
  };

  /**
   * Handle Hierarchy added Callback
   */
  handleHierarchyAdded = (data, selectedHierarchy) => {
    const { affa_parent_folder_id } = data;

    const {
      hierarchyList,
      glAccountListing,
      setHierarchyListing,
      setGLAccountListing,
    } = this.props;

    const newArr = [...hierarchyList];

    if (selectedHierarchy === affa_parent_folder_id) {
      const newGLArr = [...glAccountListing];
      newGLArr.unshift(data);
      setGLAccountListing(newGLArr);
    }

    if (hierarchyList[0].affa_record_id == affa_parent_folder_id) {
      if (!newArr[0].children) {
        newArr[0].children = [...[data]];
      } else {
        newArr[0].children.unshift(data);
      }

      setHierarchyListing(newArr);
      return;
    }

    const updatedArr = addChild(
      affa_parent_folder_id,
      hierarchyList[0].children,
      data
    );
    newArr[0].children = updatedArr;

    setHierarchyListing(newArr);
  };

  /**
   * Add Edit GL Account
   *
   * @param {Array} data
   */
  handleEditGLAccount = data => {
    const { hierarchyList, glAccountListing, setGLAccountListing } = this.props;

    let newArr = [...glAccountListing];
    const newHieArr = [...hierarchyList];

    const { affa_record_id } = data;

    newArr = newArr.map(item => {
      if (item.affa_record_id == affa_record_id) {
        const updatedObj = { ...item, ...data };
        item = updatedObj;
      }
      return item;
    });

    setGLAccountListing(newArr);

    //  Update in hierarchy
    const updatedArr = updateChild(affa_record_id, data, newHieArr[0].children);
    newHieArr[0].children = updatedArr;
    setHierarchyListing(newHieArr);
  };

  /**
   * Handle > Delete Hierarchy
   *
   * @param {Array} data
   * @param {Object} item
   */
  handleDeleteHierarchy = (data, item) => {
    const {
      hierarchyList,
      glAccountListing,
      setHierarchyListing,
      setGLAccountListing,
    } = this.props;

    // remove folder from account listing(Table view)
    let newGLArr = [...glAccountListing];
    newGLArr = newGLArr.filter(
      ({ affa_record_id }) => item.affa_record_id != affa_record_id
    );
    setGLAccountListing(newGLArr);

    const newArr = [...hierarchyList];

    const modifyArr = removeChild(
      newArr[0].affa_record_id,
      'children',
      [item],
      hierarchyList[0].children
    );

    newArr[0].children = modifyArr;

    // always move deleted data to root hierarchy
    if (data && data.length > 0) {
      const filterFolders = data.filter(
        ({ affa_record_type }) => affa_record_type === 'folder'
      );

      newArr[0].children = [...newArr[0].children, ...filterFolders];
      setHierarchyListing(hierarchyList);
    }

    setHierarchyListing(newArr);
  };

  /**
   * Handle > Rename Hierarchy
   *
   * @param {Array} data
   */
  handleRenameHierarchy = data => {
    const { affa_record_id, affa_h_key_name, rollup_op } = data;
    const { glAccountListing, setGLAccountListing, hierarchyType } = this.props;

    // replace name and rollup operator
    const newGLArr = glAccountListing.map(item => {
      const newItem = {};

      if (item.affa_record_id == affa_record_id) {
        newItem.affa_h_key_name = affa_h_key_name;

        if (hierarchyType == 'GLAccounts') {
          newItem.rollup_op = rollup_op;
        }
      }

      return { ...item, ...newItem };
    });
    setGLAccountListing(newGLArr);
  };

  /**
   * Get Table Headers
   *
   * @param {Array} headers
   */
  getHeaders = headers => {
    const { isEnableEditRecord } = this.props;

    if (headers.length > 0) {
      headers.map(header => {
        header.width = HIERARCHY_COL_WIDTH;
        return header;
      });

      if (isEnableEditRecord) {
        return [...HEADERS, ...SETTINGS_HEADER];
      }

      return [...CHECKBOX_HEADER, ...headers];
    }

    if (this.props.hierarchyType == 'GLAccounts') return [...HEADERS];

    return [];
  };

  /**
   * Search Hierarchy
   *
   * @param {String} search
   */
  handleSearch = search => {
    this.setState({ search }, () => {
      this.getHierarchy(this.props.selectedFolder);
    });
  };

  /**
   * Remove additional space in table height
   *
   * @param {String} height
   */
  adjustTableHeight = height => {
    if (!height) return '0px';

    let heightInNumber = getNumbers(height);
    heightInNumber -= 75;

    return `${heightInNumber}px`;
  };

  /**
   * Render View
   */
  render() {
    const {
      isFetching,
      isMoving,
      selectedGLAccount,
      isEditGLAccountModal,
      selectedSetting,
      tableHeight,
    } = this.state;

    const {
      isHeaderEnable,
      isVisibleLevels,
      glAccountListing,
      isEnableEditRecord,
      setLevelsVisibilities,
      hierarchyList,
      hierarchyType,
      dimensionId,
      rootName,
      headers,
    } = this.props;

    return (
      <Box className="hierarchy-list-wrap">
        {(isFetching || isMoving) && <Spinner />}

        {isHeaderEnable && (
          <Box className="gl-header">
            <Box mb={1}>
              <Typography variant="caption" color="textSecondary">
                Setup GL Accounts
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h2">Specify GL Account Hierarchy</Typography>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  className="title-button"
                  onClick={() => {
                    logAmplitudeEvent('Financial Env. Setup: rename levels');
                    setLevelsVisibilities(true);
                  }}
                >
                  Rename Levels
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        <Box className="full-height-container">
          {isHeaderEnable && <Divider />}
          <Grid container>
            <DndProvider backend={HTML5Backend}>
              <Grid
                container
                item
                lg={4}
                md={6}
                direction="column"
                className="hierarchy-sidebar"
              >
                <GLHierarchyListing
                  onHierarchySelect={this.handleHierarchySelection}
                  hierarchyList={hierarchyList}
                  onHierarchyUpdate={this.handleUpdateHierarchy}
                  onHierarchyRename={this.handleRenameHierarchy}
                  onHierarchyAdded={this.handleHierarchyAdded}
                  onHeadersUpdate={this.handleUpdateHeaders}
                  onUpdateChilds={this.handleUpdateChilds}
                  onUpdateSelection={this.handleGLAccountSelection}
                  onHierarchyDeleted={this.handleDeleteHierarchy}
                  hierarchyType={hierarchyType}
                  dimensionId={dimensionId}
                  rootName={rootName}
                  tableHeight={this.adjustTableHeight(tableHeight)}
                />
              </Grid>

              <Grid item container lg={8} md={6} direction="column">
                <Box pl={3} height="100%">
                  <Divider orientation="vertical" />
                </Box>
                <GLAccountsListing
                  data={glAccountListing}
                  selectedGLAccount={selectedGLAccount}
                  hierarchyType={hierarchyType}
                  headers={this.getHeaders(headers)}
                  onSelect={this.handleGLAccountSelection}
                  onSettingsClick={this.handleSettingsClick}
                  tableHeight={this.adjustTableHeight(tableHeight)}
                  isEnableEditRecord={isEnableEditRecord}
                  onSearch={this.handleSearch}
                  isFetching={isFetching}
                />
              </Grid>
            </DndProvider>
          </Grid>

          {isEditGLAccountModal && (
            <AddEditGLAccountModal
              isOpen={isEditGLAccountModal}
              selectedAccount={selectedSetting}
              isEditMode
              doneText="Update"
              handleClose={value =>
                this.setState({ isEditGLAccountModal: value })
              }
              onGLAccountAddEdit={this.handleEditGLAccount}
            />
          )}

          {isVisibleLevels && (
            <LevelsConfigs
              isOpen={isVisibleLevels}
              id={dimensionId}
              handleClose={value => setLevelsVisibilities(value)}
            />
          )}
          <Divider />
        </Box>
      </Box>
    );
  }
}

GLAccountHierarchy.propTypes = {
  clearData: func.isRequired,
  dimensionId: oneOfType([number, string]),
  glAccountListing: arrayOf(shape({})),
  headers: arrayOf(shape({})),
  hierarchyList: arrayOf(shape({})),
  hierarchyType: string,
  isEnableEditRecord: bool,
  isHeaderEnable: bool,
  isVisibleLevels: bool.isRequired,
  rootName: string,
  selectedFolder: oneOfType([number, string]),
  setGLAccountListing: func.isRequired,
  setHierarchyListing: func.isRequired,
  setLevelsVisibilities: func.isRequired,
  // setSelectedFolder: func.isRequired,
  tableHeight: any,
};

GLAccountHierarchy.defaultProps = {
  isHeaderEnable: true,
  isEnableEditRecord: false,
  hierarchyType: 'GLAccounts',
  rootName: '',
  selectedFolder: '',
};

const mapStateToProps = createStructuredSelector({
  hierarchyList: getHierarchyListing(),
  glAccountListing: getGLAccountListing(),
  selectedFolder: getSelectedFolder(),
  headers: getHierarchyHeaders(),
  isVisibleLevels: getLevelsVisibilities(),
});

export default connect(mapStateToProps, {
  setGLAccountListing,
  setHierarchyListing,
  setLevelsVisibilities,
  setSelectedFolder,
  clearData,
})(GLAccountHierarchy);
