import React from 'react';
import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf, bool } from 'prop-types';
import moment from 'moment';

import {
  Menu,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

import { MODELS_API } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import { MODELS_MSG } from '../../../../configs/messages';

import {
  getFormattedDates,
  getRunStatusDetails,
  MODEL_RUN_STATUS,
} from '../helper';
import { httpPost, httpDelete, httpGet } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';

import RenameModelDialog from '../../RenameModelDialog';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

export const MODEL_ACTIONS = {
  view: 'Open',
  run: 'Run',
  duplicate: 'Make a Copy',
  rename: 'Rename',
  export: 'Export',
  delete: 'Delete',
  // archive: 'Archive',
  // restore: 'Restore',
};

const ACTIONS = Object.values(MODEL_ACTIONS);

function ModelsListActions({
  model,
  history,
  list,
  setList,
  children,
  isArchived,
  onActionCompleted,
}) {
  const [isRenameModal, toggleIsRenameModal] = React.useState(false);
  const [showLoader, toggleLoader] = React.useState(false);
  const [menuElement, setMenumenuElement] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(false);
  const [confirmMsg, setConfirmMsg] = React.useState(false);

  const { id, name } = model;

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
   * @return {Booelean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case MODEL_ACTIONS.view:
      case MODEL_ACTIONS.rename:
      case MODEL_ACTIONS.delete:
      case MODEL_ACTIONS.duplicate:
      case MODEL_ACTIONS.export:
        return false;

      case MODEL_ACTIONS.run:
        return model.run_status == MODEL_RUN_STATUS.inProcess;

      case MODEL_ACTIONS.archive:
      case MODEL_ACTIONS.restore:
        return true;

      default:
        return false;
    }
  };

  /**
   * Verify > Is Action Allowed
   *
   * @param {String} action
   *
   * @return {Booelean}
   */
  const isActionAllowed = action => {
    switch (action) {
      case MODEL_ACTIONS.view:
      case MODEL_ACTIONS.rename:
      case MODEL_ACTIONS.run:
      case MODEL_ACTIONS.export:
      case MODEL_ACTIONS.duplicate:
      case MODEL_ACTIONS.delete:
        return !isArchived;

      case MODEL_ACTIONS.archive:
      case MODEL_ACTIONS.restore:
        return isArchived;

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
      case MODEL_ACTIONS.view:
        logAmplitudeEvent('Open model');
        route = APP_ROUTES.MODELS_WORKBOOK.replace(':id', id);
        history.push(route);
        break;

      case MODEL_ACTIONS.rename:
        logAmplitudeEvent('Rename model');
        toggleIsRenameModal(true);
        break;

      case MODEL_ACTIONS.run:
        logAmplitudeEvent('Run model');
        runWorkbook();
        break;

      case MODEL_ACTIONS.export:
        logAmplitudeEvent('Export model');
        exportModel();
        break;

      case MODEL_ACTIONS.duplicate:
        logAmplitudeEvent('Copy model');
        route = APP_ROUTES.DUPLICATE_MODEL.replace(':id', id);
        history.push(route);
        break;

      case MODEL_ACTIONS.archive:
        logAmplitudeEvent('Archive model');
        setConfirmAction('ARCHIVE');
        setConfirmMsg(`Are you sure to archive "${name}" model?`);
        break;

      case MODEL_ACTIONS.delete:
        logAmplitudeEvent('Delete model');
        setConfirmAction('DELETE');
        setConfirmMsg(`Are you sure to delete "${name}" model?`);
        break;

      case MODEL_ACTIONS.restore:
        logAmplitudeEvent('Restore model');
        setConfirmAction('RESTORE');
        setConfirmMsg(`Are you sure to restore "${name}" model?`);
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
        deleteModel({ isArchive: true });
        break;

      case 'DELETE':
        deleteModel({ isDelete: true });
        break;

      case 'RESTORE':
        deleteModel({ isRestore: true });
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   * Archive | Delete | Restore Model
   */
  const deleteModel = async ({ isArchive, isRestore, isDelete } = {}) => {
    try {
      let url = '';
      if (isArchive) url = MODELS_API.ARCHIVE_WORKBOOK;
      if (isRestore) url = MODELS_API.RESTORE_WORKBOOK;
      if (isDelete) url = MODELS_API.DELETE_WORKBOOK;

      if (!url) return;

      toggleLoader(true);

      url = url.replace('#ID#', id);

      if (isArchive || isRestore) {
        await httpPost(url);
      } else if (isDelete) {
        await httpDelete(url);
      }

      toggleLoader(false);
      onActionCompleted(MODEL_ACTIONS.delete);

      const newList = list.filter(({ id: mId }) => mId != id);
      setList(newList);

      let msg = '';
      if (isArchive) msg = MODELS_MSG.model_archived;
      if (isRestore) msg = MODELS_MSG.model_restored;
      if (isDelete) msg = MODELS_MSG.model_deleted;

      showSuccessMsg(msg);
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

      const url = MODELS_API.RENAME_WORKBOOK.replace('#ID#', id);

      const formData = new FormData();
      formData.append('name', newName);

      await httpPost(url, formData);

      const newList = list.map(item => {
        if (id == item.id) {
          return {
            ...item,
            name: newName,
          };
        }

        return item;
      });

      toggleLoader(false);
      toggleIsRenameModal(false);
      setList(newList);

      showSuccessMsg(MODELS_MSG.model_renamed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Run Workbook
   */
  const runWorkbook = async () => {
    const updateStatus = () => {
      model.run_status = MODEL_RUN_STATUS.inProcess;
      model.last_run_at = moment().utc().format('YYYY-MM-DD HH:mm:ss');

      const updatedModel = {
        ...model,
        ...getRunStatusDetails(model),
        ...getFormattedDates(model),
      };

      const newList = list.map(item => {
        if (id == item.id) return updatedModel;

        return item;
      });

      setList(newList);
      toggleLoader(false);
    };

    try {
      toggleLoader(true);

      const url = MODELS_API.RUN_WORKBOOK.replace('#ID#', id);

      await httpPost(url, {});

      updateStatus();
    } catch (err) {
      console.error(err);
      toggleLoader(false);
    }
  };

  /**
   * Export Model
   */
  const exportModel = async () => {
    try {
      if (showLoader) return;

      toggleLoader(true);

      const url = MODELS_API.EXPORT_WORKBOOK.replace('#ID#', model.id);

      const { data } = await httpGet(url);

      programmaticallyLoadByUrl(data.url, { target: '_blank' });

      toggleLoader(false);
    } catch (e) {
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
        id="model-actions-menu"
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
        <RenameModelDialog
          isOpen
          showLoader={showLoader}
          name={name || ''}
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

ModelsListActions.propTypes = {
  children: func,
  isArchived: bool.isRequired,
  list: arrayOf(shape({})).isRequired,
  model: shape({}).isRequired,
  onActionCompleted: func.isRequired,
  setList: func.isRequired,
};

ModelsListActions.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(ModelsListActions);
