import { ASSUMPTION_SCOPES_KEYS } from './configs';
import { ASSUMPTIONS_MSG, ERROR_MESSAGES } from '../../configs/messages';
import { FIELD_TYPE_KEYS } from './AssumptionsSheet/configs';
import {
  DEFAULT_COL_HEADER,
  getEmptyGridRow,
  makeCopy,
  validateLabelPattern,
} from './AssumptionsSheet/helper';

/**
 * Assumption Keys
 */
export const ASSUMPTION_KEYS = {
  descriptionKey: 'description',
  descriptionLabel: 'Description',

  labelKey: 'label',
  labelLabel: 'Label',

  valueKey: 'value',
  valueLabel: 'Value',
};

/**
 * Get Formatted data to fill in Assumption Grid
 *
 * @param {Object}
 *
 * @return {Object}
 */
export const getFormattedAssumptionToFill = ({ description, entities }) => {
  try {
    const headers = [
      { width: 50 },
      { label: 'Description', width: 250, rowSpan: 2 },
    ];

    const data = [];
    const [labelHeader] = DEFAULT_COL_HEADER;

    let colIndex = 2;
    entities.forEach((entity, entityIndex) => {
      const { data: entityData } = entity;

      description.forEach((desc, rowIndex) => {
        const { label = '', value = '' } = entityData[rowIndex] || {};

        if (!data[rowIndex]) data[rowIndex] = [];

        data[rowIndex][0] = {};
        data[rowIndex][1] = { value: desc };

        data[rowIndex][colIndex] = { value: label };
        data[rowIndex][colIndex + 1] = { value };

        // when Data type is percentage then multiply value field with 100 to show accurate value
        if (entity.type == FIELD_TYPE_KEYS.percentage) {
          data[rowIndex][colIndex + 1].value = String(
            data[rowIndex][colIndex + 1].value * 100
          );
        }
      });

      colIndex += 2;

      headers.push({
        ...makeCopy(labelHeader),
        label: entity.name,
        type: entity.type,
      });

      headers.push({
        ...makeCopy(labelHeader),
        label: '',
      });
    });

    const emptyRow = getEmptyGridRow(headers.length);
    data.push(emptyRow);

    return { headers, data };
  } catch (err) {
    console.error(err);
    return { headers: [], data: [] };
  }
};

/**
 * Get Formatted Params to Save Assumption Data
 *
 * @param {Object} that
 *
 * @return {Object}
 */
export const getFormattedParamsToSaveAssumption = that => {
  const {
    assumption,
    gridHeaders,
    gridData,
    setGridHeaders,
    setGridData,
  } = that.props;

  const { model } = that.state;

  let errMsg = '';

  const descriptionArray = [];
  const entityArray = [];

  const entityNames = {};
  const descriptionsNames = {};
  const variableNames = {};

  let entity = {};
  let entityData = [];

  gridHeaders.forEach((headerCell, colIndex) => {
    if (colIndex == 0) return;

    if (colIndex % 2 == 0) {
      entityData = [];

      // Validate Entity Names
      if (entityNames[headerCell.label] || !headerCell.label) {
        errMsg = ASSUMPTIONS_MSG.fill_valid_data;
        gridHeaders[colIndex].error = headerCell.label
          ? ASSUMPTIONS_MSG.duplicate
          : ERROR_MESSAGES.required;
      } else {
        entityNames[headerCell.label] = true;
      }
    }

    for (let rowIndex = 0; rowIndex < gridData.length - 1; rowIndex++) {
      gridData[rowIndex][colIndex].error = '';

      const cell = gridData[rowIndex][colIndex];

      // Description Cell
      if (colIndex == 1) {
        descriptionArray.push(cell.value);

        // Validate Descriptions
        if (descriptionsNames[cell.value] || !cell.value) {
          // Error when duplicate description
          errMsg = cell.value
            ? ASSUMPTIONS_MSG.duplicate_description.replace(
                '#DESCRIPTION#',
                cell.value
              )
            : ASSUMPTIONS_MSG.fill_valid_data;

          gridData[rowIndex][colIndex].error = cell.value
            ? ASSUMPTIONS_MSG.duplicate_description.replace(
                '#DESCRIPTION#',
                cell.value
              )
            : ERROR_MESSAGES.required;
        } else {
          descriptionsNames[cell.value] = true;
        }
      } else if (colIndex > 1) {
        // Label Cell
        if (colIndex % 2 == 0) {
          entity = {
            name: headerCell.label,
            type: headerCell.type,
            label_name: 'Label',
            value_name: 'Value',
          };

          entityData.push({ label: cell.value });

          // Validate Variables
          if (variableNames[cell.value] || !cell.value) {
            // Error when duplicate description
            errMsg = cell.value
              ? ASSUMPTIONS_MSG.duplicate_label.replace('#LABEL#', cell.value)
              : ASSUMPTIONS_MSG.fill_valid_data;

            gridData[rowIndex][colIndex].error = cell.value
              ? ASSUMPTIONS_MSG.duplicate_label.replace('#LABEL#', cell.value)
              : ERROR_MESSAGES.required;
          } else if (validateLabelPattern(cell.value)) {
            errMsg = ASSUMPTIONS_MSG.validate_label_pattern;

            gridData[rowIndex][colIndex].error = cell.value
              ? 'Duplicate'
              : ERROR_MESSAGES.required;
          } else {
            variableNames[cell.value] = true;
          }
        } else if (colIndex % 2 == 1) {
          // Value Cell
          gridHeaders[colIndex - 1].type === FIELD_TYPE_KEYS.percentage
            ? (entityData[rowIndex].value = String(cell.value / 100))
            : (entityData[rowIndex].value = cell.value);
        }
      }
    }

    if (colIndex > 1 && colIndex % 2 == 1) {
      entity.data = makeCopy(entityData);
      entityArray.push(entity);
    }
  });

  if (
    descriptionArray.length == 0 ||
    entityArray.length == 0 ||
    entityArray[0].data.length == 0
  ) {
    errMsg = ASSUMPTIONS_MSG.add_one_valid_row;
  }

  const params = {
    name: assumption.name,
    scope: assumption.scope,
    model_id:
      assumption.scope == ASSUMPTION_SCOPES_KEYS.local
        ? model.id || null
        : null,
    grid_data: {
      description: descriptionArray,
      entities: entityArray,
    },
  };

  setGridHeaders(gridHeaders);
  setGridData(gridData);

  return { params, errMsg };
};

/**
 * Get params to create empty assumptions
 *
 * @param {String} name
 * @param {String} scope
 * @param {Number || String} modelId
 *
 * @returns {Object}
 */
export const getFormattedEmptyAssumptionParams = (name, scope, modelId) => {
  const params = {
    name,
    scope,
    model_id: null,
    grid_data: {
      description: [],
      entities: [
        {
          name: 'Column 1',
          type: 'number',
          label_name: 'Label',
          value_name: 'Value',
          data: [],
        },
      ],
    },
  };

  if (scope == ASSUMPTION_SCOPES_KEYS.local) {
    params.model_id = modelId;
  }

  return params;
};
