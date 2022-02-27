import React, { useState } from 'react';
import { func, bool } from 'prop-types';
import Dropzone from 'react-dropzone';
import * as PapaParse from 'papaparse';
import { last } from 'lodash';
import XLSX from 'xlsx';
import moment from 'moment';

import {
  Button,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  withStyles,
} from '@material-ui/core';
import { Close, ReportProblemOutlined } from '@material-ui/icons';

import ImgRenderer from '../ImgRenderer';
import UploadLoader from '../UploadLoader';

import {
  MAX_RECORDS_TO_SHOW,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_MIME_TYPES,
} from '../../views/FinancialEnvSetup/SetupGLAccounts/configs';
import { DEFAULT_DATE_FORMAT } from '../../configs/app';
import { API_URLS } from '../../configs/api';
import { ERROR_MESSAGES, SOURCE_TABLES_MSG } from '../../configs/messages';

import { showErrorMsg } from '../../utils/notifications';
import getNumberFromAlphabet from '../../utils/helper/getNumberFromAlphabet';
import { httpPost } from '../../utils/http';

import { styles } from './styles';
import './styles.scss';

const ImportModal = ({
  handleData,
  isOpen,
  onClose,
  classes,
  showLoader,
  validateFile,
  isDialog,
}) => {
  const [error, setError] = useState('');
  const [isUploading, toggleUploading] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);

  /**
   * Handle file imported by user
   *
   * @param {Array|Object} files
   */
  const handleImportFile = files => {
    setError('');
    const [file] = files || [];

    if (!file || !SUPPORTED_MIME_TYPES.includes(file.type)) {
      showErrorMsg(ERROR_MESSAGES.unsupported_file);
      return;
    }

    const fileExt = file.name.split('.').pop();
    if (!SUPPORTED_FILE_TYPES.includes(fileExt)) {
      showErrorMsg(ERROR_MESSAGES.unsupported_file);
      return;
    }

    switch (fileExt.toLowerCase()) {
      case 'csv':
        readCsvFile(file);
        break;

      case 'xlsx':
      case 'xls':
        readExcelFile(file);
        break;

      default:
        break;
    }
  };

  /**
   * Read CSV File
   */
  const readCsvFile = file => {
    const reader = new FileReader();

    reader.onload = evt => {
      const { data } = PapaParse.parse(reader.result, {
        header: false,
        dynamicTyping: true,
        error: p => console.error(p),
        encoding: p => console.error(p),
      });

      // Remove Empty Last Row
      const lastRow = (last(data) || []).filter(Boolean);
      if (lastRow.length == 0) data.pop();

      processFileData({ file, data });
    };

    reader.readAsText(file);
  };

  /**
   * Read Excel FIle
   */
  const readExcelFile = file => {
    const reader = new FileReader();

    reader.onload = () => {
      // Read Excel File
      const wb = XLSX.read(reader.result, {
        type: 'binary',
        cellDates: true,
        cellNF: false,
        cellText: false,
      });

      if (!wb.SheetNames[0]) {
        showErrorMsg(SOURCE_TABLES_MSG.no_worksheet);
        return;
      }

      // First Sheet
      const sheet = wb.Sheets[wb.SheetNames[0]];

      // Read as JSON from first Sheet
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        range: 0,
        blankrows: true,
        dateNF: DEFAULT_DATE_FORMAT,
        // defval: '',
      });

      if (jsonData.length == 0) {
        showErrorMsg(SOURCE_TABLES_MSG.import_empty_table_err);
        return;
      }

      let maxRows = jsonData.length;
      if (maxRows > MAX_RECORDS_TO_SHOW) maxRows = MAX_RECORDS_TO_SHOW;

      /* Handle Missed Empty Cols > Start */
      let missedCols = 0;
      let ref = sheet['!ref'];
      if (ref) {
        [ref] = ref.split(':');
        missedCols = getNumberFromAlphabet(ref.replace(/[^a-zA-Z]+/g, ''));
      }

      if (missedCols) {
        for (let i = 0; i < maxRows; i++) {
          for (let j = 1; j < missedCols; j++) {
            jsonData[i].unshift('');
          }
        }
      }
      /* Handle Missed Empty Cols > End */

      const getCellValue = (value = '') => {
        // Get Formula Result
        if (value && value.result != undefined) return value.result;

        // If Result is not available with formula
        if (value && typeof value == 'object') {
          const date = moment(value);
          // Format Date Type
          if (date.isValid() && !value.formula) {
            return date.format(DEFAULT_DATE_FORMAT);
          }

          return '';
        }

        // Cell Value
        return value;
      };

      let data = jsonData.splice(0, MAX_RECORDS_TO_SHOW);

      const maxCols = Math.max(...data.map(cols => cols.length));

      data = data.map(rowValues => {
        if (rowValues.length < maxCols) {
          rowValues = [...rowValues, ...new Array(maxCols - rowValues.length)];
        }

        return rowValues.map(getCellValue);
      });

      /* Process Data */
      processFileData({ file, data });
    };

    reader.readAsBinaryString(file);
  };

  /**
   * Process File Data
   *
   * @param {Object}
   */
  const processFileData = async ({ data = [], file }) => {
    try {
      const { isValid, error } = validateFile({ data });

      if (!isValid) {
        showErrorMsg(error);
        return;
      }

      const fileUrl = await uploadFile(file);

      handleData({ file, data, fileUrl });
    } catch (e) {
      toggleUploading(false);
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
      toggleUploading(true);

      const onUploadProgress = ({ loaded = 0, total = 1 }) => {
        const percentage = Math.floor((loaded / total) * 100);
        setUploadPercentage(percentage);
      };

      const formData = new FormData();
      formData.append('file', file);

      const { url = '' } = await httpPost(API_URLS.UPLOAD_FILE, formData, {
        onUploadProgress,
      });

      toggleUploading(false);

      return url;
    } catch (e) {
      setUploadPercentage(0);
      toggleUploading(false);

      return '';
    }
  };

  /**
   * Get Body Content of Modal
   */
  const getBody = () => {
    return (
      <Box>
        <Dropzone onDrop={handleImportFile} multiple={false}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()} className="drag-drop-dialog">
                <input {...getInputProps()} />
                <Box mb={1} align="center">
                  <Box display="block" mb={1}>
                    <ImgRenderer src="drag-drop.svg" />
                  </Box>
                  <Box mb={1}>
                    <Typography
                      variant="body1"
                      align="center"
                      display="inline"
                      color="textPrimary"
                      gutterBottom
                    >
                      Drop your file here or
                    </Typography>
                    <Typography
                      variant="body1"
                      align="center"
                      display="inline"
                      color="primary"
                      gutterBottom
                    >
                      &nbsp;browse
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    align="center"
                    gutterBottom
                  >
                    Supports csv, xls, xlsx
                  </Typography>
                </Box>
              </div>
            </section>
          )}
        </Dropzone>

        {error && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            bgcolor="secondary.processTable"
            mt={1}
            borderRadius={4}
            className="warning-col"
          >
            <Box display="flex" alignItems="center">
              <ReportProblemOutlined className="warning-icon" />
              <Typography variant="body2" color="textSecondary">
                {error}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setError('')}
              color="textSecondary"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <div className="import-file-modal">
      <UploadLoader
        uploadPercentage={uploadPercentage}
        isVisible={isUploading || showLoader}
        savingText="Saving..."
      />

      {!isDialog && getBody()}

      {isDialog && (
        <Dialog open={isOpen} onClose={onClose}>
          <DialogContent
            className={classes.submit}
            id="alert-dialog-description"
          >
            {getBody()}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="primary" disabled={isUploading}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

ImportModal.propTypes = {
  handleData: func.isRequired,
  isDialog: bool,
  isOpen: bool,
  onClose: func,
  showLoader: bool,
  validateFile: func,
};

ImportModal.defaultProps = {
  showLoader: false,
  isDialog: true,
  validateFile: () => ({ isValid: true }),
  handleData: func.isRequired,
  isOpen: false,
  onClose: () => {},
};

export default withStyles(styles)(ImportModal);
