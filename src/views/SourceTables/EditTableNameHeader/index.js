import React from 'react';
import { func, string } from 'prop-types';

import { validateTableName } from '../ProcessImportedTable/helper';
import InlineRenaming from '../../../components/InlineRenaming';
import { SUCCESS_MESSAGES } from '../../../configs/messages';
import { showSuccessMsg, showErrorMsg } from '../../../utils/notifications';
import { validateName } from '../../../utils/helper/validateName';

function EditTableNameHeader({ name, handleNewName, onChangeEditingState }) {
  const [tableName, setTableName] = React.useState(name);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);

  /**
   * Enabling Renaming of inline source table
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

      if (tableName == newName) {
        setIsRenaming(false);
        onChangeEditingState(false);
        setLoading(false);
        return;
      }
      setTableName(newName);

      const { is_exists, message = '' } = await validateTableName(newName);

      if (is_exists) {
        showErrorMsg(message);
        setIsRenaming(true);
        onChangeEditingState(true);
        setLoading(false);
        return;
      }

      handleNewName(newName);

      setLoading(false);
      setIsRenaming(false);
      onChangeEditingState(false);
      showSuccessMsg(SUCCESS_MESSAGES.name_updated);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <>
      <InlineRenaming
        name={tableName}
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
    </>
  );
}

EditTableNameHeader.propTypes = {
  handleNewName: func,
  name: string,
  onChangeEditingState: func,
};

EditTableNameHeader.defaultProps = {
  handleNewName: () => {},
  onChangeEditingState: () => {},
  name: '',
};

export default EditTableNameHeader;
