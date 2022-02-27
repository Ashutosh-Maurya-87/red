import {
  AI_MODULES_DISPLAY_NAME,
  PRE_DEFINED_LABELS,
} from '../../../configs/app';

export const SCENARIO_ACTIONS = {
  view: 'Open',
  assignLabel: 'Assign Label',
  rename: 'Rename',
  configuration: 'Configurations',
  relation: 'Relationship',
  archive: 'Archive',
  restore: 'Restore',
  delete: 'Delete',
  export: 'Export',
};

/**
 * Export Scenario options > Export types
 */
export const SCENARIO_EXPORT_KEYS = {
  Actuals: PRE_DEFINED_LABELS.actuals.label,
  dimensions: `${AI_MODULES_DISPLAY_NAME.dimensions}`,
  time_hierarchies: 'Time Hierarchies',
  time_variables: 'Time Variables',
};

/**
 * Get export Array
 *
 * @return {Object}
 */
function getExportOptions() {
  const options = [];

  Object.keys(SCENARIO_EXPORT_KEYS).forEach(key => {
    const obj = {
      label: SCENARIO_EXPORT_KEYS[key],
      value: key,
      isSelected: true,
    };

    options.push({ ...obj });
  });

  return options;
}

/**
 * Export options > Array
 */
export const EXPORT_OPTIONS_ARRAY = getExportOptions();
