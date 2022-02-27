import { get } from 'lodash';

/**
 * Get Formatted Record Editors
 *
 * @param {Array} data
 *
 * @param {Array}
 */
export const getFormattedRecordEditors = data => {
  return data.map(item => {
    return { ...item, ...getSrcDetails(item) };
  });
};

/**
 * Get Source details for Record Editor
 *
 * @param {Object} recordEditor
 *
 * @param {Object}
 */
export const getSrcDetails = recordEditor => {
  let srcType = '';
  let srcIcon = '';
  let srcName = '';

  switch (recordEditor.ref_type) {
    case 'source-table':
      srcType = 'Source Table';
      srcName = get(recordEditor, 'src_table.display_name') || '';
      srcIcon = 'source-table.svg';
      break;

    case 'scenario':
      srcType = 'Scenario';
      srcIcon = 'scenario.svg';
      srcName = get(recordEditor, 'scenario.scenario_meta.dataset_name') || '';
      break;

    default:
      break;
  }

  return { srcType, srcIcon, srcName };
};
