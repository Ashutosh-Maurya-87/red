import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { string } from 'prop-types';
import { Grid, Button, Typography, Box } from '@material-ui/core';

import { AI_MODULES_DISPLAY_NAME } from '../../../configs/app';

import ImgRenderer from '../../../components/ImgRenderer';
import CreateDimensionModal from '../CreateDimension/CreateDimensionModal';

import './styles.scss';

function NoDimension({ history, height }) {
  const [isSelectTableModal, setSelectTableModal] = useState(false);

  /**
   * Toggle Select Table Modal for Create Dimension
   */
  const toggleSelectTableModal = () => {
    setSelectTableModal(!isSelectTableModal);
  };

  return (
    <>
      <CreateDimensionModal
        isOpen={isSelectTableModal}
        onClose={toggleSelectTableModal}
      />

      <Box className="dimension-msg" height={height}>
        <Grid container direction="row" justify="center" alignItems="center">
          <ImgRenderer src="dimension.svg" />

          <Typography variant="h5" gutterBottom color="textSecondary">
            {`No ${AI_MODULES_DISPLAY_NAME.dimension} Available`}
          </Typography>

          <Typography variant="body2" color="textSecondary" gutterBottom>
            {`You can create a new ${AI_MODULES_DISPLAY_NAME.dimension}`}
          </Typography>

          <div className="btn-option">
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={toggleSelectTableModal}
            >
              {`New ${AI_MODULES_DISPLAY_NAME.dimension}`}
            </Button>
          </div>
        </Grid>
      </Box>
    </>
  );
}

NoDimension.propTypes = {
  height: string,
};

NoDimension.defaultProps = {
  height: undefined,
};

export default withRouter(NoDimension);
