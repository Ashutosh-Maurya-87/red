import React from 'react';
import { any, bool, func, string } from 'prop-types';

import InlineRenaming from '../../../../components/InlineRenaming';

import { DIMENSIONS_MSG } from '../../../../configs/messages';
import { API_URLS } from '../../../../configs/api';

import { httpPost } from '../../../../utils/http';
import { validateName } from '../../../../utils/helper/validateName';
import { showSuccessMsg } from '../../../../utils/notifications';

const EditDimensionNameHeader = ({
  name,
  id,
  handleNewName,
  canEdit,
  onChangeEditingState,
}) => {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);

  /**
   * Enabling Renaming of inline Dimension
   */
  const startRenaming = () => {
    setIsRenaming(true);
    onChangeEditingState(true);
  };

  /**
   * Updating Name on validation
   *
   * @params {string}
   */
  const handleUpdateTableName = async newName => {
    const isValidName = validateName(newName);

    setLoading(true);

    try {
      if (!isValidName) {
        setIsRenaming(true);
        onChangeEditingState(true);
        setLoading(false);
        return;
      }

      if (name == newName) {
        setIsRenaming(false);
        onChangeEditingState(false);
        setLoading(false);
        return;
      }

      name = newName;

      const url = API_URLS.RENAME_DIMENSION.replace('#ID#', id);

      const params = { name: newName };

      await httpPost(url, params);

      handleNewName(newName);

      setLoading(false);
      setIsRenaming(false);
      onChangeEditingState(false);
      showSuccessMsg(DIMENSIONS_MSG.dimension_renamed);
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <InlineRenaming
      name={name}
      isLoading={isLoading}
      isEditingEnable={canEdit ? isRenaming : ''}
      onRename={handleUpdateTableName}
      onTitleClick={startRenaming}
      max={50}
      isFixedWidth
      width={600}
      fontSize={24}
      required
    />
  );
};

EditDimensionNameHeader.propTypes = {
  canEdit: bool,
  handleNewName: func,
  id: any,
  name: string,
  onChangeEditingState: func,
};

EditDimensionNameHeader.defaultProps = {
  handleNewName: () => {},
  name: '',
  canEdit: false,
  onChangeEditingState: () => {},
};

export default EditDimensionNameHeader;
