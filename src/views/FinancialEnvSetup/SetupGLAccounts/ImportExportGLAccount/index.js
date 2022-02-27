import React, { useState } from 'react';
import { func } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Typography, Box, Button } from '@material-ui/core';
import { CloudDownload as CloudDownloadIcon } from '@material-ui/icons';

import ImportGLAccountModal from '../ImportGLAccountModal';
import Spinner from '../../../../components/Spinner';

import { API_URLS } from '../../../../configs/api';
import { httpGet } from '../../../../utils/http';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

const ImportExportGLAccount = ({ onNext }) => {
  const [isImport, setImport] = useState(false);
  const [showLoader, setLoader] = useState(false);

  const toggleImport = () => setImport(!isImport);

  /**
   * Handle imported data
   */
  const handleData = () => {
    toggleImport();
    onNext();
  };

  /**
   * Export GL Accounts
   */
  const exportGLAccount = async () => {
    logAmplitudeEvent('Financial Env. Setup: download GL account template');

    try {
      setLoader(true);
      if (showLoader) return;

      const { url } = await httpGet(API_URLS.EXPORT_GL_ACCOUNT);

      programmaticallyLoadByUrl(url, { target: '_blank' });

      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };

  return (
    <div className="configure-actuals-data">
      {showLoader && <Spinner />}

      <Box>
        <Typography variant="h4">Import your GL Account data</Typography>
      </Box>

      <Box className="full-height-container">
        <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              1
            </Typography>
            <Typography variant="body1">
              Download the GL Account Template
            </Typography>
          </Box>

          <Box pl={4} pt={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Our system expects GL Account data in a particular format. Let's
              use the GL Account Template to upload your Chart of Accounts.
            </Typography>

            <Box pt={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudDownloadIcon />}
                onClick={exportGLAccount}
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
            <Typography variant="body1">Add your GL Data</Typography>
          </Box>
        </Box>

        <Box display="flex" pl={4} pt={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Add GL Accounts into the downloaded template.
          </Typography>
        </Box>

        <Box mt={5}>
          <Box display="flex">
            <Typography variant="body2" className="config-count">
              3
            </Typography>
            <Typography variant="body1">
              Import the completed Template
            </Typography>
          </Box>
          <Box display="flex" pl={4} pt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                logAmplitudeEvent(
                  'Financial Env. Setup: import completed template'
                );
                toggleImport();
              }}
              startIcon={<CloudDownloadIcon />}
            >
              Import
            </Button>
          </Box>
        </Box>

        <ImportGLAccountModal
          handleData={handleData}
          isOpen={isImport}
          onClose={toggleImport}
        />
      </Box>
    </div>
  );
};

ImportExportGLAccount.propTypes = {
  onNext: func,
};

ImportExportGLAccount.defaultProps = {
  onNext: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, {})(ImportExportGLAccount);
