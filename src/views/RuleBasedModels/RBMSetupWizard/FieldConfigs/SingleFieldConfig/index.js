import React, { useCallback, useEffect, useState } from 'react';
import { bool, func, number, shape, string } from 'prop-types';

import {
  Box,
  Checkbox,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Lock as LockIcon,
} from '@material-ui/icons';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';

import ListboxComponent from '../../../../../components/CustomListBox';
import Spinner from '../../../../../components/Spinner';

import { API_URLS } from '../../../../../configs/api';
import { RULE_BASED_MODELS_MSG } from '../../../../../configs/messages';
import {
  AI_MODULES_DISPLAY_NAME,
  COLUMN_DATA_TYPES,
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATATYPE,
  DEFAULT_DATE_FORMAT,
  EXCEL_DATE_FORMATS,
} from '../../../../../configs/app';

import { httpGet } from '../../../../../utils/http';
import { validateNameWithUnderScore } from '../../../../../utils/helper/validateName';

const filter = createFilterOptions();

/**
 * Wrapper for system field to show tooltip
 * @param {Object} props
 * @returns Node
 */
const CustomExpansionPanelSummary = props => {
  const { tooltip = '' } = props;

  return tooltip ? (
    <Tooltip title={tooltip} placement="top-start">
      <ExpansionPanelSummary {...props} />
    </Tooltip>
  ) : (
    <ExpansionPanelSummary {...props} />
  );
};

CustomExpansionPanelSummary.propTypes = {
  tooltip: string,
};

const SingleFieldConfig = ({
  config,
  index,
  onDelete,
  isSubmit,
  updateConfigs,
  // onHierarchyAddRemove,
}) => {
  const [showLoader, setLoader] = useState(false);

  // Dimension and columns list
  const [dimensions, setDimensions] = useState([]);
  const [dimensionCols, setDimensionCols] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    dataType = '',
    dateFormat = '',
    isError = false,
    isExpanded = false,
    isMapToDimension = false,
    isSystem = false,
    // isAddToHierarchy = false,
    dimension = {},
    dimensionCol = {},
    displayName = '',
    tooltip = '',
  } = config || {};

  /**
   * ON Click => Toggle Accordion
   */
  const onExpandFC = (event, expended) => {
    if (isSystem) return;

    const updatedField = { ...config, isExpanded: expended };

    updateConfigs(updatedField, index);
  };

  /**
   * Handle Input => For Title, Params
   *
   * @param {Object} event
   */
  const handleInput = ({ target: { value = '' } = {} }) => {
    const updatedField = { ...config, displayName: value };

    updateConfigs(updatedField, index);

    // Input field name validation
    const isNameValid = validateNameWithUnderScore(value);

    if (!isNameValid) {
      return setErrorMsg(
        !value
          ? RULE_BASED_MODELS_MSG.field_name_required
          : RULE_BASED_MODELS_MSG.invalid_name_message
      );
    }

    if (isNameValid && errorMsg) setErrorMsg('');
    return updatedField;
  };

  /**
   * ON change => Map To Dimension Checkbox
   */
  const handleMapToDimension = () => {
    const updatedField = {
      ...config,
      isMapToDimension: !isMapToDimension,
      dataType: DEFAULT_DATATYPE,
      dateFormat: DEFAULT_DATE_FORMAT,
      dimension: '',
      dimensionCol: '',
    };

    updateConfigs(updatedField, index);
  };

  /**
   * ON change => Add To Hierarchy Checkbox
   */
  // const handleAddHierarchy = () => {
  //   const updatedField = {
  //     ...config,
  //     isAddToHierarchy: !isAddToHierarchy,
  //   };

  //   onHierarchyAddRemove(updatedField);
  //   updateConfigs(updatedField, index);
  // };

  /**
   * Select > DataType -> Amount, AlphaNumeric, Date
   *
   * @param {Object} dataType
   */
  const handleDataTypeSelection = (event, selectOpt) => {
    const { value = '' } = selectOpt || {};

    const updatedField = {
      ...config,
      dataType: value,
      dateFormat:
        value == COLUMN_DATA_TYPES_KEYS.date ? DEFAULT_DATE_FORMAT : '',
    };

    updateConfigs(updatedField, index);
  };

  /**
   * Select -> Date-Format --> YYYY-MM-DD, MMM YYYY, MM/DD/YY Etc.
   *
   * @param {Object} format
   */
  const handleDateFormatSelection = (evt, format) => {
    const { value = '' } = format || {};
    const updatedField = {
      ...config,
      dateFormat: value,
    };

    updateConfigs(updatedField, index);
  };

  /**
   * Dimension call back
   *
   * @returns
   */
  const dimensionListCallBack = async () => {
    try {
      if (showLoader) return;

      setLoader(true);

      const url = API_URLS.GET_DIMENSION_LIST;
      const { dimensions_table_info: { data = [] } = {} } = await httpGet(url);

      setDimensions([...dimensions, ...data]);

      if (dimension) {
        fetchDimensionColumn(dimension);
      }

      setLoader(false);
    } catch (error) {
      setLoader(false);
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
  }, [fetchDimensionsList]);

  /**
   * Handle Dimension Selection
   *
   * @param {Object} event
   * @param {Object} dimension
   * @returns
   */
  const handleDimensionSelection = (event, dimension) => {
    const { value = '' } = dimension || {};

    // Store selected dimension
    const updatedField = {
      ...config,
      dimension: value,
      dimensionCol: null,
    };

    updateConfigs(updatedField, index);

    if (value) {
      fetchDimensionColumn(value);
    }
  };

  /**
   * Fetch Dimension from API
   */
  const fetchDimensionColumn = async dimension => {
    try {
      if (showLoader) return;
      setLoader(true);

      const url = API_URLS.GET_DIMENSION_DATA_BY_ID.replace('#ID#', dimension);
      const { meta_data = [] } = await httpGet(url);

      // Store selected dimension columns
      setDimensionCols(meta_data);

      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  };

  /**
   * Select single Column of Dimension
   *
   * @param {Object} dimeCol
   */
  const getDimensionColumn = (event, dimeCol) => {
    try {
      setLoader(true);
      const { value = '', option = {} } = dimeCol || {};

      const { data_type = '' } = option || {};

      let updatedField = {
        ...config,
        dimensionCol: value,
      };

      if (data_type) {
        updatedField = {
          ...updatedField,
          dataType: data_type,
        };
      }

      updateConfigs(updatedField, index);

      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  };

  /**
   * Filter label key
   * @param {Array} data
   * @param {String} valueToMatch
   * @param {String} matchKey
   * @param {String} keyToGetAsLabel
   * @returns {String}
   */
  const getLabel = (data, valueToMatch, matchKey, keyToGetAsLabel) => {
    const filteredResult = data.filter(item => valueToMatch == item[matchKey]);

    if (filteredResult.length > 0) {
      return filteredResult[0][keyToGetAsLabel];
    }

    return '';
  };

  return (
    <ExpansionPanel
      className="field-expansion-panel"
      expanded={isExpanded}
      style={{ border: isSubmit && isError ? '1px solid red' : '' }}
      onChange={onExpandFC}
    >
      <CustomExpansionPanelSummary
        className={`${
          isSystem ? 'system-panel-disabled' : ''
        } field-expansion-panel-summary`}
        expandIcon={<ExpandMoreIcon />}
        IconButtonProps={{
          disabled: isSystem ? true : false,
        }}
        tooltip={tooltip}
        aria-controls="panel-content"
        id="panel-header"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box maxWidth={'80%'} display="flex" alignItems="center">
            <Typography noWrap>{displayName} &nbsp;</Typography>
            <span>
              {isMapToDimension ? `(${AI_MODULES_DISPLAY_NAME.dimension})` : ''}
            </span>
          </Box>
          {isSystem ? (
            <Box mr={0.5} display="flex">
              <LockIcon disabled fontSize="small" />
            </Box>
          ) : (
            <Box mr={-1}>
              <IconButton>
                <DeleteIcon
                  fontSize="small"
                  onClick={onDelete(config, index)}
                />
              </IconButton>
            </Box>
          )}
        </Box>
      </CustomExpansionPanelSummary>
      <ExpansionPanelDetails className="field-expansion-panel-detail">
        <Box display="flex" flexDirection="column">
          <TextField
            name="subsidiaryName"
            required
            autoComplete="off"
            autoFocus
            variant="outlined"
            label="Name"
            margin="dense"
            fullWidth
            value={displayName}
            onChange={event => handleInput(event)}
            error={Boolean(errorMsg)}
            helperText={errorMsg}
          />
          <Box my={2}>
            <FormControlLabel
              control={
                <Checkbox
                  name="checkedBox"
                  checked={isMapToDimension}
                  color="primary"
                  onChange={handleMapToDimension}
                />
              }
              label={`Map To ${AI_MODULES_DISPLAY_NAME.dimension}`}
            />
          </Box>
          <Grid container spacing={3}>
            {isMapToDimension ? (
              <>
                <Grid item sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    {showLoader && <Spinner />}

                    <Autocomplete
                      clearOnBlur
                      fullWidth
                      filterOptions={(options, params) => {
                        return filter(options, params);
                      }}
                      freeSolo
                      getOptionLabel={({ label = '' }) => label}
                      getOptionDisabled={({ label, is_disabled }) =>
                        label == dimension?.label || is_disabled
                      }
                      handleHomeEndKeys
                      ListboxComponent={ListboxComponent}
                      onChange={handleDimensionSelection}
                      openOnFocus
                      options={dimensions.map(singleDimension => ({
                        label: `${singleDimension?.display_name}`,
                        value: singleDimension?.id,
                        option: singleDimension,
                      }))}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={`Select ${AI_MODULES_DISPLAY_NAME.dimension} Table`}
                          placeholder={`Select ${AI_MODULES_DISPLAY_NAME.dimension} Table`}
                          margin="dense"
                          id="dimensionTableID"
                          error={isSubmit && isMapToDimension && !dimension}
                          variant="outlined"
                        />
                      )}
                      renderOption={({ label }) => label}
                      selectOnFocus
                      value={{
                        label: getLabel(
                          dimensions,
                          dimension,
                          'id',
                          'display_name'
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid item sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    {showLoader && <Spinner />}

                    <Autocomplete
                      clearOnBlur
                      disabled={!dimension}
                      filterOptions={(options, params) => {
                        return filter(options, params);
                      }}
                      freeSolo
                      fullWidth
                      getOptionLabel={({ label = '' }) => label}
                      handleHomeEndKeys
                      ListboxComponent={ListboxComponent}
                      onChange={getDimensionColumn}
                      openOnFocus
                      options={dimensionCols.map(dimenCol => ({
                        label: `${dimenCol.display_name}`,
                        value: dimenCol.name,
                        option: dimenCol,
                      }))}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={`Select Field From ${AI_MODULES_DISPLAY_NAME.dimension}`}
                          placeholder={`Select Field From ${AI_MODULES_DISPLAY_NAME.dimension}`}
                          id="dimensionFieldID"
                          margin="dense"
                          error={isSubmit && isMapToDimension && !dimensionCol}
                          variant="outlined"
                        />
                      )}
                      renderOption={({ label }) => label}
                      selectOnFocus
                      value={{
                        label: getLabel(
                          dimensionCols,
                          dimensionCol,
                          'name',
                          'display_name'
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
              </>
            ) : (
              <>
                <Grid item sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    <Autocomplete
                      clearOnBlur
                      fullWidth
                      filterOptions={(options, params) => {
                        return filter(options, params);
                      }}
                      freeSolo
                      getOptionLabel={({ label = '' }) => label}
                      handleHomeEndKeys
                      ListboxComponent={ListboxComponent}
                      onChange={handleDataTypeSelection}
                      openOnFocus
                      options={COLUMN_DATA_TYPES.map(dataTypeConfig => ({
                        label: `${dataTypeConfig.label}`,
                        value: dataTypeConfig.value,
                        option: dataTypeConfig,
                      }))}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Data Type"
                          margin="dense"
                          placeholder="Data Type"
                          error={!dataType}
                          variant="outlined"
                          helperText={
                            !dataType && RULE_BASED_MODELS_MSG.required
                          }
                        />
                      )}
                      renderOption={({ label }) => label}
                      selectOnFocus
                      value={{
                        label: getLabel(
                          COLUMN_DATA_TYPES,
                          dataType,
                          'value',
                          'label'
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                {/* Date Format Selection */}
                <Grid item sm={12} md={6}>
                  {dataType == COLUMN_DATA_TYPES_KEYS.date && (
                    <FormControl
                      variant="outlined"
                      fullWidth
                      className="date-select"
                    >
                      <Autocomplete
                        clearOnBlur
                        fullWidth
                        filterOptions={(options, params) => {
                          return filter(options, params);
                        }}
                        freeSolo
                        getOptionLabel={({ label = '' }) => label}
                        handleHomeEndKeys
                        ListboxComponent={ListboxComponent}
                        onChange={handleDateFormatSelection}
                        openOnFocus
                        options={EXCEL_DATE_FORMATS.map(dateType => ({
                          label: `${dateType.label}`,
                          value: dateType.value,
                          option: dateType,
                        }))}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label="Date Format"
                            margin="dense"
                            placeholder="Date Format"
                            error={!dateFormat}
                            helperText={
                              !dateFormat && RULE_BASED_MODELS_MSG.required
                            }
                            variant="outlined"
                            id="data-type-select"
                          />
                        )}
                        renderOption={({ label }) => label}
                        selectOnFocus
                        value={{
                          label: getLabel(
                            EXCEL_DATE_FORMATS,
                            dateFormat,
                            'value',
                            'label'
                          ),
                        }}
                      />
                    </FormControl>
                  )}
                </Grid>
              </>
            )}
          </Grid>
          {/* <Box my={2}>
            <FormControlLabel
              control={
                <Checkbox
                  name="checkedB"
                  color="primary"
                  checked={isAddToHierarchy}
                  disabled={!displayName}
                  onChange={handleAddHierarchy}
                />
              }
              label="Add To Hierarchy"
            />
          </Box> */}
        </Box>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};

SingleFieldConfig.propTypes = {
  config: shape({}).isRequired,
  index: number.isRequired,
  isSubmit: bool,
  onDelete: func.isRequired,
  onHierarchyAddRemove: func.isRequired,
  updateConfigs: func.isRequired,
};

export default SingleFieldConfig;
