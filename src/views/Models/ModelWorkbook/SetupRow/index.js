import React from 'react';
import {
  bool,
  func,
  string,
  shape,
  oneOfType,
  arrayOf,
  number,
} from 'prop-types';
import { AutoSizer } from 'react-virtualized';

import {
  Drawer,
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  withStyles,
  Switch,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';

import SetupExtractRow from './SetupExtractRow';
import SetupFormulaRow from './SetupFormulaRow';

import { SETUP_ROW_TABS, SETUP_ROW_TAB_KEYS } from './configs';
import { ROW_TYPES_KEYS, ROW_TYPES_ARRAY } from '../configs';
import { MODELS_MSG } from '../../../../configs/messages';
import { ASSUMPTION_PREFIX } from '../GridPanel/configs';

import { validateFormulaAPI } from '../helper';
import { showErrorMsg } from '../../../../utils/notifications';

import { styles } from './styles';

class SetupRow extends React.Component {
  defaultState = {
    rowTypesEle: null,

    tabs: [...SETUP_ROW_TABS],
    activeTab: SETUP_ROW_TAB_KEYS.rowType,
    tabOptions: [...ROW_TYPES_ARRAY],
    rowConfig: null,

    rowType: ROW_TYPES_KEYS.freeform,

    extractFormula: [],
    postingFormula: [],

    readMappings: [],
    writeMappings: [],

    isSubmitted: false,
    isPostingEnable: false,
    isFormulaEnable: false,
    isUseExtractMappings: false,
    isRowUseAsHeading: false,
  };

  /**
   * State
   */
  state = { ...this.defaultState };

  /**
   * When component did mount
   */
  componentDidMount() {
    const { rowConfig = {} } = this.props;
    const {
      rowType,
      isPostingEnable,
      isRowUseAsHeading,
      isSameExtractPostMappings,

      writeMappings = [],
      readMappings = [],

      extractFormula = [],
      postingFormula = [],
    } = rowConfig || {};

    this.setState({
      rowConfig,
      rowType,
      isPostingEnable,
      isRowUseAsHeading,
      isFormulaEnable: postingFormula && postingFormula.length > 0,
      extractFormula: JSON.parse(JSON.stringify(extractFormula)),
      postingFormula: JSON.parse(JSON.stringify(postingFormula)),
      writeMappings: JSON.parse(JSON.stringify(writeMappings)),
      readMappings: JSON.parse(JSON.stringify(readMappings)),
      isUseExtractMappings: isSameExtractPostMappings,
    });
  }

  /**
   * Handle Close Modal without data
   */
  handleCloseModal = () => {
    const { handleClose } = this.props;

    // Reset state
    this.setState(this.defaultState);
    handleClose(false);
  };

  /**
   * Handle click of tabs options
   */
  handleTabOptions = tab => event => {
    event.stopPropagation();

    const { value = '', options = [] } = tab || {};

    this.setState({
      activeTab: value,
      tabOptions: options,
      rowTypesEle: event.currentTarget,
    });
  };

  /**
   * Handle click of tabs options
   */
  handleCloseOptions = () => {
    this.setState({ rowTypesEle: null });
  };

  /**
   * Reset Row Configs
   *
   * @param {Object} rowConfig
   * @param {String} activeTab
   * @param {String} value
   *
   * @return {Object}
   */
  resetRowConfigs = (rowConfig, activeTab, value) => {
    const { isPostingEnable } = rowConfig || {};

    const state = {};
    if (activeTab == 'rowType' && value == ROW_TYPES_KEYS.freeform) {
      rowConfig.readMappings = [];
      state.readMappings = [];

      rowConfig.extractFormula = [];
      state.extractFormula = [];
    }

    if (activeTab == 'rowType' && value == ROW_TYPES_KEYS.extract) {
      rowConfig.isRowUseAsHeading = false;
      state.isRowUseAsHeading = false;

      rowConfig.extractFormula = [];
      state.extractFormula = [];
    }

    if (activeTab == 'rowType' && value == ROW_TYPES_KEYS.formula) {
      rowConfig.readMappings = [];
      state.readMappings = [];

      rowConfig.isRowUseAsHeading = false;
      state.isRowUseAsHeading = false;
    }

    if (!isPostingEnable) {
      rowConfig.postingFormula = [];
      state.postingFormula = [];
    }

    return {
      modifiedConfig: rowConfig,
      state,
    };
  };

  /**
   * Handle Option Selection > Row|Posting Type
   *
   * @param {Object} menuItem
   */
  handleOptionSelection = (event, value) => {
    const { activeTab, rowConfig } = this.state;

    const tempConfig = { ...rowConfig };
    const { isPostingEnable = false } = tempConfig || {};

    const isUseExtractMapping =
      value === ROW_TYPES_KEYS.extract && isPostingEnable ? true : false;

    const fieldName =
      activeTab === SETUP_ROW_TAB_KEYS.rowType ? 'rowType' : 'postingType';
    tempConfig[fieldName] = value;

    const { modifiedConfig, state } = this.resetRowConfigs(
      { ...tempConfig },
      fieldName,
      value
    );

    state.isUseExtractMappings = isUseExtractMapping;
    state.rowConfig = modifiedConfig;
    state[fieldName] = value;

    this.setState(state);
  };

  /**
   * Handle switch button onChange event
   *
   * @param {Object} event
   */
  handleSwitch = event => {
    const { rowConfig, activeTab, rowType = '' } = this.state;

    const tempConfig = { ...rowConfig };
    tempConfig[event.target.name] = event.target.checked;

    const state = {};

    if (!event.target.checked && event.target.name == 'isPostingEnable') {
      state.writeMappings = [];
      tempConfig.writeMappings = [];
    }

    if (
      event.target.checked &&
      event.target.name == 'isPostingEnable' &&
      activeTab === SETUP_ROW_TAB_KEYS.rowType &&
      rowType === ROW_TYPES_KEYS.extract
    ) {
      this.setState({ isUseExtractMappings: true });
    }

    if (!event.target.checked && event.target.name == 'isFormulaEnable') {
      state.postingFormula = [];
      tempConfig.postingFormula = [];
    }

    // Enabling SetupExtractRow on extract -> posting toggle
    if (!event.target.checked && event.target.name == 'isUseExtractMappings') {
      this.setState({ isUseExtractMappings: false });
    }

    state[event.target.name] = event.target.checked;
    state.rowConfig = tempConfig;

    this.setState(state);
  };

  /**
   * Identify the current node is already selected or not
   *
   * @param {Number} dimensionId
   */
  isHavingNode = dimensionId => {
    if (!dimensionId) return false;

    const { sharedMappings = [] } = this.props;

    const ids = sharedMappings.map(({ dimension_id }) =>
      dimension_id?.toString()
    );

    return ids.indexOf(dimensionId?.toString()) != -1;
  };

  /**
   * Handle Save button click > Save configs
   */
  handleSave = () => {
    const {
      rowConfig,
      readMappings,

      rowType,

      extractFormula,
      postingFormula,

      isPostingEnable,
      isFormulaEnable,
      isUseExtractMappings,
    } = this.state;

    let { writeMappings = [] } = this.state;

    if (isUseExtractMappings) writeMappings = readMappings;

    const { onSaveConfig, rowConfigs, rowIndex, systemDimensions } = this.props;
    let assumptionError = extractFormula.filter(
      error => error?.type === ASSUMPTION_PREFIX
    );
    assumptionError = assumptionError.find(error => {
      return error?.error;
    });

    this.setState({ isSubmitted: true });

    // Validating Assumption Error
    if (assumptionError?.error && assumptionError?.error_message) {
      showErrorMsg(assumptionError?.error_message);
      return;
    }
    // validate at least we have one read mappings to save
    if (rowType === ROW_TYPES_KEYS.extract && readMappings.length == 0) {
      showErrorMsg(MODELS_MSG.select_at_least_one_extract_field);
      return;
    }

    // validate at least we have one write mappings to save
    if (isPostingEnable && writeMappings.length == 0) {
      showErrorMsg(MODELS_MSG.select_at_least_one_posting_field);
      return;
    }

    // validate at least we have one write mappings to save
    if (
      isPostingEnable &&
      writeMappings.length > 0 &&
      systemDimensions.length > 0 &&
      !this.isHavingNode(systemDimensions[0].id)
    ) {
      const [chartOfAccount] = systemDimensions || [];
      const codIndex = writeMappings.findIndex(
        ({ dimension }) => dimension.id == chartOfAccount.id
      );

      if (codIndex < 0) {
        showErrorMsg(MODELS_MSG.coa_member_required);
        return;
      }
    }

    // Validate formula for Posting tab, if posting enable
    if (
      isPostingEnable &&
      isFormulaEnable &&
      !validateFormulaAPI(postingFormula)
    )
      return;

    // Validate formula for Extract tab
    if (
      rowType === ROW_TYPES_KEYS.formula &&
      !validateFormulaAPI(extractFormula)
    )
      return;

    const tempConfig = {
      ...rowConfig,
      row_id: rowConfigs[rowIndex].row_id,
      ...{
        readMappings,
        writeMappings: isUseExtractMappings ? readMappings : writeMappings,
        extractFormula,
        postingFormula,
      },
      isSameExtractPostMappings: isUseExtractMappings,
    };

    // Preventing to save non-updated value --> (Freeform, Extract, Formula)
    const nonUpdatedData = rowConfigs.filter(
      singleRowConfig =>
        JSON.stringify(singleRowConfig) == JSON.stringify(tempConfig)
    );

    this.handleCloseModal();
    if (nonUpdatedData.length == 0) onSaveConfig(tempConfig);
  };

  /**
   * Handle callback > When any hierarchy selected
   *
   * @param {Array} selectedHierarchies
   * @param {Object} dimension
   */
  handleHierarchySelection = (selectedHierarchies, dimension) => {
    const { readMappings, writeMappings, activeTab } = this.state;

    const mappings =
      activeTab == SETUP_ROW_TAB_KEYS.rowType ? readMappings : writeMappings;

    const mappingKey =
      activeTab == SETUP_ROW_TAB_KEYS.rowType
        ? 'readMappings'
        : 'writeMappings';

    const copySelectedDimensions = [...mappings];

    const { id } = dimension || {};

    // Remove dimension object is selectedHierarchies == 0
    if (selectedHierarchies.length == 0) {
      let selectedItems = [];

      selectedItems = copySelectedDimensions.filter(
        item => item.dimension.id != id
      );

      this.setState({ [mappingKey]: selectedItems });
      return;
    }

    const index = copySelectedDimensions.findIndex(
      item => item.dimension.id == id
    );

    if (index == -1) {
      copySelectedDimensions.push({ selectedHierarchies, dimension });
    } else {
      copySelectedDimensions[index].selectedHierarchies = selectedHierarchies;
    }

    this.setState({ [mappingKey]: copySelectedDimensions });
  };

  /**
   * Update formula state
   *
   * @param {Array} formula
   */
  handleFormulaUpdate = formula => {
    const { activeTab } = this.state;

    const mappingKey =
      activeTab == SETUP_ROW_TAB_KEYS.rowType
        ? 'extractFormula'
        : 'postingFormula';

    this.setState({ [mappingKey]: formula });
  };

  /**
   * Render View
   */
  render() {
    const {
      tabs,
      activeTab,
      tabOptions,

      rowType,

      readMappings,
      writeMappings,

      extractFormula,
      postingFormula,

      isSubmitted,
      isRowUseAsHeading,
      isPostingEnable,
      isFormulaEnable,

      isUseExtractMappings,
    } = this.state;

    const {
      isOpen,
      title,
      doneText,
      classes,
      rowConfig,
      workbook,
    } = this.props;
    const { row_id } = rowConfig || {};

    const { id: workbookId = '', scenario_id: scenarioId = '' } =
      workbook || {};

    return (
      <Drawer
        anchor="right"
        disableBackdropClick
        disableEscapeKeyDown
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
        open={isOpen}
        onClose={this.handleCloseModal}
      >
        {/* Header section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" component="h5">
            {title}
          </Typography>
        </Box>

        {/* Body section */}
        <AutoSizer>
          {({ width, height }) => (
            <div style={{ height: '100%' }}>
              <Box height={height - 90} width={width} mb={1}>
                <Tabs
                  value={activeTab}
                  classes={{ indicator: classes.bigIndicator }}
                >
                  {tabs.map(
                    (tab, index) =>
                      (tab.isEnable || isPostingEnable) && (
                        <Tab
                          key={index}
                          disableRipple
                          classes={{
                            wrapper: `${classes.tabWrapper} ${
                              !tab.isOptionsEnable
                                ? classes.tabWrapperLeftAlign
                                : ''
                            }`,
                            root: classes.tab,
                          }}
                          value={tab.value}
                          label={`${tab.label}`}
                          onClick={() => {
                            this.setState({ activeTab: tab.value });
                          }}
                        />
                      )
                  )}
                </Tabs>

                <Box
                  bgcolor="secondary.modelTab"
                  padding={2}
                  style={{ height: 'calc(100% - 84px)' }}
                >
                  {activeTab === SETUP_ROW_TAB_KEYS.rowType && (
                    <Box display="flex" flexDirection="row">
                      <RadioGroup
                        aria-label="gender"
                        name="row-type"
                        value={rowType}
                        className={classes.flexDirectionRow}
                        onChange={this.handleOptionSelection}
                      >
                        {tabOptions.map((option, index) => (
                          <Box
                            key={index}
                            bgcolor="secondary.processTable"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            mb={1}
                            mx={0.5}
                            px={2}
                            py={1}
                            borderRadius={6}
                            flexBasis="0"
                            flexGrow="1"
                          >
                            <FormControlLabel
                              control={
                                <Radio
                                  className="hierarchy-select-radio"
                                  color="primary"
                                  value={option.value}
                                  name="hierarchy-radio-button"
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2">
                                    {option.label}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    {option.description}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Box>
                        ))}
                      </RadioGroup>
                    </Box>
                  )}
                  {activeTab === SETUP_ROW_TAB_KEYS.rowType &&
                    rowType === ROW_TYPES_KEYS.freeform && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <Box>
                          <Typography variant="body1" component="div">
                            Use this row as a Header
                          </Typography>
                        </Box>
                        <Switch
                          disabled={isPostingEnable}
                          checked={isRowUseAsHeading}
                          onChange={this.handleSwitch}
                          color="primary"
                          className={classes.switcher}
                          name="isRowUseAsHeading"
                          inputProps={{ 'aria-label': 'primary checkbox' }}
                        />
                      </Box>
                    )}

                  {activeTab === SETUP_ROW_TAB_KEYS.rowType && (
                    <>
                      <Box display="flex" alignItems="center">
                        <Box mr={5}>
                          <Typography variant="body1" component="div">
                            Enable forecasting
                          </Typography>
                        </Box>
                        <Box style={{ marginLeft: '3px' }}>
                          <Switch
                            checked={isPostingEnable}
                            onChange={this.handleSwitch}
                            color="primary"
                            name="isPostingEnable"
                            inputProps={{ 'aria-label': 'primary checkbox' }}
                          />
                        </Box>
                      </Box>
                      {(rowType === ROW_TYPES_KEYS.extract ||
                        rowType === ROW_TYPES_KEYS.formula) && (
                        <Box pb={2} pt={1}>
                          <Divider />
                        </Box>
                      )}
                      {rowType === ROW_TYPES_KEYS.extract && (
                        <>
                          <Box pb={1}>
                            <Typography variant="body1" component="div">
                              Map Rows
                            </Typography>
                          </Box>
                          <Box
                            display="flex"
                            flexDirection="column"
                            style={{ height: 'calc(100% - 244px)' }}
                          >
                            <SetupExtractRow
                              isMulti
                              workbookId={workbookId}
                              scenarioId={scenarioId}
                              selectedItems={readMappings}
                              onSelection={this.handleHierarchySelection}
                            />
                          </Box>
                        </>
                      )}
                    </>
                  )}

                  {activeTab === SETUP_ROW_TAB_KEYS.rowType &&
                    rowType === ROW_TYPES_KEYS.formula && (
                      <Box display="flex" flexDirection="column">
                        <Box pb={1}>
                          <Typography variant="body1" component="div">
                            Define Formula for Row
                          </Typography>
                        </Box>
                        <SetupFormulaRow
                          rowId={row_id}
                          isSubmit={isSubmitted}
                          formula={extractFormula}
                          onFormulaUpdate={this.handleFormulaUpdate}
                        />
                      </Box>
                    )}

                  {activeTab === SETUP_ROW_TAB_KEYS.posting && isPostingEnable && (
                    <>
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="body1" component="div">
                            Enable Formula for Posting
                          </Typography>
                        </Box>
                        <Switch
                          checked={isFormulaEnable}
                          onChange={this.handleSwitch}
                          color="primary"
                          className={classes.switcher}
                          name="isFormulaEnable"
                          inputProps={{ 'aria-label': 'primary checkbox' }}
                        />
                      </Box>

                      {/* Use extract mapping Toggle/Switch on extract -> posting */}
                      {rowType === ROW_TYPES_KEYS.extract && (
                        <Box display="flex" alignItems="center">
                          <Box>
                            <Typography variant="body1" component="div">
                              Use Extract Mappings
                            </Typography>
                          </Box>
                          <Switch
                            checked={isUseExtractMappings}
                            onChange={this.handleSwitch}
                            color="primary"
                            className={classes.switcher}
                            name="isUseExtractMappings"
                            inputProps={{ 'aria-label': 'primary checkbox' }}
                          />
                        </Box>
                      )}
                      <Box pb={2} pt={1}>
                        <Divider />
                      </Box>

                      {isFormulaEnable && (
                        <>
                          <Box display="flex" flexDirection="column">
                            <Box pb={1}>
                              <Typography variant="body1" component="div">
                                Define Formula for Posting
                              </Typography>
                            </Box>
                          </Box>
                          <SetupFormulaRow
                            rowId={row_id}
                            isSubmit={isSubmitted}
                            formula={postingFormula}
                            onFormulaUpdate={this.handleFormulaUpdate}
                          />
                          <Box pb={2} pt={1}>
                            <Divider />
                          </Box>
                        </>
                      )}

                      {!isUseExtractMappings && (
                        <Box
                          display="flex"
                          flexDirection="column"
                          style={{
                            height: `calc(100% - ${
                              isFormulaEnable ? 275 : 65
                            }px)`,
                          }}
                        >
                          <SetupExtractRow
                            workbookId={workbookId}
                            scenarioId={scenarioId}
                            selectedItems={writeMappings}
                            onSelection={this.handleHierarchySelection}
                          />
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* Footer Section */}
              <Box display="flex" justifyContent="flex-end" width={width}>
                <Box mr={1}>
                  <Button color="primary" onClick={this.handleCloseModal}>
                    Cancel
                  </Button>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  onClick={this.handleSave}
                  color="primary"
                  disabled={false}
                >
                  {doneText}
                </Button>
              </Box>
            </div>
          )}
        </AutoSizer>
      </Drawer>
    );
  }
}

SetupRow.propTypes = {
  doneText: string,
  handleClose: func.isRequired,
  isOpen: bool.isRequired,
  onSaveConfig: func.isRequired,
  rowConfig: shape({}),
  rowConfigs: arrayOf(shape({})),
  rowIndex: oneOfType([string, number]),
  sharedMappings: arrayOf(shape({})).isRequired,
  systemDimensions: arrayOf(shape({})).isRequired,
  title: string,
  workbook: shape({}).isRequired,
};

SetupRow.defaultProps = {
  doneText: 'Done',
  title: 'Shared Mapping for',
  systemDimensions: [],
  sharedMappings: [],
  onSaveConfig: () => {},
  workbook: {},
};

export default withStyles(styles)(SetupRow);
