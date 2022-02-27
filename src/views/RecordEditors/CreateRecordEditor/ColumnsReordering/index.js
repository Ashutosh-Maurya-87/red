/* eslint-disable react/prop-types */
import React from 'react';
import { arrayOf, bool, shape, func } from 'prop-types';

import {
  Grid,
  Box,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';

import {
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
} from '@material-ui/icons';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/**
 * Render Sheet (Headings Section)
 */
class ColumnsReordering extends React.Component {
  /**
   * State
   */
  state = {
    selectedHeaders: [],
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.setState({ selectedHeaders: this.props.selectedFields });
  }

  /**
   * Handle Drag-Drop
   */
  onDragEndReOrderFields = ({ source, destination }) => {
    if (!source || !destination) return;

    const { selectedHeaders } = this.state;

    const { index: sourceIndex } = source || {};
    const { index: destinationIndex } = destination || {};

    if (sourceIndex == destinationIndex) return;

    const result = [...selectedHeaders];
    const [removed] = result.splice(sourceIndex, 1);

    result.splice(destinationIndex, 0, removed);

    this.setState({ selectedHeaders: result });
  };

  /**
   * Handle Done
   */
  handleDone = () => {
    this.props.handleDone(this.state.selectedHeaders);
  };

  /**
   * Render View
   */
  render() {
    const { isOpen, handleClose } = this.props;
    const { selectedHeaders } = this.state;

    return (
      <Dialog
        fullWidth
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={isOpen}
      >
        <DialogTitle>
          <Grid
            container
            direction="row"
            justify="space-between"
            alignItems="center"
          >
            <Box>Reorder Fields</Box>
            <Box mr={-1}>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Grid>
        </DialogTitle>

        <DialogContent>
          <Box minHeight="250px">
            <Grid direction="row" container>
              <Grid
                item
                xs={12}
                container
                direction="row"
                className="translate-drag-col"
              >
                <DragDropContext onDragEnd={this.onDragEndReOrderFields}>
                  <Droppable droppableId="droppable">
                    {droppableProvided => (
                      <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        <Box
                          p={2}
                          pb={1}
                          border={1}
                          borderRadius={5}
                          height="100%"
                          borderColor="secondary.stepBorderColor"
                        >
                          {selectedHeaders.map((col, i) => {
                            return (
                              <Draggable
                                key={`selectedHeaders-${i}`}
                                draggableId={`selectedHeaders-${i}`}
                                index={i}
                              >
                                {draggableProvided => (
                                  <div
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                  >
                                    <Box
                                      bgcolor="secondary.processTable"
                                      className="create-dialog-grid"
                                      display="flex"
                                      alignItems="center"
                                      mb={1}
                                      p={1}
                                      borderRadius={4}
                                    >
                                      <DragIndicatorIcon fontSize="small" />

                                      <Typography variant="body2">
                                        {col.display_name || ''}
                                      </Typography>
                                    </Box>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </Box>
                        {droppableProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Box
            display="flex"
            justifyContent="end"
            alignItems="center"
            px={2}
            py={1}
          >
            <Box mr={1}>
              <Button
                autoFocus
                onClick={handleClose}
                color="primary"
                size="small"
              >
                Cancel
              </Button>
            </Box>
            <Button
              autoFocus
              onClick={this.handleDone}
              color="primary"
              variant="contained"
              size="small"
            >
              Apply
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  }
}

ColumnsReordering.propTypes = {
  handleClose: func.isRequired,
  handleDone: func.isRequired,
  isOpen: bool.isRequired,
  selectedFields: arrayOf(shape({})).isRequired,
};

export default ColumnsReordering;
