import React from 'react';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf, bool, string } from 'prop-types';

import {
  Menu,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

import { AI_MODULES_DISPLAY_NAME } from '../../../../configs/app';
import { API_URLS } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import { DIMENSIONS_MSG } from '../../../../configs/messages';
import { TYPES } from '../../EditDimension/configs';

import { httpPost, httpDelete, httpGet } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';

import ConfirmationModal from '../../../../components/ConfirmationModal';
import UploadLoader from '../../../../components/UploadLoader';

import { handleFileForReloadTable } from '../../../../services/Dimensions';
import { uploadFiles } from '../../../../services/Source';

import RenameDimensionModal from '../../RenameDimensionModal';
import { setSourceTable } from '../../../../reducers/SourceTables/actions';
import ImportSourceTable from '../../../SourceTables/ImportSourceTable';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

export const DIMENSION_ACTIONS = {
  view: 'View Table',
  rename: 'Rename',
  reload: 'Reload',
  viewHierarchy: 'View Hierarchy',
  linkDimension: `Link ${AI_MODULES_DISPLAY_NAME.dimension}`,
  configurations: 'Configurations',
  download: 'Download Excel',
  delete: 'Delete',
};

const ACTIONS = Object.values(DIMENSION_ACTIONS);

function DimensionListActions({
  dimension,
  history,
  list,
  setList,
  children,
  isSystem,
  type,
  onActionCompleted,
  setSourceTable,
  goToViewDimension,
}) {
  const [isRenameModal, toggleIsRenameModal] = React.useState(false);
  const [isReloadTable, toggleIsReloadModal] = React.useState(false);
  const [uploadPercentage, setuploadPercentage] = React.useState(null);
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
   * @return {Boolean}
   */
  const isActionDisabled = action => {
    return false;
  };

  /**
   * Handle Clicked Menu Action
   *
   * @param {String} action
   */
  const handleAction = action => () => {
    handleCloseMenu();

    let route = '';
    const { alias = '', id = '', dimension_meta = '' } = dimension || {};

    switch (action) {
      case DIMENSION_ACTIONS.view:
        logAmplitudeEvent('View dimension table');
        // Setup time dimension if not setup
        if (type === TYPES[2] && !dimension_meta) {
          goToViewDimension(id, alias, dimension_meta, '0')();
          return;
        }

        route = APP_ROUTES.EDIT_DIMENSION.replace(':id', id);
        history.push({ pathname: route, search: `?tab=0&type=${type}` });
        break;

      case DIMENSION_ACTIONS.rename:
        logAmplitudeEvent('Rename dimension');
        toggleIsRenameModal(true);
        break;

      case DIMENSION_ACTIONS.reload:
        logAmplitudeEvent('Reload dimension');
        toggleIsReloadModal(true);
        break;

      case DIMENSION_ACTIONS.delete:
        logAmplitudeEvent('Delete dimension');
        setConfirmAction('DELETE');
        setConfirmMsg(
          `Are you sure to delete "${dimension.display_name}" ${AI_MODULES_DISPLAY_NAME.dimension}?`
        );
        break;

      case DIMENSION_ACTIONS.viewHierarchy:
        logAmplitudeEvent('View dimension hierarchy');
        route = APP_ROUTES.EDIT_DIMENSION.replace(':id', id);
        history.push({ pathname: route, search: `?tab=1&type=${type}` });
        break;

      case DIMENSION_ACTIONS.linkDimension:
        logAmplitudeEvent('Link dimension');
        route = APP_ROUTES.EDIT_DIMENSION.replace(':id', id);
        history.push({ pathname: route, search: '?tab=2' });
        break;

      case DIMENSION_ACTIONS.configurations:
        logAmplitudeEvent('Configure dimension');
        // Setup time dimension if not setup
        if (type === TYPES[2] && !dimension_meta) {
          goToViewDimension(id, alias, dimension_meta, '3')();
          return;
        }

        route = APP_ROUTES.EDIT_DIMENSION.replace(':id', id);
        history.push({ pathname: route, search: `?tab=3&type=${type}` });
        break;

      case DIMENSION_ACTIONS.download:
        logAmplitudeEvent('Download dimension');
        exportDimension();
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
        deleteDimension();
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   * Delete Selected Dimension
   */
  const deleteDimension = async () => {
    try {
      toggleLoader(true);

      const url = API_URLS.DELETE_DIMENSION.replace('#ID#', dimension.id);
      await httpDelete(url);

      toggleLoader(false);
      onActionCompleted(DIMENSION_ACTIONS.delete);

      const newList = list.filter(({ id }) => id != dimension.id);
      setList(newList);

      showSuccessMsg(DIMENSIONS_MSG.dimension_deleted);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle > Update Dimension Name
   *
   * @param {String} name
   */
  const handleUpdateName = async name => {
    try {
      if (dimension.display_name == name) {
        toggleIsRenameModal(false);
        return;
      }

      if (showLoader) return;

      toggleLoader(true);

      const url = API_URLS.RENAME_DIMENSION.replace('#ID#', dimension.id);

      const params = { name };

      await httpPost(url, params);

      const newList = list.map(item => {
        if (dimension.id == item.id) return { ...item, display_name: name };

        return item;
      });

      toggleLoader(false);
      toggleIsRenameModal(false);
      setList(newList);

      showSuccessMsg(DIMENSIONS_MSG.dimension_renamed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle File > Reload Dimension
   *
   * @param {Object} file
   */

  const handleFileForReload = async file => {
    try {
      toggleIsReloadModal(false);

      const uploadedFile = await uploadFile(file);
      if (!uploadedFile) return;

      const { source_table_id } = dimension;

      const sourceTableObj = await handleFileForReloadTable(
        uploadedFile,
        source_table_id
      );

      if (sourceTableObj) {
        setSourceTable(sourceTableObj);
      }

      setuploadPercentage(null);

      history.push(APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Upload Imported File
   *
   * @return {String}
   */
  const uploadFile = async file => {
    try {
      setuploadPercentage(0);

      const url = uploadFiles(file, setuploadPercentage);

      return url;
    } catch (e) {
      setuploadPercentage(null);
      return '';
    }
  };

  /**
   * Export Dimension
   */
  const exportDimension = async () => {
    try {
      if (showLoader) return;

      toggleLoader(true);

      let url = API_URLS.EXPORT_DIMENSION.replace('#ID#', dimension.id);

      if (type == TYPES[1]) {
        url = API_URLS.EXPORT_GL_ACCOUNT;
      }

      const res = await httpGet(url);

      programmaticallyLoadByUrl(res.url, { target: '_blank' });

      toggleLoader(false);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Is Action ALlow for System Dimension
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionAllowForSystemDimension = action => {
    switch (action) {
      case DIMENSION_ACTIONS.view:
        return true;
      case DIMENSION_ACTIONS.viewHierarchy:
      case DIMENSION_ACTIONS.download:
        return type == TYPES[1];

      case DIMENSION_ACTIONS.configurations:
        return type == TYPES[2];

      case DIMENSION_ACTIONS.rename:
      case DIMENSION_ACTIONS.linkDimension:
      case DIMENSION_ACTIONS.delete:
      default:
        return false;
    }
  };

  return (
    <>
      {children && children(handleAction)}

      <IconButton aria-label="settings" size="small" onClick={toggleMenu}>
        {showLoader ? <CircularProgress size={24} /> : <MoreVertIcon />}
      </IconButton>

      <Menu
        id="dimension-actions-menu"
        anchorEl={menuElement}
        keepMounted
        open={Boolean(menuElement)}
        onClose={handleCloseMenu}
      >
        {ACTIONS.map(action => {
          if (isSystem && !isActionAllowForSystemDimension(action)) return null;

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
        <RenameDimensionModal
          isOpen
          showLoader={showLoader}
          name={dimension.display_name || ''}
          handleClose={() => toggleIsRenameModal(false)}
          handleUpdatedName={handleUpdateName}
        />
      )}

      {isReloadTable && (
        <ImportSourceTable
          isOpen
          handleClose={() => toggleIsReloadModal(false)}
          handleFile={handleFileForReload}
        />
      )}

      {typeof uploadPercentage == 'number' && (
        <UploadLoader
          isVisible
          uploadPercentage={uploadPercentage}
          savingText="Saving..."
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

DimensionListActions.propTypes = {
  children: func,
  dimension: shape({}).isRequired,
  goToViewDimension: func,
  isSystem: bool,
  list: arrayOf(shape({})).isRequired,
  onActionCompleted: func.isRequired,
  setList: func.isRequired,
  setSourceTable: func.isRequired,
  type: string,
};

DimensionListActions.defaultProps = {
  onActionCompleted: () => {},
  goToViewDimension: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {
  setSourceTable,
})(withRouter(DimensionListActions));
