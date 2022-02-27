import React, { useEffect } from 'react';
import { bool, func, number, string } from 'prop-types';
import { Box, TextField } from '@material-ui/core';

import Spinner from '../Spinner';

import { showErrorMsg } from '../../utils/notifications';
import { validateName as validateInlineName } from '../../utils/helper/validateName';
import { ERROR_MESSAGES } from '../../configs/messages';

import './styles.scss';

function InlineRenaming({
  name,
  isLoading,
  isEditingEnable,
  onRename,
  onTitleClick,
  onTitleDoubleClick,
  max,
  required,
  isFixedWidth,
  fontSize,
  width,
  disabled,
  validateName,
  isErrorName,
}) {
  const [inlineName, setName] = React.useState(name);

  const isValidName = validateInlineName(inlineName);
  /**
   * Load Data on Load Component
   */
  useEffect(() => {
    setName(name);
  }, [name]);

  /**
   * Error showing on name validation
   *
   * @returns {string}
   */
  const validNameFunc = () => {
    if (!isValidName) {
      return !inlineName
        ? ERROR_MESSAGES.required
        : ERROR_MESSAGES.invalid_name;
    }

    return '';
  };

  /**
   * Handle Input Change > Name
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, max);
    setName(validName);
  };

  /**
   * Handle Input Blur
   */
  const handleUpdateName = evt => {
    evt.preventDefault();

    try {
      const validName = inlineName.trim();

      if (!isValidName) {
        showErrorMsg(
          !inlineName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
        );

        onRename(validName);

        return;
      }

      if (required && !validName) {
        setName(validName);

        return;
      }

      onRename(validName);
    } catch (error) {
      console.error('error');
    }
  };

  return (
    <>
      {isLoading && <Spinner />}

      {!isEditingEnable && (
        <Box
          disabled={disabled}
          onClick={onTitleClick}
          onDoubleClick={onTitleDoubleClick}
        >
          {name}
        </Box>
      )}

      {isEditingEnable && (
        <form
          noValidate
          onSubmit={handleUpdateName}
          className="inline-rename-form"
          style={{ width: `${isFixedWidth ? `${width}px` : 'auto'}` }}
        >
          <TextField
            autoFocus
            fullWidth
            required
            id="rename"
            name="inlineName"
            variant="outlined"
            autoComplete="off"
            className="inline-rename-input"
            placeholder="Name..."
            value={inlineName}
            error={Boolean(validNameFunc())}
            helperText={!isErrorName && validNameFunc()}
            onChange={onChangeName}
            onBlur={handleUpdateName}
            inputProps={{
              style: { fontSize: `${fontSize}px` },
            }}
          />
        </form>
      )}
    </>
  );
}

InlineRenaming.propTypes = {
  disabled: bool,
  fontSize: number,
  isEditingEnable: bool,
  isErrorName: bool,
  isFixedWidth: bool,
  isLoading: bool,
  max: number,
  name: string,
  onRename: func.isRequired,
  onTitleClick: func,
  onTitleDoubleClick: func,
  required: bool,
  validateName: func,
  width: number,
};

InlineRenaming.defaultProps = {
  disabled: false,
  isEditingEnable: false,
  fontSize: 14,
  width: 200,
  isFixedWidth: false,
  onTitleClick: () => {},
  onTitleDoubleClick: () => {},
  onRename: () => {},
  isLoading: false,
  name: '',
  max: 50,
  required: false,
  isErrorName: false,
};

export default InlineRenaming;
