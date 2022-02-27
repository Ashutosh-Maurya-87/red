import React from 'react';
import { withRouter } from 'react-router-dom';
import { bool, string } from 'prop-types';
import { Grid, Button, Typography } from '@material-ui/core';

import { APP_ROUTES } from '../../../configs/routes';
import ImgRenderer from '../../../components/ImgRenderer';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

function NoModel({ history, hideCreateBtn, msg }) {
  /**
   * Go To Create Model
   */
  const goToCreateModel = () => {
    logAmplitudeEvent('Create new model');
    history.push({ pathname: APP_ROUTES.CREATE_MODEL });
  };

  return (
    <div
      className="no-model-msg"
      style={{ height: hideCreateBtn ? 'auto' : '72vh' }}
    >
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="model.svg" />

        <Typography variant="h5" gutterBottom color="textSecondary">
          {msg}
        </Typography>

        {!hideCreateBtn && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            You can create a new Model
          </Typography>
        )}

        {!hideCreateBtn && (
          <div className="btn-option">
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={goToCreateModel}
            >
              Create New Model
            </Button>
          </div>
        )}
      </Grid>
    </div>
  );
}

NoModel.propTypes = {
  hideCreateBtn: bool,
  msg: string,
};

NoModel.defaultProps = {
  hideCreateBtn: false,
  msg: 'No Model Available',
};

export default withRouter(NoModel);
