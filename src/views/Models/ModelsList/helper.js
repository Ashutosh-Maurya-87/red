import { get } from 'lodash';
import moment from 'moment';

import {
  Check as CheckIcon,
  WarningRounded as WarningRoundedIcon,
  Autorenew as SyncIcon,
} from '@material-ui/icons';

import { MODELS_MSG } from '../../../configs/messages';

/**
 * Model Execution Status [API]
 */
export const MODEL_RUN_STATUS = {
  inProcess: 'IN_PROCESS',
  failed: 'FAILED',
  completed: 'COMPLETED',
};

/**
 * Get Formatted Models List
 *
 * @param {Array} data
 *
 * @param {Array}
 */
export const getFormattedModelsList = data => {
  return data.map(item => ({
    ...item,
    ...getFormattedDates(item),
    ...getSrcDetails(item),
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
 * Get Source details for Model
 *
 * @param {Object} model
 *
 * @param {Object}
 */
export const getSrcDetails = model => {
  const srcType = 'Scenario';
  const srcIcon = 'scenario.svg';
  const srcName = get(model, 'scenario.scenario_meta.dataset_name') || '';

  return { srcType, srcIcon, srcName };
};

/**
 * Get `Run Status` details for Model
 *
 * @param {Object} model
 *
 * @param {Object}
 */
export const getRunStatusDetails = ({ run_status } = {}) => {
  let statusIcon;
  let runStatus;
  let statusClassName = '';

  // Assign Random Status
  // if (!run_status) {
  //   const randomIndex = Math.floor(Math.random() * 4);
  //   run_status = Object.values(MODEL_RUN_STATUS)[randomIndex];
  // }

  switch (run_status) {
    case MODEL_RUN_STATUS.inProcess:
      statusIcon = SyncIcon;
      runStatus = 'In Progress';
      statusClassName = 'progress';
      break;

    case MODEL_RUN_STATUS.completed:
      statusIcon = CheckIcon;
      runStatus = 'Completed';
      statusClassName = 'completed';
      break;

    case MODEL_RUN_STATUS.failed:
      statusIcon = WarningRoundedIcon;
      runStatus = 'Failed';
      statusClassName = 'error';
      break;

    default:
      break;
  }

  return { statusIcon, runStatus, statusClassName };
};
