import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { func, shape, string } from 'prop-types';
import { TextField } from '@material-ui/core';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import CircularProgress from '@material-ui/core/CircularProgress';

import ListboxComponent from '../../../../../components/CustomListBox';

import { API_URLS } from '../../../../../configs/api';

import { httpCancel, httpGet } from '../../../../../utils/http';
import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
} from '../../../../../configs/app';

const filter = createFilterOptions();

const DimensionDropdown = ({
  dimension = {},
  inputProps = {},
  autoCompleteProps = {},
  onChange = () => {},
  value = '',
}) => {
  // states
  const [isLoading, setIsLoading] = useState(true);
  const [dimensionCol, setDimensionCol] = useState([]);
  const [dimensionLabel, setDimension] = useState(value);

  /**
   * Getting meta-data of dimensionId
   */
  const dimensionListCallBack = async () => {
    const { id = '' } = dimension || {};

    try {
      const url = API_URLS.GET_DIMENSION_DATA_BY_ID.replace('#ID#', id);

      const { data = [] } = await httpGet(url);

      setDimensionCol(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  /**
   * Fetch List of Dimensions from API
   */
  const fetchDimensionsList = useCallback(dimensionListCallBack, []);

  /**
   * Fetching Dimension List on render
   */
  useEffect(() => {
    fetchDimensionsList();

    return () => {
      httpCancel();
    };
  }, [fetchDimensionsList]);

  /**
   * To select dimension from the list
   *
   * @param {String} type
   * @param {Object} dimensionOpt
   *
   * @returns
   */
  const handleOnChangeSelect = type => (event, dimensionOpt) => {
    const { label: dimeLabel = '', nameKeyValue = '' } = dimensionOpt || {};
    const { name = '' } = autoCompleteProps || {};

    setDimension(dimeLabel);
    onChange({ ...dimensionOpt, name, fieldName: nameKeyValue });
  };

  /**
   * Get options of auto complete
   *
   * @returns {Array}
   */
  const getAutoCompleteOptions = () => {
    const options = dimensionCol.map(dimensionOpt => {
      const { affa_h_key_name = '' } = dimensionOpt || {};
      const { identifierName = '', fieldName = '', dataType = '' } =
        dimension || {};

      const value =
        dataType == COLUMN_DATA_TYPES_KEYS.date
          ? `${
              moment(dimensionOpt[fieldName]).format(DEFAULT_DATE_FORMAT) || ''
            }`
          : `${dimensionOpt[fieldName]}`;

      const isMatched = fieldName == identifierName;
      const label = !isMatched
        ? `${dimensionOpt[identifierName] || ''} (${value})`
        : dimensionOpt[identifierName] || '';

      const singleOption = {
        label: label || affa_h_key_name || '',
        value: value || '',
        nameKeyValue: dimensionOpt[identifierName] || '',
        opt: dimensionOpt,
      };

      return singleOption;
    });

    return options;
  };

  return (
    <Autocomplete
      {...autoCompleteProps}
      id="dimension"
      fullWidth
      openOnFocus
      selectOnFocus
      clearOnBlur
      freeSolo
      loading={isLoading}
      ListboxComponent={ListboxComponent}
      handleHomeEndKeys
      value={{ label: dimensionLabel }}
      renderOption={({ label }) => label}
      onChange={handleOnChangeSelect('dimension')}
      options={getAutoCompleteOptions()}
      filterOptions={(options, params) => {
        return filter(options, params);
      }}
      getOptionLabel={option => option.label || ''}
      renderInput={params => (
        <TextField
          {...params}
          {...inputProps}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          variant="outlined"
          margin="dense"
          placeholder="Not Selected"
        />
      )}
    />
  );
};

/**
 * Prop-type validation
 */
DimensionDropdown.propTypes = {
  autoCompleteProps: shape({}),
  dimension: shape({}),
  inputProps: shape({}),
  onChange: func,
  value: string,
};

/**
 * Default props
 */
DimensionDropdown.defaultProps = {
  autoCompleteProps: {},
  dimension: {},
  inputProps: {},
  onChange: () => {},
};

export default DimensionDropdown;
