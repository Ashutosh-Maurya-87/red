/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Menu, MenuItem, Popover, Grid, Button, Box } from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon } from '@material-ui/icons';

import CalculatedField from '../../TableFormulaBuilder/CalculatedField';
import RowLabelCell from './RowLabelCell';

import { ROW_ACTIONS, COL_WIDTH, MAX_ROWS, LABEL_COL_WIDTH } from '..';
import { PROCESS_MANAGER_MSG } from '../../../../../../configs/messages';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../../../configs/app';
import { showErrorMsg } from '../../../../../../utils/notifications';
import { validateFormula } from '../../TableFormulaBuilder/CalculatedField/helper';

/**
 * Render Single Cell
 */
const CellRenderer = props => {
  const [menuEle, setMenuEle] = useState(null);
  const [calculationBoxEle, toggleCalulationBox] = useState(null);
  const [formulaCell, updateFormula] = useState({ ...props.cell });

  const {
    cell,
    row,
    col,
    columns,
    attributesRenderer,
    selected,
    editing,
    updated,
    style,
    handleRowAction,
    className,
    headersToCompare,
    tableColumns,
    handleUpdateCell,
    totalRows,
    stepNumber,
    ...rest
  } = props;

  const attributes = cell.attributes || {};

  let width;
  if (columns[col]) ({ width } = columns[col]);
  if (col == 0) width = LABEL_COL_WIDTH;
  if (!width) width = COL_WIDTH;

  attributes.style = {
    width,
    minWidth: width,
    maxWidth: width,
    minHeight: '31px',
  };

  const { data_type: dataType = COLUMN_DATA_TYPES_KEYS.amount } =
    columns[col] || {};

  /**
   * Get Styles for Cell
   *
   * @return {String}
   */
  const getCellStyles = () => {
    if (col == 0) return className;

    let styles = className;

    if (col <= headersToCompare.length) styles += ' col-compare';

    if (col > headersToCompare.length) styles += ' col-update';

    return styles;
  };

  /**
   * Handle Mouse Right Click on first cell of Row
   *
   * @param {Object} evt
   */
  const handleRightClick = evt => {
    try {
      evt.preventDefault();
      setMenuEle(evt.currentTarget);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Handle Click on first cell of Row
   *
   * @param {String} evt
   * @param {Number} row
   */
  const onClickRowAction = (action, row) => () => {
    setMenuEle(null);
    handleRowAction({ action, row });
  };

  /**
   * Show Formula Calculation Box
   *
   * @param {Object} evt
   */
  const showCalculationBox = evt => {
    evt.preventDefault();
    toggleCalulationBox(evt.currentTarget);
  };

  /**
   * Hide | Close Formula Calculation Box
   *
   * @param {Object} evt
   */
  const hideCalculationBox = evt => {
    toggleCalulationBox(null);

    setTimeout(() => {
      const id = `data-header-${stepNumber}-wrap`;
      const headerEle = document.getElementById(`${id}`);

      if (!headerEle) return;

      const total = headerEle.clientWidth + headerEle.scrollLeft + 15;

      if (headerEle.scrollWidth == total) {
        headerEle.scrollLeft += 15;
      }
    }, 200);
  };

  /**
   * Cancel Formula Calculation Box
   *
   * @param {Object} evt
   */
  const cancelCalculationBox = () => {
    updateFormula({ ...cell });
    hideCalculationBox();
  };

  /**
   * Apply Formula on Cell (Done Action)
   */
  const handleDoneFormula = () => {
    if (!formulaCell.formula || formulaCell.formula.length == 0) {
      showErrorMsg(PROCESS_MANAGER_MSG.add_valid_formula);
      return;
    }

    const { display_name = '' } = columns[col] || {};
    formulaCell.display_name = display_name;

    const { error } = validateFormula(formulaCell);

    if (error) {
      showErrorMsg(error);
      return;
    }

    hideCalculationBox();
    handleUpdateCell({ cell: formulaCell, row, col });
  };

  /**
   * Set Final Formula
   *
   * @param {Array} formula
   */
  const setFormula = formula => {
    formulaCell.formula = formula;
    updateFormula({ ...formulaCell });
  };

  /**
   * Verify > Is Row Context Menu action allowed
   *
   * @param {String} action
   *
   * @param {Boolean}
   */
  const isRowActionDisabled = action => {
    switch (action) {
      case ROW_ACTIONS.insertAbove:
      case ROW_ACTIONS.insertBelow:
        return totalRows >= MAX_ROWS;

      case ROW_ACTIONS.delete:
      case ROW_ACTIONS.clear:
        return false;

      default:
        return true;
    }
  };

  return (
    <>
      <div
        {...attributes}
        {...rest}
        className={getCellStyles()}
        title={cell.value}
      >
        {col == 0 ? (
          <RowLabelCell toggleRowContextMenu={handleRightClick} rowIndex={row}>
            {props.children}
          </RowLabelCell>
        ) : (
          props.children
        )}

        {col > headersToCompare.length &&
          dataType == COLUMN_DATA_TYPES_KEYS.amount && (
            <>
              {!String(cell.value) &&
                cell.formula &&
                cell.formula.length > 0 && (
                  <span className="placeholder-value">(Fx)</span>
                )}

              <ArrowDropDownIcon
                color="primary"
                className="cell-arrow"
                onClick={showCalculationBox}
              />
            </>
          )}

        {col == 0 && menuEle && (
          <Menu
            id={`row-menu-${row}`}
            anchorEl={menuEle}
            open={Boolean(menuEle)}
            onClose={() => setMenuEle(null)}
          >
            {Object.values(ROW_ACTIONS).map(action => (
              <MenuItem
                key={action}
                onClick={onClickRowAction(action, row)}
                disabled={isRowActionDisabled(action)}
              >
                {action}
              </MenuItem>
            ))}
          </Menu>
        )}
      </div>

      {calculationBoxEle && (
        <Popover
          id={`calculation-box-popover-${col}`}
          open={Boolean(calculationBoxEle)}
          anchorEl={calculationBoxEle}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          onClose={cancelCalculationBox}
          disableRestoreFocus
        >
          <Box className="calculation-box-popover" px={3} py={2}>
            <Box>
              <CalculatedField
                col={formulaCell}
                setFormula={setFormula}
                step={{ targetTable: { columns: tableColumns } }}
                isSubmit
              />
            </Box>
            <Grid container justify="flex-end" alignItems="center">
              <Box mr={1}>
                <Button
                  color="primary"
                  onClick={cancelCalculationBox}
                  size="small"
                >
                  Cancel
                </Button>
              </Box>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                onClick={handleDoneFormula}
                size="small"
              >
                Done
              </Button>
            </Grid>
          </Box>
        </Popover>
      )}
    </>
  );
};

export default CellRenderer;
