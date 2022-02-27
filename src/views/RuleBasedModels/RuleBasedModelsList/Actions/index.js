import React, { useState } from 'react';
import { shape, func, arrayOf, bool, number } from 'prop-types';

import { withRouter } from 'react-router-dom';
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

import { MODELS_API, RULE_BASED_MODELS_API } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';

import { httpDelete, httpGet, httpPut, httpPost } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';

import ConfirmationModal from '../../../../components/ConfirmationModal';
import UploadLoader from '../../../../components/UploadLoader';
import RenameRBMDialog from '../../RenameRBMDialog';
import ImportSourceTable from '../../../SourceTables/ImportSourceTable';

import { handleFileForReloadTable } from '../../../../services/Dimensions';
import { uploadFiles } from '../../../../services/Source';
import { setSourceTable } from '../../../../reducers/SourceTables/actions';

import {
  RBM_CONFIRMATION_ACTIONS,
  RULE_BASED_MODEL_ACTIONS,
} from '../../configs';

const ACTIONS = Object.values(RULE_BASED_MODEL_ACTIONS);

function RuleBasedModelsListActions({
  ruleBasedModel,
  history,
  list,
  index,
  setList,
  children,
  isArchived,
  onActionCompleted,
  setSourceTable,
}) {
  const [isRenameModal, toggleIsRenameRBM] = useState(false);
  const [showLoader, toggleLoader] = useState(false);
  const [menuElement, setMenuElement] = useState(null);
  const [confirmAction, setConfirmAction] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState(false);
  const [isReloadTable, toggleIsReloadModal] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(null);

  const { id, name, source_table_id } = ruleBasedModel;

  /**
   * Toggle Import
   */
  const toggleImport = () => {
    toggleIsReloadModal(true);
  };

  /**
   * Toggle Menu
   *
   * @param {Event}
   */
  const toggleMenu = ({ currentTarget }) => {
    setMenuElement(currentTarget);
  };

  /**
   * Handle > Close Menu
   */
  const handleCloseMenu = () => {
    setMenuElement(null);
  };

  /**
   * Verify > Is Action Disabled
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case RULE_BASED_MODEL_ACTIONS.view:
      case RULE_BASED_MODEL_ACTIONS.rename:
      case RULE_BASED_MODEL_ACTIONS.delete:
      case RULE_BASED_MODEL_ACTIONS.reload:
      case RULE_BASED_MODEL_ACTIONS.duplicate:
        return false;

      case RULE_BASED_MODEL_ACTIONS.archive:
      case RULE_BASED_MODEL_ACTIONS.restore:
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
   * @return {Boolean}
   */
  const isActionAllowed = action => {
    switch (action) {
      case RULE_BASED_MODEL_ACTIONS.view:
      case RULE_BASED_MODEL_ACTIONS.rename:
      case RULE_BASED_MODEL_ACTIONS.delete:
      case RULE_BASED_MODEL_ACTIONS.reload:
      case RULE_BASED_MODEL_ACTIONS.duplicate:
        return !isArchived;

      case RULE_BASED_MODEL_ACTIONS.archive:
      case RULE_BASED_MODEL_ACTIONS.restore:
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
      case RULE_BASED_MODEL_ACTIONS.view:
        route = APP_ROUTES.RULE_BASED_MODEL.replace(':id', id);
        history.push(route);
        break;

      case RULE_BASED_MODEL_ACTIONS.rename:
        toggleIsRenameRBM(true);
        break;

      case RULE_BASED_MODEL_ACTIONS.export:
        exportRBM();
        break;

      case RULE_BASED_MODEL_ACTIONS.reload:
        toggleImport();
        break;

      case RULE_BASED_MODEL_ACTIONS.duplicate:
        handleMakeaCopy();
        break;

      case RULE_BASED_MODEL_ACTIONS.delete:
        setConfirmAction(RBM_CONFIRMATION_ACTIONS.delete);
        setConfirmMsg(
          RULE_BASED_MODELS_MSG.rbm_delete_confirmation.replace('#NAME#', name)
        );
        break;

      default:
        break;
    }
  };

  /**
   * Handle Response of Confirmation Rule Based Model
   *
   * @param {String|Boolean} res
   */
  const handleCloseConfModal = res => {
    switch (res) {
      case RBM_CONFIRMATION_ACTIONS.delete:
        deleteRuleBasedModel({ isDelete: true });
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   *  Delete Rule Based Model
   *
   *  @param {Boolean} isDelete
   */
  const deleteRuleBasedModel = async ({ isDelete } = {}) => {
    try {
      if (showLoader || !isDelete) return;

      toggleLoader(true);

      const url = RULE_BASED_MODELS_API.DELETE_RBM.replace('#ID#', id);
      const res = await httpDelete(url);

      toggleLoader(false);
      onActionCompleted(RULE_BASED_MODEL_ACTIONS.delete);

      const newList = list.filter(({ id: mId }) => mId != id);
      setList(newList);

      let msg = '';
      if (res) msg = RULE_BASED_MODELS_MSG.rule_based_model_deleted;

      showSuccessMsg(msg);
      toggleLoader(false);
    } catch (e) {
      toggleLoader(false);
      console.error(e);
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
        toggleIsRenameRBM(false);
        return;
      }

      if (showLoader) return;

      toggleLoader(true);

      const url = RULE_BASED_MODELS_API.RENAME_RBM.replace('#ID#', id);

      const formData = {
        name: newName,
      };

      await httpPut(url, formData);

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
      toggleIsRenameRBM(false);
      setList(newList);

      showSuccessMsg(RULE_BASED_MODELS_MSG.rule_based_model_renamed);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Export Rule Based Model
   */
  const exportRBM = async () => {
    try {
      if (showLoader) return;

      toggleLoader(true);

      // TODO: Change API for rule based-model instead of model
      const url = MODELS_API.EXPORT_WORKBOOK.replace('#ID#', ruleBasedModel.id);

      const { data } = await httpGet(url);

      programmaticallyLoadByUrl(data.url, { target: '_blank' });

      toggleLoader(false);
    } catch (e) {
      toggleLoader(false);
    }
  };

  /**
   * Handle File > Reload Rule Based Model
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
        source_table_id
      );

      const {
        location: { pathname = '' },
      } = history;

      if (sourceTableObj) {
        setSourceTable(sourceTableObj);
      }

      setUploadPercentage(null);

      let url = APP_ROUTES.VIEW_RULE_BASED_MODEL;
      url += `?redirectUrl=${pathname}`;

      history.push(url);
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
      setUploadPercentage(0);

      const url = uploadFiles(file, setUploadPercentage);

      return url;
    } catch (e) {
      setUploadPercentage(null);
      return '';
    }
  };

  /**
   * Copy the selected RBM
   */
  const handleMakeaCopy = async () => {
    try {
      toggleLoader(true);

      const url = RULE_BASED_MODELS_API.COPY_RBM.replace('#ID#', id);

      const { data = {} } = await httpPost(url);

      showSuccessMsg(RULE_BASED_MODELS_MSG.copy_created);

      const newList = [...list];

      newList.splice(index, 0, data);

      toggleLoader(false);
      setList(newList);
    } catch (e) {
      toggleLoader(false);
      console.error(e);
    }
  };

  return (
    <>
      {children && children(handleAction)}

      <IconButton aria-label="settings" size="small" onClick={toggleMenu}>
        {showLoader ? <CircularProgress size={24} /> : <MoreVertIcon />}
      </IconButton>

      <Menu
        id="rule-based-models-actions-menu"
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
        <RenameRBMDialog
          isOpen
          showLoader={showLoader}
          name={name || ''}
          handleClose={() => toggleIsRenameRBM(false)}
          handleUpdatedName={handleUpdateName}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          showLoader={showLoader}
          handleClose={handleCloseConfModal}
          isOpen
          action={confirmAction}
          msg={confirmMsg}
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
    </>
  );
}

RuleBasedModelsListActions.propTypes = {
  children: func,
  index: number.isRequired,
  isArchived: bool.isRequired,
  list: arrayOf(shape({})).isRequired,
  onActionCompleted: func.isRequired,
  ruleBasedModel: shape({}).isRequired,
  setList: func.isRequired,
  setSourceTable: func.isRequired,
};

RuleBasedModelsListActions.defaultProps = {
  onActionCompleted: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {
  setSourceTable,
})(withRouter(RuleBasedModelsListActions));
