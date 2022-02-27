import React from 'react';
import { shape, func, number } from 'prop-types';

import {
  Box,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { Add as AddIcon, Remove as RemoveIcon } from '@material-ui/icons';

import {
  ROW_CONTEXT_MENU_ACTIONS,
  ROW_FIELD_TYPES,
  MIN_ROUNDING_DIGIT,
  MAX_ROUNDING_DIGIT,
  // DEFAULT_ROUNDING_DIGIT,
  ROW_CONTEXT_MENU_ACTIONS_KEYS,
} from '../../configs';

import getNumbers from '../../../../../../utils/helper/getNumbers';
import './styles.scss';

function RowContextMenu({ state, ...props }) {
  const { fieldType, roundingDigits } = state;

  const {
    updateState,
    handleRowContextMenuAction,
    isValidRoundingDigit,
    rowsCount,
    activeRowIndex,
  } = props;

  /**
   * Handle Round Off
   *
   * @param {String} opt
   * @param {String} value
   */
  // const handleRoundOff = (opt, value) => {
  //   if (!value) {
  //     updateState({
  //       isRoundOff: false,
  //       roundingDigits: DEFAULT_ROUNDING_DIGIT,
  //     });
  //     return;
  //   }

  //   updateState({ isRoundOff: value });
  // };

  /**
   * Handle Field Type
   *
   * @param {String} opt
   * @param {String} value
   */
  const handleFieldType = (opt, value) => {
    if (!value) return;

    updateState({ fieldType: value });
  };

  /**
   * Handle Decimals
   *
   * @param {Event}
   */
  const handleRoundingDigits = ({ target: { value } }) => {
    const number = getNumbers(value);

    if (number >= MAX_ROUNDING_DIGIT) {
      updateState({ roundingDigits: MAX_ROUNDING_DIGIT });
      return;
    }

    if (number <= MIN_ROUNDING_DIGIT) {
      updateState({ roundingDigits: MIN_ROUNDING_DIGIT });
    }
  };

  /**
   * Increment | Decrement Decimals
   *
   * @param {Boolean} isIncrement
   */
  const increDecreRoundingDigits = isIncrement => () => {
    let count = Number(roundingDigits);
    isIncrement ? count++ : count--;

    updateState({ roundingDigits: count });
  };

  /**
   * Is Action Disabled
   *
   * @param {String} action
   *
   * @return {Boolean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertAbove:
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertBelow:
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.duplicate:
        return false;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.moveAbove:
        return activeRowIndex <= 0;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.moveBelow:
        return activeRowIndex == rowsCount - 2;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.delete:
        return rowsCount <= 1;

      default:
        return true;
    }
  };

  return (
    <Box p={1} className="model-grid-row-context-menu">
      <Box
        p={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2">Field Type</Typography>
        <ToggleButtonGroup
          value={fieldType}
          exclusive
          size="small"
          className="hierarchy-toggle toggle-group"
          onChange={handleFieldType}
        >
          {ROW_FIELD_TYPES.map((opt, index) => (
            <ToggleButton value={opt.value} key={index}>
              {opt.symbol}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      {/* <Box
        p={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2">Round Off</Typography>
        <ToggleButtonGroup
          value={isRoundOff}
          exclusive
          size="small"
          className="hierarchy-toggle toggle-group"
          onChange={handleRoundOff}
        >
          <ToggleButton value>Yes</ToggleButton>
          <ToggleButton value={false}>No</ToggleButton>
        </ToggleButtonGroup>
      </Box> */}

      <Box
        p={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2">Decimals</Typography>
        <Box display="flex" alignItems="center" justifyContent="end">
          <Button
            size="small"
            className="rounding-btn"
            disabled={roundingDigits <= MIN_ROUNDING_DIGIT}
            onClick={increDecreRoundingDigits(false)}
          >
            <RemoveIcon />
          </Button>
          <TextField
            className="rounding-input"
            size="small"
            style={{ width: 40 }}
            name="roundingDigits"
            variant="outlined"
            color="primary"
            value={roundingDigits}
            onChange={handleRoundingDigits}
            error={isValidRoundingDigit(roundingDigits)}
            required
          />
          <Button
            size="small"
            disabled={roundingDigits >= MAX_ROUNDING_DIGIT}
            onClick={increDecreRoundingDigits(true)}
            className="rounding-btn"
          >
            <AddIcon />
          </Button>
        </Box>
      </Box>

      <Box py={1}>
        <Divider />
      </Box>

      <Typography variant="subtitle1">Actions</Typography>
      {ROW_CONTEXT_MENU_ACTIONS.map(action => (
        <MenuItem
          key={action}
          disabled={isActionDisabled(action)}
          onClick={handleRowContextMenuAction(action)}
        >
          {action}
        </MenuItem>
      ))}
    </Box>
  );
}

RowContextMenu.propTypes = {
  activeRowIndex: number,
  handleRowContextMenuAction: func.isRequired,
  isValidRoundingDigit: func.isRequired,
  rowsCount: number.isRequired,
  state: shape({}).isRequired,
  updateState: func.isRequired,
};

RowContextMenu.defaultProps = {
  activeRowIndex: -1,
};

export default RowContextMenu;
