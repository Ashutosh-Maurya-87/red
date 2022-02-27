import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { func, bool } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import Dropzone from 'react-dropzone';
import * as PapaParse from 'papaparse';
import { last } from 'lodash';
import XLSX from 'xlsx';
import moment from 'moment';

import {
  withStyles,
  Button,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  CircularProgress,
  IconButton,
} from '@material-ui/core';
import { Close, ReportProblemOutlined } from '@material-ui/icons';
import amplitude from 'amplitude-js';

import { API_URLS } from '../../../configs/api';
import { DEFAULT_DATE_FORMAT } from '../../../configs/app';
import { APP_ROUTES } from '../../../configs/routes';
import { ERROR_MESSAGES, SOURCE_TABLES_MSG } from '../../../configs/messages';

import { httpGet, httpPost } from '../../../utils/http';
import { showErrorMsg } from '../../../utils/notifications';
import getNumberFromAlphabet from '../../../utils/helper/getNumberFromAlphabet';

import ImgRenderer from '../../../components/ImgRenderer';
import { setSourceTable } from '../../../reducers/SourceTables/actions';

import { styles } from './styles';
import './styles.scss';

export const DEFAULT_COL_WIDTH = '150px';
export const MAX_RECORDS_TO_SHOW = 100;
export const MAX_FILE_SIZE = 10; // MB
export const MAX_FILE_SIZE_READ_UI = 1; // MB
export const MAX_EXCEL_FILE_SIZE = 4; // MB

const SUPPORTED_MIME_TYPES = [
  '',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/wps-office.xlsx',
];

const SUPPORTED_FILE_TYPES = ['csv', 'xls', 'xlsx'];

function ImportSourceTable({
  isOpen,
  handleClose,
  setSourceTable,
  classes,
  isDialog,
  ...props
}) {
  const history = useHistory();
  const [importedFile, setImportedFile] = useState(null);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState('');

  useEffect(() => {
    if (importedFile && !isUploading) handleSave();
  });

  /**
   * Handle Close Modal without data
   */
  const handleCloseModal = () => {
    amplitude.getInstance().logEvent('Cancel import table');
    handleClose(false);
  };

  /**
   * Handle file imported by user
   *
   * @param {Array|Object} files
   */
  const handleImportFile = files => {
    amplitude.getInstance().logEvent('Importing source table from file');

    setError('');
    const [file] = files || [];

    if (!file) {
      showErrorMsg(ERROR_MESSAGES.unsupported_file);
      return;
    }

    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      showErrorMsg(ERROR_MESSAGES.unsupported_file);
      return;
    }

    const fileExt = file.name.split('.').pop();
    if (!SUPPORTED_FILE_TYPES.includes(fileExt)) {
      showErrorMsg(ERROR_MESSAGES.unsupported_file);
      return;
    }

    if (
      file &&
      (fileExt === 'xls' || fileExt === 'xlsx') &&
      file.size > MAX_EXCEL_FILE_SIZE * 1000000
    ) {
      let msg = SOURCE_TABLES_MSG.max_file_size;
      msg = msg.replace('#SIZE#', MAX_EXCEL_FILE_SIZE);

      setError(msg);
      return;
    }

    setFileType(fileExt.toLowerCase() == 'csv' ? 'csv' : 'xlsx');

    setImportedFile(file);
  };

  /**
   * Handle Save Data
   */
  const handleSave = () => {
    try {
      if (!importedFile || isUploading) return;

      // Now Extract records from API by default
      if (importedFile) {
        extractViaApi();
        return;
      }

      if (importedFile.size > MAX_FILE_SIZE_READ_UI * 1000000) {
        extractViaApi();
        return;
      }

      setUploading(true);

      switch (fileType) {
        case 'csv':
          readCsvFile();
          break;

        case 'xlsx':
          readExcelFile();
          break;

        default:
          break;
      }
    } catch (e) {
      console.error(e);
      setImportedFile(null);
      setUploading(false);
    }
  };

  /**
   * Extract and Read File records via API
   */
  const extractViaApi = async () => {
    try {
      if (props.handleFile) {
        props.handleFile(importedFile);
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append('file', importedFile);

      const { url: fileUrl = '' } = await httpPost(
        API_URLS.UPLOAD_FILE,
        formData
      );

      const { data = [], total_rows } = await httpGet(
        API_URLS.READ_FILE + fileUrl
      );

      processFileData({
        fileUrl,
        data,
        totalRows: total_rows || data.length || 0,
        totalColumns: (data[0] && data[0].length) || 0,
      });
    } catch (e) {
      console.error(e);
      setImportedFile(null);
      setUploading(false);
    }
  };

  /**
   * Read CSV File
   */
  const readCsvFile = () => {
    const reader = new FileReader();

    reader.onload = evt => {
      const { data } = PapaParse.parse(reader.result, {
        header: props.withHeaderCSV,
        dynamicTyping: true,
        error: p => console.error(p),
        encoding: p => console.error(p),
      });

      // Remove Empty Last Row
      if (props.withHeaderCSV) {
        const lastRow = last(data) || {};
        if (Object.keys(lastRow).length <= 1) data.pop();
      } else {
        const lastRow = (last(data) || []).filter(Boolean);
        if (lastRow.length == 0) data.pop();
      }

      if (props.handleData) {
        props.handleData({ data });
        return;
      }

      processFileData({
        totalRows: data.length || 0,
        totalColumns: (data[0] && data[0].length) || 0,
        data: data.splice(0, MAX_RECORDS_TO_SHOW),
      });
    };

    reader.readAsText(importedFile);
  };

  /**
   * Read Excel FIle
   */
  const readExcelFile = () => {
    const reader = new FileReader();
    const startTime = new Date().getTime();

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
        setImportedFile(null);
        setUploading(false);
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
        setImportedFile(null);
        setUploading(false);
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

      /* Handle Merged Cols > Start */
      const merges = sheet['!merges'] || [];
      merges.forEach(merge => {
        const { s: start, e: end } = merge;
        const { r: startRow, c: startCol } = start;
        const { r: endRow, c: endCol } = end;

        const val = jsonData[startRow][startCol];

        for (let i = startRow; i <= endRow; i++) {
          for (let j = startCol; j <= endCol; j++) {
            jsonData[i][j] = val;
          }
        }
      });
      /* Handle Merged Cols > End */

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

      const totalRows = jsonData.length;
      let data = jsonData.splice(0, MAX_RECORDS_TO_SHOW);

      const maxCols = Math.max(...data.map(cols => cols.length));

      data = data.map(rowValues => {
        if (rowValues.length < maxCols) {
          rowValues = [...rowValues, ...new Array(maxCols - rowValues.length)];
        }

        return rowValues.map(getCellValue);
      });

      /* Process Data */
      processFileData({
        totalRows,
        totalColumns: data[0].length,
        data,
      });

      const endTime = new Date().getTime();
      const readTime = Math.floor(((endTime - startTime) / 1000) % 60);

      console.info(`## Reading Time is ${readTime} seconds`);
    };

    reader.readAsBinaryString(importedFile);
  };

  /**
   * Process File Data
   *
   * @param {Object}
   */
  const processFileData = ({ data = [], totalRows, totalColumns, fileUrl }) => {
    const getFileName = () => {
      // - ${Math.random().toString(36).substring(7)}
      return `${importedFile.name.substr(0, importedFile.name.indexOf('.'))}`;
    };

    const table = {
      data,
      fileUrl,
      file: importedFile,
      fileName: getFileName(),
      totalRows: totalRows < 0 ? 0 : totalRows,
      totalColumns: totalColumns < 0 ? 0 : totalColumns,
    };

    setSourceTable(table);
    setImportedFile(null);
    setUploading(false);

    if (props.onRedirect) {
      props.onRedirect();
      return;
    }

    history.push(APP_ROUTES.IMPORT_TABLE);
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
                    {isUploading ? (
                      <CircularProgress />
                    ) : (
                      <ImgRenderer src="drag-drop.svg" />
                    )}
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
    <div className="source-table-import-modal">
      {!isDialog && getBody()}

      {isDialog && (
        <Dialog
          open={isOpen}
          onClose={handleCloseModal}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogContent
            className={classes.submit}
            id="alert-dialog-description"
          >
            {getBody()}
          </DialogContent>
          <DialogActions>
            {!isUploading && (
              <Button onClick={handleCloseModal} color="secondary">
                Cancel
              </Button>
            )}
            {isUploading && (
              <Button
                onClick={handleSave}
                color="primary"
                disabled={isUploading || !importedFile}
              >
                <CircularProgress size={24} />
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

ImportSourceTable.propTypes = {
  handleClose: func.isRequired,
  handleData: func,
  handleFile: func,
  isDialog: bool,
  isOpen: bool.isRequired,
  onRedirect: func,
  setSourceTable: func.isRequired,
  withHeaderCSV: bool,
};

ImportSourceTable.defaultProps = {
  isDialog: true,
  withHeaderCSV: false,
  handleFile: undefined,
  handleClose: () => {},
  isOpen: false,
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, { setSourceTable })(
  withStyles(styles)(ImportSourceTable)
);
