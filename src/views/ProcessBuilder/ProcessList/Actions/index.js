import React from 'react';
import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf } from 'prop-types';

import {
  Menu,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

import {
  PROCESS_STATUS,
  PROCESS_EXECUTION_TYPES,
} from '../../CreateProcess/configs';
import { PROCESS_ACTIONS } from '../configs';
import { PROCESS_MANAGER_MSG } from '../../../../configs/messages';
import { APP_ROUTES } from '../../../../configs/routes';
import { API_URLS } from '../../../../configs/api';
import { httpPost, httpDelete } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import { isExecutionMode } from '../../CreateProcess/helper';

import RenameProcessModal from '../../RenameProcessModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function ProcessListActions({
  process,
  history,
  list,
  setList,
  children,
  onActionCompleted,
}) {
  const [isRenameModal, toggleIsRenameModal] = React.useState(false);
  const [showLoader, toggleLoader] = React.useState(false);
  const [menuElement, setMenumenuElement] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(false);
  const [confirmMsg, setConfirmMsg] = React.useState(false);

  const toggleMenu = ({ currentTarget }) => {
    setMenumenuElement(currentTarget);
  };

  const handleCloseMenu = () => {
    setMenumenuElement(null);
  };

  /**
   * Verify > Is Action Disabled
   *
   * @param {String} action
   *
   * @return {Booelean}
   */
  const isActionDisabled = action => {
    const [viewProcess, renameProcess, runProcess] = PROCESS_ACTIONS;

    switch (action) {
      case runProcess:
        return isExecutionMode(process.status);

      case viewProcess:
      case renameProcess:
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

    const [
      viewProcess,
      renameProcess,
      runProcess,
      deleteProcess,
    ] = PROCESS_ACTIONS;

    switch (action) {
      case viewProcess:
        logAmplitudeEvent('View existing process');
        const route = APP_ROUTES.EDIT_PROCESS.replace(':id', process.id);
        history.push(route);
        break;

      case renameProcess:
        logAmplitudeEvent('Rename existing process');
        toggleIsRenameModal(true);
        break;

      case runProcess:
        logAmplitudeEvent('Run existing process');
        handleRunProcess();
        break;

      case deleteProcess:
        logAmplitudeEvent('Delete existing process');
        setConfirmAction('DELETE');
        setConfirmMsg(`Are you sure to delete "${process.name}" process?`);
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
      case 'DELETE':
        deleteProcess();
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   * Delete Selected Process
   */
  const deleteProcess = async () => {
    try {
      toggleLoader(true);

      const url = API_URLS.DELETE_PROCESS.replace('#ID#', process.id);
      await httpDelete(url);

      toggleLoader(false);
      onActionCompleted(PROCESS_ACTIONS[3]);

      const newList = list.filter(({ id }) => id != process.id);
      setList(newList);

      showSuccessMsg(PROCESS_MANAGER_MSG.process_deleted);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle > Update Process Name
   *
   * @param {String} name
   */
  const handleUpdateName = async name => {
    try {
      if (process.name == name) {
        toggleIsRenameModal(false);
        return;
      }

      if (showLoader) return;

      toggleLoader(true);

      const url = API_URLS.RENAME_PROCESS.replace('#ID#', process.id);
      await httpPost(url, { name });

      const newList = list.map(item => {
        if (process.id == item.id) return { ...item, name };

        return item;
      });

      toggleLoader(false);
      toggleIsRenameModal(false);
      setList(newList);

      showSuccessMsg(PROCESS_MANAGER_MSG.process_renamed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Run Selected Process
   */
  const handleRunProcess = async () => {
    try {
      if (showLoader) return;

      toggleLoader(true);

      const url = API_URLS.RUN_PROCESS_BY_ID.replace('#ID#', process.id);

      const tasks = (process.process_tasks || []).map(
        ({ id: taskId }) => taskId
      );

      const params = {
        execution_type: PROCESS_EXECUTION_TYPES.all,
        is_selective: false,
        tasks,
      };

      await httpPost(url, params);

      process.status = PROCESS_STATUS.QUEUED;
      showSuccessMsg(PROCESS_MANAGER_MSG.process_added_in_queue);

      toggleLoader(false);
    } catch (e) {
      console.error(e);
      toggleLoader(false);
    }
  };

  return (
    <>
      {children && children(handleAction)}

      <IconButton aria-label="settings" size="small" onClick={toggleMenu}>
        {showLoader ? <CircularProgress size={24} /> : <MoreVertIcon />}
      </IconButton>

      <Menu
        id="process-actions-menu"
        anchorEl={menuElement}
        keepMounted
        open={Boolean(menuElement)}
        onClose={handleCloseMenu}
      >
        {PROCESS_ACTIONS.map(action => (
          <MenuItem
            key={action}
            onClick={handleAction(action)}
            disabled={isActionDisabled(action)}
          >
            <Typography variant="body2">{action}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {isRenameModal && (
        <RenameProcessModal
          isOpen
          showLoader={showLoader}
          processName={process.name || ''}
          handleClose={() => toggleIsRenameModal(false)}
          handleUpdatedName={handleUpdateName}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          handleClose={handleCloseConfModal}
          isOpen
          action={confirmAction}
          msg={confirmMsg}
        />
      )}
    </>
  );
}

ProcessListActions.propTypes = {
  children: func,
  list: arrayOf(shape({})).isRequired,
  onActionCompleted: func.isRequired,
  process: shape({}).isRequired,
  setList: func.isRequired,
};

ProcessListActions.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(ProcessListActions);
