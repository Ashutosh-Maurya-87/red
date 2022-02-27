import React from 'react';
import { func, string, bool, arrayOf, shape } from 'prop-types';

import {
  withStyles,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@material-ui/core';

import { styles } from './styles';

class SingleSelect extends React.Component {
  handleOnChange = evt => {
    const { name, value } = evt.target;

    const selected = this.props.options.find(opt => opt.value == value);

    this.props.onChange(name, value, selected.option);
  };

  /**
   * Render View
   */
  render() {
    const {
      value,
      label,
      id,
      name,
      options,
      showLoader,
      placeholder,
      variant,
      classes,
      error,
      disabled,
      style,
    } = this.props;

    const attr = {
      label: label || undefined,
      disabled,
    };

    return (
      <FormControl
        variant={variant}
        style={style}
        className={`small-select ${classes.formControl}`}
      >
        {label && <InputLabel error={error}>{label}</InputLabel>}
        <Select
          {...attr}
          id={id}
          value={value}
          name={name}
          onChange={this.handleOnChange}
          error={error}
          defaultValue=""
        >
          {placeholder && (
            <MenuItem disabled value="">
              <em>{placeholder}</em>
            </MenuItem>
          )}

          {options.map(opt => {
            return (
              <MenuItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled || false}
              >
                {opt.label}
              </MenuItem>
            );
          })}

          {showLoader && (
            <MenuItem disabled value="">
              <em>Loading...</em>
            </MenuItem>
          )}
        </Select>
      </FormControl>
    );
  }
}

SingleSelect.propTypes = {
  disabled: bool,
  error: bool,
  id: string.isRequired,
  label: string,
  name: string.isRequired,
  onChange: func.isRequired,
  options: arrayOf(shape({})),
  placeholder: string,
  showLoader: bool,
  style: shape({}),
  value: string,
  variant: string,
};

SingleSelect.defaultProps = {
  disabled: false,
  error: false,
  label: '',
  placeholder: '',
  showLoader: false,
  value: '',
  variant: 'outlined',
};

export default withStyles(styles)(SingleSelect);
