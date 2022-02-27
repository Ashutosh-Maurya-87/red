import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { func, bool, string, oneOfType, number } from 'prop-types';
import {
  Grid,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Typography,
} from '@material-ui/core';
import { ArrowRightAlt } from '@material-ui/icons';
import Spinner from '../../../../../components/Spinner';

import { API_URLS } from '../../../../../configs/api';
import { httpPost } from '../../../../../utils/http';
import { fetchLevelsConfigs } from '../../../../../services/Dimensions';

import {
  setLevelsVisibilities,
  setLevelsListing,
} from '../../../../../reducers/LevelsConfigs/actions';
import validateString from '../../../../../utils/helper/validateString';
import { ERROR_MESSAGES } from '../../../../../configs/messages';

function LevelsConfigModal({
  isOpen,
  setLevelsVisibilities,
  setLevelsListing,
  handleClose,
  title,
  id,
  doneText,
}) {
  const [levels, setLevels] = useState([]);
  const [isShowLoader, setShowLoader] = useState(false);
  const [isSubmit, setSubmit] = React.useState(false);

  /**
   * Fetch dimension Levels > API Call
   */
  const getDimensionLevels = async () => {
    try {
      if (isShowLoader) return;

      setShowLoader(true);

      const { data = [] } = await fetchLevelsConfigs(id);

      setLevels(data);
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
    }
  };

  /**
   * Callback > Get Dimension Levels
   */
  const getDimensionLevelsCallback = useCallback(getDimensionLevels, []);

  /**
   * Load Data on Component Load
   */
  useEffect(() => {
    getDimensionLevelsCallback();
  }, [getDimensionLevelsCallback]);

  /**
   * Update level Name
   *
   * @param {Sting || Number} index
   * @param {Object} Event
   */
  const updatedLevelName = index => ({ target: { value } }) => {
    const validName = value.substring(0, 50);

    levels[index].level_name = validName;
    setLevels([...levels]);
  };

  /**
   * Save Levels config > API Call
   *
   * @param {Object} Event
   */
  const saveDimenisonLevels = async event => {
    event.preventDefault();
    setSubmit(true);

    // Validate Inputs
    const emptyLevls = levels.filter(({ level_name }) => level_name == '');
    if (emptyLevls && emptyLevls.length > 0) return;

    try {
      if (isShowLoader) return;
      setShowLoader(true);

      const url = API_URLS.SAVE_DIMENSION_LEVELS.replace('#ID#', id);
      const params = {
        data: levels,
      };

      const { data } = await httpPost(url, params);

      setShowLoader(false);
      setLevelsListing(data);
      setLevels([]);
      setLevelsVisibilities(false);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
    }
  };

  /**
   * Handle Close Modal without data
   */
  const handleCloseModal = () => {
    setLevels([]);
    handleClose(false);
  };

  return (
    <Dialog
      className="customized-rename-modal"
      maxWidth="xs"
      fullWidth
      aria-labelledby="customized-dialog-title"
      open={isOpen}
    >
      {isShowLoader && <Spinner />}

      <form noValidate onSubmit={saveDimenisonLevels}>
        <DialogTitle id="customized-dialog-title" className="modal-title">
          <Grid
            container
            direction="row"
            justify="space-between"
            alignItems="center"
          >
            <Box>{title}</Box>
          </Grid>
        </DialogTitle>

        <DialogContent>
          {levels.map(({ level = '', level_name = '' }, index) => {
            const errValidName =
              isSubmit && !validateString(level_name)
                ? ERROR_MESSAGES.required
                : '';
            return (
              <Box
                key={index}
                bgcolor="secondary.processTable"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={0.5}
                px={2}
                py={0.5}
                borderRadius={4}
              >
                <Box width="40px">#{level}</Box>
                <ArrowRightAlt />
                <TextField
                  required
                  placeholder="Enter level name"
                  style={{ fontSize: '13px' }}
                  value={level_name}
                  onChange={updatedLevelName(index)}
                  error={Boolean(errValidName)}
                  helperText={errValidName || ''}
                />
              </Box>
            );
          })}
          {levels && levels.length > 0 && (
            <Box mt={1}>
              <Typography variant="caption">
                <i>Note: Max 10 levels are supported.</i>
              </Typography>
            </Box>
          )}
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
              <Button color="primary" size="small" onClick={handleCloseModal}>
                Cancel
              </Button>
            </Box>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              size="small"
              onClick={saveDimenisonLevels}
              disabled={false}
            >
              {true && doneText}
              {false && <CircularProgress size={24} />}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}

LevelsConfigModal.propTypes = {
  doneText: string,
  handleClose: func.isRequired,
  id: oneOfType([string, number]).isRequired,
  isOpen: bool.isRequired,
  setLevelsListing: func.isRequired,
  setLevelsVisibilities: func.isRequired,
  title: string,
};

LevelsConfigModal.defaultProps = {
  doneText: 'Update',
  title: 'Rename Levels',
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {
  setLevelsVisibilities,
  setLevelsListing,
})(LevelsConfigModal);
