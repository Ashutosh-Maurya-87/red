import React, { useState, useEffect } from 'react';
import { func, number, shape } from 'prop-types';
import { AutoSizer } from 'react-virtualized';

import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import {
  Typography,
  Box,
  ListItem,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  FileCopyOutlined as FileCopyOutlinedIcon,
  AddCircleOutline as AddCircleOutlineIcon,
} from '@material-ui/icons';

import ConfirmationModal from '../../../../../components/ConfirmationModal';
import CustomScrollbars from '../../../../../components/ScrollBars';

import { showErrorMsg } from '../../../../../utils/notifications';
import {
  ERROR_MESSAGES,
  RULE_BASED_MODELS_MSG,
} from '../../../../../configs/messages';

import AddEditCalculationGroup from './AddEditCalculationGroup';
import { generateGroupName } from './helper';

import {
  setSelectedCalculationRules,
  setCalculationIndex,
  setSingleRBM,
} from '../../../../../reducers/RuleBasedModels/actions';
import {
  getSingleRBM,
  getSelectedCalculationIndex,
} from '../../../../../reducers/RuleBasedModels/selectors';

import '../styles.scss';

const CalculationGroupsListing = ({
  singleRBM,
  setSelectedCalculationRules,
  setCalculationIndex: setActiveTab,
  setSingleRBM,
  onSetUnsavedChanges,
  activeTab,
}) => {
  const [deletingGroup, setDeletingGroup] = useState();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedGroupName, setGroupName] = useState('');
  const [isAddNew, setIsAddNew] = useState(false);
  const [isDeleteConf, setDeleteConf] = useState(false);

  const { configuration = {} } = singleRBM || {};
  const { entity_type = {}, rules = [] } = configuration || {};
  let { rule_group_mapping = [] } = configuration || {};
  const { groups = [] } = entity_type || {};

  /**
   * On Click > Add New Calculation Group
   *
   */
  const onClickAddNew = () => {
    setIsAddNew(true);
  };

  /**
   * On Cancel > Create New Calculation Group
   */
  const handleCloseAddEditGroup = () => {
    setIsAddNew(false);
    setGroupName('');
    setSelectedIndex(null);
  };

  /**
   * On Click Edit
   *
   * @param {Number} index
   */
  const onClickEdit = index => {
    setSelectedIndex(index);
    setGroupName(groups[index]);
    setIsAddNew(true);
  };

  /**
   * On Click Copy
   *
   * @param {Number} index
   */
  const onClickCopy = index => {
    const filterResult = groups.filter(row => row.includes(groups[index]));

    const name = generateGroupName(groups, filterResult.length, groups[index]);
    const copyGroupName = name;

    groups.push(copyGroupName);

    // updated Rule Mappings on copying calculation group
    const groupMapping = [];

    ([...rule_group_mapping] || []).forEach(rule => {
      if (String(rule.group) === String(groups[index])) {
        groupMapping.push({
          ...rule,
          group: copyGroupName,
        });
      }
    });

    const updatedRuleMappings = [...rule_group_mapping, ...groupMapping];

    rule_group_mapping = updatedRuleMappings;

    // Create updated single RBM object
    const newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rule_group_mapping: updatedRuleMappings,
        entity_type: {
          ...entity_type,
          groups: [...groups],
        },
      },
    };

    onSetUnsavedChanges(true);
    setSingleRBM(newSingleRBM);
    changeTab(groups.length - 1);
  };

  /**
   * On Click Delete
   *
   * @param {Number} index
   */
  const onClickDelete = index => {
    setDeleteConf(true);
    setDeletingGroup(index);
  };

  /**
   * Handle Delete Confirmation
   *
   * @param {number} index
   */
  const handleDeleteConf = index => {
    setDeleteConf(false);

    if (typeof index == 'boolean') return;

    const groupName = groups[index] || '';

    const newRuleGroupMapping = rule_group_mapping.filter(
      rule => rule.group != groupName
    );

    const newGroups = [...groups];

    if (index > -1) {
      newGroups.splice(index, 1); // remove current index
    }

    // Create updated single RBM object
    const newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rule_group_mapping: newRuleGroupMapping,
        entity_type: {
          ...entity_type,
          groups: newGroups,
        },
      },
    };

    onSetUnsavedChanges(true);
    setSingleRBM(newSingleRBM);
  };

  /**
   * Handle Add new or Edit Calculation Group
   *
   * @param {String} index
   *
   */
  const onAddEditGroup = ({ name = '', index = null }) => {
    if (!name) return;

    // Identify duplicate group name
    const duplicateName = groups.filter(
      group => group.toLowerCase() == name.toLowerCase()
    );

    if (
      duplicateName.length > 0 &&
      selectedGroupName.toLowerCase() != name.toLowerCase()
    ) {
      showErrorMsg(ERROR_MESSAGES.group_already_exist.replace('#NAME#', name));
      return;
    }

    let newRuleGroupMapping = [];

    // Add new group
    if (index == null) {
      groups.push(name);
      changeTab(groups.length - 1);
    }

    // Edit existing group
    if (index != null) {
      groups[index] = name;

      newRuleGroupMapping = rule_group_mapping.map(rule => {
        if (String(rule.group) === String(selectedGroupName)) {
          rule.group = name;
        }

        return rule;
      });
    }

    // Create updated single RBM object
    const newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rule_group_mapping:
          index != null ? newRuleGroupMapping : [...rule_group_mapping],
        entity_type: {
          ...entity_type,
          groups: [...groups],
        },
      },
    };

    onSetUnsavedChanges(true);
    setIsAddNew(false);
    setSelectedIndex(null);
    setGroupName('');

    setSingleRBM(newSingleRBM);
  };

  /**
   * Filter selected group rules and set in store
   *
   * @param {Number} index
   */
  const setSelectedGroupRules = index => {
    const groupMapping = rule_group_mapping.filter(
      ({ group }) => String(group) === String(groups[index])
    );

    const newRules = [];
    groupMapping.forEach(map => {
      rules.forEach(rule => {
        if (String(rule.rule_uid) === String(map.rule_uid)) {
          newRules.push(rule);
        }
      });
    });

    setSelectedCalculationRules([...newRules]);
  };

  /**
   * Change calculation group
   *
   * @param {Number} index
   */
  const changeTab = index => {
    setActiveTab(index);
    setSelectedGroupRules(index);
  };

  /**
   * Component will mount
   */
  useEffect(() => {
    setActiveTab(0);
    setSelectedGroupRules(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Box
        px={1}
        pt={2}
        pb={1}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="body2" color="textSecondary" className="uppercase">
          Calculation Groups
        </Typography>
        <Tooltip title="Add Group" placement="bottom">
          <IconButton size="small" onClick={onClickAddNew}>
            <AddCircleOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {groups.length == 0 && (
        <Box pl={1}>
          <Typography variant="caption" noWrap>
            No Calculation Group found
          </Typography>
        </Box>
      )}
      <Box flexGrow="1">
        <AutoSizer>
          {({ width, height }) => (
            <CustomScrollbars style={{ width, height }}>
              {(groups || []).map((label, index) => (
                <Box
                  key={index}
                  position="relative"
                  className="calculation-group-list"
                >
                  <ListItem
                    className={`sidebar-menu cursor-pointer ${
                      index == activeTab ? 'selected' : ''
                    }`}
                    onClick={() => changeTab(index)}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                    >
                      <Typography variant="body2" noWrap title={label}>
                        {label}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Box
                    ml={1}
                    display="flex"
                    alignItems="center"
                    position="absolute"
                    right="10px"
                    top="0"
                    bottom="0"
                    className="delete-icon cursor-pointer"
                  >
                    <Tooltip title="Edit" placement="bottom">
                      <EditIcon
                        fontSize="small"
                        onClick={() => onClickEdit(index)}
                      />
                    </Tooltip>
                    &nbsp;&nbsp;
                    <Tooltip title="Duplicate" placement="bottom">
                      <FileCopyOutlinedIcon
                        fontSize="small"
                        onClick={event => onClickCopy(index)}
                      />
                    </Tooltip>
                    &nbsp;&nbsp;
                    <Tooltip title="Delete" placement="bottom">
                      <DeleteOutlineIcon
                        fontSize="small"
                        onClick={() => onClickDelete(index)}
                      />
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </CustomScrollbars>
          )}
        </AutoSizer>
      </Box>

      {isAddNew && (
        <AddEditCalculationGroup
          isOpen
          handleClose={handleCloseAddEditGroup}
          handleDone={onAddEditGroup}
          selectedIndex={selectedIndex}
          selectedGroupName={selectedGroupName}
        />
      )}

      {isDeleteConf && (
        <ConfirmationModal
          isOpen
          handleClose={handleDeleteConf}
          action={String(deletingGroup)}
          msg={RULE_BASED_MODELS_MSG.rbm_rule_group_delete.replace(
            '#NAME#',
            groups[deletingGroup] || ''
          )}
        />
      )}
    </>
  );
};

/**
 * propTypes of component
 */
CalculationGroupsListing.propTypes = {
  activeTab: number,
  onSetUnsavedChanges: func.isRequired,
  setCalculationIndex: func.isRequired,
  setSelectedCalculationRules: func.isRequired,
  setSingleRBM: func.isRequired,
  singleRBM: shape({}),
};

/**
 * defaultProps of component
 */
CalculationGroupsListing.defaultProps = {
  setCalculationIndex: () => {},
  setSelectedCalculationRules: () => {},
  onSetUnsavedChanges: () => {},
  setSingleRBM: () => {},
  singleRBM: {},
  activeTab: null,
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
  activeTab: getSelectedCalculationIndex(),
});

export default connect(mapStateToProps, {
  setSelectedCalculationRules,
  setCalculationIndex,
  setSingleRBM,
})(withRouter(CalculationGroupsListing));
