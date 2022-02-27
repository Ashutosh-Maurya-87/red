import { get } from 'lodash';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import { defaultConfigs } from './Configs';

/**
 * Get formatted Field Configurations
 *
 * @param {Object} singleRBM
 * @returns {Array}
 */
export const getFormattedAttribute = singleRBM => {
  const attributes = get(singleRBM, 'configuration.attributes') || [];

  const formattedArray = attributes.map(
    (
      {
        data_type = '',
        date_format = '',
        display_name = '',
        required = false,
        name = '',
        id = '',
        dimension_mapping = {},
        tooltip = '',
      },
      index
    ) => {
      const newFormat = {
        ...defaultConfigs,
        tooltip,
        name,
        id,
        tempId: String(index),
        dataType: data_type,
        dateFormat: date_format,
        displayName: display_name,
        isSystem: required,
        isMapToDimension: Boolean(
          dimension_mapping && Object.keys(dimension_mapping).length > 0
        ),
        dimension: '',
        dimensionCol: '',
        isAddToHierarchy: false,
        isError: false,
      };

      if (dimension_mapping && Object.keys(dimension_mapping).length > 0) {
        newFormat.dimension = dimension_mapping?.dimension_id || '';
        newFormat.dimensionCol = dimension_mapping?.name || '';
      }

      return newFormat;
    }
  );

  return formattedArray;
};

/**
 * Get formatted hierarchies
 *
 * @param {Object} singleRBM
 * @returns {Array}
 */
export const getFormattedHierarchies = singleRBM => {
  const hierarchies = get(singleRBM, 'configuration.hierarchies') || [];
  const attributes = getFormattedAttribute(singleRBM);

  const formattedArray = [];
  hierarchies.filter(({ column = '' }) => {
    const index = attributes.findIndex(({ name }) => name == column);

    if (index > -1) {
      formattedArray.push(attributes[index]);
    }

    return false;
  });

  return formattedArray;
};

/**
 * Get formatted hierarchies
 *
 * @param {Object} state
 * @returns {Array}
 */
export const getFormattedParams = ({
  singleRBM,
  fieldConfigs,
  hierarchyConfigs,
}) => {
  let newParams = {};

  const attributes = [];
  const hierarchies = [];

  fieldConfigs.forEach(
    ({
      name,
      displayName,
      isSystem,
      dataType,
      dateFormat,
      isMapToDimension,
      id = '',
      dimension,
      dimensionCol,
      tooltip = '',
    }) => {
      const field = {
        data_type: dataType,
        date_format:
          !isMapToDimension && dataType == COLUMN_DATA_TYPES_KEYS.date
            ? dateFormat
            : '',
        display_name: displayName,
        id,
        tooltip,
        name: name ? name : displayName,
        required: isSystem,
        dimension_mapping: null,
      };

      if (isMapToDimension) {
        field.dimension_mapping = {
          dimension_id: dimension,
          name: dimensionCol,
        };
      }

      attributes.push(field);
    }
  );

  hierarchyConfigs.forEach(({ name, displayName }, index) => {
    const field = {
      column: name ? name : displayName,
      order: index + 1,
    };

    hierarchies.push(field);
  });

  newParams = {
    ...singleRBM.configuration,
    attributes,
    hierarchies,
  };

  delete newParams.configuration;

  return newParams;
};

/**
 * Identify the duplicate tab name
 *
 * @param {Array} tabs
 * @param {String} name
 */
export const isDuplicateTabExist = (tabs, name) => {
  const result = tabs.filter(tab => tab.displayName === name);

  return result.length > 0 ? true : false;
};

/**
 * Generate new tab
 *
 * @param {Array} tabs
 * @param {Number} Count
 *
 * @return {Object}
 */
export const genrateTab = (tabs, count) => {
  const id = count + 1;
  const name = `Field ${id}`;

  if (isDuplicateTabExist(tabs, name)) {
    return genrateTab(tabs, id);
  }

  return name;
};
