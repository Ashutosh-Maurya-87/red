import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { func, shape } from 'prop-types';
import { AutoSizer } from 'react-virtualized';

import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Typography, Box, Grid, Button } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';

import SingleFieldConfig from './SingleFieldConfig';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import Spinner from '../../../../components/Spinner';
import { withRouterForwardRef } from '../../../../components/WithRouterForwardRef';
import CustomScrollbars from '../../../../components/ScrollBars';

// import HierarchyOrder from '../HierarchyOrder';

import { APP_ROUTES } from '../../../../configs/routes';
import { defaultConfigs } from './Configs';
import { RULE_BASED_MODEL_SETUP_MENU_KEYS } from '../../configs';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';
import { RULE_BASED_MODELS_API } from '../../../../configs/api';

import { validateName } from '../../../../utils/helper/validateName';
import { httpPut } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';

import {
  genrateTab,
  getFormattedAttribute,
  getFormattedHierarchies,
  getFormattedParams,
} from './helper';
import RuleBasedModelSetUpFooter from '../Footer';

import { setSingleRBM } from '../../../../reducers/RuleBasedModels/actions';
import { getSingleRBM } from '../../../../reducers/RuleBasedModels/selectors';

import './styles.scss';

const FieldConfigs = forwardRef(({ singleRBM, setSingleRBM, history }, ref) => {
  /**
   * States
   */
  const [confirmationToDelete, setConfirmationDelete] = useState(false);
  const [fieldConfigs, setFieldConfigurations] = useState(
    getFormattedAttribute(singleRBM)
  );
  const [hierarchyConfigs, setHierarchyConfigs] = useState(
    getFormattedHierarchies(singleRBM)
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmit, setIsSubmit] = useState(false);
  const [isShowLoader, setIsShowLoader] = useState(false);

  const { field: { displayName = '' } = {} } = selectedItem || {};

  /**
   * updated field config --> callback
   *
   * @param {Object} field
   * @param {Number} Index
   */
  const updateConfigs = (field, index) => {
    field = validateFields(field);

    fieldConfigs[index] = field;
    setFieldConfigurations([...fieldConfigs]);
  };

  /**
   * Use Imperative Handle
   */
  useImperativeHandle(ref, () => ({
    onSave,
    handleNewColumn,
  }));

  /**
   * updated Hierarchy config --> callback
   *
   * @param {Object} field
   * @param {Number} Index
   */
  // const updateHierarchyConfigs = updatedConfigs => {
  //   setHierarchyConfigs(updatedConfigs);
  // };

  /**
   * Validate field configuration
   */
  const validateFields = field => {
    const {
      dimension = {},
      dataType = {},
      dateFormat = '',
      isMapToDimension = false,
      dimensionCol = {},
      displayName = '',
      isSystem = false,
    } = field || {};

    if (isSystem) {
      field.isError = false;
      return field;
    }

    const isNameValid = validateName(displayName);

    if (!isNameValid) {
      field.isError = true;
      return field;
    }

    if (isMapToDimension && !dimension) {
      field.isError = true;
      return field;
    }

    if (isMapToDimension && !dimensionCol) {
      field.isError = true;
      return field;
    }

    if (!isMapToDimension && !dataType) {
      field.isError = true;
      return field;
    }

    // validating date format
    if (
      !isMapToDimension &&
      dataType &&
      dataType == COLUMN_DATA_TYPES_KEYS.date &&
      !dateFormat
    ) {
      field.isError = true;
      return field;
    }

    field.isError = false;
    return field;
  };

  /**
   * Opening Confirmation Modal to Delete
   */
  const onDeleteFC = (field, index) => event => {
    event.stopPropagation();
    setSelectedItem({ field, index });
    setConfirmationDelete(true);
  };

  /**
   * Closing Delete confirmation Modal
   */
  const handleCloseConfModal = res => {
    if (!res) {
      setConfirmationDelete(false);

      return;
    }

    if (res) {
      const { index, field } = selectedItem || {};
      const { tempId: fieldTempId } = field || {};

      let tempHierarchyConfigs = [...hierarchyConfigs];

      tempHierarchyConfigs = tempHierarchyConfigs.filter(
        ({ tempId = '' }) => tempId != fieldTempId
      );

      fieldConfigs.splice(index, 1);
      setFieldConfigurations(fieldConfigs);
      setHierarchyConfigs(tempHierarchyConfigs);
      setSelectedItem(null);
    }

    setConfirmationDelete(false);
  };

  /**
   * Add/Remove Hierarchy
   *
   * @param {Boolean} field
   * @returns
   */
  const handleHierarchyAddRemove = field => {
    const { isAddToHierarchy, tempId: fieldTempId } = field || {};

    let tempHierarchyConfigs = [...hierarchyConfigs];

    if (isAddToHierarchy) {
      tempHierarchyConfigs.push(field);
    }

    if (!isAddToHierarchy) {
      tempHierarchyConfigs = tempHierarchyConfigs.filter(
        ({ tempId = '' }) => tempId != fieldTempId
      );
    }

    setHierarchyConfigs(tempHierarchyConfigs);
  };

  /**
   * Add new Column
   */
  const handleNewColumn = () => {
    const newDefaultConfig = { ...defaultConfigs };
    newDefaultConfig.tempId = `${fieldConfigs.length - 1}`;

    newDefaultConfig.isExpanded = true;
    fieldConfigs.push({
      ...newDefaultConfig,
      // displayName: `Field ${fieldConfigs.length + 1}`,
      displayName: genrateTab(fieldConfigs, fieldConfigs.length),
    });

    setFieldConfigurations([...fieldConfigs]);

    // Auto scroll to bottom when new column add
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 100);
  };

  /**
   * ON Click => To save FC
   */
  const onSave = async callback => {
    try {
      if (!fieldConfigs) return;

      setIsSubmit(true);
      setIsShowLoader(true);

      // validate fields
      const updatedArray = fieldConfigs.map(field => validateFields(field));

      setFieldConfigurations(updatedArray);

      const elementIndex = updatedArray.findIndex(
        field => validateFields(field).isError
      );

      if (elementIndex > -1) {
        setIsShowLoader(false);
        return;
      }

      const { id = '' } = singleRBM || {};

      const url = RULE_BASED_MODELS_API.UPDATE_RBM_CONFIG.replace('#ID#', id);

      const params = getFormattedParams({
        singleRBM,
        fieldConfigs,
        hierarchyConfigs,
      });

      const { data = {}, message = '' } = await httpPut(url, params);

      setIsShowLoader(false);

      if (callback) {
        callback();
      }

      showSuccessMsg(message);
      setSingleRBM(data);
    } catch (error) {
      setIsShowLoader(false);
      console.error(error);
    }
  };

  /**
   * ON Click => To save FC
   */
  const onSaveNext = (isExist = false) => async () => {
    isExist ? onSave(handleNext) : onSave(handleExit);
  };

  /**
   * Common constants for next prev button
   */
  const {
    location: { search = '' },
  } = history || {};

  const query = new URLSearchParams(search);
  const id = query.get('id');
  let url = APP_ROUTES.CREATE_RULE_BASED_MODEL;

  /**
   * Handle Next button
   */
  const handleNext = () => {
    url += `?id=${id}&activeTab=2`;

    history.push(url);
  };

  /**
   * Handle Back button
   */
  const handlePrev = () => {
    url += `?id=${id}&activeTab=0`;

    history.push(url);
  };

  /**
   * Handle Save & Exit button
   */
  const handleExit = () => {
    history.push(APP_ROUTES.RULE_BASED_MODEL.replace(':id', id));
  };

  return (
    <>
      {isShowLoader && <Spinner />}
      <Box ref={ref} className="field-config-container" flexGrow="1">
        <AutoSizer>
          {({ width, height }) => (
            <CustomScrollbars style={{ width, height }}>
              <Typography variant="caption" color="textSecondary">
                Create Columns & Map Fields to Your Scenario
              </Typography>
              <Box mt={1} mb={3}>
                <Typography variant="h2">Field Configuration</Typography>
              </Box>

              <Grid container justify="space-between">
                <Grid item sm={12} lg={7}>
                  {/* Custom FC outlook */}
                  {fieldConfigs.map((field, index) => {
                    return (
                      <SingleFieldConfig
                        key={index}
                        config={field}
                        index={index}
                        onDelete={onDeleteFC}
                        isSubmit={isSubmit}
                        updateConfigs={updateConfigs}
                        onHierarchyAddRemove={handleHierarchyAddRemove}
                      />
                    );
                  })}

                  {/* Delete confirmation model */}
                  {confirmationToDelete && (
                    <ConfirmationModal
                      isOpen
                      action="delete"
                      handleClose={handleCloseConfModal}
                      msg={RULE_BASED_MODELS_MSG.rbm_fc_delete_confirmation.replace(
                        '#NAME#',
                        displayName
                      )}
                    />
                  )}

                  {/* Add new Column field */}
                </Grid>

                {/* Hierarchy order */}
                {/* <HierarchyOrder
            configs={hierarchyConfigs}
            updateConfigs={updateHierarchyConfigs}
          /> */}
              </Grid>
            </CustomScrollbars>
          )}
        </AutoSizer>
      </Box>
      <Box
        className="hide-footer-btn"
        display="flex"
        justifyContent="space-between"
        position="sticky"
        bottom="0"
        alignItems="flex-start"
        height="100px"
        bgcolor="secondary.footer"
        zIndex="1"
        pt={2}
        ml={-0.2}
      >
        <Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleNewColumn}
          >
            New Column
          </Button>
        </Box>
        <RuleBasedModelSetUpFooter
          activeTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.fieldConfigs}
          nextTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.importExport}
          prevTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.calculations}
          onPrev={handlePrev}
          onNext={onSaveNext(true)}
          onExit={onSaveNext(false)}
        />
      </Box>
    </>
  );
});

FieldConfigs.propTypes = {
  setSingleRBM: func,
  singleRBM: shape({}),
};

FieldConfigs.defaultProps = {
  setSingleRBM: () => {},
  singleRBM: {},
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
});

export default connect(mapStateToProps, { setSingleRBM }, null, {
  forwardRef: true,
})(withRouterForwardRef(FieldConfigs));
