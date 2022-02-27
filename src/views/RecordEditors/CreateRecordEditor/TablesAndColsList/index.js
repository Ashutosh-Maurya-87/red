import React from 'react';
import { arrayOf, shape, number, func } from 'prop-types';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  ListItem,
  ListItemText,
  Collapse,
} from '@material-ui/core';

import { ExpandLess, ExpandMore } from '@material-ui/icons';

import CustomScrollbars from '../../../../components/ScrollBars';
import ColumnName from './ColumnName';

import './styles.scss';

function TablesAndColsList({ tables, updateState, height }) {
  /**
   * Toggle expanding of collapse
   *
   * @param {Number} index
   */
  const handleExpand = index => () => {
    const tablesCopy = [...tables];

    tablesCopy[index].isExpanded = !tablesCopy[index].isExpanded;

    updateState({ tables: tablesCopy });
  };

  return (
    <Paper elevation={1} square>
      <CustomScrollbars style={{ height }}>
        <Box p={3}>
          <Typography color="textSecondary" variant="h5">
            Available Fields
          </Typography>

          <Typography variant="caption" color="textSecondary">
            <i>
              Drag fields from following pane into the Record <br /> Editor
              interface
            </i>
          </Typography>

          {tables.map(({ columns, display_name, isExpanded }, tableIndex) => (
            <Box key={tableIndex}>
              <ListItem
                onClick={handleExpand(tableIndex)}
                disableGutters
                className="cursor-pointer"
              >
                <ListItemText
                  secondary={
                    <Typography variant="body1" color="textSecondary">
                      {display_name}
                    </Typography>
                  }
                />
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </ListItem>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box
                  className="drop-box-field"
                  mb={2}
                  borderRadius={6}
                  overflow="hidden"
                >
                  <Droppable
                    key={`dropable-table-${tableIndex}`}
                    droppableId={`dropable-table-${tableIndex}`}
                    isDropDisabled
                  >
                    {droppableProvided => (
                      <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        {columns &&
                          columns.map((column, columnIndex) => (
                            <Draggable
                              key={`column-${tableIndex}-${columnIndex}`}
                              draggableId={`column-${tableIndex}-${columnIndex}`}
                              isDragDisabled={Boolean(column.isAdded)}
                              index={columnIndex}
                            >
                              {draggableProvided => (
                                <div
                                  className="dragable-elems-list"
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                >
                                  <ColumnName column={column} />
                                </div>
                              )}
                            </Draggable>
                          ))}

                        {columns.length == 0 && (
                          <Box p={1} ml={1}>
                            <Typography variant="body2" color="textSecondary">
                              No column found
                            </Typography>
                          </Box>
                        )}

                        {droppableProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      </CustomScrollbars>
    </Paper>
  );
}

TablesAndColsList.propTypes = {
  height: number.isRequired,
  tables: arrayOf(shape({})),
  updateState: func.isRequired,
};

export default TablesAndColsList;
