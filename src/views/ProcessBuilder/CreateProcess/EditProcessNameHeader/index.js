import React, { useState } from 'react';
import { func, number, string } from 'prop-types';

import InlineRenaming from '../../../../components/InlineRenaming';

import { PROCESS_MANAGER_MSG } from '../../../../configs/messages';

import { validateName } from '../../../../utils/helper/validateName';
import { showSuccessMsg } from '../../../../utils/notifications';
import { API_URLS } from '../../../../configs/api';
import { httpPost } from '../../../../utils/http';

const EditProcessNameHeader = ({
  name,
  handleNewName,
  onChangeEditingState,
  id,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isLoading, setLoading] = useState(false);

  /**
   * Enabling Renaming of inline process Builder
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

      if (id) {
        const url = API_URLS.RENAME_PROCESS.replace('#ID#', id);

        await httpPost(url, { name: newName });

        setLoading(false);
        showSuccessMsg(PROCESS_MANAGER_MSG.process_renamed);
      }

      handleNewName(newName);

      setLoading(false);
      setIsRenaming(false);
      onChangeEditingState(false);
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <InlineRenaming
      name={name}
      isLoading={isLoading}
      isEditingEnable={isRenaming}
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

EditProcessNameHeader.propTypes = {
  handleNewName: func,
  id: number,
  name: string,
  onChangeEditingState: func,
};

EditProcessNameHeader.defaultProps = {
  handleNewName: () => {},
  name: '',
  onChangeEditingState: () => {},
};

export default EditProcessNameHeader;
