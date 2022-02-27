import React from 'react';
import { cloneDeep } from 'lodash';

import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf, bool } from 'prop-types';

import {
  Menu,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Box,
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

import { API_URLS } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import { SCENARIOS_MSG } from '../../../../configs/messages';
import { PRE_DEFINED_LABELS } from '../../../../configs/app';

import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';
import { httpPost, httpDelete } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';

import RenameScenarioModal from '../../RenameScenarioModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import LabelManagerModal from '../../LabelManagerModal';

import { SCENARIO_ACTIONS, EXPORT_OPTIONS_ARRAY } from '../configs';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

const ACTIONS = Object.values(SCENARIO_ACTIONS);

function ScenarioListActions({
  scenario,
  history,
  list,
  setList,
  children,
  isArchived,
  onActionCompleted,
}) {
  const [isRenameModal, toggleIsRenameModal] = React.useState(false);
  const [isAssignLabelModal, toggleIsAssignLabelModal] = React.useState(false);
  const [showLoader, toggleLoader] = React.useState(false);
  const [menuElement, setMenumenuElement] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(false);
  const [exportOptions, setExportOptions] = React.useState([]);
  const [confirmMsg, setConfirmMsg] = React.useState(false);

  const {
    scenario_meta: { dataset_name: name = '' } = {},
    label,
    id,
  } = scenario;

  /**
   * Toggle Menu
   *
   * @param {Event}
   */
  const toggleMenu = ({ currentTarget }) => {
    setMenumenuElement(currentTarget);
  };

  /**
   * Handle > Close Menu
   */
  const handleCloseMenu = () => {
    setMenumenuElement(null);
  };

  /**
   * Verify > Is Action Disabled
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionDisabled = action => {
    if (
      scenario.label == PRE_DEFINED_LABELS.actuals.label &&
      (action == SCENARIO_ACTIONS.assignLabel ||
        action == SCENARIO_ACTIONS.relation ||
        action == SCENARIO_ACTIONS.archive ||
        action == SCENARIO_ACTIONS.delete)
    ) {
      return true;
    }

    return false;
  };

  /**
   * Verify > Is Action Allowed
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionAllowed = action => {
    switch (action) {
      case SCENARIO_ACTIONS.view:
      case SCENARIO_ACTIONS.rename:
      case SCENARIO_ACTIONS.assignLabel:
      case SCENARIO_ACTIONS.archive:
      case SCENARIO_ACTIONS.configuration:
      case SCENARIO_ACTIONS.relation:
      case SCENARIO_ACTIONS.export:
        return !isArchived;

      case SCENARIO_ACTIONS.restore:
        return isArchived;

      case SCENARIO_ACTIONS.delete:
        return true;

      default:
        return false;
    }
  };

  /**
   * Handle Clicked Menu Action
   *
   * @param {String} action
   */
  const handleAction = action => () => {
    handleCloseMenu();

    let route = '';

    switch (action) {
      case SCENARIO_ACTIONS.view:
        logAmplitudeEvent('Open scenario');
        route = APP_ROUTES.VIEW_SCENARIO.replace(':id', scenario.id);
        history.push(route);
        break;

      case SCENARIO_ACTIONS.configuration:
        logAmplitudeEvent('Configure scenario');
        route = APP_ROUTES.VIEW_SCENARIO.replace(':id', scenario.id);
        history.push({ pathname: route, search: '?tab=1' });
        break;

      case SCENARIO_ACTIONS.relation:
        logAmplitudeEvent('Go to scenario relationships');
        route = APP_ROUTES.VIEW_SCENARIO.replace(':id', scenario.id);
        history.push({ pathname: route, search: '?tab=2' });
        break;

      case SCENARIO_ACTIONS.assignLabel:
        logAmplitudeEvent('Label scenario');
        toggleIsAssignLabelModal(true);
        break;

      case SCENARIO_ACTIONS.rename:
        logAmplitudeEvent('Rename scenario');
        toggleIsRenameModal(true);
        break;

      case SCENARIO_ACTIONS.archive:
        logAmplitudeEvent('Archive scenario');
        setConfirmAction('ARCHIVE');
        setConfirmMsg(`Are you sure to archive "${name}" scenario?`);
        break;

      case SCENARIO_ACTIONS.delete:
        logAmplitudeEvent('Delete scenario');
        setConfirmAction('DELETE');
        setConfirmMsg(`Are you sure to delete "${name}" scenario?`);
        break;

      case SCENARIO_ACTIONS.restore:
        logAmplitudeEvent('Restore scenario');
        setConfirmAction('RESTORE');
        setConfirmMsg(`Are you sure to restore "${name}" scenario?`);
        break;

      case SCENARIO_ACTIONS.export:
        logAmplitudeEvent('Export scenario');
        setExportOptions(cloneDeep(EXPORT_OPTIONS_ARRAY));
        setConfirmAction('EXPORT');
        break;

      default:
        break;
    }
  };

  /**
   * Handle Response of Confirmation Modal
   *
   * @param {String|Boolean} res
   */
  const handleCloseConfModal = res => {
    switch (res) {
      case 'ARCHIVE':
        deleteScenario({ isArchive: true });
        break;

      case 'DELETE':
        deleteScenario({ isDelete: true });
        break;

      case 'RESTORE':
        deleteScenario({ isRestore: true });
        break;

      case 'EXPORT':
        exportScenario();
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
    setExportOptions([]);
  };

  /**
   * Archive | Delete | Restore  Selected Scenario
   */
  const deleteScenario = async ({
    isArchive,
    isRestore,
    isDelete,
    isExport,
  } = {}) => {
    try {
      let url = '';
      if (isArchive) url = API_URLS.ARCHIVE_SCENARIO;
      if (isRestore) url = API_URLS.RESTORE_SCENARIO;
      if (isDelete) url = API_URLS.DELETE_SCENARIO;

      if (!url) return;

      toggleLoader(true);

      url = url.replace('#ID#', scenario.id);

      if (isArchive || isRestore) {
        await httpPost(url);
      } else if (isDelete) {
        await httpDelete(url);
      }

      toggleLoader(false);
      onActionCompleted(SCENARIO_ACTIONS.delete);

      const newList = list.filter(({ id }) => id != scenario.id);
      setList(newList);

      let msg = '';
      if (isArchive) msg = SCENARIOS_MSG.scenario_archived;
      if (isRestore) msg = SCENARIOS_MSG.scenario_restored;
      if (isDelete) msg = SCENARIOS_MSG.scenario_deleted;

      showSuccessMsg(msg);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * export Scenario
   */
  const exportScenario = async () => {
    try {
      const url = API_URLS.EXPORT_SCENARIO.replace('#ID#', scenario.id);

      toggleLoader(true);

      const params = {
        include: [],
      };

      exportOptions.forEach(({ isSelected = '', value }) => {
        if (isSelected) params.include.push(value);
      });

      const { data: { file = '' } = {} } = await httpPost(url, params);

      programmaticallyLoadByUrl(file, {
        target: '_blank',
        name: `${scenario.name}.xlsx`,
      });

      toggleLoader(false);
      showSuccessMsg(SCENARIOS_MSG.scenario_exported);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle > Update Scenario Name
   *
   * @param {String} newName
   */
  const handleUpdateName = async newName => {
    try {
      if (name == newName) {
        toggleIsRenameModal(false);
        return;
      }

      if (showLoader) return;

      toggleLoader(true);

      const url = API_URLS.RENAME_SCENARIO.replace('#ID#', scenario.id);

      const formData = new FormData();
      formData.append('new_name', newName);

      await httpPost(url, formData);

      const newList = list.map(item => {
        if (scenario.id == item.id) {
          return {
            ...item,
            scenario_meta: {
              ...(item.scenario_meta || {}),
              dataset_name: newName,
            },
          };
        }

        return item;
      });

      toggleLoader(false);
      toggleIsRenameModal(false);
      setList(newList);

      showSuccessMsg(SCENARIOS_MSG.scenario_renmaed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Update label in scenario listing
   */
  const handleLabelSelection = scenario => {
    const { label, id } = scenario || {};

    let newList = [...list];

    newList = newList.map(item => {
      if (item.id != id && item.label == label) {
        item.label = null;
      }
      if (item.id === id) {
        item.label = label;
      }

      return item;
    });

    setList(newList);
  };

  /**
   * Rename label in scenario listing
   */
  const handleLabelRename = (oldLabel, newLabel) => {
    let newList = [...list];

    newList = newList.map(item => {
      if (item.label === oldLabel) {
        item.label = newLabel;
      }
      return item;
    });

    setList(newList);
  };

  /**
   * Hnadle Click Event > Export options
   */
  const handleExportOptionsClick = index => event => {
    const options = [...exportOptions];
    options[index].isSelected = event.target.checked;

    setExportOptions([...options]);
  };

  const isScenarioDisabled = optionLabel => {
    const { label = '' } = scenario || {};

    // Disable actual option in case of actual scenario
    if (
      label == PRE_DEFINED_LABELS.actuals.label &&
      optionLabel == PRE_DEFINED_LABELS.actuals.label
    )
      return true;

    return false;
  };

  return (
    <>
      {children && children(handleAction)}

      <IconButton aria-label="settings" size="small" onClick={toggleMenu}>
        {showLoader ? <CircularProgress size={24} /> : <MoreVertIcon />}
      </IconButton>

      <Menu
        id="scenario-actions-menu"
        anchorEl={menuElement}
        keepMounted
        open={Boolean(menuElement)}
        onClose={handleCloseMenu}
      >
        {ACTIONS.map(action => {
          if (!isActionAllowed(action)) return null;

          return (
            <MenuItem
              key={action}
              onClick={handleAction(action)}
              disabled={isActionDisabled(action)}
            >
              <Typography variant="body2">{action}</Typography>
            </MenuItem>
          );
        })}
      </Menu>

      {isRenameModal && (
        <RenameScenarioModal
          isOpen
          showLoader={showLoader}
          name={name || ''}
          handleClose={() => toggleIsRenameModal(false)}
          handleUpdatedName={handleUpdateName}
        />
      )}

      {confirmAction && confirmAction != 'EXPORT' && (
        <ConfirmationModal
          handleClose={handleCloseConfModal}
          isOpen
          action={confirmAction}
          msg={confirmMsg}
        />
      )}

      {confirmAction && confirmAction == 'EXPORT' && (
        <ConfirmationModal
          maxWidth="sm"
          handleClose={handleCloseConfModal}
          isOpen
          action={confirmAction}
          title="Export Scenario"
          yesText="Export"
          noText="Cancel"
          msg=""
        >
          <Box
            px={2}
            py={1}
            my={-4}
            display="flex"
            flexDirection="column"
            border={1}
            borderColor="secondary.stepBorderColor"
            borderRadius={5}
          >
            {exportOptions.map((option, index) => {
              const { isSelected = false, label = '' } = option || {};
              return (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={isSelected}
                      disabled={isScenarioDisabled(label)}
                      onChange={handleExportOptionsClick(index)}
                      color="primary"
                    />
                  }
                  label={label}
                />
              );
            })}
          </Box>
        </ConfirmationModal>
      )}

      {isAssignLabelModal && (
        <LabelManagerModal
          isOpen={isAssignLabelModal}
          selectedLabel={label}
          scenarioId={id}
          handleClose={() => toggleIsAssignLabelModal(false)}
          onLabelSelected={handleLabelSelection}
          onLabelRenamed={handleLabelRename}
        />
      )}
    </>
  );
}

ScenarioListActions.propTypes = {
  children: func,
  isArchived: bool.isRequired,
  list: arrayOf(shape({})).isRequired,
  onActionCompleted: func.isRequired,
  scenario: shape({}).isRequired,
  setList: func.isRequired,
};

ScenarioListActions.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(ScenarioListActions);
