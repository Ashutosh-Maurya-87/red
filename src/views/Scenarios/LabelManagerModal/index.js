import React, { useCallback, useEffect } from 'react';
import { func, bool, string, oneOfType, number } from 'prop-types';

import {
  Grid,
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Fab,
  Input,
  Button,
} from '@material-ui/core';

import {
  Check as CheckIcon,
  EditRounded as EditRoundedIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@material-ui/icons';

import PerfectScrollbar from 'react-perfect-scrollbar';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Spinner from '../../../components/Spinner';

import { API_URLS } from '../../../configs/api';
import { PRE_DEFINED_LABELS } from '../../../configs/app';
import { ERROR_MESSAGES, SCENARIOS_MSG } from '../../../configs/messages';

import { httpPost, httpGet, httpDelete } from '../../../utils/http';
import { showSuccessMsg } from '../../../utils/notifications';
import validateString from '../../../utils/helper/validateString';

import './styles.scss';

function LabelManagerModal({
  isOpen,
  handleClose,
  title,
  onLabelSelected,
  onLabelRenamed,
  selectedLabel,
  scenarioId,
}) {
  const [labelName, setLabelName] = React.useState('');
  const [lablesList, setLabelsList] = React.useState([]);
  const [isFetching, setIsFetching] = React.useState(false);

  const [isVisibleConfirmation, setConfirmation] = React.useState(false);
  const [confirmMsg, setConfirmMsg] = React.useState('');

  const [selectedItem, setSelectedItem] = React.useState(null);
  const [isDeleting, setDeleting] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);
  const [isSubmit, setSubmit] = React.useState(false);
  const errLabelName =
    isSubmit && !validateString(labelName) ? ERROR_MESSAGES.required : '';

  // Editing State
  const [renameLabel, setRenameLabel] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);

  /**
   * Get selected value in label list
   *
   * @return {Boolean}
   */
  const getIsCheckedItem = () => {
    const isSelectedItem = lablesList.filter(label => label.isSelected);

    return Boolean(isSelectedItem && isSelectedItem.length > 0);
  };

  /**
   * Get selected value in label list
   *
   * @return {Object}
   */
  const getChekcedItem = () => {
    const isSelectedItem = lablesList.filter(label => label.isSelected);

    return isSelectedItem && isSelectedItem.length > 0 ? isSelectedItem[0] : {};
  };

  const isChecked = getIsCheckedItem();

  /**
   * Handle Input Change > Add label field
   *
   * @param {Object}
   */
  const onChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, 50);
    setLabelName(validName);
  };

  /**
   * Handle Input Change > Edit label field
   *
   * @param {Object}
   */
  const onEditChangeName = ({ target: { value } }, i) => {
    const validName = value.substring(0, 50);
    setRenameLabel(validName);
  };

  /**
   * Get Label Listing
   */
  const getLabels = async () => {
    try {
      if (isFetching) return;

      setIsFetching(true);

      const url = API_URLS.GET_LABELS;

      const { data = [] } = await httpGet(url);

      const tempList = data.map(label => {
        if (label.name === selectedLabel) {
          return {
            ...label,
            isSelected: true,
          };
        }

        return label;
      });

      setLabelsList(tempList);
      setIsFetching(false);
    } catch (error) {
      console.error(error);
      setIsFetching(false);
    }
  };

  /**
   * Callback > Get Labels
   */
  const getLabelsCallback = useCallback(getLabels, []);

  /**
   * Load Data on Load Component
   */
  useEffect(() => {
    getLabelsCallback();
  }, [getLabelsCallback]);

  /**

   * Handle Click > assign|unassign label
   *
   * @param {String} label
   */
  const handleAssignRemoveLabel = async () => {
    try {
      if (isLoading) return;

      const label = getChekcedItem();
      const { name, id } = label || {};

      if (name === selectedLabel) {
        handleCloseModal();
        return;
      }

      setLoading(true);

      let url = !isChecked ? API_URLS.UNASSIGN_LABEL : API_URLS.ASSIGN_LABEL;
      url = url.replace('#ID#', scenarioId);

      let params = {};
      if (isChecked) {
        params = new FormData();
        params.append('label_id', id);
      }

      const { data } = await httpPost(url, params);

      const msg = !isChecked
        ? SCENARIOS_MSG.label_unassign
        : SCENARIOS_MSG.label_assign;

      showSuccessMsg(msg);

      setLoading(false);
      onLabelSelected(data);
      handleCloseModal();
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  /**
   * toggle > select label
   *
   * @param {Boolean} value
   * @param {Number|String} index
   */
  const toggleIsSelect = (value, index) => {
    const tempList = [...lablesList];

    tempList[index].isSelected = value;
    setLabelsList(tempList);
  };

  /**
   * Handle Click > Select label
   *
   * @param {string} label
   */
  const handleLabelClick = (label, index) => () => {
    let tempList = [...lablesList];

    const { isSelected = false } = label;

    if (isSelected) {
      toggleIsSelect(false, index);
      return;
    }

    tempList = tempList.map(label => {
      label.isSelected = false;
      return label;
    });

    setLabelsList(tempList);
    toggleIsSelect(true, index);
  };

  /**
   * Handle Click > Select label
   *
   * @param {String} label
   */
  const handleAddNewLabelClick = async evt => {
    try {
      evt.preventDefault();
      setSubmit(true);

      if (!labelName) return;
      setIsAdding(true);

      const url = API_URLS.ADD_LABEL;
      const params = { name: labelName };

      const { data, message } = await httpPost(url, params);

      showSuccessMsg(message);

      const list = [...lablesList];
      list.unshift(data);
      setLabelsList(list);

      setIsAdding(false);
      setSubmit(false);
      setLabelName('');
    } catch (error) {
      setIsAdding(false);
      console.error(error);
    }
  };

  /**
   * Handle Click > Delete label
   *
   * @param {Object} label
   */
  const handleDeleteLabel = label => () => {
    const { name } = label || {};

    setSelectedItem(label);
    setConfirmation(true);
    setConfirmMsg(`Are you sure to delete "${name}" label?`);
  };

  /**
   * toggle > Editing label
   *
   * @param {Boolean} value
   * @param {Number|String} index
   */
  const toggleIsEditEnable = (value, index) => {
    const tempList = [...lablesList];

    tempList[index].isEditEnable = value;
    setLabelsList(tempList);
  };

  /**
   * Handle Click > Edit label
   *
   * @param {Object} label
   * @param {Number|String} index
   */
  const handleEditLabel = (label, index) => () => {
    const { name } = label || {};

    let tempList = [...lablesList];

    tempList = tempList.map(label => {
      label.isEditEnable = false;
      return label;
    });

    setLabelsList(tempList);
    toggleIsEditEnable(true, index);

    setRenameLabel(name);
    setSelectedItem(label);
  };

  /**
   * Handle Close Modal without data
   */
  const handleCloseModal = () => {
    handleClose(false);
  };

  /**
   * Handle confirmation modal close event
   */
  const handleConfirmationClose = async action => {
    try {
      if (!action) {
        setConfirmation(false);
        setSelectedItem(null);
        return;
      }

      if (isDeleting) return;
      setDeleting(true);

      const url = API_URLS.DELETE_LABEL.replace('#ID#', selectedItem.id);

      const { message = '' } = await httpDelete(url);

      showSuccessMsg(message);

      let list = [...lablesList];
      list = list.filter(({ id }) => id !== selectedItem.id);
      setLabelsList(list);

      setDeleting(false);
      setConfirmMsg('');
      setConfirmation(false);
    } catch (error) {
      setDeleting(false);
      console.error(error);
    }
  };

  /**
   * Handle > Rename Label > API Call
   */
  const handleRenameLabel = index => async () => {
    try {
      if (!renameLabel || isRenaming) return;

      if (selectedItem.name === renameLabel) {
        toggleIsEditEnable(false, index);
        return;
      }
      setIsRenaming(true);

      const url = API_URLS.UPDATE_LABEL.replace('#ID#', selectedItem.id);

      const params = { name: renameLabel };

      const { data } = await httpPost(url, params);

      onLabelRenamed(selectedItem.name, data.name);

      let tempList = [...lablesList];

      tempList = tempList.map(record => {
        if (record.id === selectedItem.id) {
          record.name = data.name;
        }
        return record;
      });

      setLabelsList(tempList);

      toggleIsEditEnable(false, index);
      setIsRenaming(false);
    } catch (error) {
      setIsRenaming(false);
      console.error(error);
    }
  };

  return (
    <>
      <Dialog
        maxWidth="xs"
        fullWidth
        onClose={handleCloseModal}
        aria-labelledby="customized-label-manager"
        open={isOpen}
      >
        <DialogTitle
          id="customized-label-manager"
          onClose={handleCloseModal}
          className="modal-title"
        >
          <Grid
            container
            direction="row"
            justify="space-between"
            alignItems="center"
          >
            <Box>{title}</Box>
            <Box mr={-1}>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Grid>
        </DialogTitle>

        <DialogContent className="padding-0">
          {isLoading && <Spinner />}

          {isFetching && (
            <Box display="flex" alignItems="center" justifyContent="center">
              <CircularProgress className="hierarchy-loader" fontSize="large" />
            </Box>
          )}

          <PerfectScrollbar style={{ maxHeight: '400px', padding: '8px 24px' }}>
            {lablesList.map((label, index) => (
              <Box
                display="flex"
                justifyContent="space-between"
                key={index}
                className={`label-list ${
                  label.name === selectedLabel ? 'selected-label' : ''
                } `}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  minHeight="35px"
                  width="80%"
                  disabled={label.name == PRE_DEFINED_LABELS.actuals.label}
                  onClick={
                    !label.isEditEnable && handleLabelClick(label, index)
                  }
                  className={`${!label.isEditEnable ? 'cursor-pointer' : ''} `}
                >
                  <Box
                    width="30px"
                    flexShrink={0}
                    display="flex"
                    justifyContent="center"
                  >
                    {label.isSelected && <CheckIcon fontSize="small" />}
                  </Box>

                  {!label.isEditEnable && (
                    <Typography variant="body2" component="p" noWrap>
                      {label.name || ''}
                    </Typography>
                  )}

                  {label.isEditEnable && (
                    <Input
                      className="editlabel"
                      autoFocus
                      required
                      fullWidth
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          handleRenameLabel(index)(event);
                        }
                      }}
                      placeholder="Required*"
                      value={renameLabel}
                      error={!renameLabel}
                      onChange={onEditChangeName}
                    />
                  )}
                </Box>

                <Box display="flex" alignItems="center" justifyContent="center">
                  {label.is_system_label && (
                    <IconButton disabled size="small">
                      <LockIcon fontSize="small" />
                    </IconButton>
                  )}

                  {!label.isEditEnable && !label.is_system_label && (
                    <>
                      <IconButton
                        size="small"
                        onClick={handleEditLabel(label, index)}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        disabled={label.is_assigned}
                        size="small"
                        onClick={handleDeleteLabel(label)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}

                  {label.isEditEnable && (
                    <>
                      {isRenaming && (
                        <CircularProgress
                          className="hierarchy-loader"
                          size={18}
                        />
                      )}

                      {!isRenaming && (
                        <>
                          <IconButton
                            size="small"
                            className="hover-icon"
                            color="primary"
                            onClick={handleRenameLabel(index)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            className="hover-icon"
                            onClick={() => {
                              if (isRenaming) return;
                              toggleIsEditEnable(false, index);
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            ))}

            {!isFetching && lablesList.length === 0 && (
              <Box display="block" textAlign="center">
                <i>Please add new label.</i>
              </Box>
            )}

            <form noValidate onSubmit={handleAddNewLabelClick}>
              <Box display="flex" my={2} alignItems="center" width="100%">
                <TextField
                  name="labelName"
                  value={labelName}
                  onChange={onChangeName}
                  required
                  autoComplete="off"
                  fullWidth
                  placeholder="Label Name..."
                  label="Add New Label"
                  error={Boolean(errLabelName)}
                  helperText={errLabelName || ''}
                />

                {isAdding && (
                  <Box className="hover-icon" pl={2} pr={1} pt={2}>
                    <CircularProgress className="hierarchy-loader" size={24} />
                  </Box>
                )}

                {!isAdding && (
                  <Box width="55px" textAlign="right">
                    <Fab
                      type="submit"
                      size="small"
                      color="primary"
                      onClick={handleAddNewLabelClick}
                    >
                      <CheckIcon />
                    </Fab>
                  </Box>
                )}
              </Box>
            </form>
          </PerfectScrollbar>
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
              <Button color="primary" onClick={handleCloseModal} size="small">
                Cancel
              </Button>
            </Box>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={isLoading || (!isChecked && !selectedLabel)}
              onClick={handleAssignRemoveLabel}
              color="primary"
            >
              {(isChecked || !selectedLabel) && 'Assign'}
              {selectedLabel && !isChecked && 'Unassign'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {isVisibleConfirmation && (
        <ConfirmationModal
          handleClose={handleConfirmationClose}
          showLoader={isDeleting}
          isOpen
          title="Delete Label"
          yesText="delete"
          noText={isDeleting ? '' : 'Cancel'}
          action="delete"
          msg={confirmMsg}
        />
      )}
    </>
  );
}

LabelManagerModal.propTypes = {
  handleClose: func.isRequired,
  isOpen: bool.isRequired,
  onLabelRenamed: func.isRequired,
  onLabelSelected: func.isRequired,
  scenarioId: oneOfType([number, string]),
  selectedLabel: string,
  title: string,
};

LabelManagerModal.defaultProps = {
  selectedLabel: '',
  title: 'Assign Label',
  onLabelRenamed: () => {},
};

export default LabelManagerModal;
