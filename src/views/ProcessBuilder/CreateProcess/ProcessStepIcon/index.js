import React from 'react';
import { string, func, bool } from 'prop-types';

import { Box, Checkbox, Tooltip } from '@material-ui/core';
import {
  Error as ErrorIcon,
  CheckRounded as CheckRoundedIcon,
} from '@material-ui/icons';

import { PROCESS_STATUS } from '../configs';
import {
  ERROR_MESSAGES,
  PROCESS_MANAGER_MSG,
} from '../../../../configs/messages';

import ImgRenderer from '../../../../components/ImgRenderer';

function ProcessStepIcon({
  stepStatus,
  onChange,
  isProcessRunning,
  isSelectionEnable,
  isSelected,
  icon,
  failReason,
}) {
  const isCompleted = stepStatus === PROCESS_STATUS.COMPLETED;
  const isRunning = stepStatus === PROCESS_STATUS.RUNNING;
  const isQueued = stepStatus === PROCESS_STATUS.QUEUED;
  const isFailed = stepStatus === PROCESS_STATUS.FAILED;
  const isCancelled = stepStatus === PROCESS_STATUS.CANCELLED;

  return (
    <Box className="process-step-icon" display="flex">
      {(!(isCompleted || isFailed || isCancelled) || !stepStatus) && (
        <ImgRenderer
          src={icon}
          className={`step-icon ${isSelectionEnable ? 'always-hidden' : ''} ${
            isProcessRunning ? 'always-visible' : ''
          }`}
        />
      )}

      {isCompleted && <CheckRoundedIcon color="primary" fontSize="large" />}

      {(isFailed || isCancelled) && (
        <Tooltip
          arrow
          title={
            isCancelled
              ? PROCESS_MANAGER_MSG.process_cancelled
              : failReason || ERROR_MESSAGES.internal_error
          }
        >
          {/* Cancel Icon Added Here  */}
          {isCancelled ? (
            <svg
              fill="#ac1313"
              height="20px"
              viewBox="0 0 329.26933 329"
              width="20px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0" />
            </svg>
          ) : (
            <ErrorIcon color="error" />
          )}
        </Tooltip>
      )}

      {!isProcessRunning && !isCompleted && !isFailed && (
        <Box className="upload-progress-icon">
          <Checkbox
            color="primary"
            checked={isSelected || false}
            onChange={onChange}
            className={`step-checkbox ${
              isSelectionEnable ? 'always-visible' : ''
            }`}
          />
        </Box>
      )}

      {(isRunning || isQueued) && (
        <Box className="upload-progress-icon">
          <span className="upload-loader-progress">
            <svg
              version="1.1"
              x="0px"
              y="0px"
              width="52px"
              height="52px"
              viewBox="0 0 45 45"
            >
              <g className="loader">
                <circle fill="none" cx="22.5" cy="22.5" r="21" />
              </g>
            </svg>
          </span>
        </Box>
      )}
    </Box>
  );
}

ProcessStepIcon.propTypes = {
  failReason: string,
  icon: string.isRequired,
  isProcessRunning: bool,
  isSelected: bool,
  isSelectionEnable: bool,
  onChange: func.isRequired,
  stepStatus: string,
};

ProcessStepIcon.defaultProps = {
  failReason: '',
  stepStatus: '',
  processStatus: '',
  isSelected: false,
  isProcessRunning: false,
  isSelectionEnable: false,
};

export default ProcessStepIcon;
