import React from 'react';
import { arrayOf, number, shape, func } from 'prop-types';

import { Droppable } from 'react-beautiful-dnd';
import { ResizableBox } from 'react-resizable';

import {
  Box,
  Paper,
  Typography,
  IconButton,
  withStyles,
  Tooltip,
} from '@material-ui/core';
import {
  Cancel as CancelIcon,
  Reorder as ReorderIcon,
} from '@material-ui/icons';

import CustomScrollbars from '../../../../components/ScrollBars';
import AmountGrid from '../AmountGrid';

import ColumnsReordering from '../ColumnsReordering';

import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import {
  FIELD_MIN_WIDTH,
  FIELD_DEFAULT_WIDTH,
  FIELD_DEFAULT_HEIGHT,
} from '../configs';

import { styles } from './styles';
import './styles.scss';

function CreateStructure({
  fields,
  height,
  width,
  updateState,
  amountColumns,
  dateColumns,
  tables,
}) {
  const [isOpenReordering, setReordering] = React.useState(false);

  /**
   * Handle > Remove Field
   *
   * @param {Number} index
   */
  const handleRemoveField = index => () => {
    try {
      const fieldsCopy = [...fields];
      const col = fieldsCopy[index];

      const tableIndex = tables.findIndex(({ id }) => id == col.user_table_id);

      const { columns } = tables[tableIndex];
      const colIndex = columns.findIndex(({ name }) => name == col.name);

      tables[tableIndex].columns[colIndex].isAdded = false;

      // Remove related fields
      if (tables[tableIndex]?.src_type === 'scenario') {
        const { dimension = null } = columns[colIndex] || {};

        if (dimension) {
          const { dimension_id = '', identifier = '', name_col = '' } =
            dimension || {};
          const dimesionTableIndex = tables.findIndex(
            ({ dimension_id: tableDimesionId }) =>
              tableDimesionId == dimension_id
          );

          const { columns } = tables[dimesionTableIndex] || {};

          columns.filter((col, colIndex) => {
            if (col.name == name_col || col.name == identifier) {
              tables[dimesionTableIndex].columns[colIndex].isAdded = false;
              return col;
            }

            return false;
          });
        }
      }

      fieldsCopy.splice(index, 1);
      updateState({ selectedFields: fieldsCopy, tables });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Handle > Remove Grid
   */
  const handleRemoveGrid = () => {
    const amtDateCols = [...amountColumns, ...dateColumns];

    const updatedTables = tables.map(table => {
      (table.columns || []).forEach((tableCol, tableColIndex) => {
        const matchedCol = amtDateCols.find(
          sf =>
            sf.id == tableCol.id && sf.user_table_id == tableCol.user_table_id
        );

        if (
          matchedCol &&
          (matchedCol.data_type == COLUMN_DATA_TYPES_KEYS.amount ||
            matchedCol.data_type == COLUMN_DATA_TYPES_KEYS.date)
        ) {
          table.columns[tableColIndex].isAdded = false;
        }
      });

      return table;
    });

    updateState({
      tables: updatedTables,
      amountColumns: [],
      dateColumns: [],
    });
  };

  /**
   * Handle > Resize Field
   *
   * @param {Number} index
   * @param {MouseEvent} evt
   * @param {Object} data
   */
  const handleResize = index => (evt, data) => {
    const { size: { width: fieldWidth = FIELD_DEFAULT_WIDTH } = {} } =
      data || {};

    const fieldsCopy = [...fields];

    const perWidth = Number(((fieldWidth / width) * 100).toFixed(2));

    fieldsCopy[index].width = fieldWidth;
    fieldsCopy[index].perWidth = perWidth;

    updateState({ selectedFields: fieldsCopy });
  };

  /**
   * Handle result of reorder fields
   *
   * @param {Array} reorderedFields
   */
  const handleReording = reorderedFields => {
    updateState({ selectedFields: reorderedFields });
    setReordering(false);
  };

  /**
   * Toggle Visibility > Reorder Dialog
   */
  const toggleReorderDialog = () => {
    setReordering(!isOpenReordering);
  };

  return (
    <Paper elevation={1} square id="record-editor-builder" style={{ height }}>
      <CustomScrollbars height={height}>
        <Box p={3}>
          <Box
            mb={3}
            display="flex"
            height="30px"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h5" color="textSecondary">
              Record Editor
            </Typography>
            {fields.length > 1 && (
              <Box ml={1}>
                <Tooltip title="Reorder Fields" placement="top">
                  <IconButton
                    color="primary"
                    component="span"
                    size="small"
                    onClick={toggleReorderDialog}
                  >
                    <ReorderIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Droppable key="field-dropable" droppableId="field-dropable">
            {(droppableProvided, { isDraggingOver }) => {
              return (
                <Box
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  {fields.length == 0 &&
                  amountColumns.length == 0 &&
                  dateColumns.length == 0 ? (
                    <Box
                      mx="auto"
                      mt={15}
                      className={`record-editor-drop empty-drag-drop-dialog ${
                        isDraggingOver ? 'active-dragging' : ''
                      }`}
                    >
                      <Typography
                        color="textSecondary"
                        variant="body1"
                        align="center"
                      >
                        <Box component="span" letterSpacing={1}>
                          Drag fields from right panel
                        </Box>
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      className={`record-editor-drop ${
                        isDraggingOver ? 'active-dragging' : ''
                      }`}
                    >
                      {fields.map((field, fieldIndex) => (
                        <ResizableBox
                          key={field.id}
                          axis="x"
                          width={field.width}
                          height={FIELD_DEFAULT_HEIGHT}
                          minConstraints={[FIELD_MIN_WIDTH, Infinity]}
                          maxConstraints={[width, Infinity]}
                          resizeHandles={['w', 'e']}
                          onResizeStop={handleResize(fieldIndex)}
                        >
                          <Box
                            className={`record-field ${
                              field.is_editable ? '' : 'disabled'
                            }`}
                            border={1}
                            borderColor="grey.800"
                            style={{ maxWidth: width }}
                          >
                            {field.display_name || ''}
                            <IconButton
                              aria-label="delete"
                              className="field-delete-btn"
                              onClick={handleRemoveField(fieldIndex)}
                              size="small"
                              color="primary"
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </ResizableBox>
                      ))}

                      {amountColumns.map((col, i) => (
                        <AmountGrid
                          key={`${col.user_table_id}-${col.id}`}
                          amountColumn={col}
                          index={i}
                          isRemoveGrid
                          onRemoveGrid={handleRemoveGrid}
                        />
                      ))}
                    </Box>
                  )}

                  {droppableProvided.placeholder}
                </Box>
              );
            }}
          </Droppable>

          {isOpenReordering && (
            <ColumnsReordering
              isOpen
              selectedFields={fields}
              handleClose={toggleReorderDialog}
              handleDone={handleReording}
            />
          )}
        </Box>
      </CustomScrollbars>
    </Paper>
  );
}

CreateStructure.propTypes = {
  amountColumns: arrayOf(shape({})).isRequired,
  dateColumns: arrayOf(shape({})).isRequired,
  fields: arrayOf(shape({})).isRequired,
  height: number.isRequired,
  tables: arrayOf(shape({})).isRequired,
  updateState: func.isRequired,
  width: number.isRequired,
};

export default withStyles(styles)(CreateStructure);
