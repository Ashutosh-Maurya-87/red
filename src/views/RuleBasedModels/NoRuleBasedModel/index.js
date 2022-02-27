import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { bool, string } from 'prop-types';
import { Grid, Button, Typography } from '@material-ui/core';

import ImgRenderer from '../../../components/ImgRenderer';
import { RBM_DISPLAY_NAME } from '../../../configs/app';

import CreateRuleBaseModelDialog from '../CreateRuleBaseModelDialog';
import './styles.scss';

function NoRuleBasedModel({ history, hideCreateBtn, msg }) {
  const [isShowCreateRBM, setIsShowCreateRBM] = useState(false);

  /**
   * Go To Create Rule Based Model
   */
  const goToCreateRBM = () => {
    setIsShowCreateRBM(true);
  };

  return (
    <div
      className="no-rule-based-model-msg"
      style={{ height: hideCreateBtn ? 'auto' : '72vh' }}
    >
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="rule-based-forecasting.svg" />

        <Typography variant="h5" gutterBottom color="textSecondary">
          {msg}
        </Typography>

        {!hideCreateBtn && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            You can create a new {RBM_DISPLAY_NAME.label}
          </Typography>
        )}

        {!hideCreateBtn && (
          <div className="btn-option">
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={goToCreateRBM}
            >
              Create New
            </Button>
          </div>
        )}

        {isShowCreateRBM && (
          <CreateRuleBaseModelDialog
            isOpen={isShowCreateRBM}
            showLoader={false}
            handleClose={() => {
              setIsShowCreateRBM(false);
            }}
          />
        )}
      </Grid>
    </div>
  );
}

NoRuleBasedModel.propTypes = {
  hideCreateBtn: bool,
  msg: string,
};

NoRuleBasedModel.defaultProps = {
  hideCreateBtn: false,
  msg: `No ${RBM_DISPLAY_NAME.rbmLabel} Available`,
};

export default withRouter(NoRuleBasedModel);
