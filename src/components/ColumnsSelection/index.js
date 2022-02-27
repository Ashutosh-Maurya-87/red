import React from 'react';
import { arrayOf, bool, func, shape } from 'prop-types';
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
  Checkbox,
} from '@material-ui/core';

import {
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
} from '@material-ui/icons';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { PROCESS_MANAGER_MSG } from '../../configs/messages';
import { showErrorMsg } from '../../utils/notifications';

/**
 * Render Sheet (Headings Section)
 *
 * @param {Object} props
 */
class ColumnsSelection extends React.Component {
  /**
   * State
   */
  state = {
    allHeaders: [],
    selectedHeaders: [],
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { headers = [], selectedHeaders = [] } = this.props;

    const allHeaders = headers.map(header => {
      let isSelected = false;

      selectedHeaders.forEach(({ label, value }) => {
        if (value == header.value && label == header.label) {
          isSelected = true;
        }
      });

      return { ...header, isSelected };
    });

    this.setState({ allHeaders, selectedHeaders });
  }

  /**
   * Handle Done
   */
  handleDone = () => {
    const { allHeaders, selectedHeaders } = this.state;

    this.props.onDone({ allHeaders, selectedHeaders });
  };

  /**
   * Handle Columns Selection
   *
   * @param {Object} col
   * @param {Number} i
   */
  handleSelection = (col, i) => () => {
    const { allHeaders, selectedHeaders } = this.state;

    if (!col.isSelected) selectedHeaders.push(col);

    if (selectedHeaders.length == 1) {
      showErrorMsg(PROCESS_MANAGER_MSG.translate_table_col_required);
      return;
    }

    // Remove Column
    if (col.isSelected) {
      let selectedIndex = -1;
      selectedHeaders.find(({ label, value }, j) => {
        if (value == col.value && label == col.label) {
          selectedIndex = j;
          return true;
        }

        return false;
      });

      if (selectedIndex >= 0) selectedHeaders.splice(selectedIndex, 1);
    }

    allHeaders[i].isSelected = !col.isSelected;

    this.setState({ allHeaders, selectedHeaders });
  };

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
   * Render View
   */
  render() {
    const { isOpen, onClose, isEnableReordering } = this.props;
    const { allHeaders, selectedHeaders } = this.state;

    return (
      <Dialog
        fullWidth
        onClose={onClose}
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
            <Box>Customize Columns</Box>
            <Box mr={-1}>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Grid>
        </DialogTitle>

        <DialogContent>
          <Box minHeight="250px">
            <Box mb={3}>
              <Grid direction="row" container>
                <Grid
                  item
                  xs={isEnableReordering ? 6 : 12}
                  container
                  direction="row"
                  alignItems="center"
                >
                  <Typography variant="body1" color="textSecondary">
                    All Available Columns
                  </Typography>
                </Grid>
                {isEnableReordering && (
                  <Grid
                    item
                    xs={6}
                    container
                    direction="row"
                    alignItems="center"
                  >
                    <Typography variant="body1" color="textSecondary">
                      Columns Order
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Grid direction="row" container>
              <Grid
                item
                xs={isEnableReordering ? 6 : 12}
                container
                direction="row"
              >
                <Box
                  width="100%"
                  mr={isEnableReordering ? 3 : 0}
                  p={1}
                  border={1}
                  borderRadius={5}
                  borderColor="secondary.stepBorderColor"
                >
                  {allHeaders.map((col, i) => {
                    const { label = '' } = col || {};

                    return (
                      <Box
                        key={label}
                        display="flex"
                        alignItems="center"
                        className="cursor-pointer"
                        onClick={this.handleSelection(col, i)}
                      >
                        <Checkbox
                          value="isSelected"
                          color="primary"
                          checked={col.isSelected || false}
                          onChange={() => {}}
                        />
                        <Typography variant="body2">{label || ''}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>

              {/* Reordering section */}
              {isEnableReordering && (
                <Grid
                  item
                  xs={6}
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
                            border={1}
                            borderRadius={5}
                            height="100%"
                            borderColor="secondary.stepBorderColor"
                          >
                            {selectedHeaders.map((col, i) => {
                              const { label = '' } = col || {};

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
                                      >
                                        <DragIndicatorIcon />

                                        <Typography>{label || ''}</Typography>
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
              )}
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
              <Button autoFocus onClick={onClose} color="primary" size="small">
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

ColumnsSelection.propTypes = {
  headers: arrayOf(shape({})),
  isEnableReordering: bool,
  isOpen: bool,
  onClose: func,
  onDone: func,
  selectedHeaders: arrayOf(shape({})),
};

ColumnsSelection.defaultProps = {
  headers: [],
  isOpen: false,
  isEnableReordering: true,
  selectedHeaders: [],
  onDone: () => {},
  onClose: () => {},
};

export default ColumnsSelection;
