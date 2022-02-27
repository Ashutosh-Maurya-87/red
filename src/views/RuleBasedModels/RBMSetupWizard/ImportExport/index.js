import React, { useState } from 'react';
import { bool, func, shape } from 'prop-types';

import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createStructuredSelector } from 'reselect';

import { Box, Button, Typography } from '@material-ui/core';
import { CloudDownload as CloudDownloadIcon } from '@material-ui/icons';

import Spinner from '../../../../components/Spinner';
import UploadLoader from '../../../../components/UploadLoader';

import { httpGet } from '../../../../utils/http';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';

import { RULE_BASED_MODELS_API } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';

import { setSourceTable } from '../../../../reducers/SourceTables/actions';

import RuleBasedModelSetUpFooter from '../Footer';
import ImportSourceTable from '../../../SourceTables/ImportSourceTable';

import { RULE_BASED_MODEL_SETUP_MENU_KEYS } from '../../configs';

import { getSingleRBM } from '../../../../reducers/RuleBasedModels/selectors';
import { handleFileForReloadTable } from '../../../../services/Dimensions';
import { uploadFiles } from '../../../../services/Source';

const ImportExport = ({
  isFinishEnable,
  history,
  setSourceTable,
  singleRBM,
}) => {
  const [showLoader, setLoader] = useState(false);
  const [isReloadTable, toggleIsReloadModal] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(null);

  const { id = '' } = singleRBM || {};

  const toggleImport = () => {
    toggleIsReloadModal(true);
  };

  /**
   * Export Template
   */
  const exportTemplate = async () => {
    try {
      setLoader(true);
      if (showLoader) return;

      const url = RULE_BASED_MODELS_API.EXPORT_TEMPLATE_RBM.replace('#ID#', id);

      const { data: { url: file_url } = {} } = await httpGet(url);

      programmaticallyLoadByUrl(file_url, { target: '_blank' });

      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };

  /**
   * Handle Next button
   */
  const handleNext = () => {
    history.push(APP_ROUTES.RULE_BASED_MODEL.replace(':id', id));
  };

  /**
   * Handle Back button
   */
  const handlePrev = () => {
    const {
      location: { search = '' },
    } = history || {};

    const query = new URLSearchParams(search);
    const id = query.get('id');

    let url = APP_ROUTES.CREATE_RULE_BASED_MODEL;
    url += `?id=${id}&activeTab=1`;

    history.push(url);
  };

  /**
   * Handle File > Reload Rule Based Model
   *
   * @param {Object} file
   */

  const handleFileForReload = async file => {
    try {
      toggleIsReloadModal(false);

      const uploadedFile = await uploadFile(file);
      if (!uploadedFile) return;

      const { source_table_id = '' } = singleRBM || {};

      const sourceTableObj = await handleFileForReloadTable(
        uploadedFile,
        source_table_id
      );

      const {
        location: { search = '' },
      } = history;

      const query = new URLSearchParams(search);

      const tab = Number(query.get('activeTab'));

      if (sourceTableObj) {
        setSourceTable(sourceTableObj);
      }

      setUploadPercentage(null);

      let url = APP_ROUTES.VIEW_RULE_BASED_MODEL;

      url += `?id=${id}&activeTab=${tab}`;

      history.push(url);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Upload Imported File
   *
   * @return {String}
   */
  const uploadFile = async file => {
    try {
      setUploadPercentage(0);

      const url = uploadFiles(file, setUploadPercentage);

      return url;
    } catch (e) {
      setUploadPercentage(null);
      return '';
    }
  };

  return (
    <>
      <div className="configure-actuals-data">
        {showLoader && <Spinner />}

        <Box>
          <Typography variant="caption" color="textSecondary">
            Export/Import Data
          </Typography>
          <Box mt={1} mb={3}>
            <Typography variant="h2">Import your Data</Typography>
          </Box>
        </Box>

        <Box className="full-height-container">
          <Box mt={5}>
            <Box display="flex">
              <Typography variant="body2" className="config-count">
                1
              </Typography>
              <Typography variant="body1">Download Template</Typography>
            </Box>

            <Box pl={4} pt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Now that you've created your columns, Download the template so
                you can populate it with your data.
              </Typography>

              <Box pt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudDownloadIcon />}
                  onClick={exportTemplate}
                >
                  Download Template
                </Button>
              </Box>
            </Box>
          </Box>

          <Box mt={5}>
            <Box display="flex">
              <Typography variant="body2" className="config-count">
                2
              </Typography>
              <Typography variant="body1">Modify Template</Typography>
            </Box>
          </Box>

          <Box display="flex" pl={4} pt={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Fill the template with your data.
            </Typography>
          </Box>

          <Box mt={5}>
            <Box display="flex">
              <Typography variant="body2" className="config-count">
                3
              </Typography>
              <Typography variant="body1">Import completed Template</Typography>
            </Box>

            <Box display="flex" pl={4} pt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={toggleImport}
                startIcon={<CloudDownloadIcon />}
              >
                Import
              </Button>
            </Box>
          </Box>
        </Box>
      </div>

      {isReloadTable && (
        <ImportSourceTable
          isOpen
          handleClose={() => toggleIsReloadModal(false)}
          handleFile={handleFileForReload}
        />
      )}

      {typeof uploadPercentage == 'number' && (
        <UploadLoader
          isVisible
          uploadPercentage={uploadPercentage}
          savingText="Saving..."
        />
      )}

      <RuleBasedModelSetUpFooter
        activeTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.importExport}
        isFinishEnable={isFinishEnable}
        prevTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.fieldConfigs}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  );
};

/**
 * propTypes of component
 */
ImportExport.propTypes = {
  isFinishEnable: bool.isRequired,
  setSourceTable: func.isRequired,
  singleRBM: shape({}),
};

/**
 * defaultProps of component
 */
ImportExport.defaultProps = {
  activeTab: '',
  isFinishEnable: true,
  prevTab: true,
  singleRBM: {},
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
});

export default connect(mapStateToProps, {
  setSourceTable,
})(withRouter(ImportExport));
