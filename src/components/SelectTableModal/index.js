import React from 'react';
import { func, bool, string, arrayOf } from 'prop-types';

import {
  Grid,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  withStyles,
  Tabs,
  Tab,
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

import { TABS_ACTIONS_KEYS } from './helper';

import SourceTableSelector from '../SourceTableSelector';

import ImportSourceTable from '../../views/SourceTables/ImportSourceTable';
import ProcessImportedTable from '../../views/SourceTables/ProcessImportedTable';
import { SELECT_TABLE_TABS_RE } from '../../views/SourceTables/SourceTablesList/ThumbnailView/configs';

import {
  DIMENSIONS_MSG,
  RULE_BASED_MODELS_MSG,
  SCENARIOS_MSG,
  SOURCE_TABLES_MSG,
} from '../../configs/messages';

import { showErrorMsg } from '../../utils/notifications';
import { logAmplitudeEvent } from '../../utils/amplitude';

import { styles } from './styles';
import './styles.scss';

class SelectTableModal extends React.Component {
  /**
   * State
   */
  state = {
    table: {},
    scenario: {},
    isPreviewModal: false,
    activeTabName: this.props.activeTabName,
  };

  /**
   * Handle > On Change Tab
   *
   * @param {Object}
   * @param {String} activeTabName
   */
  onChangeTab = (evt, activeTabName) => {
    this.setState({ activeTabName });
  };

  /**
   * Handle Next
   */
  handleNext = () => {
    logAmplitudeEvent('Next on select table modal');

    const { activeTabName, table } = this.state;
    const { id = '' } = table || {};

    switch (activeTabName) {
      case TABS_ACTIONS_KEYS.sourceTableTab:
        if (!id) {
          showErrorMsg(SOURCE_TABLES_MSG.select_table_required);
          return;
        }

        this.props.handleData(table);
        break;

      case TABS_ACTIONS_KEYS.importTableTab:
        showErrorMsg(SOURCE_TABLES_MSG.import_table_required);
        break;

      case TABS_ACTIONS_KEYS.scenarioTab:
        if (!id) {
          showErrorMsg(SCENARIOS_MSG.select_scenario_required);
          return;
        }

        this.props.handleData(table);
        break;

      case TABS_ACTIONS_KEYS.dimensionTab:
        if (!id) {
          showErrorMsg(DIMENSIONS_MSG.select_dimension_required);
          return;
        }

        this.props.handleData(table);
        break;

      case TABS_ACTIONS_KEYS.rbm:
        if (!id) {
          showErrorMsg(RULE_BASED_MODELS_MSG.select_rbm_required);
          return;
        }

        this.props.handleData(table);
        break;

      default:
        break;
    }
  };

  /**
   * Handle Selected Table
   *
   * @param {Object} table
   */
  handleSelectedTable = table => {
    this.setState({ table });
  };

  /**
   * Handle Selected Scenario
   *
   * @param {Object} scenario
   */
  handleSelectedScenario = scenario => {
    this.setState({ scenario });
  };

  /**
   * Handle Imported File
   */
  handleImportedFile = () => {
    this.setState({ isPreviewModal: true });
  };

  /**
   * Handle imported Table Response
   */
  handleImportedTable = table => {
    this.setState({ isPreviewModal: false });
    this.props.handleData(table);
  };

  /**
   * Close Import Table > Preview Modal
   */
  closePreviewModal = () => {
    this.setState({ isPreviewModal: false });
  };

  /**
   * Render View
   */
  render() {
    const {
      onClose,
      isOpen,
      classes,
      tabs,
      title,
      isActualEnabled,
      areTabsVisible,
    } = this.props;
    const {
      table: { id = '' } = {},
      activeTabName,
      isPreviewModal,
    } = this.state;

    return (
      <>
        <Dialog
          fullWidth
          maxWidth="lg"
          onClose={onClose}
          open={isOpen}
          className="src-table-selector-modal"
        >
          <DialogTitle
            id="customized-dialog-title"
            onClose={onClose}
            className="modal-title"
          >
            <Grid
              container
              direction="row"
              justify="space-between"
              alignItems="center"
            >
              <Box>{title}</Box>
              <Box mr={-1}>
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Grid>
            {areTabsVisible && (
              <Tabs
                indicatorColor="primary"
                textColor="primary"
                className="select-table-tab"
                value={activeTabName}
                onChange={this.onChangeTab}
              >
                {tabs.map(t => {
                  return <Tab key={t} value={t} label={t} />;
                })}
              </Tabs>
            )}
          </DialogTitle>

          <DialogContent>
            <Box>
              {activeTabName == TABS_ACTIONS_KEYS.sourceTableTab && (
                <SourceTableSelector
                  height="100%"
                  onSelect={this.handleSelectedTable}
                  selectedTable={id}
                />
              )}

              {activeTabName == TABS_ACTIONS_KEYS.importTableTab && (
                <ImportSourceTable
                  isDialog={false}
                  onRedirect={this.handleImportedFile}
                />
              )}

              {activeTabName == TABS_ACTIONS_KEYS.scenarioTab && (
                <SourceTableSelector
                  isDisplayScenarioLabel
                  height="100%"
                  onSelect={this.handleSelectedTable}
                  selectedTable={id}
                  type={SELECT_TABLE_TABS_RE.SCENARIO.value}
                  isActualEnabled={isActualEnabled}
                  title={TABS_ACTIONS_KEYS.scenarioTab}
                />
              )}

              {activeTabName == TABS_ACTIONS_KEYS.dimensionTab && (
                <SourceTableSelector
                  height="100%"
                  onSelect={this.handleSelectedTable}
                  selectedTable={id}
                  type={SELECT_TABLE_TABS_RE.DIMENSION.value}
                />
              )}

              {activeTabName == TABS_ACTIONS_KEYS.rbm && (
                <SourceTableSelector
                  height="100%"
                  onSelect={this.handleSelectedTable}
                  selectedTable={id}
                  type={SELECT_TABLE_TABS_RE.RBM.value}
                />
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Box px={3} py={1}>
              <Button
                onClick={() => {
                  logAmplitudeEvent('Cancel on select table modal');
                  onClose();
                }}
                color="primary"
                size="small"
              >
                Cancel
              </Button>
              &nbsp; &nbsp;
              <Button
                variant="contained"
                size="small"
                onClick={this.handleNext}
                color="primary"
              >
                Next
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        <Drawer
          anchor="right"
          className={classes.drawer}
          classes={{
            paper: classes.drawerPaper,
          }}
          open={isPreviewModal}
          onClose={this.closePreviewModal}
        >
          <Box>
            {false && (
              <CloseIcon
                className={classes.drawerCloseIcon}
                onClick={this.closePreviewModal}
              />
            )}
            <ProcessImportedTable
              onRedirect={this.handleImportedTable}
              onCancel={this.closePreviewModal}
            />
          </Box>
        </Drawer>
      </>
    );
  }
}

SelectTableModal.propTypes = {
  activeTabName: string,
  areTabsVisible: bool,
  handleData: func.isRequired,
  isActualEnabled: bool,
  isOpen: bool.isRequired,
  onClose: func.isRequired,
  tabs: arrayOf(string).isRequired,
  title: string,
};

SelectTableModal.defaultProps = {
  activeTabName: TABS_ACTIONS_KEYS.sourceTableTab,
  tabs: Object.values(SELECT_TABLE_TABS_RE).map(tab => tab.label),
  title: 'Select Table',
  isActualEnabled: true,
  areTabsVisible: true,
};

export default withStyles(styles)(SelectTableModal);
