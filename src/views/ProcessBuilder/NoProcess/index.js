import React from 'react';
import { withRouter } from 'react-router-dom';
import { Grid, Button, Typography } from '@material-ui/core';

import ImgRenderer from '../../../components/ImgRenderer';
import { APP_ROUTES } from '../../../configs/routes';

import './styles.scss';

function NoPorcess({ history }) {
  const goToCreateProcess = () => {
    history.push(APP_ROUTES.CREATE_PROCESS);
  };

  return (
    <div className="process-msg">
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="no-process.svg" />
        <Typography variant="h5" gutterBottom color="textSecondary">
          No Process Available
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          You can create a new process
        </Typography>
        <div className="btn-option">
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={goToCreateProcess}
          >
            Create Process
          </Button>
        </div>
      </Grid>
    </div>
  );
}

export default withRouter(NoPorcess);
