import React, { useEffect, useState } from 'react';
import { func } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Box, Typography, Button, Drawer, withStyles } from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

import SourceTableSelector from '../../../components/SourceTableSelector';
import ImportSourceTable from '../../SourceTables/ImportSourceTable';
import ProcessImportedTable from '../../SourceTables/ProcessImportedTable';
import FinancialEnvSetupFooter from '../Footer';

import { SOURCE_TABLES_MSG } from '../../../configs/messages';
import { FINANCIAL_ENV_SETUP_MENU_KEYS } from '../configs';
import { showErrorMsg } from '../../../utils/notifications';
import {
  setActiveTab,
  setActualTable,
  setActualTableInputs,
} from '../../../reducers/FinancialEnvSetup/actions';

import { styles } from './styles';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const SelectActualTable = ({
  setActiveTab,
  classes,
  setActualTable,
  setActualTableInputs,
}) => {
  const [table, setTable] = useState({});
  const [height, setHeight] = useState(200);
  const [isImportModal, setImportModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);

  useEffect(() => {
    setCalculatedHeight();
  }, []);

  const setCalculatedHeight = () => {
    try {
      const [ele] = document.getElementsByClassName('gl-header');

      setHeight(window.innerHeight - ele.offsetHeight - 225);
    } catch {
      setHeight(window.innerHeight - 420);
    }
  };

  const handleTable = table => {
    setTable(table);
  };

  const handleNext = () => {
    logAmplitudeEvent('Financial Env. Setup: next on select actuals table');

    if (!table.id) {
      showErrorMsg(SOURCE_TABLES_MSG.select_table_required);
      return;
    }

    setActiveTab(FINANCIAL_ENV_SETUP_MENU_KEYS.configureActuals);
    setActualTableInputs({});
    setActualTable(table);
  };

  const closeImportModal = () => {
    setImportModal(false);
  };

  const closePreviewModal = () => {
    setPreviewModal(false);
  };

  const handleRedirect = () => {
    setImportModal(false);
    setPreviewModal(true);
  };

  const handleImportedTable = table => {
    setTable(table);
    setPreviewModal(false);
  };

  return (
    <Box>
      <Box className="gl-header">
        <Typography variant="caption" color="textSecondary">
          Load Actuals Data
        </Typography>
        <Box
          mt={1}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h2">
            Let's start by bringing in your "Actuals" data.
            <br />
            Select a dataset from the system.
          </Typography>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              logAmplitudeEvent('Financial Env. Setup: import table');
              setImportModal(true);
            }}
          >
            Import New Table
          </Button>
        </Box>
      </Box>

      {!previewModal && (
        <SourceTableSelector
          mt={5}
          height={`${height}px`}
          selectedTable={table.id}
          onSelect={handleTable}
          withScroll
        />
      )}

      <FinancialEnvSetupFooter
        activeTab={FINANCIAL_ENV_SETUP_MENU_KEYS.loadActuals}
        onNext={handleNext}
        // helperText="You can select source table or created data sets from processes."
      />

      {isImportModal && (
        <ImportSourceTable
          isOpen
          handleClose={closeImportModal}
          onRedirect={handleRedirect}
        />
      )}

      <Drawer
        anchor="right"
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
        open={previewModal}
        onClose={closePreviewModal}
      >
        <Box>
          {false && (
            <CloseIcon
              className={classes.drawerCloseIcon}
              onClick={closePreviewModal}
            />
          )}
          <ProcessImportedTable
            onRedirect={handleImportedTable}
            onCancel={closePreviewModal}
          />
        </Box>
      </Drawer>
    </Box>
  );
};

SelectActualTable.propTypes = {
  setActiveTab: func.isRequired,
  setActualTable: func.isRequired,
  setActualTableInputs: func.isRequired,
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {
  setActiveTab,
  setActualTable,
  setActualTableInputs,
})(withStyles(styles)(SelectActualTable));
