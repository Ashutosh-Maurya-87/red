import React from 'react';
import { withRouter } from 'react-router-dom';
import { func, string } from 'prop-types';
import { Grid, Button, Typography, Box } from '@material-ui/core';

import ImgRenderer from '../../../../components/ImgRenderer';

function NoGridDataFound({ onExport, onImport, msg, subTitle }) {
  return (
    <Box className="rule-based-msg" height="80vh">
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="rule-based-forecasting.svg" />

        <Typography variant="h5" gutterBottom color="textSecondary">
          {msg}
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          {subTitle}
        </Typography>

        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          {onExport && (
            <Box mr={2}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={onExport}
              >
                Download Template
              </Button>
            </Box>
          )}
          {onImport && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={onImport}
            >
              Import
            </Button>
          )}
        </Box>
      </Grid>
    </Box>
  );
}

NoGridDataFound.propTypes = {
  msg: string,
  onExport: func,
  onImport: func,
  subTitle: string,
};

NoGridDataFound.defaultProps = {
  msg: `No Data Available`,
  subTitle: 'You can import your data',
  onExport: () => {},
  onImport: () => {},
};

export default withRouter(NoGridDataFound);
