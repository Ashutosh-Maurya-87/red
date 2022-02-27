import { DEFAULT_DATE_FORMAT, DEFAULT_DATATYPE } from '../../../../configs/app';

/**
 * Default configs for Field Configuration
 */
export const defaultConfigs = {
  // Keys to store values
  name: '',
  displayName: '',
  isMapToDimension: false,
  dimension: '',
  dimensionCol: '',
  dataType: DEFAULT_DATATYPE,
  dateFormat: DEFAULT_DATE_FORMAT,
  isAddToHierarchy: false,
  tempId: '',

  // Validation keys
  isExpanded: false,
  isSystem: false,
  isError: false,
};
