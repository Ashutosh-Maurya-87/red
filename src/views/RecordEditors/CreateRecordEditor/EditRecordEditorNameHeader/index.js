import React from 'react';
import { withRouter } from 'react-router-dom';
import { any, func, string, bool } from 'prop-types';

import { Typography, Breadcrumbs, Link } from '@material-ui/core';
import InlineRenaming from '../../../../components/InlineRenaming';

import { RECORD_EDITOR_MSG } from '../../../../configs/messages';
import { APP_ROUTES_BREADCRUMBS } from '../../../../configs/routes';
import { API_URLS } from '../../../../configs/api';

import { showSuccessMsg } from '../../../../utils/notifications';
import { httpPost } from '../../../../utils/http';
import { validateName } from '../../../../utils/helper/validateName';

function EditRecordEditorNameHeader({
  name,
  id,
  handleNewName,
  match,
  history,
  isUpdateRecordMode,
  onChangeEditingState,
}) {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [showLoader, setLoader] = React.useState(false);

  const breadcrumb = APP_ROUTES_BREADCRUMBS[match.path] || [];

  /**
   * Go to specific route
   */
  const goToRoute = route => () => {
    if (route) history.push(route);
  };

  /**
   * Start Renaming
   */
  const startRenaming = () => {
    setIsRenaming(true);
    onChangeEditingState(true);
  };

  /**
   * Handle > Update Name
   *
   * @param {String} newName
   */
  const handleUpdateName = async newName => {
    try {
      const isValidName = validateName(newName);

      if (!isValidName) {
        setIsRenaming(true);
        onChangeEditingState(true);

        return;
      }

      if (name == newName) {
        setIsRenaming(false);
        onChangeEditingState(false);

        return;
      }

      if (!id) {
        setIsRenaming(false);
        onChangeEditingState(false);
        handleNewName(newName);

        return;
      }

      if (showLoader) return;

      setLoader(true);

      const url = API_URLS.RENAME_RECORD_EDITOR.replace('#ID#', id);

      const formData = new FormData();
      formData.append('new_name', newName);

      await httpPost(url, formData);

      showSuccessMsg(RECORD_EDITOR_MSG.editor_renamed);
      setLoader(false);
      setIsRenaming(false);
      onChangeEditingState(false);
      handleNewName(newName);
    } catch (e) {
      setLoader(false);
    }
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumb.map(({ url, name }, key) => {
          if (url) {
            return (
              <Link color="inherit" key={key} onClick={goToRoute(url)}>
                <span className="breadcrumbs cursor-pointer linked-breadcrumbs">
                  {name}
                </span>
              </Link>
            );
          }

          return (
            <Typography color="textPrimary" key={key}>
              <span className="breadcrumbs">
                {isUpdateRecordMode ? 'Edit Record' : name}
              </span>
            </Typography>
          );
        })}
      </Breadcrumbs>

      <InlineRenaming
        name={name}
        isLoading={showLoader}
        isEditingEnable={isRenaming}
        onRename={handleUpdateName}
        onTitleClick={startRenaming}
        max={50}
        isFixedWidth
        width={600}
        fontSize={24}
        required
      />
    </>
  );
}

EditRecordEditorNameHeader.propTypes = {
  handleNewName: func,
  id: any,
  isUpdateRecordMode: bool.isRequired,
  name: string,
  onChangeEditingState: func,
};

EditRecordEditorNameHeader.defaultProps = {
  handleNewName: () => {},
  name: '',
  onChangeEditingState: () => {},
};

export default withRouter(EditRecordEditorNameHeader);
