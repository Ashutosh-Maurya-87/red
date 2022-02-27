import React from 'react';
import { getUserSession } from '../../utils/localStorage';

class UnsavedChangesBase extends React.Component {
  /**
   * Subscribe `Confirm Leave Page` Events
   */
  subscribeConfirmLeavePage = () => {
    window.addEventListener('beforeunload', this.handleBeforeUnload, false);
  };

  /**
   * Unsubscribe `Confirm Leave Page` Events
   */
  unsubscribeConfirmLeavePage = () => {
    window.removeEventListener('beforeunload', this.handleBeforeUnload, false);
  };

  /**
   * Handle Window Unload
   *
   * @param {Object} evt
   */
  handleBeforeUnload = evt => {
    if (!this.hasUnsavedChanges()) return;

    evt.preventDefault();
    evt.returnValue = '';
  };

  /**
   * Handle Prompt message response
   *
   * @param {Object} nextLocation
   */
  handleBlockedNavigation = nextLocation => {
    const { isVisibleUnsavedChanges } = this.state;

    const isAuthenticated = Boolean(getUserSession());

    if (
      isAuthenticated &&
      this.hasUnsavedChanges() &&
      !isVisibleUnsavedChanges
    ) {
      const discardAction = () => {
        let url = nextLocation.pathname;
        if (nextLocation && nextLocation.search) {
          url += nextLocation.search;
        }

        this.props.history.push(url);
      };

      this.setState({ isVisibleUnsavedChanges: true, discardAction });

      return false;
    }

    return true;
  };

  /**
   * Handle Confirmation Response for unsaved Changes Modal
   *
   * @param {Boolean} isDiscard
   */
  handleUnsavedConf = isDiscard => () => {
    const callback = () => {
      this.setState({
        isVisibleUnsavedChanges: false,
        discardAction: null,
      });
    };

    if (!isDiscard) {
      callback();
      return;
    }

    const { discardAction } = this.state;
    if (discardAction && typeof discardAction == 'function') discardAction();

    callback();
  };
}

UnsavedChangesBase.propTypes = {};

UnsavedChangesBase.defaultProps = {};

export default UnsavedChangesBase;
