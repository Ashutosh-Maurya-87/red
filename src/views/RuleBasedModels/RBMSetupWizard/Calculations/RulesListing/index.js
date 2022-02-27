import React, { useState } from 'react';
import { arrayOf, bool, func, number, shape } from 'prop-types';

import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Drawer,
  withStyles,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons';

import ConfirmationModal from '../../../../../components/ConfirmationModal';

import { RULE_BASED_MODELS_MSG } from '../../../../../configs/messages';
import { RULE_INFO_MODES } from '../../../configs';

import RuleInfo from '../RuleInfo';
import AddEditCalculation from '../AddEditCalculation';
import { addEditRule, deleteRuleFromAllGroups } from '../helper';

import {
  getSingleRBM,
  getSelectedCalculationIndex,
  getSelectedCalculationRules,
} from '../../../../../reducers/RuleBasedModels/selectors';

import {
  setSelectedCalculationRules,
  setSingleRBM,
} from '../../../../../reducers/RuleBasedModels/actions';

import { styles } from './styles';

const RulesListing = ({
  isOpen,
  onClose,
  onDone,
  classes,
  singleRBM,
  activeTab,
  onSetUnsavedChanges,
  setSelectedCalculationRules,
  selectedCalculationRules,
  setSingleRBM,
}) => {
  const [isShowAddSingleCalDraw, setIsShowAddSingleCalDraw] = useState(false);
  const [isDeleteConf, setDeleteConf] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState();

  const { configuration = {} } = singleRBM || {};

  /**
   * Generate rules array with pre-selection
   * @returns {Array}
   */
  const getDefaultStateOfRules = () => {
    const { rules = [] } = configuration || {};
    let allRules = [...rules];

    allRules = allRules.map(rule => {
      const { rule_uid: allRuleUid = '' } = rule || {};
      const selectedRule = selectedCalculationRules.findIndex(
        ({ rule_uid }) => rule_uid == allRuleUid
      );

      return {
        ...rule,
        isSelected: selectedRule > -1,
      };
    });

    return [...allRules];
  };

  const [rules, setRules] = useState(getDefaultStateOfRules());

  /**
   * Handle on change > Event
   *
   * @param {Number} index
   * @param {object} Event
   * @param {boolean} checked
   */
  const handleSelection = index => (evt, checked) => {
    const copyOfRules = [...rules];
    copyOfRules[index].isSelected = checked;

    setRules(copyOfRules);
  };

  const handleDone = () => {
    const copyOfRules = [...rules];

    const newRules = [];

    copyOfRules.forEach(rule => {
      if (rule.isSelected) {
        delete rule.isSelected;
        newRules.push(rule);
      }
    });

    onClose();
    onDone(newRules);
  };

  /**
   * Closing Calculation Rules screen
   */
  const onCloseRules = () => {
    onClose();
  };

  /**
   * on delete rule
   *
   * @param {Number} res
   */
  const handleDeleteConf = res => {
    setDeleteConf(false);

    if (res == null) return;

    const { rule_uid: ruleUid = '' } = rules[res] || [];

    // handle callback
    const handleCallBack = () => {
      // set selected group rule listing
      const copyOfSelectedCalculationRules = selectedCalculationRules.filter(
        rule => rule.rule_uid != ruleUid
      );

      setSelectedCalculationRules([...copyOfSelectedCalculationRules]);

      // set rules listing
      const copyOfRules = [...rules];
      copyOfRules.splice(res, 1);

      setRules(copyOfRules);
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
   * on click > Delete confirmation
   *
   * @param {Number} index
   * @param {object} Event
   */
  const handleRuleDel = index => evt => {
    evt.stopPropagation();

    setDeleteConf(true);
    setDeletingGroup(index);
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

    const { newSingleRBM, copyOfRules, copyOfSelectedCalculationRules } =
      result || {};

    if (isEditMode) {
      setSelectedCalculationRules([...copyOfSelectedCalculationRules]);
    }

    onSetUnsavedChanges(true);
    setSingleRBM(newSingleRBM);
    setRules([...copyOfRules]);
  };

  return (
    <Drawer
      anchor="right"
      disableBackdropClick
      className={classes.drawer}
      classes={{
        paper: classes.drawerPaper,
      }}
      open={isOpen}
      onClose={onClose}
    >
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" component="h5">
            Calculations
          </Typography>
        </Box>
        {rules.map((rule, index) => {
          const { forecast_label = '', isSelected = false } = rule || {};

          return (
            <ExpansionPanel
              className="field-expansion-panel calculation-panel"
              key={index}
            >
              <ExpansionPanelSummary
                className="field-expansion-panel-summary"
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel-content"
                id="panel-header"
              >
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                >
                  <FormControlLabel
                    onClick={event => event.stopPropagation()}
                    onFocus={event => event.stopPropagation()}
                    onChange={handleSelection(index)}
                    control={
                      <Checkbox
                        name="Salary"
                        color="primary"
                        checked={isSelected}
                      />
                    }
                    label={forecast_label}
                  />
                  <Box>
                    <Tooltip title="Edit" placement="bottom">
                      <IconButton onClick={handleEditRule(index)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" placement="bottom">
                      <IconButton onClick={handleRuleDel(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails className="field-expansion-panel-detail">
                <RuleInfo rule={rule} mode={RULE_INFO_MODES.primary} />
              </ExpansionPanelDetails>
            </ExpansionPanel>
          );
        })}

        {/* Add New calculation */}
        {isShowAddSingleCalDraw && (
          <AddEditCalculation
            isOpen={isShowAddSingleCalDraw}
            onClose={() => setIsShowAddSingleCalDraw(false)}
            onDone={handleAddEditRule}
            rules={rules}
            selectedRule={rules[deletingGroup] || null}
            ruleIndex={deletingGroup}
            selectedCalculationRules={rules}
            setSelectedCalculationRules={setRules}
            activeGroup={activeTab}
            singleRBM={singleRBM}
            onSetUnsavedChanges={onSetUnsavedChanges}
          />
        )}

        {isDeleteConf && (
          <ConfirmationModal
            isOpen
            handleClose={handleDeleteConf}
            action={String(deletingGroup)}
            msg={RULE_BASED_MODELS_MSG.rbm_rule_delete.replace(
              '#NAME#',
              rules[deletingGroup].forecast_label || ''
            )}
          />
        )}
        <Box
          mb={2}
          display="flex"
          flexDirection="column"
          position="sticky"
          bottom="60px"
          zIndex="1"
        >
          <Button
            variant="contained"
            size="large"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => {
              setIsShowAddSingleCalDraw(true);
              setDeletingGroup(null);
            }}
          >
            Add New Calculation
          </Button>
        </Box>
      </Box>

      <Box
        display="flex"
        position="sticky"
        pb={3}
        pt={4}
        bgcolor="inherit"
        bottom="-20px"
      >
        <Box mr={1}>
          <Button color="primary" onClick={onCloseRules}>
            Cancel
          </Button>
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleDone}
        >
          Add to Group
        </Button>
      </Box>
    </Drawer>
  );
};

/**
 * propTypes of component
 */
RulesListing.propTypes = {
  activeTab: number,
  isOpen: bool.isRequired,
  onClose: func.isRequired,
  onDone: func.isRequired,
  onSetUnsavedChanges: func.isRequired,
  selectedCalculationRules: arrayOf(shape({})),
  setSelectedCalculationRules: func.isRequired,
  setSingleRBM: func.isRequired,
  singleRBM: shape({}),
};

/**
 * defaultProps of component
 */
RulesListing.defaultProps = {
  isOpen: false,
  onClose: () => {},
  onDone: () => {},
  singleRBM: {},
  selectedCalculationRules: [],
  setSingleRBM: () => {},
  setSelectedCalculationRules: () => {},
  onSetUnsavedChanges: () => {},
  activeTab: null,
};

const mapStateToProps = createStructuredSelector({
  activeTab: getSelectedCalculationIndex(),
  singleRBM: getSingleRBM(),
  selectedCalculationRules: getSelectedCalculationRules(),
});

export default connect(mapStateToProps, {
  setSelectedCalculationRules,
  setSingleRBM,
})(withStyles(styles)(RulesListing));
