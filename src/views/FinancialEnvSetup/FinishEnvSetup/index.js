import React from 'react';
import { withRouter } from 'react-router-dom';
import { Box, Typography, Grid, Button } from '@material-ui/core';

import ImgRenderer from '../../../components/ImgRenderer';
import FinancialEnvSetupFooter from '../Footer';
import HelpGuideInfo from '../Footer/HelpGuideInfo';

import { AI_MODULES_DISPLAY_NAME } from '../../../configs/app';
import { APP_ROUTES } from '../../../configs/routes';
import { logAmplitudeEvent } from '../../../utils/amplitude';
import './styles.scss';

function FinishFinancialEnvSetup({ history }) {
  const goToRoute = (route, route_label) => () => {
    logAmplitudeEvent(`Financial Env. Setup: go to ${route_label}`);
    history.push(route);
  };

  return (
    <Box>
      <Box className="env-msg full-height-container" flexDirection="column">
        <Grid container direction="row" justify="center" alignItems="center">
          <ImgRenderer src="complete-fin-env.svg" />
          <Typography variant="h5" gutterBottom color="textSecondary">
            Well Done!
          </Typography>
        </Grid>

        <Box display="flex" mt={2}>
          <Box
            border={1}
            borderColor="secondary.stepBorderColor"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-around"
            minHeight="195"
            p={2}
          >
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Go to Scenarios where you can create or upload Forecasts and
              Annual Operating Plans.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={goToRoute(APP_ROUTES.SCENARIOS, 'scenario')}
            >
              Scenarios
            </Button>
          </Box>
          <Box
            border={1}
            borderColor="secondary.stepBorderColor"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-around"
            minHeight="195"
            p={2}
            ml={2}
          >
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Connect columns in the Actuals data to reference tables to add
              context (such as Customer details).
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={goToRoute(APP_ROUTES.DIMENSIONS, 'dimensions')}
            >
              {`${AI_MODULES_DISPLAY_NAME.dimensions}`}
            </Button>
          </Box>
        </Box>
      </Box>
      <FinancialEnvSetupFooter helperText={<HelpGuideInfo />} />
    </Box>
  );
}

export default withRouter(FinishFinancialEnvSetup);
