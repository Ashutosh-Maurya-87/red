import React from 'react';
import { withRouter } from 'react-router-dom';
import { func, shape, bool } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import InlineRenaming from '../../../../components/InlineRenaming';

import { MODELS_API } from '../../../../configs/api';
import { MODELS_MSG } from '../../../../configs/messages';

import { httpPost } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import { validateName } from '../../../../utils/helper/validateName';

import { setWorkbook } from '../../../../reducers/Models/actions';
import {
  getIsViewMode,
  getWorkbook,
} from '../../../../reducers/Models/selectors';

const WorkbookHeader = ({
  workbook,
  setWorkbook,
  isViewMode,
  onChangeEditingState,
}) => {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [showLoader, setLoader] = React.useState(false);

  const { id, name } = workbook;

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

      if (showLoader) return;

      setLoader(true);

      if (!isValidName) {
        setIsRenaming(true);
        onChangeEditingState(true);
        setLoader(false);

        return;
      }

      if (name == newName) {
        setIsRenaming(false);
        setLoader(false);
        onChangeEditingState(false);

        return;
      }

      setLoader(true);

      const url = MODELS_API.RENAME_WORKBOOK.replace('#ID#', id);

      const formData = new FormData();
      formData.append('name', newName);

      await httpPost(url, formData);

      setWorkbook({ ...workbook, name: newName });
      showSuccessMsg(MODELS_MSG.model_renamed);

      setLoader(false);
      setIsRenaming(false);
      onChangeEditingState(false);
    } catch (e) {
      setLoader(false);
    }
  };

  return (
    <InlineRenaming
      disabled={isViewMode}
      name={workbook.name}
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
  );
};

WorkbookHeader.propTypes = {
  isViewMode: bool.isRequired,
  onChangeEditingState: func,
  setWorkbook: func.isRequired,
  workbook: shape({}).isRequired,
};

WorkbookHeader.defaultProps = {};

const mapStateToProps = createStructuredSelector({
  workbook: getWorkbook(),
  isViewMode: getIsViewMode(),
});

export default connect(mapStateToProps, {
  setWorkbook,
})(withRouter(WorkbookHeader));
