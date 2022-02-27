import React from 'react';
import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf, number } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Menu,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

import {
  AI_MODULES_DISPLAY_NAME,
  PRE_DEFINED_LABELS,
} from '../../../../configs/app';
import { APP_ROUTES } from '../../../../configs/routes';
import { API_URLS } from '../../../../configs/api';
import { SOURCE_TABLES_MSG } from '../../../../configs/messages';
import { httpPost, httpDelete, httpGet } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';

import {
  setTablesList,
  setSourceTable,
  setReloadTable,
} from '../../../../reducers/SourceTables/actions';
import { getTablesList } from '../../../../reducers/SourceTables/selectors';
import { handleFileForReloadTable } from '../../../../services/Dimensions';

import UploadLoader from '../../../../components/UploadLoader';
import RenameSourceTable from '../../RenameSourceTable';
import ImportSourceTable from '../../ImportSourceTable';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { uploadFiles } from '../../../../services/Source';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

export const TABLE_ACTIONS = {
  open: 'Open',
  rename: 'Rename',
  reload: 'Reload',
  delete: 'Delete',
  export: 'Export',
  copy: 'Make a Copy',
};

function SourceTableActions({
  table,
  history,
  tablesList,
  setReloadTable,
  setTablesList,
  children,
  index,
  setSourceTable,
  onActionCompleted,
}) {
  const [isRenameTable, toggleIsRenameModal] = React.useState(false);
  const [isReloadTable, toggleIsReloadModal] = React.useState(false);
  const [showLoader, toggleLoader] = React.useState(false);
  const [menuElement, setMenumenuElement] = React.useState(null);
  const [uploadPercentage, setuploadPercentage] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState('');
  const [confirmMsg, setConfirmMsg] = React.useState('');

  const toggleMenu = ({ currentTarget }) => {
    setMenumenuElement(currentTarget);
  };

  const handleCloseMenu = () => {
    setMenumenuElement(null);
  };
  /**
   * Handle Clicked Menu Action
   *
   * @param {String} action
   */
  const handleAction = action => () => {
    handleCloseMenu();

    const {
      open,
      rename,
      reload,
      delete: deleteTable,
      export: exportTable,
      copy,
    } = TABLE_ACTIONS;

    switch (action) {
      case open:
        logAmplitudeEvent('Open existing source table');
        const route = APP_ROUTES.VIEW_SOURCE_TABLE.replace(':id', table.id);
        history.push(route);
        break;

      case rename:
        logAmplitudeEvent('Rename existing source table');
        toggleIsRenameModal(true);
        break;

      case reload:
        logAmplitudeEvent('Reload existing source table');
        toggleIsReloadModal(true);
        break;

      case deleteTable:
        logAmplitudeEvent('Delete existing source table');
        setConfirmAction('DELETE');
        setConfirmMsg(
          table.label
            ? `You are about to delete Scenario/${AI_MODULES_DISPLAY_NAME.dimension}. Do you want to continue?`
            : `Are you sure to delete "${table.display_name}" table?`
        );
        break;

      case exportTable:
        logAmplitudeEvent('Export existing source table');
        exportSourceTable();
        break;

      case copy:
        logAmplitudeEvent('Copy existing source table');
        copySourceTable();
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
        deleteTable();
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   * Handle > Update Table Name
   *
   * @param {String} newName
   */
  const handleUpdateTableName = async newName => {
    try {
      if (table.display_name == newName) {
        toggleIsRenameModal(false);
        return;
      }

      if (showLoader) return;

      toggleLoader(true);

      const url = API_URLS.RENAME_SOURCE_TABLE.replace('#ID#', table.id);

      const formData = new FormData();
      formData.append('name', newName);

      await httpPost(url, formData);

      const newTablesList = tablesList.map(item => {
        if (table.id == item.id) {
          return { ...item, display_name: newName };
        }

        return item;
      });

      toggleLoader(false);
      toggleIsRenameModal(false);
      setTablesList(newTablesList);

      showSuccessMsg(SOURCE_TABLES_MSG.table_renamed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Delete Selected Table
   */
  const deleteTable = async () => {
    try {
      toggleLoader(true);

      if (table?.label === PRE_DEFINED_LABELS.actuals.label) {
        showSuccessMsg("You can't delete source which is linked with Actuals.");
        toggleLoader(false);
        return;
      }
      const url = API_URLS.DELETE_SOURCE_TABLE.replace('#ID#', table.id);
      await httpDelete(url);

      toggleLoader(false);
      onActionCompleted(TABLE_ACTIONS.delete);

      const newList = tablesList.filter(({ id }) => id != table.id);
      setTablesList(newList);

      showSuccessMsg(SOURCE_TABLES_MSG.table_deleted);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle File > Reload Source Table
   *
   * @param {Object} file
   */

  const handleFileForReload = async file => {
    try {
      toggleIsReloadModal(false);

      const uploadedFile = await uploadFile(file);
      if (!uploadedFile) return;

      const sourceTableObj = await handleFileForReloadTable(
        uploadedFile,
        table.id
      );

      if (sourceTableObj) {
        setSourceTable(sourceTableObj);
      }

      setuploadPercentage(null);
      history.push(APP_ROUTES.VIEW_RELOAD_TABLE);
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
   * Export Source Tables as XLSX file
   */
  const exportSourceTable = async () => {
    try {
      toggleLoader(true);

      let url = API_URLS.EXPORT_SOURCE_TABLE.replace('#ID#', table.id);
      url += `?response_type=url`;

      const { file_url } = await httpGet(url);

      programmaticallyLoadByUrl(file_url, {
        target: '_blank',
        name: `${table.display_name}.xlsx`,
      });

      toggleLoader(false);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Copy/Paste the selected Source Table
   */
  const copySourceTable = async () => {
    try {
      toggleLoader(true);

      const url = API_URLS.COPY_SOURCE_TABLE.replace('#ID#', table.id);

      const formData = new FormData();
      formData.append('copy_data', 1);

      const { data = {} } = await httpPost(url, formData);

      showSuccessMsg(SOURCE_TABLES_MSG.copy_created);

      const newList = [...tablesList];
      newList.splice(index, 0, data);

      toggleLoader(false);
      setTablesList(newList);
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
        id="source-table-actions-menu"
        anchorEl={menuElement}
        keepMounted
        open={Boolean(menuElement)}
        onClose={handleCloseMenu}
      >
        {Object.keys(TABLE_ACTIONS).map(actionKey => {
          return (
            <MenuItem
              key={actionKey}
              onClick={handleAction(TABLE_ACTIONS[actionKey])}
            >
              <Typography variant="body2">
                {TABLE_ACTIONS[actionKey]}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>

      {isRenameTable && (
        <RenameSourceTable
          isOpen
          showLoader={showLoader}
          tableName={table.display_name}
          tableId={table.id}
          handleClose={() => toggleIsRenameModal(false)}
          handleUpdatedName={handleUpdateTableName}
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

SourceTableActions.propTypes = {
  children: func,
  index: number.isRequired,
  onActionCompleted: func.isRequired,
  setReloadTable: func.isRequired,
  setSourceTable: func.isRequired,
  setTablesList: func.isRequired,
  table: shape({}).isRequired,
  tablesList: arrayOf(shape({})).isRequired,
};

SourceTableActions.defaultProps = {
  onActionCompleted: () => {},
};

const mapStateToProps = createStructuredSelector({
  tablesList: getTablesList(),
});

export default connect(mapStateToProps, {
  setTablesList,
  setSourceTable,
  setReloadTable,
})(withRouter(SourceTableActions));
