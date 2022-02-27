import React from 'react';
import { bool, string } from 'prop-types';
import { Grid, Button, Typography } from '@material-ui/core';

import ImportSourceTable from '../ImportSourceTable';
import CreateSourceTable from '../CreateSourceTable';
import ImgRenderer from '../../../components/ImgRenderer';

import './styles.scss';

function NoSourceTables({ hideImportBtn, title }) {
  const [isImportModal, setImportModal] = React.useState(false);
  const [isCreateModal, setCreateModal] = React.useState(false);

  const handleCloseImportModal = data => {
    setImportModal(false);
  };

  const handleCloseCreateModal = data => {
    setCreateModal(false);
  };

  return (
    <div
      className="source-table-msg"
      style={{ height: hideImportBtn ? 'auto' : '72vh' }}
    >
      <Grid container direction="row" justify="center" alignItems="center">
        <ImgRenderer src="no-source-table.svg" />

        <Typography variant="h5" gutterBottom color="textSecondary">
          {`No ${title} Found`}
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          You can create a new table or you can import a <br />
          new table from Microsoft Excel
        </Typography>

        {!hideImportBtn && (
          <div className="btn-option">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => setImportModal(true)}
            >
              Import Table
            </Button>
          </div>
        )}
      </Grid>

      {isImportModal && (
        <ImportSourceTable isOpen handleClose={handleCloseImportModal} />
      )}

      {isCreateModal && (
        <CreateSourceTable isOpen handleClose={handleCloseCreateModal} />
      )}
    </div>
  );
}

NoSourceTables.propTypes = {
  hideImportBtn: bool,
  title: string,
};

NoSourceTables.defaultProps = {
  hideImportBtn: false,
  title: 'Source Table',
};

export default NoSourceTables;
