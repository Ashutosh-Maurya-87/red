/**
 * Helpers for managing Amplitude analytics instrumentation
 *
 * The tracing used here is sent to the relevant Amplitude project server to
 * track user analytics. For more info, see {@link https://amplitude.com/}
 */

import amplitude from 'amplitude-js';
import { AMPLITUDE_API_KEY } from '../configs/amplitude';

let isAmplitudeEnabled = false;

/**
 * Initializes the singleton amplitude client. Define the relevant Amplitude
 * project API key in the src/configs/amplitude.js file as per their ENV (AMPLITUDE_API_KEY).
 */
export const initAmplitude = () => {
  if (AMPLITUDE_API_KEY) {
    amplitude.getInstance().init(AMPLITUDE_API_KEY);
    isAmplitudeEnabled = true;
  }
};

/**
 * Sets the Amplitude user ID so the user shows up user analytics
 * @param userId the user ID to set to. Set to null to clear the current user ID
 */
export const setAmplitudeUserId = userId => {
  if (isAmplitudeEnabled) {
    amplitude.getInstance().setUserId(userId);
  }
};

/**
 * Logs an Amplitude event
 * @param eventId Unique identifier for the event
 * @returns {Promise<void>}
 */
export const logAmplitudeEvent = async eventId => {
  if (isAmplitudeEnabled) {
    amplitude.getInstance().logEvent(eventId);
  }
};
