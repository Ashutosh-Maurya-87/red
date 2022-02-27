import React from 'react';
import { shape, number } from 'prop-types';
import moment from 'moment';

import {
  TextField,
  IconButton,
  InputAdornment,
  Badge,
  Tooltip,
} from '@material-ui/core';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import {
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@material-ui/icons';

import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import ListboxComponent from '../../../../components/CustomListBox';

import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DECIMAL_PLACE,
} from '../../../../configs/app';
import { API_URLS } from '../../../../configs/api';

import { httpGet } from '../../../../utils/http';
import { getFormattedNumberWithNegative } from '../../../../utils/helper/getFormattedNumber';

const filter = createFilterOptions();

/**
 * Get Formatted Inputs Data
 *
 * @param {Object}
 *
 * @return {Object}
 */
export const getFormattedInputsData = ({
  data,
  isAddNew,
  selectedFields,
} = {}) => {
  const inputs = {};
  const inputsLabels = {};

  if (isAddNew) {
    selectedFields.forEach(field => {
      inputs[`${field.user_table_id}-${field.name}`] = '';
    });

    return { inputs, selectedFields };
  }

  const fieldsData = data.fields_data || [];

  selectedFields.forEach(field => {
    const dataField = fieldsData.find(f => {
      return f.id == field.id && f.table_id == field.user_table_id;
    });

    if (dataField) {
      const { data_type, date_format } = dataField;

      field.is_related = dataField.is_related;
      field.dimension_source_table_id = dataField.dimension_source_table_id;
      field.dimension_id = dataField.dimension_id || '';
      field.dimension_alias = dataField.dimension_alias || '';

      field.dimension_alias = dataField.dimension_alias || '';
      field.identifier_col = dataField.identifier_col;
      field.src_type = dataField.src_type;
      field.src_type_id = dataField.src_type_id;
      field.name_col = dataField.name_col;

      if (dataField.value && data_type == COLUMN_DATA_TYPES_KEYS.date) {
        dataField.value = moment(dataField.value).format(date_format);
      }

      inputs[`${dataField.table_id}-${dataField.name}`] = dataField.value;
      inputsLabels[`${dataField.table_id}-${dataField.name}`] = dataField.label;
    } else {
      inputs[`${field.user_table_id}-${field.name}`] = '';
      inputsLabels[`${field.user_table_id}-${field.name}`] = '';
    }
  });

  return { inputs, inputsLabels, selectedFields };
};

/**
 * Load More Relational Data
 *
 * @param {Object} options
 * @param {Object} that
 */
const loadMoreRelationalData = (
  { field, fieldIndex, fieldName },
  that
) => () => {
  const { relationOptions = {} } = that.state;

  let options = [];
  let pagination = {
    total: 0,
  };

  if (relationOptions[fieldName] && relationOptions[fieldName].options) {
    ({ options, pagination } = relationOptions[fieldName]);
  }

  if (
    !pagination ||
    !options ||
    !pagination.total ||
    pagination.total >= options.length
  ) {
    return null;
  }

  return null;
};

/**
 * Get input box as per field type
 *
 * @param {Object} { field, fieldIndex }
 * @param {Object} that [this Object of Update Record Component]
 *
 * @return {HTML|null}
 */
export const getInputAsPerType = ({ field, fieldIndex }, that) => {
  const {
    inputs,
    inputsLabels,
    relationOptions = {},
    activeInput,
    filtersEle,
    colValuesList,
    areFieldsEditing,
  } = that.state;

  let isNewOptionAdd = false;

  const { name: activeInputName } = activeInput || {};

  let isEnabled = Boolean(field.data_type);
  if (isEnabled) isEnabled = field.is_editable ? true : false;

  const fieldName = `${field.user_table_id}-${field.name}`;
  let value = inputs[fieldName] || '';
  const LabelField = inputsLabels[fieldName] || '';

  const { identifier_col = '', name_col = '' } = field || {};

  const commonProps = {
    name: field.name,
    label: field.display_name,
    placeholder: field.display_name,
    value,
    autoComplete: 'off',
    variant: 'outlined',
    size: 'small',
    style: { width: '100%' },
    disabled: !isEnabled,
    onChange: that.onChangeInput(field, fieldIndex),
  };

  /**
   * Handle > On Change Select (Relation Data)
   *
   * @param {Object} options
   */
  const handleOnChangeSelect = ({ fieldName, field }) => (evt, opt) => {
    const {
      option = {},
      isNewAdd = false,
      dimensionId = null,
      dimensionAlias = '',
      inputValue = '',
    } = opt || {};

    const { identifier_col = '', name_col = '' } = field || {};

    // when new option is created
    if (isNewAdd) {
      that.setState({
        isOpenDimensionDialog: true,
        dimensionId,
        dimensionAlias,
        fieldName,
        tempIdentifierCol: identifier_col,
        inputValue,
        tempNameCol: name_col,
      });
    }

    const id = option[field.identifier_col];
    const name = option[field.name_col];

    // inputs[fieldName] = String(`${name} ${id ? `(${id})` : ''}`);
    inputsLabels[fieldName] = name;
    inputs[fieldName] = id;

    if (id != undefined && field.is_related) {
      Object.keys(option).forEach(optionKey => {
        const nameKey = `${field.dimension_source_table_id}-${optionKey}`;
        if (inputs[nameKey] != undefined) inputs[nameKey] = option[optionKey];
      });
    }

    that.setState({ inputs, inputsLabels, hasUnsavedChanges: true });
  };

  /**
   * On Clear filters on GL id
   *
   * @param {String} fieldName
   * @returns
   */
  const onClearFilter = ({ fieldName }) => {
    inputsLabels[fieldName] = null;
    inputs[fieldName] = null;

    that.setState({ inputsLabels, inputs, hasUnsavedChanges: true });
  };

  /**
   * Fetch Options [Calling API]
   *
   * @param {Object} options
   * @param {Object} evt
   */
  const fetchOptions = ({ fieldName, field }) => async evt => {
    if (
      !field.identifier_col ||
      !field.dimension_source_table_id ||
      relationOptions[fieldName]
    ) {
      return;
    }

    let url = API_URLS.GET_RELATED_FIELD_OPTIONS_RE;
    url = url.replace('#ID#', field.dimension_source_table_id);

    try {
      relationOptions[fieldName] = { isFetching: true };

      that.setState({ showLoader: true, relationOptions });

      const { data } = await httpGet(url);

      const filterData = data.filter(colData => colData);

      const item = { options: filterData, isFetching: false };

      relationOptions[fieldName] = item;

      that.setState({ showLoader: false, relationOptions });
    } catch (err) {
      console.error(err);

      delete relationOptions[fieldName];
      that.setState({ showLoader: false, relationOptions });
    }
  };

  /**
   * On Press KeyDown|Tab in Target Column
   *
   * @param {object} props
   * @param {Object} evt
   */
  const onKeyDownDestination = props => evt => {
    switch (evt.key) {
      case 'Tab':
        const {
          fieldName = '',
          field = {},
          dimensionId = null,
          dimensionAlias = '',
        } = props || {};

        const { identifier_col = '', name_col = '' } = field || {};

        // when new option is created
        if (isNewOptionAdd) {
          evt.preventDefault();

          that.setState({
            isOpenDimensionDialog: true,
            dimensionId,
            dimensionAlias,
            fieldName,
            tempIdentifierCol: identifier_col,
            tempNameCol: name_col,
          });
        }
        break;

      default:
        break;
    }
  };

  /**
   * Get formatted list of options (relational data)
   */
  const getFormattedOptions = () => {
    let options = [];

    if (
      field.identifier_col &&
      relationOptions[fieldName] &&
      relationOptions[fieldName].options
    ) {
      ({ options } = relationOptions[fieldName]);

      if (Array.isArray(options)) {
        options = options.map(opt => {
          const id = opt[field.identifier_col];
          const optName = opt[field.name_col] || '';

          return {
            label: String(`${optName} ${id != optName ? `(${id})` : ''}`),
            option: opt,
          };
        });
      }
    }

    return options;
  };

  /**
   * On focus when user starts edit
   */
  const onInputFocus = event => {
    const { target: { name = '' } = {} } = event || {};

    that.setState({
      isEditing: true,
      areFieldsEditing: { ...areFieldsEditing, [name]: true },
    });
  };

  /**
   * On Focus out- when user click outside the input box
   */
  const onInputFocusOut = event => {
    const { target: { name = '' } = {} } = event || {};

    that.setState({
      isEditing: false,
      areFieldsEditing: { ...areFieldsEditing, [name]: false },
    });
  };

  const {
    is_related,
    name,
    user_table_id,
    dimension_id = null,
    dimension_alias = '',
  } = field;

  const { count } = colValuesList[field.id] || {};

  switch (field.data_type) {
    case COLUMN_DATA_TYPES_KEYS.alphanumeric:
      if (is_related) {
        const fieldName = `${user_table_id}-${name}`;
        const displayValue = identifier_col != name_col ? value : '';

        commonProps.onChange = undefined;

        return (
          <Tooltip
            title={
              LabelField || displayValue ? `${LabelField} ${displayValue}` : ''
            }
            placement="bottom-start"
          >
            <Autocomplete
              value={{
                label:
                  value && LabelField !== null
                    ? String(`${LabelField} ${displayValue}`)
                    : '',
              }}
              selectOnFocus
              loading={(relationOptions[fieldName] || {}).isFetching || false}
              clearOnBlur
              disableClearable
              blurOnSelect
              handleHomeEndKeys
              ListboxComponent={ListboxComponent}
              ListboxProps={{
                state: that.state,
                loadMoreTables: loadMoreRelationalData(
                  { field, fieldIndex, fieldName },
                  that
                ),
              }}
              className="small-select"
              options={getFormattedOptions()}
              getOptionLabel={opt => {
                return opt.label;
                // const id = opt[field.identifier_col];
                // const optName = opt[field.name_col] || '';

                // return String(`${id}${optName ? ` (${optName})` : ''}`);
              }}
              onChange={handleOnChangeSelect({ fieldName, field })}
              renderInput={params => {
                return (
                  <TextField
                    {...params}
                    {...commonProps}
                    onKeyDown={onKeyDownDestination({
                      fieldName,
                      field,
                      dimensionId: dimension_id,
                      dimensionAlias: dimension_alias,
                    })}
                    onFocus={fetchOptions({ fieldName, field })}
                    InputLabelProps={{ shrink: true }}
                    placeholder=""
                    InputProps={{
                      ...params.InputProps,
                      className: 'record-editor-input',
                      endAdornment: (
                        <InputAdornment position="end">
                          {/* close icon to clear filter on GL account */}
                          {(LabelField || value) && (
                            <IconButton
                              size="small"
                              className={'record-editor-filter'}
                              onClick={() => onClearFilter({ fieldName })}
                              edge="end"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          )}

                          <IconButton
                            size="small"
                            className={
                              (activeInputName == field.name && filtersEle) ||
                              count
                                ? ''
                                : 'record-editor-filter'
                            }
                            onClick={that.showFiltersDialog(field)}
                            edge="end"
                          >
                            {count ? (
                              <Badge
                                badgeContent={count}
                                max={100000}
                                color="primary"
                              >
                                <FilterListIcon fontSize="small" />
                              </Badge>
                            ) : (
                              <FilterListIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                );
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue = '' } = params || {};

                const isMatchedName = filtered.findIndex(
                  ({ label }) => label.toUpperCase() == inputValue.toUpperCase()
                );

                // Suggest the creation of a new value
                if (isMatchedName && inputValue !== '') {
                  isNewOptionAdd = true;

                  filtered.push({
                    inputValue,
                    isNewAdd: true,
                    label: `Add "${inputValue}"`,
                    dimensionId: dimension_id,
                    dimensionAlias: dimension_alias,
                  });
                }

                return filtered;
              }}
            />
          </Tooltip>
        );
      }

      return (
        <Tooltip title={value} placement="bottom-start">
          <TextField
            {...commonProps}
            InputLabelProps={{ shrink: true }}
            placeholder=""
            InputProps={{
              className: 'record-editor-input',
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    className={
                      (activeInputName == field.name && filtersEle) || count
                        ? ''
                        : 'record-editor-filter'
                    }
                    onClick={that.showFiltersDialog(field)}
                    edge="end"
                  >
                    {count ? (
                      <Badge badgeContent={count} max={100000} color="primary">
                        <FilterListIcon fontSize="small" />
                      </Badge>
                    ) : (
                      <FilterListIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Tooltip>
      );

    case COLUMN_DATA_TYPES_KEYS.date:
      value = (value && moment(value, field.date_format)) || null;

      return (
        <Tooltip title={value} placement="bottom-start">
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <DatePicker
              {...commonProps}
              autoOk
              variant="dialog"
              inputVariant="outlined"
              helperText=""
              format={field.date_format}
              value={value}
              InputLabelProps={{ shrink: true }}
              placeholder=""
              onChange={commonProps.onChange}
              InputProps={{
                className: 'record-editor-input',
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      className={
                        (activeInputName == field.name && filtersEle) || count
                          ? ''
                          : 'record-editor-filter'
                      }
                      onClick={that.showFiltersDialog(field)}
                      edge="end"
                    >
                      {count ? (
                        <Badge
                          badgeContent={count}
                          max={100000}
                          color="primary"
                        >
                          <FilterListIcon fontSize="small" />
                        </Badge>
                      ) : (
                        <FilterListIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </MuiPickersUtilsProvider>
        </Tooltip>
      );

    case COLUMN_DATA_TYPES_KEYS.amount:
      return (
        <Tooltip
          title={
            !areFieldsEditing[field.name]
              ? getFormattedNumberWithNegative({
                  value: value || '',
                  decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                })
              : String(value)
          }
          placement="bottom-start"
        >
          <TextField
            {...commonProps}
            onFocus={onInputFocus}
            onBlur={onInputFocusOut}
            value={
              !areFieldsEditing[field.name]
                ? getFormattedNumberWithNegative({
                    value: value || '',
                    decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                  })
                : String(value)
            }
            InputLabelProps={{ shrink: true }}
            placeholder=""
            InputProps={{
              className: 'record-editor-input',
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    className={
                      (activeInputName == field.name && filtersEle) || count
                        ? ''
                        : 'record-editor-filter'
                    }
                    onClick={that.showFiltersDialog(field)}
                    edge="end"
                  >
                    {count ? (
                      <Badge badgeContent={count} max={100000} color="primary">
                        <FilterListIcon fontSize="small" />
                      </Badge>
                    ) : (
                      <FilterListIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Tooltip>
      );

    default:
      return null;
  }
};

/**
 * Prop Types of Get Input As Per Type
 */
getInputAsPerType.propTypes = {
  field: shape({}),
  fieldIndex: number,
};
