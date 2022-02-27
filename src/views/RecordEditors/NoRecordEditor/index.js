import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { bool, string } from 'prop-types';
import { Grid, Button, Typography } from '@material-ui/core';

import ImgRenderer from '../../../components/ImgRenderer';
import CreateRecordEditorModal from '../CreateRecordEditor/CreateRecordEditorModal';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

function NoRecordEditor({ history, hideCreateBtn, msg }) {
  const [isSelectTableModal, setSelectTableModal] = useState(false);

  /**
   * Toggle Select Table Modal for Create
   */
  const toggleSelectTableModal = () => {
    logAmplitudeEvent('Create new record editor');
    setSelectTableModal(!isSelectTableModal);
  };

  return (
    <>
      <CreateRecordEditorModal
        isOpen={isSelectTableModal}
        onClose={toggleSelectTableModal}
      />
      <div
        className="record-editor-msg"
        style={{ height: hideCreateBtn ? 'auto' : '72vh' }}
      >
        <Grid container direction="row" justify="center" alignItems="center">
          <ImgRenderer src="record-editor.svg" />

          <Typography variant="h5" gutterBottom color="textSecondary">
            {msg}
          </Typography>

          {!hideCreateBtn && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              You can create a new Record Editor
            </Typography>
          )}

          {!hideCreateBtn && (
            <div className="btn-option">
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={toggleSelectTableModal}
              >
                New Record Editor
              </Button>
            </div>
          )}
        </Grid>
      </div>
    </>
  );
}

NoRecordEditor.propTypes = {
  hideCreateBtn: bool,
  msg: string,
};

NoRecordEditor.defaultProps = {
  hideCreateBtn: false,
  msg: 'No Record Editor Available',
};

export default withRouter(NoRecordEditor);
