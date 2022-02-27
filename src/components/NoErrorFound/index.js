import React from 'react';
import { string } from 'prop-types';

import { Grid, Typography } from '@material-ui/core';

import ImgRenderer from '../ImgRenderer';
import { PRE_DEFINED_LABELS } from '../../configs/app';
import { ERROR_MESSAGES } from '../../configs/messages';

const NoErrorFound = ({ type = '' }) => {
  return (
    <div className="source-table-msg" style={{ height: '70vh' }}>
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="scenario.svg" />

        <Typography variant="h5" gutterBottom color="textSecondary">
          {ERROR_MESSAGES.no_error_found_table.replace('#TABLE_TYPE#', type)}
        </Typography>
      </Grid>
    </div>
  );
};

// Props validation
NoErrorFound.propTypes = {
  type: string.isRequired,
};

// Default Props
NoErrorFound.defaultProps = {
  type: PRE_DEFINED_LABELS.scenarios.label,
};

export default NoErrorFound;
