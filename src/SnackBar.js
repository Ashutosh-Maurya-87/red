import React from 'react';
import { func } from 'prop-types';
import { withSnackbar } from 'notistack';

class SnackBar extends React.Component {
  /**
   * When Component Did Mount
   */
  componentDidMount = () => {
    /* Add 'Set Snack' Event Listener */
    document.addEventListener('SHOW_NOTIFICATION', this.handleSnackEvent);
  };

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    document.removeEventListener('SHOW_NOTIFICATION', this.handleSnackEvent);
  }

  /**
   * Handle Snack Event
   *
   * @param {Object}
   */
  handleSnackEvent = ({ detail }) => {
    const { message, type } = detail;

    const configs = {
      variant: type,
      persist: false,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      },
    };

    this.props.enqueueSnackbar(message, configs);
  };

  /**
   * Render View
   */
  render() {
    return <></>;
  }
}

/**
 * Define component props
 */
SnackBar.propTypes = {
  enqueueSnackbar: func,
};

export default withSnackbar(SnackBar);
