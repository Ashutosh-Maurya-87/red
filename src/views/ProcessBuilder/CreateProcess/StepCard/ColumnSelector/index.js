import React from 'react';
import { func, string, bool, arrayOf, number, shape } from 'prop-types';
import { withStyles, TextField, Typography } from '@material-ui/core';

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import ListboxComponent from '../../../../../components/CustomListBox';

import { styles } from './styles';
import './styles.scss';

const filter = createFilterOptions();

class ColumnSelector extends React.Component {
  /**
   * Handle > Select Source Table
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  handleOnChange = (evt, opt) => {
    const { name, onChange } = this.props;

    const val = opt.map(({ value }) => value);

    onChange(name, val);
  };

  /**
   * Get Selectd Values for Input
   *
   * @return {Array|Object|String}
   */
  getSelectedValues = () => {
    const { value, columnList } = this.props;

    let selectedValue = [];
    if (value) {
      selectedValue = columnList
        .map(({ name, display_name }) => {
          if (!value.includes(String(name))) return '';

          return { label: display_name, value: String(name) };
        })
        .filter(Boolean);
    }

    return { selectedValue };
  };

  /**
   * Render View
   */
  render() {
    const {
      label,
      id,
      name,
      classes,
      error,
      helperText,
      coreProps,
      limitTags,
      columnList,
      isDisablePrimary,
    } = this.props;

    const { selectedValue } = this.getSelectedValues();

    return (
      <Autocomplete
        autoComplete
        autoHighlight
        disableClearable
        filterSelectedOptions
        multiple
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        freeSolo
        openOnFocus
        id={id}
        name={name}
        value={selectedValue}
        limitTags={limitTags}
        ListboxComponent={ListboxComponent}
        className={`small-select ${classes.formControl}`}
        options={columnList.map(column => ({
          label: column.display_name,
          value: column.name,
          option: column,
        }))}
        onChange={this.handleOnChange}
        getOptionLabel={({ label = '' }) => label}
        getOptionDisabled={({ option: { is_primary = false } }) =>
          isDisablePrimary && is_primary
        }
        renderOption={({ label }) => <Typography noWrap>{label}</Typography>}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            placeholder="Select"
            error={error}
            helperText={helperText}
          />
        )}
        filterOptions={(options, params) => {
          return filter(options, params).filter(({ value }) => {
            return !this.props.value.includes(value);
          });
        }}
        {...coreProps}
      />
    );
  }
}

ColumnSelector.propTypes = {
  columnList: arrayOf(shape({})),
  coreProps: shape({}),
  error: bool,
  helperText: string,
  id: string.isRequired,
  isDisablePrimary: bool,
  label: string.isRequired,
  limitTags: number,
  name: string.isRequired,
  onChange: func.isRequired,
  value: arrayOf(string),
};

ColumnSelector.defaultProps = {
  columnList: [],
  coreProps: {},
  error: false,
  helperText: '',
  limitTags: 3,
  value: [],
  isDisablePrimary: false,
};

export default withStyles(styles)(ColumnSelector);
