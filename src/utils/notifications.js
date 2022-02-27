import { ERROR_MESSAGES } from '../configs/messages';

/**
 * Show Success Notification
 *
 * @param {String} msg [message to show]
 */
export const showSuccessMsg = msg => {
  showNotification(msg, 'success');
};

/**
 * Show Error Notification
 *
 * @param {String} msg [message to show]
 */
export const showErrorMsg = (msg = ERROR_MESSAGES.internal_error) => {
  showNotification(msg, 'error');
};

/**
 * Show Warning Notification
 *
 * @param {String} msg [message to show]
 */
export const showWarnMsg = msg => {
  showNotification(msg, 'warning');
};

/**
 * Show Info Notification
 *
 * @param {String} msg [message to show]
 */
export const showInfoMsg = msg => {
  showNotification(msg, 'info');
};

/**
 * Format amd Show Notification
 *
 * @param {String} msg
 * @param {String} type ['success', 'warning', 'info', 'error']
 *
 * @return {Object} snack
 */
const showNotification = (msg, type) => {
  const detail = {
    id: new Date().getTime(),
    message: typeof msg == 'string' ? msg : '',
    type,
  };

  const e = new CustomEvent('SHOW_NOTIFICATION', { detail });

  document.dispatchEvent(e);
};
