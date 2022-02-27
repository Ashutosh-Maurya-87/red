import React from 'react';
import { withRouter } from 'react-router-dom';
import { string, func } from 'prop-types';
import { Button, Box } from '@material-ui/core';

import { APP_ROUTES } from '../../../../configs/routes';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function CreateScenarioFooter({ history, backText, nextText, onNext, onBack }) {
  const defaultOnBack = () => {
    logAmplitudeEvent('Cancel scenario');
    history.push(APP_ROUTES.SCENARIOS);
  };

  if (!onBack) onBack = defaultOnBack;

  return (
    <Box pt={5} px={3} mb={4}>
      {backText && (
        <Box component="span" mr={2}>
          <Button variant="outlined" color="primary" onClick={onBack}>
            {backText}
          </Button>
        </Box>
      )}

      {nextText && (
        <Button variant="contained" color="primary" onClick={onNext}>
          {nextText}
        </Button>
      )}
    </Box>
  );
}

CreateScenarioFooter.propTypes = {
  backText: string,
  nextText: string,
  onBack: func,
  onNext: func,
};

CreateScenarioFooter.defaultProps = {
  backText: '',
  nextText: '',
  onBack: undefined,
  onNext: () => {},
};

export default withRouter(CreateScenarioFooter);
