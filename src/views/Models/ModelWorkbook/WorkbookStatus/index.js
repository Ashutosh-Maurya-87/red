import React from 'react';
import { string } from 'prop-types';

import { Grid, Typography } from '@material-ui/core';

import { Cached as CachedIcon } from '@material-ui/icons';

import ImgRenderer from '../../../../components/ImgRenderer';
import { MODEL_RUN_STATUS } from '../../ModelsList/helper';

const WorkbookStatus = ({ msg } = {}) => {
  return (
    <div className="no-model-msg" style={{ height: '72vh' }}>
      {msg != MODEL_RUN_STATUS.inProcess && (
        <Grid container direction="row" justify="center" alignItems="center">
          <span className="last-executed-status error">
            <ImgRenderer src="model.svg" />
          </span>
          <Typography variant="h5" gutterBottom color="textSecondary">
            {msg}
          </Typography>
        </Grid>
      )}

      {msg == MODEL_RUN_STATUS.inProcess && (
        <Grid container direction="row" justify="center" alignItems="center">
          <span className="last-executed-status progress animate-icon">
            <CachedIcon style={{ fontSize: '100px' }} />
          </span>
          <Typography variant="h5" gutterBottom color="textSecondary">
            Run in Progress
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Your execution is in progress. Please wait...
          </Typography>
        </Grid>
      )}
    </div>
  );
};

WorkbookStatus.propTypes = {
  msg: string,
};

WorkbookStatus.defaultProps = {
  workbook: {},
  msg: '',
};

export default WorkbookStatus;
