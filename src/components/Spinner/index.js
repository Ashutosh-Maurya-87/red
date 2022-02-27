import React from 'react';
import { string } from 'prop-types';
import { CircularProgress, Typography } from '@material-ui/core';

import './styles.scss';

const Spinner = ({ text = '' }) => {
  return (
    <div className={`app-spinner-wrap ${text ? 'with-text' : ''}`}>
      <div className="app-spinner">
        <CircularProgress disableShrink />
        {text && <Typography variant="body1">{text}</Typography>}
      </div>
    </div>
  );
};

Spinner.propTypes = {
  text: string,
};

Spinner.defaultProps = {
  text: '',
};

export default Spinner;
