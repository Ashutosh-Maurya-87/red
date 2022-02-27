import React from 'react';
import { func } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import qs from 'query-string';
import { get } from 'lodash';
import { Box, Tabs, Tab } from '@material-ui/core';

import Spinner from '../../../components/Spinner';
import AppHeader from '../../../components/AppHeader';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { DIMENSIONS_MSG } from '../../../configs/messages';
import EditDimensionRecords from './EditDimensionRecords';
import DimensionRelationship from './Relationship';
import HierarchyListing from './HierarchyListing';
import EditDimensionNameHeader from './EditDimensionNameHeader';
import ConfigureDimension from './ConfigureDimension';
import NoDimension from '../NoDimension';

import AddEditGLAccountModal from '../../FinancialEnvSetup/SetupGLAccounts/GLAccountHierarchy/AddEditGLAccount';

import { AI_MODULES_DISPLAY_NAME } from '../../../configs/app';
import { APP_ROUTES } from '../../../configs/routes';
import { API_URLS } from '../../../configs/api';
import { httpDelete } from '../../../utils/http';
import { getSystemDimensionName, TABS, TYPES } from './configs';

import {
  addGLAccount,
  setHeaders,
} from '../../../reducers/GLAccountHierarchy/actions';
import { setLevelsVisibilities } from '../../../reducers/LevelsConfigs/actions';
import { fetchDimension } from '../../../services/Dimensions';

class EditDimension extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    showTableSelection: false,
    isVisibleAddGLAccountModal: false,
    isLevel: false,

    bodyHeight: '',
    activeTab: 0,

    name: `New ${AI_MODULES_DISPLAY_NAME.dimension}`,
    type: TYPES[0],
    table: {},

    isClearConfirmed: false,
    isBlockDone: false,
  };

  editDimension = React.createRef();

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize);

    this.fillInitialData();
  }

  /**
   * Fill Initial Data
   */
  fillInitialData = async () => {
    const id = get(this.props, 'match.params.id');

    const query = new URLSearchParams(this.props.location.search);
    const tab = Number(query.get('tab'));
    const type = query.get('type') || TYPES[0];

    const name = getSystemDimensionName({ type, defaultName: this.state.name });

    let activeTab = 0;
    if (tab > 0 && tab <= 3) activeTab = tab;
    if (type == TYPES[1] && activeTab > 1) activeTab = 0;

    let dimension = { id };
    dimension = await this.fetchDimension(type == TYPES[0] ? id : type);

    if (!dimension) dimension = {};

    this.setState({
      showTableSelection: true,
      activeTab,
      table: { ...dimension },
      type,
      name,
    });
  };

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  /**
   * Handle Window Resize
   */
  handleWindowResize = () => {
    const bodyHeight = this.getBodyHeight();

    this.setState({ bodyHeight });
  };

  /**
   * Get Calculated Body Height
   *
   * @param {Number}
   */
  getBodyHeight = () => {
    try {
      const [appHeaderEle] = document.getElementsByClassName('app-header');

      // Header = 65px
      // Tabs = 105px
      return window.innerHeight - appHeaderEle.offsetHeight - 65 - 105;
    } catch {
      return window.innerHeight;
    }
  };

  /**
   * Fetch Dimension Details
   *
   * @param {String} id
   *
   * @return {Object}
   */
  fetchDimension = async id => {
    try {
      this.setState({ showLoader: true });

      const { data, meta = [] } = await fetchDimension(id);

      const { setHeaders } = this.props;

      setHeaders(meta);

      if (data && !data.display_name) {
        data.display_name = data.name;
      }

      this.setState({ showLoader: false });
      return data;
    } catch (err) {
      this.setState({ showLoader: false });

      return null;
    }
  };

  /**
   * Handle > On Change Tab
   *
   * @param {Object}
   * @param {Number} activeTab
   */
  onChangeTab = (evt, activeTab) => {
    const {
      history,
      location: { pathname, search },
    } = this.props;

    const searchObj = qs.parse(search);
    searchObj.tab = activeTab;
    const searchStr = qs.stringify(searchObj);

    this.setState({ activeTab });
    history.push({ pathname, search: searchStr });
  };

  /**
   * Handle > Go To Previous
   */
  handleBack = () => {
    this.props.history.push(APP_ROUTES.DIMENSIONS);
  };

  /**
   * Handle Selected Table
   *
   * @param {Object} table
   */
  handleTable = table => {
    this.setState({ table });
  };

  /**
   * Update Dimension Name
   *
   * @param {String} name
   */
  handleNewName = name => {
    const { table } = this.state;

    this.setState({
      table: {
        ...table,
        name,
        display_name: name,
      },
    });
  };

  /**
   * Add GL account
   *
   * @param {String} name
   */
  handleAddGLAccount = data => {
    const { addGLAccount } = this.props;
    addGLAccount(data);
  };

  /**
   * Update Table after Update Configs
   *
   * @param {Object} table
   */
  updateTable = table => {
    this.setState({
      table: {
        ...this.state.table,
        ...table,
      },
    });
  };

  /**
   * Update table > Handle Time Dimension update
   *
   * @param {Object} dimension
   */
  handleTimeDimensionUpdate = dimension => {
    this.setState({
      table: { ...dimension },
    });
  };

  /**
   * Handle Confirmation Modal clear Dimension
   */
  handleConfirmClear = () => {
    this.setState({ isClearConfirmed: true });
  };

  /**
   * Handle Confirmation Modal Closing
   */
  handleCloseConfModal = res => {
    if (res) this.handleClear();
    return this.setState({ isClearConfirmed: false });
  };

  /**
   * Handle update Inline Name
   */
  handleUpdateInlineName = value => {
    this.setState({ isBlockDone: value });
  };

  /**
   * Handling Clearing or reloading data on API request
   */
  handleClear = async () => {
    try {
      const { showLoader, activeTab = 0, table: { id = '' } = {} } =
        this.state || {};

      if (showLoader) return;

      this.setState({ showLoader: true });

      const url = API_URLS.CLEAR_DIMENSION.replace('#ID#', id);

      const { data } = await httpDelete(url);

      if (data && this.editDimension && this.editDimension.current) {
        if (activeTab === 0) {
          this.editDimension.current.fillInitialData();
        }
      }

      if (data) {
        const tempTable = this.state.table;
        this.setState({ table: {} }, () => {
          this.setState({ table: tempTable });
        });
      }
      this.setState({ showLoader: false });
    } catch (error) {
      console.error(error);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const {
      bodyHeight,
      showTableSelection,
      isVisibleAddGLAccountModal,
      showLoader,
      table,
      activeTab,
      type,
      isClearConfirmed,
    } = this.state;

    const { id = '', display_name = '' } = table || {};

    const isClearButton =
      (type == TYPES[0] || type == TYPES[1]) &&
      (activeTab == 0 || activeTab == 1);

    return (
      <>
        {showLoader && <Spinner />}

        <AppHeader
          header={
            <EditDimensionNameHeader
              name={display_name}
              handleNewName={this.handleNewName}
              onChangeEditingState={this.handleUpdateInlineName}
              id={id}
              canEdit={type == TYPES[0]}
            />
          }
          saveText={
            activeTab == 1 && Boolean(type == TYPES[1] && id)
              ? 'Add GL Account'
              : ''
          }
          levelText={activeTab == 1 && Boolean(id) ? 'Rename Levels' : ''}
          cancelText="Exit"
          onSave={() => this.setState({ isVisibleAddGLAccountModal: true })}
          onLevel={() => this.props.setLevelsVisibilities(true)}
          onCancel={this.handleBack}
          clearText={isClearButton && 'Clear Data'}
          onClear={this.handleConfirmClear}
        />

        {isClearConfirmed && (
          <ConfirmationModal
            handleClose={this.handleCloseConfModal}
            isOpen
            action={toString(isClearConfirmed)}
            msg={DIMENSIONS_MSG.dimension_clear_confirmation}
          />
        )}

        <Box px={3}>
          {showTableSelection && bodyHeight && table.id && (
            <Box textAlign="center" mt={1} fontSize={24}>
              <Tabs
                value={activeTab}
                indicatorColor="primary"
                textColor="primary"
                className="select-table-tab"
                onChange={this.onChangeTab}
              >
                {TABS.map((tab, tabIndex) => {
                  const tabs =
                    type == TYPES[2] && tab == 'Edit View' ? 'View' : tab;
                  const isDisabled =
                    ((tabIndex == 2 || tabIndex == 3) && type == TYPES[1]) ||
                    ((tabIndex == 1 || tabIndex == 2) && type == TYPES[2]);

                  return <Tab key={tabs} label={tabs} disabled={isDisabled} />;
                })}
              </Tabs>
            </Box>
          )}

          {activeTab == 0 && id && (
            <Box mt={3}>
              <EditDimensionRecords
                ref={this.editDimension}
                table={table}
                tableHeight={`${bodyHeight + 10}px`}
                type={type}
              />
            </Box>
          )}

          {activeTab == 1 && id && (
            <HierarchyListing
              table={table}
              type={type}
              tableHeight={bodyHeight + 80}
            />
          )}

          {activeTab == 2 && id && type != TYPES[1] && (
            <DimensionRelationship
              table={table}
              type={type}
              tableHeight={bodyHeight - 90}
            />
          )}

          {activeTab == 3 && id && type != TYPES[1] && (
            <ConfigureDimension
              table={table}
              type={type}
              updateTable={this.updateTable}
              tableHeight={bodyHeight - 90}
              onTimeDimensionUpdate={this.handleTimeDimensionUpdate}
            />
          )}

          {!showLoader && !id && <NoDimension />}
        </Box>

        {isVisibleAddGLAccountModal && (
          <AddEditGLAccountModal
            isOpen={isVisibleAddGLAccountModal}
            handleClose={value =>
              this.setState({ isVisibleAddGLAccountModal: value })
            }
            onGLAccountAddEdit={this.handleAddGLAccount}
          />
        )}
      </>
    );
  }
}

EditDimension.propTypes = {
  addGLAccount: func.isRequired,
  setHeaders: func.isRequired,
  setLevelsVisibilities: func.isRequired,
};

EditDimension.defaultProps = {};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {
  addGLAccount,
  setLevelsVisibilities,
  setHeaders,
})(withRouter(EditDimension));
