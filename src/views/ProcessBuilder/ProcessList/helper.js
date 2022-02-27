import moment from 'moment';

import {
  Check as CheckIcon,
  WarningRounded as WarningRoundedIcon,
  Autorenew as SyncIcon,
} from '@material-ui/icons';

import { MODELS_MSG } from '../../../configs/messages';

import { PROCESS_RUN_STATUS } from './configs';

/**
 * Get Formatted Process List
 *
 * @param {Array} data
 *
 * @param {Array}
 */
export const getFormattedProcessList = data => {
  return data.map(item => ({
    ...item,
    ...getFormattedDates(item),
    ...getRunStatusDetails(item),
  }));
};

/**
 * Get Formatted Dates
 *
 * @param {Object} model
 *
 * @param {Object}
 */
export const getFormattedDates = ({
  created_at,
  updated_at,
  last_run_at,
} = {}) => {
  let createdAt = '';
  let updatedAt = '';
  let lastRunAt = MODELS_MSG.not_executed_yet;

  if (created_at) createdAt = moment.utc(created_at).local().calendar();

  if (updated_at) updatedAt = moment.utc(updated_at).local().calendar();

  if (last_run_at) lastRunAt = moment.utc(last_run_at).local().calendar();

  return { createdAt, updatedAt, lastRunAt };
};

/**
 * Get `Run Status` details for Process
 *
 * @param {Object} process
 *
 * @param {Object}
 */
export const getRunStatusDetails = ({ status, last_run_at } = {}) => {
  let statusIcon;
  let runStatus;
  let statusClassName = '';

  if (status == PROCESS_RUN_STATUS.created && last_run_at) {
    statusIcon = CheckIcon;
    runStatus = PROCESS_RUN_STATUS.completed;
    statusClassName = 'completed';

    return { statusIcon, runStatus, statusClassName };
  }

  switch (status) {
    case PROCESS_RUN_STATUS.queued:
      statusIcon = SyncIcon;
      runStatus = PROCESS_RUN_STATUS.queued;
      statusClassName = 'progress';
      break;

    case PROCESS_RUN_STATUS.completed:
      statusIcon = CheckIcon;
      runStatus = PROCESS_RUN_STATUS.completed;
      statusClassName = 'completed';
      break;

    case PROCESS_RUN_STATUS.failed:
      statusIcon = WarningRoundedIcon;
      runStatus = PROCESS_RUN_STATUS.failed;
      statusClassName = 'error';
      break;

    default:
      break;
  }

  return { statusIcon, runStatus, statusClassName };
};
