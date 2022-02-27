import React, { useState } from 'react';
import { shape, number, func, bool } from 'prop-types';
import {
  Box,
  Menu,
  MenuItem,
  ButtonGroup,
  Button,
  Typography,
  Fade,
  TextField,
} from '@material-ui/core';

import {
  ArrowDropDown as ArrowDropDownIcon,
  DeleteForever as DeleteForeverIcon,
} from '@material-ui/icons';

import { Autocomplete } from '@material-ui/lab';
import CustomScrollbars from '../../../../../../components/ScrollBars';
import ListboxComponent from '../../../../../../components/CustomListBox';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
} from '../../../../../../configs/app';
import { FORMULA_KEYS, FIELD_OPERATIONS, OPERATORS } from './config';

import { getFormattedNumberWithNegative } from '../../../../../../utils/helper/getFormattedNumber';
import getNumbersWithFirstCharSymbol from '../../../../../../utils/helper/getNumbersWithFirstCharSymbol';

import './styles.scss';

function CalculatedField({ col, setFormula, isSubmit, step }) {
  const [menuEle, setMenuEle] = useState(null);
  const [fieldOperationEle, setFieldOperationEle] = useState(null);
  const [activeFxIndex, setActiveFxIndex] = useState(null);
  const [showUseAsInput, toggleUseAsInput] = useState(null);
  const [selectedInput, setSelectedInput] = useState(null);

  /**
   * Close `Add Field` Menu
   */
  const closeFieldsList = () => setMenuEle(null);

  /**
   * Open Operations Menu for specific field in
   *
   * @param {Number} fi
   */
  const openFieldOperationMenu = fi => ({ currentTarget }) => {
    setActiveFxIndex(fi);
    setFieldOperationEle(currentTarget);
  };

  /**
   * Handle selected field operations for specific field
   *
   * @param {Object} opt
   */
  const handleFieldOperation = opt => evt => {
    setFieldOperationEle(null);

    if (!opt) {
      setActiveFxIndex(null);
      return;
    }

    const { formula = [] } = col;
    formula[activeFxIndex].operation = { ...opt };

    setFormula(formula);
    setActiveFxIndex(null);
  };

  /**
   * Delete object from formula
   */
  const deleteFormula = () => {
    const { formula } = col;

    formula.pop();

    setFormula(formula);
  };

  /**
   * Handle Selected Field from Add Field Menu
   *
   * @param {Object} field
   */
  const handleSelectedField = field => () => {
    closeFieldsList();
    const { formula = [] } = col;

    if (field.key == FORMULA_KEYS.INPUT) {
      if (typeof activeFxIndex == 'number') {
        formula[activeFxIndex] = { key: FORMULA_KEYS.INPUT, value: '' };
      } else {
        formula.push({ key: FORMULA_KEYS.INPUT, value: '' });
      }

      setFormula(formula);
      return;
    }

    const fx = { ...field, key: FORMULA_KEYS.FIELD };

    if (typeof activeFxIndex == 'number') {
      formula[activeFxIndex] = { ...formula[activeFxIndex], ...fx };
      setFormula(formula);
    }

    const lastKey = formula[formula.length - 1] || {};

    if (
      lastKey.key == FORMULA_KEYS.FIELD ||
      lastKey.key == FORMULA_KEYS.INPUT
    ) {
      return;
    }

    formula.push(fx);
    setFormula(formula);
  };

  /**
   * Disable Number formatting while user editing on Input
   */
  const onInputFocus = fi => () => {
    setSelectedInput(fi);
  };

  /**
   * Enable Number formatting while user stop editing on Input
   */
  const onInputFocusOut = () => {
    setSelectedInput(null);
  };

  /**
   * Handle Change > Input Field Value in Formula
   *
   * @param {Number} fi
   */
  const onChangeInputValue = fi => (evt, value) => {
    const { formula } = col;

    const validValue = String(getNumbersWithFirstCharSymbol(value, true) || '');

    formula[fi].value = validValue;

    setFormula(formula);
  };

  /**
   * Use Input Filed as Table Field
   *
   * @param {Number} fi
   */
  const convertInputIntoField = fi => () => {
    const { formula = [] } = col;

    formula[fi] = { key: FORMULA_KEYS.FIELD };

    setFormula(formula);
  };

  /**
   * Check > Is Operator Allowed
   *
   * @param {Object} opt
   *
   * @return {Boolean}
   */
  const isOperatorAllowed = opt => {
    const { formula = [] } = col || {};
    const lastKey = formula[formula.length - 1] || {};

    switch (opt.key) {
      case FORMULA_KEYS.FIELD:
      case FORMULA_KEYS.INPUT:
        if (
          lastKey.key == FORMULA_KEYS.FIELD ||
          lastKey.key == FORMULA_KEYS.INPUT
        ) {
          return false;
        }

        return true;

      case FORMULA_KEYS.OPERATOR:
        if (lastKey.key && lastKey.key != opt.key) {
          return true;
        }

        return false;

      case FORMULA_KEYS.BRACKET:
        if (
          (!lastKey.key && opt.operator == '(') ||
          (lastKey.key == FORMULA_KEYS.OPERATOR && opt.operator == '(') ||
          (lastKey.key == '(' && opt.operator == '(') ||
          (lastKey.key == FORMULA_KEYS.FIELD && opt.operator == ')') ||
          (lastKey.key == FORMULA_KEYS.INPUT && opt.operator == ')')
        ) {
          return true;
        }

        return false;

      case FORMULA_KEYS.IF_OPERATOR:
        return false;

      default:
        return true;
    }
  };

  /**
   * Handle Click `Add Field | Operation | if`
   *
   * @param {Object} opt
   */
  const onClickOperator = ({
    opt,
    index,
    useAsInput = false,
    isAllowed = true,
  }) => evt => {
    if (!isAllowed) return;
    setActiveFxIndex(null);

    const { formula = [] } = col || {};
    const lastKey = formula[formula.length - 1] || {};

    switch (opt.key) {
      case FORMULA_KEYS.INPUT:
        if (
          lastKey.key == FORMULA_KEYS.FIELD ||
          lastKey.key == FORMULA_KEYS.INPUT
        ) {
          return;
        }
        formula.push({ ...opt });
        break;

      case FORMULA_KEYS.FIELD:
        setActiveFxIndex(index);
        toggleUseAsInput(useAsInput);
        setMenuEle(evt.currentTarget);
        break;

      case FORMULA_KEYS.OPERATOR:
        if (lastKey.key && lastKey.key != opt.key) {
          formula.push({ ...opt });
        }
        break;

      case FORMULA_KEYS.BRACKET:
        if (
          (!lastKey.key && opt.operator == ')') ||
          (lastKey.operator == '(' && opt.operator == ')')
        ) {
          return;
        }

        formula.push({ ...opt });
        break;

      case FORMULA_KEYS.IF_OPERATOR:
      default:
        return;
    }

    setFormula(formula);
  };

  /**
   * Get Fields List for `Add Field` Menu
   *
   * * @return {HTML}
   */
  const getFieldsList = () => {
    const { columns: targetColumns = [] } = step.targetTable || {};

    const filteredCols = targetColumns.filter(({ isNewCol }) => !isNewCol); // Excluded newly added fields

    const relatedColumns = (step.relatedTables || []).map(
      ({ columns = [] }) => columns
    );

    const input = {
      key: FORMULA_KEYS.INPUT,
      name: FORMULA_KEYS.INPUT,
      display_name: showUseAsInput ? 'Use as Input' : 'Add Input',
      data_type: COLUMN_DATA_TYPES_KEYS.amount,
    };

    let options = [];
    if (relatedColumns.length == 0) {
      options = [input, ...filteredCols];
    } else {
      options = [input, filteredCols, ...relatedColumns];
    }

    return (
      <Menu
        id="menu-fields"
        anchorEl={menuEle}
        keepMounted
        open={Boolean(menuEle)}
        onClose={closeFieldsList}
        PaperProps={{ style: { maxHeight: 360 } }}
      >
        {options.map(opt => {
          if (Array.isArray(opt)) {
            return opt.map((childOpt, i) => {
              return (
                <Box key={`${childOpt.tableName}-${childOpt.name}`}>
                  {i == 0 && (
                    <MenuItem selected>{childOpt.tableDisplayName}</MenuItem>
                  )}
                  <FieldMenuOption
                    opt={childOpt}
                    onClick={handleSelectedField(childOpt)}
                    ml={2}
                  />
                </Box>
              );
            });
          }

          return (
            <Box key={`${opt.tableName}-${opt.name}`}>
              <FieldMenuOption opt={opt} onClick={handleSelectedField(opt)} />
            </Box>
          );
        })}
      </Menu>
    );
  };

  /**
   * Get View of Formula [Field | Operator]
   *
   * @param {Object} fx
   * @param {Number} fi
   *
   * @return {HTML|Null}
   */
  const getFormulaView = (fx, fi) => {
    switch (fx.key) {
      case FORMULA_KEYS.FIELD:
        const fieldName = fx.display_name || `<Field>`;
        const tableName = fx.tableDisplayName || '<Table>';

        let label = `${fieldName} [${tableName}]`;

        if (fx.operation && fx.operation.key) {
          label = `${fx.operation.label}( ${label} )`;
        }

        return (
          <Box>
            <ButtonGroup size="small" color="primary">
              <Button
                onClick={onClickOperator({
                  opt: OPERATORS[0],
                  index: fi,
                  useAsInput: true,
                })}
              >
                {label}
              </Button>
              <Button onClick={openFieldOperationMenu(fi)}>
                <i>FX</i> <ArrowDropDownIcon fontSize="small" />
              </Button>
            </ButtonGroup>
          </Box>
        );

      case FORMULA_KEYS.OPERATOR:
      case FORMULA_KEYS.BRACKET:
        return <Box>{fx.label}</Box>;

      case FORMULA_KEYS.INPUT:
        return (
          <Autocomplete
            disableClearable
            value={{
              label:
                selectedInput !== fi
                  ? String(
                      getFormattedNumberWithNegative({
                        value: fx.value || '',
                        decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                      }) || ''
                    )
                  : String(fx.value) || '',
            }}
            selectOnFocus
            clearOnBlur
            freeSolo
            className="formula-input"
            size="small"
            name="label"
            variant="outlined"
            placeholder="Value"
            handleHomeEndKeys
            ListboxComponent={ListboxComponent}
            options={[{ label: 'Use as Field', key: FORMULA_KEYS.FIELD }]}
            renderOption={({ label }) => <i>{label}</i>}
            onChange={convertInputIntoField(fi)}
            getOptionLabel={({ label = '' }) => label}
            onInputChange={onChangeInputValue(fi)}
            onFocus={onInputFocus(fi)}
            onBlur={onInputFocusOut}
            renderInput={params => (
              <TextField
                {...params}
                variant="outlined"
                error={isSubmit && !fx.value}
              />
            )}
          />
        );

      case FORMULA_KEYS.IF_OPERATOR:
      default:
        return null;
    }
  };

  return (
    <Box className="calculation-wrap">
      <Box display="flex" alignItems="center" flexWrap="wrap" pr={5}>
        {OPERATORS.map(opt => {
          const isAllowed = isOperatorAllowed(opt);

          return (
            <Box
              className={`operators-list ${
                isAllowed ? '' : 'disable-operator'
              }`}
              m={1}
              key={opt.label}
              onClick={onClickOperator({ opt, isAllowed })}
            >
              {opt.label}
            </Box>
          );
        })}
      </Box>

      {getFieldsList()}

      <CustomScrollbars style={{ width: 'auto', height: '120px' }}>
        <Box className="formula-fix-list">
          {(col.formula || []).map((fx, fi) => (
            <Box key={fi} m={1} className="formula-fx-box">
              {getFormulaView(fx, fi)}
            </Box>
          ))}

          {(col.formula || []).length > 0 && (
            <DeleteForeverIcon
              fontSize="small"
              className="delete-fx-icon"
              onClick={deleteFormula}
            />
          )}
        </Box>
      </CustomScrollbars>

      <Menu
        id="field-operation-menu"
        anchorEl={fieldOperationEle}
        open={Boolean(fieldOperationEle)}
        TransitionComponent={Fade}
        onClose={handleFieldOperation(null)}
        keepMounted
      >
        {FIELD_OPERATIONS.map(opt => (
          <MenuItem key={opt.label} onClick={handleFieldOperation(opt)}>
            <Typography variant="body2">{opt.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

const FieldMenuOption = ({ opt, ml, onClick }) => {
  return (
    <MenuItem
      key={opt.name}
      onClick={onClick}
      disabled={opt.data_type != COLUMN_DATA_TYPES_KEYS.amount}
    >
      <Box ml={ml}>
        {opt.key == FORMULA_KEYS.INPUT ? (
          <i>{opt.display_name}</i>
        ) : (
          opt.display_name
        )}
      </Box>
    </MenuItem>
  );
};

FieldMenuOption.propTypes = {
  ml: number,
  onClick: func,
  opt: shape({}),
};

CalculatedField.propTypes = {
  col: shape({}).isRequired,
  isSubmit: bool,
  setFormula: func.isRequired,
  step: shape({}).isRequired,
};

CalculatedField.defaultProps = {};

export default CalculatedField;
