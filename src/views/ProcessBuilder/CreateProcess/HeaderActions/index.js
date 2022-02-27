import React from 'react';
import moment from 'moment';
import { func, bool, string } from 'prop-types';

import { Box, Button, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import SplitButton from '../../../../components/SplitButton';

import { PROCESS_STATUS } from '../configs';
import { PROCESS_MANAGER_MSG } from '../../../../configs/messages';
import { getRunStatusDetails } from '../../ProcessList/helper';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function ProcessHeaderActions({
  showLoader,
  onCancel,
  onCancelProcess,
  onSave,
  onRun,
  onSaveAs,
  isEditMode,
  isProcessRunning,
  processStatus,
  lastRunAt,
  onFinish,
  isFinishing,
  showStatusCard,
  toggleStatusCard,
  isButtonBlockDone,
}) {
  const handleSplitButton = value => {
    switch (value) {
      case 'Pause Between Steps':
        logAmplitudeEvent('Run process with pause between steps');
        onRun(true);
        break;

      default:
        break;
    }
  };

  const { statusIcon: StatusIcon, statusClassName } = getRunStatusDetails({
    status: processStatus,
    last_run_at: lastRunAt,
  });

  return (
    <>
      <Box display="flex" alignItems="center">
        {showStatusCard && (
          <Box mr={2}>
            <Alert
              variant="outlined"
              severity={
                processStatus == PROCESS_STATUS.FAILED ||
                processStatus == PROCESS_STATUS.CANCELLED
                  ? 'error'
                  : 'success'
              }
              onClose={toggleStatusCard}
            >
              {processStatus == PROCESS_STATUS.COMPLETED &&
                PROCESS_MANAGER_MSG.executed_success}
              {processStatus == PROCESS_STATUS.FAILED &&
                PROCESS_MANAGER_MSG.executed_error}
              {processStatus == PROCESS_STATUS.CANCELLED &&
                PROCESS_MANAGER_MSG.executed_cancel}
            </Alert>
          </Box>
        )}
        <Box display="flex" alignItems="center" justifyContent="end">
          {StatusIcon && lastRunAt && (
            <Typography
              display="block"
              variant="caption"
              noWrap
              color="textSecondary"
            >
              {StatusIcon && (
                <>
                  Last Run -&nbsp;
                  <span className={`last-executed-status ${statusClassName}`}>
                    {StatusIcon && <StatusIcon fontSize="small" />}
                  </span>
                </>
              )}
              {lastRunAt ? moment.utc(lastRunAt).local().calendar() : '--'}
            </Typography>
          )}
          <Button
            variant="outlined"
            color="primary"
            className="title-button"
            onClick={onCancel}
            disabled={showLoader}
          >
            Exit
          </Button>

          {(processStatus == PROCESS_STATUS.QUEUED ||
            processStatus == PROCESS_STATUS.RUNNING) && (
            <Button
              variant="outlined"
              color="primary"
              className="title-button"
              onClick={onCancelProcess}
              disabled={showLoader}
            >
              Cancel Process
            </Button>
          )}

          {!isProcessRunning && (
            <>
              <Button
                variant="contained"
                color="primary"
                className="title-button"
                onClick={onSave}
                disabled={isProcessRunning || showLoader || isButtonBlockDone}
              >
                Save
              </Button>

              {isEditMode && (
                <Button
                  variant="contained"
                  color="primary"
                  className="title-button"
                  onClick={onSaveAs}
                  disabled={isProcessRunning || showLoader || isButtonBlockDone}
                >
                  Save As
                </Button>
              )}

              <SplitButton
                className="title-button run-split-btn"
                buttonLabel="Run"
                options={['Pause Between Steps']}
                onButtonClick={onRun}
                onOptionClick={handleSplitButton}
                disabled={isProcessRunning || showLoader || isButtonBlockDone}
              />
            </>
          )}

          {(processStatus == PROCESS_STATUS.COMPLETED ||
            processStatus == PROCESS_STATUS.FAILED ||
            processStatus == PROCESS_STATUS.CANCELLED) && (
            <Button
              variant="contained"
              color="primary"
              className="title-button"
              onClick={onFinish}
              disabled={isFinishing || isButtonBlockDone}
            >
              Finish
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}

ProcessHeaderActions.propTypes = {
  isButtonBlockDone: bool,
  isEditMode: bool,
  isFinishing: bool,
  isProcessRunning: bool,
  lastRunAt: string,
  onCancel: func.isRequired,
  onCancelProcess: func.isRequired,
  onFinish: func.isRequired,
  onRun: func.isRequired,
  onSave: func.isRequired,
  onSaveAs: func,
  processStatus: string,
  showLoader: bool.isRequired,
  showStatusCard: bool,
  toggleStatusCard: func.isRequired,
};

export default ProcessHeaderActions;
