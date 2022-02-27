import React from 'react';
import { withRouter } from 'react-router-dom';
import { bool, string } from 'prop-types';
import { Grid, Button, Typography } from '@material-ui/core';

import ImgRenderer from '../../../components/ImgRenderer';
import { APP_ROUTES } from '../../../configs/routes';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

function NoScenario({ history, hideCreateBtn, msg }) {
  const goToCreateScenario = () => {
    logAmplitudeEvent('Create new scenario');
    history.push(APP_ROUTES.CREATE_SCENARIO);
  };

  return (
    <div
      className="scenario-msg"
      style={{ height: hideCreateBtn ? 'auto' : '72vh' }}
    >
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="scenario.svg" />

        <Typography variant="h5" gutterBottom color="textSecondary">
          {msg}
        </Typography>

        {!hideCreateBtn && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            You can create a new scenario
          </Typography>
        )}

        {!hideCreateBtn && (
          <div className="btn-option">
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={goToCreateScenario}
            >
              New Scenario
            </Button>
          </div>
        )}
      </Grid>
    </div>
  );
}

NoScenario.propTypes = {
  hideCreateBtn: bool,
  msg: string,
};

NoScenario.defaultProps = {
  hideCreateBtn: false,
  msg: 'No Scenario Available',
};

export default withRouter(NoScenario);
