import React, { useState } from 'react';
import { shape, number, func, bool } from 'prop-types';
import { get } from 'lodash';

import {
  Box,
  Grid,
  IconButton,
  Typography,
  TextField,
  Tooltip,
  Drawer,
  withStyles,
} from '@material-ui/core';

import {
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  DeleteOutline as DeleteOutlineIcon,
  DragIndicator as DragIndicatorIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  InfoOutlined as InfoOutlinedIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@material-ui/icons';

import ViewSourceTable from '../../../../SourceTables/ViewSourceTable';
import { filterTranslateHeader, isTranslateHaveError } from '../../helper';
import {
  MENUS_ACTIONS,
  DELETE_TYPE_ACTION_KEYS,
  PROCESS_STATUS,
} from '../../configs';

import { styles } from './styles';
import './styles.scss';
import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';

function StepCardHeader({
  step,
  stepNumber,
  onRemoveStep,
  updateStepData,
  isDragging,
  classes,
  runNextStep,
  isProcessRunning,
}) {
  const [isEditName, updateisEditName] = useState(false);
  const [name, setName] = useState(step.name);
  const [previewModal, togglePreviewModal] = useState(false);

  const targetTableId = (step.targetTable && step.targetTable.id) || '';

  const { sourceLabel, targetLabel, sourceName, targetName } = getHeaderLabels(
    step
  );

  const toggleEditName = () => {
    if (isProcessRunning) return;

    updateisEditName(!isEditName);
  };

  const toggleCollapse = () => {
    if (!step.isExpand && step.label == MENUS_ACTIONS.translate) {
      // Detect Translate Table's width due to scroll added in window
      setTimeout(() => {
        const evt = new CustomEvent('resize', {});
        window.dispatchEvent(evt);
      }, 500);
    }

    step.isExpand = !step.isExpand;

    updateStepData(stepNumber, step);
  };

  const onPressKeyNameInput = evt => {
    if (evt.key == 'Enter') updateName();
  };

  const onChangeName = ({ target }) => {
    setName(target.value);
  };

  const updateName = () => {
    if (!name.trim()) return;

    toggleEditName();
    if (name == step.name) return;

    step.name = name;
    updateStepData(stepNumber, step);
  };

  const previewResult = () => {
    togglePreviewModal(true);
  };

  const closePreviewModal = () => {
    togglePreviewModal(false);
  };

  const isShowPreviow = () => {
    return (
      step.showPreview &&
      targetTableId &&
      targetTableId != 'NEW' &&
      step.actionType != DELETE_TYPE_ACTION_KEYS.dropTable
    );
  };

  /**
   * Return error msg for validation
   */
  const getErrorMsgForStep = step => {
    const header = filterTranslateHeader(step);

    if (header && header.length > 0) {
      return PROCESS_MANAGER_MSG.translate_column_not_found
        .replace(
          '#COLUMNS#',
          header.map(({ display_name = '' }) => display_name).join(' ')
        )
        .replace('#STEP#', step.label);
    }

    return '';
  };

  return (
    <Grid
      container
      direction="row"
      alignItems="center"
      justify="space-between"
      className={`${isDragging ? 'drag-color' : ''} step-header`}
    >
      <Grid xs={4} item>
        <Grid container direction="row" alignItems="center">
          <Box mr={1} color="text.secondary" className="re-order-process-icon">
            <Box
              display="flex"
              alignItems="center"
              className="re-order-process-details-wrap"
            >
              <DragIndicatorIcon />
            </Box>
          </Box>

          <Box mr={2} color="text.secondary">
            <Typography variant="body1">#{stepNumber + 1}</Typography>
          </Box>

          {!isEditName && (
            <Box mr={1}>
              <Typography variant="body1" onDoubleClick={toggleEditName}>
                {step.name}
              </Typography>
            </Box>
          )}

          {isEditName && (
            <>
              <TextField
                margin="none"
                autoFocus
                value={name}
                className="step-edit"
                variant="outlined"
                onChange={onChangeName}
                placeholder="Step Name"
                error={!name.trim()}
                onKeyPress={onPressKeyNameInput}
              />
              <IconButton onClick={updateName}>
                <CheckIcon />
              </IconButton>
              <IconButton onClick={toggleEditName}>
                <CloseIcon />
              </IconButton>
            </>
          )}
        </Grid>
      </Grid>

      <Grid xs={5} item className="step-header-table">
        <Box width="50%">
          {sourceLabel && (
            <>
              <Typography variant="caption" color="primary">
                {sourceLabel}
              </Typography>
              <Typography variant="body2">{sourceName || '--'}</Typography>
            </>
          )}
        </Box>
        <Box width="50%">
          {targetLabel && (
            <>
              <Typography variant="caption" color="primary">
                {targetLabel}
              </Typography>
              <Typography variant="body2">{targetName || '--'}</Typography>
            </>
          )}
        </Box>
      </Grid>

      <Grid xs={3} item container justify="flex-end">
        {step.runNext && (
          <Tooltip title="Run next step" placement="top" arrow>
            <IconButton onClick={runNextStep}>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
        )}

        {isShowPreviow() && (
          <Tooltip title="View source table" placement="top" arrow>
            <IconButton onClick={previewResult}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        )}

        {isTranslateHaveError(step) && (
          <Tooltip title={getErrorMsgForStep(step)} placement="top" arrow>
            <Box display="flex" alignItems="center">
              <ErrorOutlineIcon color="error" />
            </Box>
          </Tooltip>
        )}

        {isProcessRunning &&
          step.message &&
          step.status == PROCESS_STATUS.COMPLETED && (
            <Tooltip title={step.message} placement="top" arrow>
              <IconButton>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}

        {!isProcessRunning && (
          <IconButton onClick={onRemoveStep}>
            <DeleteOutlineIcon />
          </IconButton>
        )}

        {!isProcessRunning && (
          <IconButton onClick={toggleCollapse}>
            {step.isExpand ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Grid>

      <Drawer
        anchor="right"
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
        open={previewModal}
        onClose={closePreviewModal}
      >
        <Box>
          <CloseIcon
            className={classes.drawerCloseIcon}
            onClick={closePreviewModal}
          />
          <ViewSourceTable fromProcess tableId={targetTableId} />
        </Box>
      </Drawer>
    </Grid>
  );
}

const getHeaderLabels = step => {
  let sourceName = '';
  let title = '';
  let l = '';

  switch (step.label) {
    case MENUS_ACTIONS.createTable:
      return {
        sourceLabel: '',
        targetLabel: 'Target Table',
        sourceName: '',
        targetName: step.tableName,
      };

    case MENUS_ACTIONS.deleteClear:
    case MENUS_ACTIONS.translate:
      return {
        sourceLabel: '',
        targetLabel: 'Target Table',
        sourceName: '',
        targetName: get(step, 'targetTable.display_name'),
      };

    case MENUS_ACTIONS.copyPaste:
      return {
        sourceLabel: 'Source Table',
        targetLabel: 'Target Table',
        sourceName: get(step, 'sourceTable.display_name'),
        targetName: get(step, 'targetTable.display_name'),
      };

    case MENUS_ACTIONS.lookup:
    case MENUS_ACTIONS.multiLookup:
      const lookupTables = get(step, 'lookupTables') || [];

      sourceName = get(lookupTables, '0.display_name') || '--';
      l = lookupTables.length;
      if (l > 1) sourceName += ` <i>& ${l - 1} more</i>`;

      title = (
        (lookupTables.length > 0 && lookupTables) || [
          { display_name: 'Please select Lookup Table' },
        ]
      ).map(({ display_name }) => <Box key={display_name}>{display_name}</Box>);

      return {
        sourceLabel: 'Lookup Table',
        targetLabel: 'Destination Table',
        sourceName: (
          <Tooltip arrow interactive title={title}>
            <span dangerouslySetInnerHTML={{ __html: sourceName || '--' }} />
          </Tooltip>
        ),
        targetName: get(step, 'targetTable.display_name'),
      };

    case MENUS_ACTIONS.singleFormulaBuider:
      return {
        sourceLabel: '',
        targetLabel: 'Target Table',
        sourceName: '',
        targetName: get(step, 'targetTable.display_name'),
      };

    case MENUS_ACTIONS.multiFormulaBuider:
      const relatedTables = get(step, 'relatedTables') || [];

      sourceName = get(relatedTables, '0.display_name') || '--';
      l = relatedTables.length;
      if (l > 1) sourceName += ` <i>& ${l - 1} more</i>`;

      title = (
        (relatedTables.length > 0 && relatedTables) || [
          { display_name: 'Please select Related Table' },
        ]
      ).map(({ display_name }) => <Box key={display_name}>{display_name}</Box>);
      return {
        sourceLabel: 'Related Tables',
        targetLabel: 'Target Table',
        sourceName: (
          <Tooltip arrow interactive title={title}>
            <span dangerouslySetInnerHTML={{ __html: sourceName || '--' }} />
          </Tooltip>
        ),
        targetName: get(step, 'targetTable.display_name'),
      };

    default:
      return {
        sourceLabel: '',
        targetLabel: '',
        sourceName: '',
        targetName: '',
      };
  }
};

StepCardHeader.propTypes = {
  isDragging: bool.isRequired,
  isProcessRunning: bool.isRequired,
  onRemoveStep: func.isRequired,
  runNextStep: func.isRequired,
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(StepCardHeader);
