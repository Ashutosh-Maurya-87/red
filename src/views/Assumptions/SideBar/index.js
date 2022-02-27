import React, { useState } from 'react';
import { arrayOf, bool, func, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Box, Typography, IconButton, TextField } from '@material-ui/core';
import { AddCircleOutline as AddCircleOutlineIcon } from '@material-ui/icons';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import CustomScrollbars from '../../../components/ScrollBars';
import ListboxComponent from '../../../components/CustomListBox';
import ConfirmationModal from '../../../components/ConfirmationModal';
import CreateAssumptionModal from '../AssumptionsSheet/CreateNewAssumption';
import AssumptionsListView from './ListView';

import {
  setAssumption,
  setGridData,
  setGridHeaders,
} from '../../../reducers/Assumptions/actions';
import { getAssumption } from '../../../reducers/Assumptions/selectors';

import { ASSUMPTION_SCOPES_KEYS } from '../configs';
import { ASSUMPTIONS_API } from '../../../configs/api';
import { ASSUMPTIONS_MSG } from '../../../configs/messages';

import { httpDelete } from '../../../utils/http';
import { getEmptyGridRow, getInitialHeaders } from '../AssumptionsSheet/helper';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const filter = createFilterOptions();

const AssumptionsSideBar = ({
  globalAssumptions,
  localAssumptions,
  assumption,
  setAssumption,
  loadAssumptionData,
  updateState,
  setGridHeaders,
  setGridData,
  modelsList,
  model,
  handleSelectedModel,
  isFetchingGlobal,
  isFetchingLocal,
  isFetchingModels,
  loadMoreModels,
}) => {
  const [deletingAssumption, setDeletingAssumption] = useState({});
  const [isDeleteConf, setDeleteConf] = useState(false);
  const [createNewScope, setCreateNewScope] = useState('');

  /**
   * On Click Assumption Label
   *
   * @param {Object} selected
   */
  const onSelect = selected => () => {
    if (assumption.id == selected.id || deletingAssumption.id == selected.id)
      return;

    setAssumption(selected);
    loadAssumptionData(selected);
  };

  /**
   * On Click Delete
   *
   * @param {Object} selected
   */
  const onClickDelete = selected => async evt => {
    if (evt) evt.stopPropagation();

    setDeletingAssumption(selected);
    setDeleteConf(true);
  };

  /**
   * Handle Delete Confirmation
   *
   * @param {Any}
   */
  const handleDeleteConf = async res => {
    try {
      setDeleteConf(false);

      if (!res) {
        setDeletingAssumption({});
        return;
      }

      updateState({ showLoader: true });

      const url = ASSUMPTIONS_API.DELETE_ASSUMPTION.replace(
        '#ID#',
        deletingAssumption.id
      );

      await httpDelete(url);

      if (deletingAssumption.scope == ASSUMPTION_SCOPES_KEYS.global) {
        globalAssumptions = globalAssumptions.filter(
          ({ id }) => id != deletingAssumption.id
        );
        updateState({ globalAssumptions, showLoader: false });
      }

      if (deletingAssumption.scope == ASSUMPTION_SCOPES_KEYS.local) {
        localAssumptions = localAssumptions.filter(
          ({ id }) => id != deletingAssumption.id
        );
        updateState({ localAssumptions, showLoader: false });
      }

      if (assumption.id == deletingAssumption.id) {
        if (globalAssumptions.length > 0) {
          const [firstGlobal] = globalAssumptions;
          setAssumption(firstGlobal);
          loadAssumptionData(firstGlobal);
        } else if (localAssumptions.length > 0) {
          const [firstlocal] = localAssumptions;
          setAssumption(firstlocal);
          loadAssumptionData(firstlocal);
        } else {
          setAssumption({});
          loadAssumptionData({});
        }
      }

      setDeletingAssumption({});
    } catch (err) {
      console.error(err);
      setDeletingAssumption({});
    }
  };

  /**
   * On Click > Add New Assumption
   *
   * @param {String} scope
   */
  const onClickAddNew = scope => () => {
    logAmplitudeEvent(`Add new ${scope} assumption`);
    setCreateNewScope(scope);
  };

  /**
   * On Cancel > Create New Assumption
   */
  const onCancelAddNew = () => {
    setCreateNewScope('');
  };

  /**
   * On Success > Create New Assumption
   */
  const onSuccessAddNew = async ({ name, scope, id, model_id }) => {
    if (name) {
      // Reset grid
      setGridData([]);
      setGridHeaders([]);

      const headers = getInitialHeaders();
      headers[2].label = `${headers[2].label} 1`;

      const data = [getEmptyGridRow(headers.length)];

      if (data && data.length > 0 && headers) {
        setGridData(data);
        setGridHeaders(headers);
      }

      const newAssumption = { name, scope, id, model_id };
      let assumptions = [];

      switch (scope) {
        case ASSUMPTION_SCOPES_KEYS.global:
          assumptions = [...globalAssumptions];
          assumptions.push(newAssumption);
          updateState({ globalAssumptions: assumptions });
          break;

        case ASSUMPTION_SCOPES_KEYS.local:
          assumptions = [...localAssumptions];
          assumptions.push(newAssumption);
          updateState({ localAssumptions: assumptions });
          break;

        default:
          break;
      }

      setAssumption({ name, scope, id, model_id });
      setCreateNewScope('');
    }
  };

  return (
    <>
      <Box className="inner-sidebar" bgcolor="secondary.sidebar" pr={0}>
        <CustomScrollbars>
          <Box minHeight="130px" pr={1}>
            <Box
              pl={1}
              pt={2}
              pb={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                variant="body2"
                color="textSecondary"
                className="uppercase"
              >
                Global Assumptions
              </Typography>
              <IconButton
                size="small"
                onClick={onClickAddNew(ASSUMPTION_SCOPES_KEYS.global)}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Box>

            {!isFetchingGlobal && (
              <AssumptionsListView
                assumptions={globalAssumptions}
                assumption={assumption}
                onDelete={onClickDelete}
                onSelect={onSelect}
              />
            )}

            {isFetchingGlobal && (
              <Box pl={4}>
                <Typography noWrap>Loading...</Typography>
              </Box>
            )}

            {!isFetchingGlobal && globalAssumptions.length == 0 && (
              <Box pl={4}>
                <Typography variant="caption" noWrap>
                  No assumptions found
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            px={1}
            pt={2}
            pb={1}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="body2"
              color="textSecondary"
              className="uppercase"
            >
              Local Assumptions
            </Typography>
            <IconButton
              size="small"
              onClick={onClickAddNew(ASSUMPTION_SCOPES_KEYS.local)}
              disabled={!model.id}
            >
              <AddCircleOutlineIcon />
            </IconButton>
          </Box>

          <Box mb={2} mt={2} pr={1}>
            <Autocomplete
              fullWidth
              value={{ label: model.name }}
              openOnFocus
              selectOnFocus
              clearOnBlur
              freeSolo
              ListboxComponent={ListboxComponent}
              handleHomeEndKeys
              renderOption={({ label }) => label}
              onChange={handleSelectedModel}
              getOptionLabel={({ label = '' }) => label}
              getOptionDisabled={({ label }) => label == model.name}
              loading={isFetchingModels}
              options={modelsList.map(item => ({
                label: `${item.name}`,
                value: item.id,
                model: item,
              }))}
              ListboxProps={{
                loadMoreTables: loadMoreModels,
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Select Model"
                  placeholder="Select Model"
                  size="small"
                />
              )}
              filterOptions={(options, params) => {
                return filter(options, params);
              }}
            />
          </Box>

          {!isFetchingLocal && (
            <AssumptionsListView
              assumptions={localAssumptions}
              assumption={assumption}
              onDelete={onClickDelete}
              onSelect={onSelect}
              deletingId={deletingAssumption.id}
            />
          )}

          {isFetchingLocal && (
            <Box textAlign="center" pt={1}>
              <Typography variant="caption" noWrap>
                Loading...
              </Typography>
            </Box>
          )}

          {!isFetchingLocal && model.id && localAssumptions.length == 0 && (
            <Box textAlign="center" pt={1}>
              <Typography variant="caption" noWrap>
                No assumptions found
              </Typography>
            </Box>
          )}
        </CustomScrollbars>
      </Box>

      {isDeleteConf && (
        <ConfirmationModal
          handleClose={handleDeleteConf}
          isOpen
          action={String(deletingAssumption.id)}
          msg={ASSUMPTIONS_MSG.delete_assumption_confirmation.replace(
            '#ASSUMPTION_NAME#',
            deletingAssumption.name || ''
          )}
        />
      )}

      {createNewScope && (
        <CreateAssumptionModal
          isOpen
          scope={createNewScope}
          modelId={model.id}
          handleClose={onCancelAddNew}
          handleDone={onSuccessAddNew}
        />
      )}
    </>
  );
};

AssumptionsSideBar.propTypes = {
  assumption: shape({}),
  globalAssumptions: arrayOf(shape({})),
  handleSelectedModel: func.isRequired,
  isFetchingGlobal: bool.isRequired,
  isFetchingLocal: bool.isRequired,
  isFetchingModels: bool.isRequired,
  loadAssumptionData: func.isRequired,
  loadMoreModels: func.isRequired,
  localAssumptions: arrayOf(shape({})),
  model: shape({}),
  modelsList: arrayOf(shape({})).isRequired,
  setAssumption: func.isRequired,
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
  updateState: func.isRequired,
};

AssumptionsSideBar.defaultProps = {
  model: {},
  globalAssumptions: [],
  localAssumptions: [],
  isCreating: false,
};

const mapStateToProps = createStructuredSelector({
  assumption: getAssumption(),
});

export default connect(mapStateToProps, {
  setAssumption,
  setGridHeaders,
  setGridData,
})(AssumptionsSideBar);
