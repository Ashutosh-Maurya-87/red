import React from 'react';
import { withRouter } from 'react-router-dom';
import { string, shape, func } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// eslint-disable-next-line import/no-extraneous-dependencies
import jSuites from 'jsuites';
import jexcel from 'jexcel';
import moment from 'moment';

import { Box, Button } from '@material-ui/core';

import ViewSystemDImension from '../ViewSystemDImension';

import Spinner from '../../../../components/Spinner';
import ImgRenderer from '../../../../components/ImgRenderer';
import UploadLoader from '../../../../components/UploadLoader';
import ViewGLAccount from '../../../FinancialEnvSetup/SetupGLAccounts/ViewGLAccount';

import { DEFAULT_JEXCEL_CONFIGS } from '../../../../configs/jexcel';
import { API_URLS } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import {
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_COL_WIDTH,
  DEFAULT_DATE_FORMAT,
} from '../../../../configs/app';
import { TYPES } from '../configs';

import { httpGet, httpPost } from '../../../../utils/http';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';
import getNumbers from '../../../../utils/helper/getNumbers';
import getFormattedNumber from '../../../../utils/helper/getFormattedNumber';

import ImportSourceTable from '../../../SourceTables/ImportSourceTable';

import { uploadFiles } from '../../../../services/Source';
import { handleFileForReloadTable } from '../../../../services/Dimensions';

import { setGLAccountsMeta } from '../../../../reducers/FinancialEnvSetup/actions';
import { setSourceTable } from '../../../../reducers/SourceTables/actions';

import './styles.scss';

// Update jSuite method for date
jSuites.calendar.getDateString = (date, format) => {
  if (!date) return '';

  return moment(date).format(format);
};

class EditDimensionRecords extends React.Component {
  state = {
    isImport: false,
    uploadPercentage: false,
    showLoader: false,
    data: [],
    metadata: [],
  };

  /**
   * Spreadsheet Element Ref
   */
  dimensionSheetRef = React.createRef();

  /**
   * Spreadsheet Handler
   */
  spreadsheet;

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fillInitialData();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    const { type, setGLAccountsMeta } = this.props;

    if (type == TYPES[1]) {
      setGLAccountsMeta([]);
    }
  }

  /**
   * Fill Initial Data
   */
  fillInitialData = async () => {
    const { tableHeight, type } = this.props;

    if (type != TYPES[0]) return;

    if (this.spreadsheet) this.spreadsheet.destroy();

    const { data = [], meta_data: metadata = [] } = await this.fetchDimension();

    const columns = this.getFormattedHeaders({ metadata });

    const rows = data.map(row => {
      return metadata.map(({ name }) => row[name]);
    });

    const rowsCount = rows.length || 0;
    const colsCount = ((rows && rows[0]) || []).length || 0;

    // if (!rowsCount && !colsCount) return;

    const jexcelOptions = {
      ...DEFAULT_JEXCEL_CONFIGS,
      contextMenu: () => {},
      allowInsertRow: true,
      tableHeight,
      data: rows,
      columns,
      editable: true,
      minDimensions: [colsCount, rowsCount + 1], // Cols * Rows
      onselection: () => {},
      onpaste: () => {},
      onbeforepaste: () => false,
      onafterchanges: this.handleChanges,
    };

    this.spreadsheet = jexcel(this.dimensionSheetRef.current, jexcelOptions);
  };

  /**
   * Custom Editor for Number(Amount) Type
   */
  getNumberEditor = () => {
    const getValue = cell => cell.innerHTML;

    const setValue = (cell, value) => {
      cell.innerHTML = getFormattedNumber(getNumbers(value, true));
    };

    const closeEditor = (cell, save) => {
      const value = getNumbers((cell.children[0] || {}).value, true);

      cell.children[0].onblur = null;
      cell.classList.remove('editor');

      setValue(cell, value);
      this.spreadsheet.edition = null;

      return value;
    };

    const openEditor = cell => {
      const info = cell.getBoundingClientRect();

      const editor = document.createElement('input');
      editor.style.width = `${info.width}px`;
      editor.style.height = `${info.height - 2}px`;
      editor.style.minHeight = `${info.height - 2}px`;

      editor.onblur = () => {
        closeEditor(cell, true);
      };

      editor.value = getNumbers(cell.innerHTML, true);
      editor.scrollLeft = editor.scrollWidth;

      cell.classList.add('editor');
      cell.innerHTML = '';
      cell.appendChild(editor);

      editor.focus();
    };

    return {
      getValue,
      setValue,
      closeEditor,
      openEditor,
    };
  };

  /**
   * Get Formatted Headers of GL Accounts Sheet
   *
   * @param {Object}
   *
   * @return {Array}
   */
  getFormattedHeaders = ({ metadata }) => {
    const colStr = {
      type: 'text',
      title: '',
      width: DEFAULT_COL_WIDTH,
    };

    const getHeader = ({ display_name: title, data_type, date_format }) => {
      switch (data_type) {
        case COLUMN_DATA_TYPES_KEYS.date:
          return {
            title,
            type: 'calendar',
            options: {
              format: date_format || DEFAULT_DATE_FORMAT,
            },
          };

        case COLUMN_DATA_TYPES_KEYS.amount:
          return {
            title,
            type: 'numeric',
            mask: '#,##.000',
            decimal: '.',
            // editor: this.getNumberEditor(),
          };

        default:
          return { title };
      }
    };

    const headers = metadata.map(col => ({ ...colStr, ...getHeader(col) }));

    return headers;
  };

  /**
   * Fetch Dimension from API
   */
  fetchDimension = async () => {
    try {
      this.setState({ showLoader: true });
      const { table } = this.props;

      const url = API_URLS.GET_DIMENSION_DATA_BY_ID.replace('#ID#', table.id);
      const res = await httpGet(url);

      this.setState({
        showLoader: false,
        data: res.data,
        metadata: res.meta_data,
      });

      return res;
    } catch (e) {
      this.setState({
        showLoader: false,
        data: [],
        metadata: [],
      });

      return {};
    }
  };

  /**
   * Handle Changes
   */
  handleChanges = async (ele, updatedCells) => {
    try {
      if (updatedCells.length > 1) {
        this.spreadsheet.undo();
        return;
      }

      const { data, metadata } = this.state;
      const colNames = metadata.map(({ name }) => name);

      const rows = [];
      let rowToUpdate = {};

      let cellName = '';
      let cellValue = '';
      let cellMeta;

      updatedCells.forEach(cell => {
        const { x, y, newValue, oldValue } = cell;

        if (newValue == oldValue) return;

        if (!rows[y]) rows[y] = [];
        if (!rows[y][x]) rows[y][x] = [];

        rows[y][x] = cell;
      });

      let rowIndex;

      rows.forEach(cols => {
        rowIndex = cols && cols.length ? cols[cols.length - 1].y : undefined;

        if (rowIndex == undefined) return;

        const row = data[rowIndex] || {};

        cols.forEach(cell => {
          const { x, newValue } = cell;
          const cellIndex = Number(x);

          cellName = colNames[cellIndex];
          cellMeta = metadata[cellIndex];
          cellValue = newValue;
          row[cellName] = newValue;
        });

        rowToUpdate = row;
      });

      if (cellMeta && cellMeta.data_type == COLUMN_DATA_TYPES_KEYS.amount) {
        cellValue = getNumbers(cellValue, true);
      }

      // if (cellMeta && cellMeta.data_type == COLUMN_DATA_TYPES_KEYS.date) {
      //   cellValue = moment(cellValue).format('YYYY-MM-DD');
      // }

      const params = { [cellName]: cellValue };

      if (!cellName) return;

      // Update Existing Record
      if (rowToUpdate.affa_record_id) {
        let url = API_URLS.UPDATE_DIMENSION_RECORD;
        url = url.replace('#ID#', this.props.table.id);
        url = url.replace('#RECORD_ID#', rowToUpdate.affa_record_id);

        await httpPost(url, params);
      }

      // Add New Record
      if (!rowToUpdate.affa_record_id) {
        let url = API_URLS.ADD_DIMENSION_RECORD;
        url = url.replace('#ID#', this.props.table.id);

        const { data: newRow } = await httpPost(url, params);

        data.push(newRow);
        this.setState({ data });

        this.spreadsheet.insertRow();
      }
    } catch (e) {
      console.error(e);
      this.spreadsheet.undo();
    }
  };

  /**
   * Handle File > Reload Dimension
   *
   * @param {Object} file
   */

  handleFileForReload = async file => {
    try {
      this.setState({ isImport: false });

      const uploadedFile = await this.uploadFile(file);
      if (!uploadedFile) return;

      const {
        table: { source_table_id },
      } = this.props;

      const sourceTableObj = await handleFileForReloadTable(
        uploadedFile,
        source_table_id
      );

      const { setSourceTable, history } = this.props;

      if (sourceTableObj) {
        setSourceTable(sourceTableObj);
      }

      this.setState({ uploadPercentage: null });

      const {
        location: { pathname = '' },
      } = history;

      const url = `${APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE}?redirectUrl=${pathname}`;
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
  uploadFile = async file => {
    try {
      const setuploadPercentage = uploadPercentage => {
        this.setState({ uploadPercentage });
      };

      setuploadPercentage(0);

      const url = uploadFiles(file, setuploadPercentage);

      return url;
    } catch (e) {
      this.setState({ uploadPercentage: null });
      return '';
    }
  };

  /**
   * Toggle Import Modal
   */
  toggleImport = () => {
    this.setState({ isImport: !this.state.isImport });
  };

  /**
   * Handle imported data
   */
  handleData = () => {
    this.toggleImport();
    this.fillInitialData();
  };

  /**
   * Export Dimension
   */
  exportDimension = async () => {
    try {
      this.setState({ showLoader: true });
      if (this.state.showLoader) return;

      const { table } = this.props;
      const url = API_URLS.EXPORT_DIMENSION.replace('#ID#', table.id);

      const res = await httpGet(url);

      programmaticallyLoadByUrl(res.url, { target: '_blank' });

      this.setState({ showLoader: false });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const { isImport, showLoader, uploadPercentage } = this.state;
    const { type, tableHeight } = this.props;

    return (
      <>
        {showLoader && <Spinner />}

        {isImport && (
          <ImportSourceTable
            isOpen
            handleClose={() => this.setState({ isImport: false })}
            handleFile={this.handleFileForReload}
          />
        )}

        {typeof uploadPercentage == 'number' && (
          <UploadLoader
            isVisible
            uploadPercentage={uploadPercentage}
            savingText="Saving..."
          />
        )}

        {type == TYPES[1] && (
          <ViewGLAccount
            type={type}
            showHeaderText={false}
            tableHeight={tableHeight}
          />
        )}

        {type == TYPES[2] && (
          <ViewSystemDImension
            type={type}
            showHeaderText={false}
            tableHeight={tableHeight}
          />
        )}

        {type == TYPES[0] && (
          <>
            <Box display="flex" justifyContent="flex-end" mb={3}>
              {/* <Box display="flex" mr={1}>
                <IconButton size="small">
                  <ImportExportRoundedIcon />
                </IconButton>
              </Box>
              <Button color="primary" size="small">
                Add GL Account
              </Button> */}
              <Box display="flex" mr={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ImgRenderer src="export.svg" />}
                  onClick={this.exportDimension}
                >
                  Export
                </Button>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={this.toggleImport}
                startIcon={<ImgRenderer src="import.svg" />}
              >
                Import
              </Button>
            </Box>

            <Box
              className="edit-dimension-sheet"
              style={{ height: tableHeight }}
            >
              <Box className="import-selected-table">
                <div ref={this.dimensionSheetRef} />
              </Box>
            </Box>
          </>
        )}
      </>
    );
  }
}

EditDimensionRecords.propTypes = {
  setGLAccountsMeta: func.isRequired,
  setSourceTable: func.isRequired,
  table: shape({}),
  tableHeight: string,
  type: string,
};

EditDimensionRecords.defaultProps = {
  table: {},
  tableHeight: DEFAULT_JEXCEL_CONFIGS.tableHeight,
  type: '',
  setSourceTable: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(
  mapStateToProps,
  { setGLAccountsMeta, setSourceTable },
  null,
  {
    forwardRef: true,
  }
)(withRouter(EditDimensionRecords));
