import React, { useState } from 'react';
import { arrayOf, bool, func, number, shape } from 'prop-types';

import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { AutoSizer } from 'react-virtualized';

import { v4 as uuidV4 } from 'uuid';

import {
  Typography,
  Box,
  IconButton,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Grid,
  withStyles,
  Tooltip,
} from '@material-ui/core';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import {
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  FileCopyOutlined as FileCopyOutlinedIcon,
  DragIndicator as DragIndicatorIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@material-ui/icons';

import ConfirmationModal from '../../../../../components/ConfirmationModal';
import CustomScrollbars from '../../../../../components/ScrollBars';

import {
  DELETE_CONFIRMATION_ALL_GROUPS,
  DELETE_CONFIRMATION_MSG,
  DELETE_CONFIRMATION_THIS_GROUP,
  DELETE_CONFIRMATION_TITLE,
  RULES_TYPES,
  RULE_INFO_MODES,
} from '../../../configs';

import {
  getSelectedCalculationIndex,
  getSelectedCalculationRules,
  getSingleRBM,
} from '../../../../../reducers/RuleBasedModels/selectors';
import {
  setSingleRBM,
  setSelectedCalculationRules,
} from '../../../../../reducers/RuleBasedModels/actions';

import RuleInfo from '../RuleInfo';

import { styles } from '../RulesListing/styles';
import AddEditCalculation from '../AddEditCalculation';
import { generateRuleName } from '../AddEditCalculation/helper';
import {
  addEditRule,
  deleteRuleFromAllGroups,
  getPercentageLabels,
} from '../helper';

import '../styles.scss';

// Actions for Remove calculation from all groups and this group
const actions = {
  allGroup: 'allGroup',
  thisGroup: 'thisGroup',
};

const SelectedGroupRules = ({
  selectedCalculationRules,
  setSelectedCalculationRules,
  setSingleRBM,
  singleRBM,
  onSetUnsavedChanges,
  activeGroup,
  isUpdateMapping,
}) => {
  const [isDeleteConf, setDeleteConf] = useState(false);
  const [isShowAddSingleCalDraw, setIsShowAddSingleCalDraw] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState();

  const { configuration = {} } = singleRBM || {};
  const { entity_type = {}, rules = [] } = configuration || {};

  let { rule_group_mapping = [] } = configuration;

  const { groups = [] } = entity_type || {};

  /**
   * On drag end
   * @param {Object} result
   * @returns
   */
  const onDragEnd = result => {
    const { source = {}, destination = {} } = result || {};
    const { index: sourceIndex = 0 } = source || {};
    const { index: destIndex = 0 } = destination || {};
    if (!destination || !source) {
      return;
    }

    const copyRuleGroup = rule_group_mapping.filter(
      ({ group }) => String(group) !== String(groups[activeGroup])
    );

    const updateSelectedCalculationRules = reorder(
      selectedCalculationRules,
      sourceIndex,
      destIndex
    );

    const newRules = [];

    updateSelectedCalculationRules.forEach((rule, index) => {
      newRules.push({
        group: groups[activeGroup],
        rule_uid: rule.rule_uid,
        logical_order: index + 1,
      });
    });

    rule_group_mapping = [...copyRuleGroup, ...newRules];

    const newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rule_group_mapping: [...rule_group_mapping],
      },
    };

    onSetUnsavedChanges(true);
    setSingleRBM(newSingleRBM);
    setSelectedCalculationRules(updateSelectedCalculationRules);
  };

  /**
   *  Styling of lists
   */
  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    margin: `0 0 10px 0`,
    ...draggableStyle,
  });

  /**
   * reordering the Selected rules
   *
   * @param {Array} list
   * @param {Number} startIndex
   * @param {Number} endIndex
   * @returns {Array} result (Updated List Array)
   */
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  /**
   * on click > Edit rule
   *
   * @param {Number} index
   * @param {object} Event
   */
  const handleEditRule = index => evt => {
    evt.stopPropagation();

    setDeletingGroup(index);
    setIsShowAddSingleCalDraw(true);
  };

  /**
   * handle callback of onDone add/edit rule
   */
  const handleAddEditRule = (rule, isEditMode) => {
    setIsShowAddSingleCalDraw(false);

    const result = addEditRule({
      singleRBM,
      isEditMode,
      rule,
      rules,
      selectedCalculationRules,
    });

    const { newSingleRBM, copyOfSelectedCalculationRules } = result;

    if (isEditMode) {
      setSelectedCalculationRules([...copyOfSelectedCalculationRules]);
    }

    onSetUnsavedChanges(true);
    setSingleRBM(newSingleRBM);
  };

  /**
   * On Click Delete
   *
   * @param {Number} index
   */
  const onClickDelete = index => evt => {
    evt.stopPropagation();

    setDeleteConf(true);
    setDeletingGroup(index);
  };

  /**
   * Delete Rule From All Group
   *
   * @param {Number} res
   */
  const handleDeleteRuleFromAllGroup = res => {
    setDeleteConf(false);

    if (res == null) return;

    const { rule_uid: ruleUid = '' } = selectedCalculationRules[res] || [];

    // handle callback
    const handleCallBack = () => {
      // set selected group rule listing
      const copyOfSelectedCalculationRules = selectedCalculationRules.filter(
        rule => rule.rule_uid != ruleUid
      );

      setSelectedCalculationRules([...copyOfSelectedCalculationRules]);
      onSetUnsavedChanges(true);
    };

    // delete rule from all groups
    deleteRuleFromAllGroups({
      singleRBM,
      setSingleRBM,
      ruleUid,
      callback: handleCallBack,
    });
  };

  /**
   * Handle Delete Confirmation
   *
   * @param {Any}
   */
  const handleDeleteConf = res => {
    setDeleteConf(false);

    if (!res) return;

    if (res == actions.allGroup) {
      handleDeleteRuleFromAllGroup(deletingGroup);
      return;
    }

    const mappedIndex = rule_group_mapping.findIndex(
      ({ rule_uid, group }) =>
        String(selectedCalculationRules[res].rule_uid) === String(rule_uid) &&
        String(groups[activeGroup]) === String(group)
    );

    rule_group_mapping.splice(mappedIndex, 1);
    selectedCalculationRules.splice(res, 1);

    const copyRuleGroup = rule_group_mapping.filter(
      ({ group }) => String(group) !== String(groups[activeGroup])
    );

    const newRules = [];

    selectedCalculationRules.forEach((rule, index) => {
      newRules.push({
        group: groups[activeGroup],
        rule_uid: rule.rule_uid,
        logical_order: index + 1,
      });
    });

    rule_group_mapping = [...copyRuleGroup, ...newRules];

    const newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rule_group_mapping: [...rule_group_mapping],
      },
    };

    onSetUnsavedChanges(true);
    setSelectedCalculationRules(selectedCalculationRules);
    setSingleRBM(newSingleRBM);
  };

  /**
   * On Click Copy
   *
   * @param {Number} index
   */
  const onClickCopy = index => evt => {
    evt.stopPropagation();

    const filterResult = rules.filter(row =>
      row.forecast_label.includes(
        selectedCalculationRules[index].forecast_label
      )
    );

    const { forecast_label = '' } = selectedCalculationRules[index] || {};
    const name = generateRuleName(rules, filterResult.length, forecast_label);
    const copyGroupName = name;

    const uuid = uuidV4();

    const copyRule = {
      ...selectedCalculationRules[index],
      rule_uid: uuid,
      forecast_label: copyGroupName,
      forecast_column: copyGroupName,
      id: null,
    };

    const copyRuleMapping = {
      group: groups[activeGroup],
      rule_uid: uuid,
      logical_order: selectedCalculationRules.length + 1,
    };

    selectedCalculationRules.push(copyRule);
    rules.push(copyRule);
    rule_group_mapping.push(copyRuleMapping);

    // Create updated single RBM object
    const newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rule_group_mapping: [...rule_group_mapping],
        rules: [...rules],
        entity_type: {
          ...entity_type,
          groups: [...groups],
        },
      },
    };

    onSetUnsavedChanges(true);
    setSelectedCalculationRules([...selectedCalculationRules]);
    setSingleRBM(newSingleRBM);
  };

  /**
   *
   * @param {Array} dependRules
   *
   * @returns {String}
   */
  const getDependRulesErrorText = dependRules => {
    const listOfRulesNotAvail = dependRules.filter(
      ({ isDisable = false }) => isDisable
    );

    const ruleNotAvail = dependRules
      .filter(({ isDisable = false }) => isDisable)
      .map(({ forecast_label = '' }) => forecast_label)
      .join(', ');

    const text = listOfRulesNotAvail.length > 1 ? 'are' : 'is';

    return `${ruleNotAvail} ${text} not applicable`;
  };

  return (
    <>
      {selectedCalculationRules.length > 0 && (
        <Box flexGrow="1">
          <AutoSizer>
            {({ width, height }) => (
              <CustomScrollbars style={{ width, height }}>
                <Box>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="droppable">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {(selectedCalculationRules || []).map(
                            (rule, index) => {
                              const {
                                gl_id = '',
                                gl_id_lookup = '',
                                forecast_label = '',
                                calc_method = '',
                                rule_uid = '',
                                percent_of = [],
                              } = rule || {};

                              const { dependRules = [], isHaveError = false } =
                                calc_method &&
                                calc_method == RULES_TYPES.PERCENT.value
                                  ? getPercentageLabels(
                                      percent_of,
                                      singleRBM,
                                      selectedCalculationRules
                                    )
                                  : [];

                              return (
                                <Draggable
                                  key={index}
                                  draggableId={`${rule_uid}-${index}`}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style
                                      )}
                                    >
                                      <Box id={rule_uid} mx={0.5}>
                                        <ExpansionPanel
                                          className="field-expansion-panel"
                                          key={index}
                                        >
                                          <ExpansionPanelSummary
                                            className="field-expansion-panel-summary"
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel-content"
                                            id="panel-header"
                                          >
                                            <Box
                                              flexDirection="row"
                                              display="flex"
                                              alignItems="center"
                                              width="100%"
                                              justifyContent="space-between"
                                              justify="space-between"
                                              py={1}
                                            >
                                              <Box
                                                ml={-1}
                                                mr={0.5}
                                                display="flex"
                                                {...provided.dragHandleProps}
                                                className="cursor-pointer"
                                              >
                                                <DragIndicatorIcon
                                                  onClick={event =>
                                                    event.stopPropagation()
                                                  }
                                                />
                                              </Box>
                                              <Grid
                                                container
                                                display="flex"
                                                alignItems="center"
                                              >
                                                <Grid item xs={3}>
                                                  <Box
                                                    display="flex"
                                                    flexDirection="row"
                                                    alignItems="center"
                                                  >
                                                    <Typography
                                                      noWrap
                                                      variant="body1"
                                                      title={
                                                        forecast_label || '--'
                                                      }
                                                    >
                                                      {forecast_label || '--'}
                                                    </Typography>

                                                    {isHaveError && (
                                                      <Tooltip
                                                        title={getDependRulesErrorText(
                                                          dependRules
                                                        )}
                                                        placement="bottom"
                                                      >
                                                        <Box
                                                          ml={0.5}
                                                          alignItems="center"
                                                          display="flex"
                                                        >
                                                          <ErrorOutlineIcon color="error" />
                                                        </Box>
                                                      </Tooltip>
                                                    )}
                                                  </Box>
                                                </Grid>

                                                <Grid item xs={3}>
                                                  {(gl_id_lookup || gl_id) && (
                                                    <>
                                                      <Typography
                                                        variant="caption"
                                                        color="primary"
                                                      >
                                                        GL
                                                      </Typography>
                                                      <Typography
                                                        title={
                                                          gl_id_lookup ||
                                                          gl_id ||
                                                          '--'
                                                        }
                                                        noWrap
                                                        variant="body2"
                                                      >
                                                        {gl_id_lookup ||
                                                          gl_id ||
                                                          '--'}
                                                      </Typography>
                                                    </>
                                                  )}
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <Typography
                                                    variant="caption"
                                                    color="primary"
                                                  >
                                                    Type
                                                  </Typography>
                                                  <Typography
                                                    variant="body2"
                                                    noWrap
                                                    title={
                                                      (calc_method &&
                                                        RULES_TYPES[calc_method]
                                                          .label) ||
                                                      '--'
                                                    }
                                                  >
                                                    {(calc_method &&
                                                      RULES_TYPES[calc_method]
                                                        .label) ||
                                                      '--'}
                                                  </Typography>
                                                </Grid>
                                                <Grid
                                                  item
                                                  xs={3}
                                                  style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                  }}
                                                >
                                                  <Tooltip
                                                    title="Edit"
                                                    placement="bottom"
                                                  >
                                                    <IconButton
                                                      onClick={handleEditRule(
                                                        index
                                                      )}
                                                    >
                                                      <EditIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                  <Tooltip
                                                    title="Duplicate"
                                                    placement="bottom"
                                                  >
                                                    <IconButton
                                                      onClick={onClickCopy(
                                                        index
                                                      )}
                                                    >
                                                      <FileCopyOutlinedIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                  <Tooltip
                                                    title="Remove From List"
                                                    placement="bottom"
                                                  >
                                                    <IconButton
                                                      onClick={onClickDelete(
                                                        index
                                                      )}
                                                    >
                                                      <DeleteIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                </Grid>
                                              </Grid>
                                            </Box>
                                          </ExpansionPanelSummary>
                                          <ExpansionPanelDetails className="field-expansion-panel-detail">
                                            <RuleInfo
                                              rule={rule}
                                              mode={RULE_INFO_MODES.secondary}
                                            />
                                          </ExpansionPanelDetails>
                                        </ExpansionPanel>
                                      </Box>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            }
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Box>
              </CustomScrollbars>
            )}
          </AutoSizer>
        </Box>
      )}

      {selectedCalculationRules.length == 0 && (
        <Box
          className="env-msg full-height-container"
          flexDirection="column"
          minHeight="calc(100vh - 235px)"
        >
          <Box
            display="flex"
            flexDirection="column"
            justify="center"
            alignItems="center"
          >
            <Typography variant="h5" gutterBottom color="textSecondary">
              No Calculations Yet!
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              You haven't created any Calculations yet.
            </Typography>
          </Box>
        </Box>
      )}

      {isDeleteConf && (
        <ConfirmationModal
          isOpen
          handleClose={handleDeleteConf}
          actionForCancel={String(actions.allGroup)}
          action={String(deletingGroup)}
          msg={DELETE_CONFIRMATION_MSG.replace(
            '#NAME#',
            selectedCalculationRules[deletingGroup].forecast_label || ''
          ).replace('#this#', groups[activeGroup] || '')}
          noText={DELETE_CONFIRMATION_ALL_GROUPS}
          title={DELETE_CONFIRMATION_TITLE}
          yesText={DELETE_CONFIRMATION_THIS_GROUP}
        />
      )}

      {/* Add New calculation */}
      {isShowAddSingleCalDraw && (
        <AddEditCalculation
          isOpen={isShowAddSingleCalDraw}
          onClose={() => setIsShowAddSingleCalDraw(false)}
          onDone={handleAddEditRule}
          rules={rules}
          selectedRule={selectedCalculationRules[deletingGroup] || null}
          ruleIndex={deletingGroup}
          selectedCalculationRules={selectedCalculationRules}
          setSelectedCalculationRules={setSelectedCalculationRules}
          activeGroup={activeGroup}
          singleRBM={singleRBM}
          isUpdateMapping={isUpdateMapping}
          onSetUnsavedChanges={onSetUnsavedChanges}
        />
      )}
    </>
  );
};

/**
 * propTypes of component
 */
SelectedGroupRules.propTypes = {
  activeGroup: number,
  isUpdateMapping: bool,
  onSetUnsavedChanges: func.isRequired,
  selectedCalculationRules: arrayOf(shape({})),
  setSelectedCalculationRules: func.isRequired,
  setSingleRBM: func.isRequired,
  singleRBM: shape({}),
};

/**
 * defaultProps of component
 */
SelectedGroupRules.defaultProps = {
  isUpdateMapping: true,
  setSelectedCalculationRules: () => {},
  setSingleRBM: () => {},
  onSetUnsavedChanges: () => {},
  singleRBM: {},
};

const mapStateToProps = createStructuredSelector({
  selectedCalculationRules: getSelectedCalculationRules(),
  singleRBM: getSingleRBM(),
  activeGroup: getSelectedCalculationIndex(),
});

export default connect(mapStateToProps, {
  setSingleRBM,
  setSelectedCalculationRules,
})(withStyles(styles)(SelectedGroupRules));
