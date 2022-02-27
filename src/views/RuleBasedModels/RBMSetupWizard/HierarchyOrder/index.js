import React from 'react';
import { arrayOf, func, shape } from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DragIndicator as DragIndicatorIcon } from '@material-ui/icons';
import { Box, Grid, Paper, Typography } from '@material-ui/core';

const HierarchyOrder = ({ configs, updateConfigs }) => {
  /**
   * On drag end
   * @param {Object} result
   * @returns
   */
  const onDragEnd = result => {
    const { source = {}, destination = {} } = result || {};
    const { index: sourceIndex = 0 } = source || {};
    const { index: destIndex = 0 } = destination || {};
    if (!destination || !source) {
      return;
    }

    updateConfigs(reorder(configs, sourceIndex, destIndex));
  };

  /**
   *  Styling of lists
   */
  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    margin: `0 0 10px 0`,
    ...draggableStyle,
  });

  /**
   * reordering the Hierarchy order
   *
   * @param {Array} list
   * @param {Number} startIndex
   * @param {Number} endIndex
   * @returns {Array} result (Updated List Array)
   */
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  return (
    <>
      <Grid item sm={12} lg={4}>
        <Paper
          elevation={1}
          className="hierarchy-order"
          style={{
            position: 'sticky',
            top: '0',
            maxHeight: 'calc(100vh - 232px)',
            overflow: 'auto',
          }}
        >
          <Box pb={2} display="flex" flexDirection="column">
            <Typography
              color="textSecondary"
              variant="body2"
              className="uppercase"
              gutterBottom
            >
              Hierarchy Order
            </Typography>

            <Typography variant="caption" color="textSecondary">
              <i>
                This Hierarchy order will be used to display organizational view
                in hierarchy view
              </i>
            </Typography>
          </Box>

          <Box>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {configs.map((item, index) => (
                      <Draggable
                        key={index}
                        draggableId={`${item?.name}-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style
                            )}
                            className="hierarchy-order-div"
                          >
                            <Box
                              bgcolor="secondary.processTable"
                              mb={1}
                              borderRadius={6}
                              display="flex"
                              alignItems="center"
                              py={1}
                              px={0.5}
                              className="cursor-pointer"
                              id={`hierarchy-order-${item.labelKey}`}
                            >
                              <DragIndicatorIcon />
                              <Typography noWrap variant="body2">
                                {/* Subsidiary */}
                                {item?.displayName}
                              </Typography>
                            </Box>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        </Paper>
      </Grid>
    </>
  );
};

HierarchyOrder.propTypes = {
  configs: arrayOf(shape({})),
  updateConfigs: func,
};

export default HierarchyOrder;
