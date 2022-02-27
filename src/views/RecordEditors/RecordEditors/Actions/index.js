import React from 'react';
import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf, bool, number } from 'prop-types';

import {
  Menu,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

import { API_URLS } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import { RECORD_EDITOR_MSG } from '../../../../configs/messages';

import { httpPost, httpDelete } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import { getSrcDetails } from '../helper';

import RenameRecordEditorModal from '../../RenameRecordEditorModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

export const RECORD_EDITOR_ACTIONS = {
  view: 'Open',
  rename: 'Rename',
  archive: 'Archive',
  restore: 'Restore',
  delete: 'Delete',
  copy: 'Make a Copy',
};

const ACTIONS = [
  RECORD_EDITOR_ACTIONS.view,
  RECORD_EDITOR_ACTIONS.rename,
  RECORD_EDITOR_ACTIONS.copy,
  RECORD_EDITOR_ACTIONS.archive,
  RECORD_EDITOR_ACTIONS.restore,
  RECORD_EDITOR_ACTIONS.delete,
];

function RecordEditorThumbnailActions({
  item,
  history,
  list,
  setList,
  children,
  isArchived,
  index,
  onActionCompleted,
}) {
  const [isRenameModal, toggleIsRenameModal] = React.useState(false);
  const [showLoader, toggleLoader] = React.useState(false);
  const [menuElement, setMenumenuElement] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(false);
  const [confirmMsg, setConfirmMsg] = React.useState(false);

  const { name = '' } = item;

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
    return false;
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
      case RECORD_EDITOR_ACTIONS.view:
      case RECORD_EDITOR_ACTIONS.rename:
      case RECORD_EDITOR_ACTIONS.copy:
      case RECORD_EDITOR_ACTIONS.delete:
        return !isArchived;

      case RECORD_EDITOR_ACTIONS.archive:
      case RECORD_EDITOR_ACTIONS.restore:
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
      case RECORD_EDITOR_ACTIONS.view:
        logAmplitudeEvent('Open existing record editor');
        route = APP_ROUTES.EDIT_RECORD_EDITOR.replace(':id', item.id);
        history.push(route);
        break;

      case RECORD_EDITOR_ACTIONS.rename:
        logAmplitudeEvent('Rename record editor');
        toggleIsRenameModal(true);
        break;

      case RECORD_EDITOR_ACTIONS.copy:
        logAmplitudeEvent('Copy record editor');
        createCopy();
        break;

      case RECORD_EDITOR_ACTIONS.archive:
        logAmplitudeEvent('Archive record editor');
        setConfirmAction('ARCHIVE');
        setConfirmMsg(`Are you sure to archive "${name}"?`);
        break;

      case RECORD_EDITOR_ACTIONS.delete:
        logAmplitudeEvent('Delete record editor');
        setConfirmAction('DELETE');
        setConfirmMsg(`Are you sure to delete "${name}"?`);
        break;

      case RECORD_EDITOR_ACTIONS.restore:
        logAmplitudeEvent('Restore record editor');
        setConfirmAction('RESTORE');
        setConfirmMsg(`Are you sure to restore "${name}"?`);
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
        deleteRecordEditor({ isArchive: true });
        break;

      case 'DELETE':
        deleteRecordEditor({ isDelete: true });
        break;

      case 'RESTORE':
        deleteRecordEditor({ isRestore: true });
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   * Archive | Delete | Restore Selected Record Editor
   */
  const deleteRecordEditor = async ({
    isArchive,
    isRestore,
    isDelete,
  } = {}) => {
    try {
      let url = '';
      if (isArchive) url = API_URLS.ARCHIVE_RECORD_EDITOR;
      if (isRestore) url = API_URLS.RESTORE_RECORD_EDITOR;
      if (isDelete) url = API_URLS.DELETE_RECORD_EDITOR;

      if (!url) return;

      toggleLoader(true);

      url = url.replace('#ID#', item.id);

      if (isArchive || isRestore) {
        await httpPost(url);
      } else if (isDelete) {
        await httpDelete(url);
      }

      toggleLoader(false);
      onActionCompleted(RECORD_EDITOR_ACTIONS.delete);

      const newList = list.filter(({ id }) => id != item.id);
      setList(newList);

      let msg = '';
      if (isArchive) msg = RECORD_EDITOR_MSG.editor_archived;
      if (isRestore) msg = RECORD_EDITOR_MSG.editor_restored;
      if (isDelete) msg = RECORD_EDITOR_MSG.editor_deleted;

      showSuccessMsg(msg);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle > Update Name
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

      const url = API_URLS.RENAME_RECORD_EDITOR.replace('#ID#', item.id);

      const formData = new FormData();
      formData.append('new_name', newName);

      await httpPost(url, formData);

      const newList = list.map(listItem => {
        if (item.id == listItem.id) {
          return {
            ...listItem,
            name: newName,
          };
        }

        return listItem;
      });

      toggleLoader(false);
      toggleIsRenameModal(false);
      setList(newList);

      showSuccessMsg(RECORD_EDITOR_MSG.editor_renamed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Create Copy of Record Editor
   */
  const createCopy = async () => {
    try {
      toggleLoader(true);

      const url = API_URLS.COPY_RECORD_EDITOR.replace('#ID#', item.id);

      const { data = {} } = await httpPost(url);

      showSuccessMsg(RECORD_EDITOR_MSG.copy_created);

      const newList = [...list];
      newList.splice(index, 0, {
        ...data,
        ...getSrcDetails({ ...item, ...data }),
      });

      toggleLoader(false);
      setList(newList);
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
        id="record-edit-actions-menu"
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
        <RenameRecordEditorModal
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

RecordEditorThumbnailActions.propTypes = {
  children: func,
  index: number.isRequired,
  isArchived: bool.isRequired,
  item: shape({}).isRequired,
  list: arrayOf(shape({})).isRequired,
  onActionCompleted: func.isRequired,
  setList: func.isRequired,
};

RecordEditorThumbnailActions.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(RecordEditorThumbnailActions);
