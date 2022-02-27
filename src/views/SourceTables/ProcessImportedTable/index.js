import React from 'react';
import { func, shape, string } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import jexcel from 'jexcel';
import _ from 'lodash';

import {
  Typography,
  Grid,
  Button,
  Box,
  FormHelperText,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Radio,
  Divider,
  Tooltip,
} from '@material-ui/core';

import {
  Delete as DeleteIcon,
  ArrowRightAlt as ArrowRightAltIcon,
  Error as ErrorIcon,
} from '@material-ui/icons';

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import SingleSelect from '../../ProcessBuilder/CreateProcess/StepCard/SingleSelect';
import { MAX_RECORDS_TO_SHOW } from '../ImportSourceTable';
import EditTableNameHeader from '../EditTableNameHeader';
import ImportedPreview from './ImportedPreview';
import AppHeader from '../../../components/AppHeader';
import UploadLoader from '../../../components/UploadLoader';
import ListboxComponent from '../../../components/CustomListBox';
import Spinner from '../../../components/Spinner';

import { setSourceTable } from '../../../reducers/SourceTables/actions';
import { getSourceTable } from '../../../reducers/SourceTables/selectors';
import { getTheme } from '../../../reducers/Theme/selectors';
import {
  getReloadImportTypes,
  formatParamsToImportTable,
  formatParamsToReloadTable,
  getValidDateCellValue,
  getMaxColsMessage,
  getValueAsPerType,
  validateTableName,
  regxToIdentifySpace,
  generateColumnName,
} from './helper';

import {
  COLUMN_DATA_TYPES,
  COLUMN_DATA_TYPES_KEYS,
  DEFAULT_DATE_FORMAT,
  MAX_COLS_FOR_IMPORT,
} from '../../../configs/app';
import {
  DEFAULT_RESET_STYLES,
  DEFAULT_CELL_PROPS,
  EXCEL_COLORS,
  DEFAULT_JEXCEL_CONFIGS,
} from '../../../configs/jexcel';
import { APP_ROUTES } from '../../../configs/routes';
import { API_URLS } from '../../../configs/api';
import {
  RULE_BASED_MODELS_MSG,
  DIMENSIONS_MSG,
  SOURCE_TABLES_MSG,
} from '../../../configs/messages';

import { httpPost } from '../../../utils/http';
import { showErrorMsg, showSuccessMsg } from '../../../utils/notifications';

import './styles.scss';

import DATA from './data';
import getFormattedNumber from '../../../utils/helper/getFormattedNumber';
import { logAmplitudeEvent } from '../../../utils/amplitude';

const filter = createFilterOptions();

const TABS = ['Imported Table Preview', 'Mappings'];
const NEW_FIELD = '<New Field>';

const defaultState = {
  activeTab: 0,
  isFillingData: false,

  uploadPercentage: 0,
  activeAction: '',
  selections: [], // Active Selection [A1, B1, ...]

  showLoader: false,
  isShowPreview: false, // Show Imported | Transposed Table
  isValidMappings: true,

  styledColumns: [], // Jexcel Columns

  headers: [], // Header Cells
  rows: [], // Data Cells

  importedHeaders: [], // imported headers of imported file [A1, B1, ...]
  importedHeadersXY: {}, // imported headers of imported file [x1, y1, ...]
  transposedHeaders: [], // tranposed headers of imported file [A1, B1, ...]
  transposedHeadersXY: {}, // tranposed headers of imported file [x1, y1, ...]
  multiTransposedHeaders: [],
  multiTransposedHeadersXY: {},
  uploadedFileUrl: '',

  isBlockDone: false,
};

class ProcessImportedTable extends React.PureComponent {
  importType = getReloadImportTypes(this.props.sourceTable);

  /**
   * State
   */
  state = {
    ...defaultState,
    reloadImportType: this.importType[0],
  };

  /**
   * Spreadsheet Element Ref
   */
  spreadsheetEle = React.createRef();

  /**
   * Spreadsheet Handler
   */
  spreadsheet;

  /**
   * Runtime Selection of keys
   */
  activeselection = {}; // { x1, y1, ... }

  /**
   * Handle Timeouts
   */
  timeouts = {
    cellSelection: null,
  };

  /**
   * Handle > Reset Pressed or Not
   */
  isResetPressed = false;

  /**
   * Updated History of Import Headers
   */
  headersHistory = {};

  /**
   * Updated History of Transposed Headers
   */
  transposeHeadersHistory = {};

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { sourceTable, setSourceTable, history } = this.props;

    let timeout = 1;

    let { data = [], fileUrl = '' } = sourceTable;
    const { meta = {} } = sourceTable;

    if (!sourceTable.file) {
      const {
        location: { pathname = '', search = '' },
      } = history;

      const path = search.replace('?redirectUrl=', '');

      const query = new URLSearchParams(search);
      const id = query.get('id');
      const tab = Number(query.get('activeTab'));

      let url = APP_ROUTES.CREATE_RULE_BASED_MODEL;
      url += `?id=${id}&activeTab=${tab}`;

      if (search.includes('redirectUrl')) {
        history.push(path);
        return;
      }

      if (pathname == APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE) {
        history.push(APP_ROUTES.DIMENSIONS);
        return;
      }

      if (pathname == APP_ROUTES.VIEW_RULE_BASED_MODEL) {
        history.push(url);
        return;
      }

      if (pathname == APP_ROUTES.VIEW_RELOAD_TABLE) {
        history.push(APP_ROUTES.SOURCE_TABLES);
        return;
      }

      data = DATA;
      fileUrl = 'TEST_URL';
      setSourceTable({ data: DATA, file: {}, fileName: 'Static Data File' });
      timeout = 1;
    }

    const rowsCount = data.length || 10;
    const colsCount = ((data && data[0]) || []).length || 10;

    const jexcelOptions = {
      ...DEFAULT_JEXCEL_CONFIGS,
      data,
      minDimensions: [colsCount, rowsCount], // Cols * Rows
      onselection: this.handleSelection,
      // mergeCells: {
      //   A1: [3, 3], // cols * roes
      // },
    };

    this.setState({ uploadedFileUrl: fileUrl });

    if (meta && this.isReloadTable()) this.loadDataForReload();

    setTimeout(() => {
      this.spreadsheet = jexcel(this.spreadsheetEle.current, jexcelOptions);
      this.spreadsheet.ignoreHistory = true;
    }, timeout);
  }

  /**
   * Check > Is Reloading Table
   *
   * @return {Boolean}
   */
  isReloadTable = () => {
    return this.props.type == 'reloadTable';
  };

  /**
   * filter selections columns
   *
   * @param {Object}
   */
  getSelections = selected => {
    if (!selected) return [];

    const selections = [];

    for (const [, value] of Object.entries(selected)) {
      const { cell_key } = value;
      if (cell_key) selections.push(cell_key);
    }

    return selections;
  };

  /**
   * Convert excel column name
   *
   * @param {Number} number
   * @returns {String}
   */
  getReloadColumnName = number => {
    let ret = '';
    for (let a = 1, b = 26; (number -= a) >= 0; a = b, b *= 26) {
      ret = String.fromCharCode(Number((number % b) / a) + 65) + ret;
    }
    return `${ret}1`;
  };

  /**
   * Update Header Information after Import|Transpose in Reload (Initial Phase)
   */
  updateHeaderTypes = () => {
    const {
      sourceTable: { meta = {}, fileUrl, columns, columnsWithDisplayNames },
    } = this.props;

    const { previewFieldsWithKeys, preview_fields = [] } = meta;

    let isValidMappings = true;

    /**
     * @param {Object} metaHeader
     * @param {Object} header
     *
     * @returns {Object|Null}
     */
    const getMappedColumn = (
      { display_name, original_name, is_transpose },
      { label }
    ) => {
      return columns.find(col => {
        if (is_transpose) return col.display_name == display_name;

        return (
          col.display_name == label ||
          (col.display_name == display_name && original_name == label)
        );
      });
    };

    const { headers } = this.state;

    const getFormattedHeader = (header, i) => {
      if (header.newLabel) return header;

      let metaHeader = previewFieldsWithKeys[header.cellKey] || null;

      if (header.forTranspose) {
        if (headers.length - 1 == i) {
          metaHeader = preview_fields[preview_fields.length - 1];
        } else {
          metaHeader = preview_fields[preview_fields.length - 2];
        }
      }

      if (!metaHeader || (header.forTranspose && !metaHeader.is_transpose)) {
        const dbCol = columnsWithDisplayNames[header.label] || null;

        if (dbCol && header.forImport) {
          // Imported column already exists in database
          return {
            ...header,
            isNewCol: false,
            id: dbCol.id,
            newLabel: header.label,
            newDataType: dbCol.data_type,
          };
        }

        // Create new column
        return {
          ...header,
          isNewCol: true,
          newLabel: '',
          newDataType: header.dataType,
        };
      }

      const mappedCol = getMappedColumn(metaHeader, header) || {};

      const label = mappedCol.display_name || header.label;

      return {
        ...header,
        dataType: metaHeader.data_type,
        dateFormat: metaHeader.dateFormat || DEFAULT_DATE_FORMAT,
        label,
        oldLabel: label,
        id: mappedCol.id || '',

        isNewCol: !mappedCol.id,
        newLabel: mappedCol.id ? label : '',
        newDataType: mappedCol.data_type || metaHeader.data_type,
      };
    };

    const mappedHeaders = headers.map((header, i) => {
      const newHeader = getFormattedHeader(header, i);

      if (isValidMappings && !newHeader.newLabel) isValidMappings = false;

      if (newHeader.forTranspose) {
        this.transposeHeadersHistory[header.cellKey] = newHeader;
      }

      if (newHeader.forImport) {
        this.headersHistory[header.cellKey] = newHeader;
      }

      return newHeader;
    });

    this.setState({
      headers: mappedHeaders,
      uploadedFileUrl: fileUrl,
      isFillingData: false,
      isValidMappings,
    });
  };

  /**
   * Update Header Information after Import|Transpose in Reload
   * After Press Reset
   */
  updateMappingsAfterReset = () => {
    const {
      sourceTable: { fileUrl, columns },
    } = this.props;

    let isValidMappings = true;

    const getMappedColumn = ({ label }) => {
      return columns.find(col => {
        return col.display_name == label;
      });
    };

    const { headers } = this.state;

    const getFormattedHeader = header => {
      if (header.newLabel) return header;

      const mappedCol = getMappedColumn(header) || {};
      const label = mappedCol.display_name || header.label;

      if (!isValidMappings) isValidMappings = !mappedCol.id;

      return {
        ...header,
        dataType: mappedCol.data_type || header.dataType,
        dateFormat: mappedCol.dateFormat || DEFAULT_DATE_FORMAT,
        label,
        oldLabel: label,
        id: mappedCol.id || '',

        isNewCol: !mappedCol.id,
        newLabel: mappedCol.id ? label : '',
        newDataType: mappedCol.data_type || header.dataType,
      };
    };

    const mappedHeaders = headers.map(getFormattedHeader);

    this.setState({
      headers: mappedHeaders,
      uploadedFileUrl: fileUrl,
      isFillingData: false,
      isValidMappings,
    });
  };

  /**
   * Load Table Data for Reload Feature
   */
  loadDataForReload = () => {
    try {
      this.setState({ isFillingData: true });

      const {
        sourceTable: { meta = {}, data = [] },
      } = this.props;

      const { selected_fields = [] } = meta;
      const totalColsInSheet = (data[0] || []).length;

      const importHeaders = selected_fields
        .filter(
          ({ is_transpose, index }) => !is_transpose && index < totalColsInSheet
        )
        .map(({ cell_key }) => cell_key);

      const transposeHeaders = selected_fields
        .filter(
          ({ is_transpose, index }) => is_transpose && index < totalColsInSheet
        )
        .map(({ cell_key }) => cell_key);

      /* Process Import */
      const doImport = () => {
        if (importHeaders.length > 0) {
          this.activeselection = this.getAxisForJexcel(importHeaders);

          this.setState({ isShowPreview: true, selections: importHeaders });

          setTimeout(() => this.processDataForPreview(true, doTranspose), 500);
        } else {
          doTranspose();
        }
      };

      /* Process Transpose */
      const doTranspose = () => {
        if (transposeHeaders.length > 0) {
          this.activeselection = this.getAxisForJexcel(transposeHeaders);

          this.setState({ isShowPreview: true, selections: transposeHeaders });

          setTimeout(
            () => this.processDataForPreview(false, this.updateHeaderTypes),
            500
          );
        } else {
          this.updateHeaderTypes();
        }
      };

      doImport();
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Get Axis from Cells Keys
   *
   * @param {Array} selections
   */
  getAxisForJexcel = selections => {
    if (selections.length == 0) return {};

    // For Import
    let [col, row] = jexcel.getIdFromColumnName(selections[0]).split('-');
    const x1 = col;
    const y1 = row;

    [col, row] = jexcel
      .getIdFromColumnName(selections[selections.length - 1])
      .split('-');
    const x2 = col;
    const y2 = row;

    return { x1, y1, x2, y2 };
  };

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    this.props.setSourceTable({});
    window.removeEventListener('resize', this.handleWindowResize, false);
  }

  /**
   * Reset Data
   */
  resetData = () => {
    logAmplitudeEvent('Reset source table');

    this.spreadsheet.refresh();
    this.setState({ ...defaultState });

    this.headersHistory = {};
    this.transposeHeadersHistory = {};
    this.isResetPressed = true;

    // if (this.isReloadTable()) {
    //   setTimeout(this.loadDataForReload, 200);
    // }
  };

  /**
   * Update Table Name
   */
  updateTableName = newName => {
    const { setSourceTable, sourceTable } = this.props;
    setSourceTable({ ...sourceTable, fileName: newName });
  };

  /**
   * Handle Cell Selections in Jexcel
   */
  handleSelection = (instance, x1, y1, x2, y2, origin) => {
    if (this.timeouts.cellSelection) clearTimeout(this.timeouts.cellSelection);

    const cellNames = [];

    // Left to Right Selection
    let startX = x1;
    let endX = x2;

    // Top to Bottom Selection
    let startY = y1;
    let endY = y2;

    // Right to Left Selection
    if (x1 > x2) {
      startX = x2;
      endX = x1;
    }

    // Bottom to Top Selection
    if (y1 > x2) {
      startY = y2;
      endY = y1;
    }

    for (let i = startX; i <= endX; i++) {
      const cellName = jexcel.getColumnNameFromId([i, startY]);
      if (
        this.state.importedHeaders.includes(cellName) ||
        this.state.transposedHeaders.includes(cellName)
      ) {
        // Skip
      } else {
        cellNames.push(cellName);
      }
    }

    this.activeselection = { x1: startX, y1: startY, x2: endX, y2: endY };

    this.timeouts.cellSelection = setTimeout(() => {
      this.setState({ selections: [...cellNames] });
    }, 500);
  };

  /**
   * Get Data Type of Cell
   */
  getDataType = () => {
    return COLUMN_DATA_TYPES_KEYS.alphanumeric;
  };

  /**
   * Handle Click > Import Data
   */
  onClickImport = () => {
    logAmplitudeEvent('Import source table column');
    this.processDataForPreview(true);
  };

  /**
   * Handle Click > Transpsoe Data
   */
  onClickTransposeColsToRow = () => {
    logAmplitudeEvent('Transpose source table column');
    this.processDataForPreview();
  };

  /**
   * Process Data for Preview Table
   *
   * @param {Boolean} isFromImport
   */
  processDataForPreview = (isFromImport = false, callback) => {
    try {
      const coOrdinates = this.validateSelections(isFromImport);
      if (!coOrdinates) return;

      const { x1, y1, y2, maxRows, multiTranspose } = coOrdinates;
      let { x2 } = coOrdinates;
      const { importedHeaders, transposedHeaders, selections } = this.state;

      const {
        sourceTable: { data },
      } = this.props;

      const totalColsInSheet = (data[0] || []).length;

      if (x2 >= totalColsInSheet && this.isReloadTable()) {
        x2 = totalColsInSheet - 1;
      }

      const {
        headers: importedHeadersPreview,
        importedRows,
      } = this.processImport({
        x1,
        y1,
        x2,
        y2,
        maxRows,
        isFromImport,
      });

      const {
        rows: rowsWithTranspose,
        headers,
        multiTransposedHeaders,
      } = this.processTranspose({
        maxRows,
        x1,
        y1,
        x2,
        y2,
        isFromImport,
        importedRows,
        headers: importedHeadersPreview,
        multiTranspose,
      });

      let updatedImportedHeaders = importedHeaders;
      let updatedTransposedHeaders = transposedHeaders;
      if (isFromImport) {
        updatedImportedHeaders = [...updatedImportedHeaders, ...selections];
      } else if (
        this.state.transposedHeadersXY.y1 == undefined ||
        this.activeselection.y1 == this.state.transposedHeadersXY.y1
      ) {
        updatedTransposedHeaders = [...updatedTransposedHeaders, ...selections];
      }

      this.activeselection = {};

      const rows =
        rowsWithTranspose.length > 0
          ? rowsWithTranspose.splice(0, 500)
          : importedRows;

      this.setState({
        headers,
        rows,
        isShowPreview: true,
        transposedHeaders: updatedTransposedHeaders,
        transposedHeadersXY: { x1, y1, x2, y2 },
        importedHeaders: updatedImportedHeaders,
        importedHeadersXY: { x1, y1, x2, y2 },
        selections: [],
        multiTransposedHeadersXY: multiTranspose || {},
        multiTransposedHeaders,
      });

      const {
        imported: importedColor,
        transposed: transposedColor,
      } = EXCEL_COLORS[this.props.theme];

      const styles = {};
      updatedImportedHeaders.forEach(c => {
        styles[c] = `background-color: ${importedColor};`;
      });

      [...updatedTransposedHeaders, ...multiTransposedHeaders].forEach(c => {
        styles[c] = `background-color: ${transposedColor};`;
      });

      this.spreadsheet.setStyle(styles);

      if (typeof callback == 'function') callback();

      if (!callback && this.isReloadTable()) {
        if (this.isResetPressed) {
          setTimeout(this.updateMappingsAfterReset, 300);
        } else {
          setTimeout(this.updateHeaderTypes, 300);
        }
      }
    } catch (e) {
      console.error('# ERROR #', e);
    }
  };

  /**
   * Validate Selection of Cells in Sheet
   * Return Object is valid selection, else false
   *
   * @return {Object|Boolean}
   */
  validateSelections = isFromImport => {
    const {
      sourceTable: { data },
    } = this.props;

    // selections = [A1, A2, ...]
    const {
      importedHeadersXY,
      transposedHeadersXY,
      transposedHeaders,
    } = this.state;

    let { multiTransposedHeadersXY } = this.state;

    const { activeselection } = this; // x1, y1, ...

    if (Object.keys(activeselection).length != 4) {
      showErrorMsg(SOURCE_TABLES_MSG.select_cells_err);
      return false;
    }

    let { x1, x2, y1, y2 } = activeselection;
    const { x1: ix1, x2: ix2 } = importedHeadersXY;
    const { x1: tx1, x2: tx2 } = transposedHeadersXY;

    if (Number(x1) > Number(ix1)) x1 = Number(ix1);
    if (Number(x2) < Number(ix2)) x2 = Number(ix2);

    if (Number(x1) > Number(tx1)) x1 = Number(tx1);
    if (Number(x2) < Number(tx2)) x2 = Number(tx2);

    if (y1 != y2) {
      showErrorMsg(SOURCE_TABLES_MSG.select_cells_in_single_row);
      return false;
    }

    if (
      // isFromImport && // Enable this to activate multi transpose
      importedHeadersXY.y1 != undefined &&
      importedHeadersXY.y1 != y1
    ) {
      showErrorMsg(SOURCE_TABLES_MSG.select_cells_in_same_row);
      return false;
    }

    if (transposedHeaders.length > 0 && transposedHeadersXY.y1 != y1) {
      if (
        multiTransposedHeadersXY.y1 != undefined &&
        multiTransposedHeadersXY.y1 != y1
      ) {
        showErrorMsg(SOURCE_TABLES_MSG.select_cells_in_same_row_for_transpose);
        return false;
      }

      if (transposedHeadersXY.y1 == y1 - 1) {
        multiTransposedHeadersXY = { y1 };
        y1--;
        y2--;
      } else if (transposedHeadersXY.y1 == y1 + 1) {
        multiTransposedHeadersXY = { y1 };
        y1++;
        y2++;
      } else {
        showErrorMsg(SOURCE_TABLES_MSG.select_valid_cell_for_multi_transpose);
        return false;
      }
    } else if (
      transposedHeadersXY.y1 != undefined &&
      transposedHeadersXY.y1 != y1
    ) {
      showErrorMsg(SOURCE_TABLES_MSG.select_cells_in_same_row);
      return false;
    }

    let maxRows = MAX_RECORDS_TO_SHOW;
    if (data.length - y1 < maxRows) maxRows = data.length - y1;

    return {
      x1,
      y1,
      x2,
      y2,
      maxRows,
      multiTranspose: multiTransposedHeadersXY,
    };
  };

  /**
   * Process Data for Import
   *
   * @param {Object}
   *
   * @return {Object}
   */
  processImport = ({ maxRows, x1, x2, y1, y2, isFromImport }) => {
    const {
      sourceTable: { data },
    } = this.props;

    const { importedHeaders, selections, headers: stateHeaders } = this.state;

    const importedRows = [];
    const headers = [];
    let rowIndex = y1;

    // For Import
    for (let i = 0; i < maxRows; i++) {
      const row = [];

      for (let colIndex = x1; colIndex <= x2; colIndex++) {
        const columnHead = jexcel.getColumnNameFromId([colIndex, y1]);

        const isAlreadyImported = importedHeaders.includes(columnHead);

        if (
          isAlreadyImported ||
          (isFromImport && selections.includes(columnHead))
        ) {
          let cellValue = data[rowIndex] && data[rowIndex][colIndex];
          cellValue = getValidDateCellValue(cellValue);

          if (i == 0) {
            if (!cellValue) {
              cellValue = generateColumnName([...headers, ...stateHeaders], 0);
            }

            let headerCell = {
              ...DEFAULT_CELL_PROPS,
              forImport: true,
              label: cellValue,
              oldLabel: cellValue,
              dataType: this.getDataType(),
              cellKey: columnHead,
            };

            if (isAlreadyImported && this.headersHistory[columnHead]) {
              const existingHeader = { ...this.headersHistory[columnHead] };
              headerCell = { ...existingHeader };
            }

            this.headersHistory[columnHead] = { ...headerCell };
            headers.push(headerCell);
          } else {
            row.push({
              ...DEFAULT_CELL_PROPS,
              value: cellValue,
              dataType: this.getDataType(),
            });
          }
        }
      }

      if (i != 0 && row.length > 0) importedRows.push(row);

      rowIndex++;
    }

    return { headers, importedRows };
  };

  /**
   * Process Data for Transpose
   *
   * @param {Object}
   *
   * @return {Object}
   */
  processTranspose = ({
    maxRows,
    x1,
    x2,
    y1,
    y2,
    isFromImport,
    importedRows,
    headers,
    multiTranspose,
  }) => {
    let multiTranposeY1 = -1;
    if (multiTranspose) multiTranposeY1 = multiTranspose.y1;

    const multiTransposedHeaders = [];

    const {
      sourceTable: { data },
    } = this.props;

    const { transposedHeaders, selections } = this.state;

    let rowIndex = y1;
    const rows = [];
    const transposeKeys = {};
    let isTranposedHeadersAdded = false;
    let tarnsposeIndex = 0;

    // For Transpose
    for (let i = 0; i < maxRows; i++) {
      // [i - 1] to skip first header row
      const row = importedRows[i - 1] || [];

      for (let colIndex = x1; colIndex <= x2; colIndex++) {
        const columnHead = jexcel.getColumnNameFromId([colIndex, y1]);

        if (
          (!isFromImport && selections.includes(columnHead)) ||
          transposedHeaders.includes(columnHead)
        ) {
          let cellValue = data[rowIndex] && data[rowIndex][colIndex];
          cellValue = getValidDateCellValue(cellValue);

          if (i == 0) {
            transposeKeys[colIndex] = cellValue;

            if (!isTranposedHeadersAdded) {
              if (multiTranposeY1 >= 0) {
                tarnsposeIndex++;
                headers.push({
                  ...DEFAULT_CELL_PROPS,
                  forTranspose: true,
                  forMultiTranspose: true,
                  label: `New Column ${tarnsposeIndex}`,
                  dataType: COLUMN_DATA_TYPES_KEYS.alphanumeric,
                  transposedColumn: true,
                });
              }

              this.transposeHeadersHistory[0] = this.transposeHeadersHistory[0]
                ? this.transposeHeadersHistory[0]
                : {
                    ...DEFAULT_CELL_PROPS,
                    forTranspose: true,
                    label: `New Column ${tarnsposeIndex + 1}`,
                    dataType: COLUMN_DATA_TYPES_KEYS.alphanumeric,
                    transposedColumn: true,
                  };

              this.transposeHeadersHistory[1] = this.transposeHeadersHistory[1]
                ? this.transposeHeadersHistory[1]
                : {
                    ...DEFAULT_CELL_PROPS,
                    forTranspose: true,
                    label: `New Column ${tarnsposeIndex + 2}`,
                    dataType: COLUMN_DATA_TYPES_KEYS.alphanumeric,
                    transposedColumn: true,
                  };

              headers.push(this.transposeHeadersHistory[0]);
              headers.push(this.transposeHeadersHistory[1]);

              isTranposedHeadersAdded = true;
            }
          } else {
            let multiTransposedCell = null;

            if (multiTranposeY1 >= 0) {
              const multiTransposedCellValue =
                data[multiTranposeY1] && data[multiTranposeY1][colIndex];

              const cellName = jexcel.getColumnNameFromId([
                colIndex,
                multiTranposeY1,
              ]);

              if (!multiTransposedHeaders.includes(cellName)) {
                multiTransposedHeaders.push(cellName);
              }

              multiTransposedCell = {
                ...DEFAULT_CELL_PROPS,
                value: String(getValidDateCellValue(multiTransposedCellValue)),
                dataType: this.getDataType(multiTransposedCellValue),
              };
            }

            let transposedRow = [...row];
            if (multiTransposedCell) {
              transposedRow.push(multiTransposedCell);
            }

            transposedRow = [
              ...transposedRow,
              {
                ...DEFAULT_CELL_PROPS,
                value: String(transposeKeys[colIndex] || ''),
                dataType: this.getDataType(cellValue),
              },
              {
                ...DEFAULT_CELL_PROPS,
                value: String(cellValue),
                dataType: this.getDataType(cellValue),
              },
            ];

            rows.push(transposedRow);
          }
        }
      }

      rowIndex++;
    }

    return { rows, headers, multiTransposedHeaders };
  };

  /**
   * Update Column [Header Props]
   *
   * @param {Object}
   */
  updateColumn = ({ colIndex, title, dataType, dateFormat }) => {
    const copyHeaders = [...this.state.headers];

    const header = copyHeaders[colIndex];

    const newCol = {
      ...header,
      label: title,
      dataType,
      dateFormat,
    };

    if (header.forTranspose) {
      if (copyHeaders.length - 1 == colIndex) {
        this.transposeHeadersHistory[1] = newCol;
      } else {
        this.transposeHeadersHistory[0] = newCol;
      }
    }

    if (header.forImport) {
      this.headersHistory[header.cellKey] = newCol;
    }

    copyHeaders[colIndex] = { ...newCol };

    const formattedRows = this.state.rows.map((row, i) => {
      const col = { ...row[colIndex] };
      const value = col.realValue || col.value;

      const formattedCol = {
        ...col,
        realValue: value,
        value: getValueAsPerType({ value, dataType, dateFormat }),
      };

      row[colIndex] = formattedCol;

      return row;
    });

    this.setState({ headers: copyHeaders, rows: formattedRows });
  };

  /**
   * Delete Column [Header]
   *
   * @param {Object}
   */
  deleteColumn = ({ colIndex, column }) => {
    const { rows } = this.state;
    let { headers, importedHeaders } = this.state;
    const styles = {};

    let {
      transposedHeaders,
      multiTransposedHeaders,
      multiTransposedHeadersXY,
    } = this.state;

    let mappedRows = rows;

    const { cellKey } = headers[colIndex] || {};

    // Delete Imported Column
    if (column.forImport) {
      headers.splice(colIndex, 1);
      delete this.headersHistory[cellKey];

      mappedRows = rows.map(row => {
        row.splice(colIndex, 1);
        return row;
      });

      styles[cellKey] = DEFAULT_RESET_STYLES;

      importedHeaders = [...importedHeaders].filter(key => cellKey != key);
    }

    // Delete Transposed Column
    if (column.forMultiTranspose) {
      multiTransposedHeaders.forEach(colName => {
        styles[colName] = DEFAULT_RESET_STYLES;
      });

      multiTransposedHeaders = [];
      multiTransposedHeadersXY = {};
    } else if (column.forTranspose) {
      transposedHeaders.forEach(colName => {
        styles[colName] = DEFAULT_RESET_STYLES;
      });

      this.transposeHeadersHistory = {};

      transposedHeaders = [];
      const removeTransposeIndex = [];

      headers = headers.filter(({ forTranspose, forMultiTranspose }, i) => {
        if (forTranspose || forMultiTranspose) {
          removeTransposeIndex.push(i);
          return false;
        }

        return true;
      });

      mappedRows = rows.map(row => {
        row.splice(removeTransposeIndex[0], removeTransposeIndex.length);
        return row;
      });
    }

    let isValidMappings = true;
    if (this.isReloadTable()) {
      isValidMappings = !headers.find(({ newLabel }) => !newLabel);
    }

    this.spreadsheet.resetStyle(styles);
    this.setState({
      transposedHeaders,
      importedHeaders,
      headers,
      rows: mappedRows,
      multiTransposedHeaders,
      multiTransposedHeadersXY,
      isValidMappings,
    });
  };

  /**
   * Handle Click > Save Table
   */
  onSaveTable = async () => {
    logAmplitudeEvent('Save source table');

    try {
      const {
        showLoader = false,
        headers = [],
        uploadedFileUrl = '',
      } = this.state;

      const { sourceTable = {} } = this.props;
      const { fileName = '', id = '', dimension = {}, columns = [] } =
        sourceTable || {};

      const { identifier_col = '' } = dimension || {};

      if (showLoader) return;

      if (headers.length == 0) {
        showErrorMsg(SOURCE_TABLES_MSG.cells_required_to_import);
        return;
      }

      if (headers.length > MAX_COLS_FOR_IMPORT) {
        showErrorMsg(getMaxColsMessage(headers.length));
        return;
      }

      const [duplicateHeader] = _.filter(
        headers.map(({ label }) => label),
        (value, index, iteratee) => _.includes(iteratee, value, index + 1)
      );
      if (duplicateHeader) {
        showErrorMsg(SOURCE_TABLES_MSG.duplicateColumn(duplicateHeader));
        return;
      }

      if (this.isReloadTable()) {
        const headerWithoutNewLabel = headers.find(({ newLabel }) => !newLabel);

        if (headerWithoutNewLabel) {
          showErrorMsg(
            SOURCE_TABLES_MSG.mappingNameRequiredInReload(
              headerWithoutNewLabel.label
            )
          );
          return;
        }
      }

      this.setState({ showLoader: true });

      if (!this.isReloadTable()) {
        // Validate table name exist or not

        const { is_exists, message = '' } = await validateTableName(fileName);

        if (is_exists) {
          showErrorMsg(message);
          this.setState({ showLoader: false });
          return;
        }
      }

      let uploadedFile = uploadedFileUrl;
      if (!uploadedFile) {
        uploadedFile = await this.uploadFile();
      } else {
        this.setState({ uploadPercentage: 100 });
      }

      if (!uploadedFile) {
        this.setState({ showLoader: false });
        return;
      }

      const params = this.isReloadTable()
        ? formatParamsToReloadTable(this.state, this.props)
        : formatParamsToImportTable(this.state, this.props, jexcel);

      const { mappings = [] } = params || {};

      const columnsWithUniqueId = columns.filter(
        ({ is_unique = '' }) => is_unique === true
      );

      // Validate is unique in(ID Column)
      if (columnsWithUniqueId.length > 0) {
        const [firstEle] = columnsWithUniqueId || [];
        const { display_name = '', name = '' } = firstEle || {};

        const isAvailableUniqueID = mappings.findIndex(
          ({ destination_field_name = '' }) =>
            destination_field_name
              ?.replace(regxToIdentifySpace, '_')
              ?.toLowerCase() === name
        );

        if (isAvailableUniqueID === -1) {
          showErrorMsg(
            RULE_BASED_MODELS_MSG.reload_validate_unique_id.replace(
              '#FIELD_NAME#',
              display_name
            )
          );
          this.setState({ showLoader: false });

          return;
        }
      }

      // Validate identifier col(ID Column)
      if (identifier_col) {
        const isAvailableIdentifier = mappings.findIndex(
          ({ destination_field_name = '' }) =>
            destination_field_name
              ?.replace(regxToIdentifySpace, '_')
              ?.toLowerCase() === identifier_col
        );

        if (isAvailableIdentifier === -1) {
          showErrorMsg(DIMENSIONS_MSG.reload_validate_identifier_feild);
          this.setState({ showLoader: false });

          return;
        }
      }

      if (this.isReloadTable()) {
        params.table_id = id;
      }

      params.meta.file_url = uploadedFile;

      let url = API_URLS.SAVE_IMPORTED_TABLE;
      if (this.isReloadTable()) {
        url = API_URLS.SAVE_RELOAD_SOURCE_TABLE;
        url = url.replace('#ID#', id);
      }

      const { data, message = '' } = await httpPost(url, params);

      this.setState({ showLoader: false, uploadPercentage: 0 });

      const { onRedirect } = this.props;
      if (onRedirect) {
        onRedirect(data);
        return;
      }

      const {
        location: { pathname = '', search = '' },
      } = this.props.history;

      const path = search.replace('?redirectUrl=', '');

      const query = new URLSearchParams(search);
      const rbmId = query.get('id');

      if (search.includes('redirectUrl')) {
        if (identifier_col) {
          showSuccessMsg(String(message));
        }
        this.props.history.push(path);
        return;
      }

      switch (true) {
        case pathname == APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE:
          showSuccessMsg(String(message));

          this.props.history.push(APP_ROUTES.DIMENSIONS);
          break;

        case pathname == APP_ROUTES.VIEW_RULE_BASED_MODEL:
          showSuccessMsg(RULE_BASED_MODELS_MSG.rule_based_model_reloaded);

          this.props.history.push(
            APP_ROUTES.RULE_BASED_MODEL.replace(':id', rbmId)
          );
          break;

        default:
          if (identifier_col) {
            showSuccessMsg(String(message));
          }

          if (!identifier_col) {
            this.isReloadTable()
              ? showSuccessMsg(SOURCE_TABLES_MSG.table_reloaded)
              : showSuccessMsg(SOURCE_TABLES_MSG.table_imported);
          }

          this.props.history.push(APP_ROUTES.SOURCE_TABLES);
          break;
      }
    } catch (e) {
      console.error(e);
      _.debounce(() => {
        this.setState({ showLoader: false, uploadPercentage: 0 });
      }, 200)();
    }
  };

  /**
   * Upload Imported File
   *
   * @return {String}
   */
  uploadFile = async () => {
    try {
      const {
        sourceTable: { file },
      } = this.props;

      const onUploadProgress = ({ loaded = 0, total = 1 }) => {
        const uploadPercentage = Math.floor((loaded / total) * 100);
        this.setState({ uploadPercentage });
      };

      const formData = new FormData();
      formData.append('file', file);

      const { url = '' } = await httpPost(API_URLS.UPLOAD_FILE, formData, {
        onUploadProgress,
      });

      this.setState({ uploadedFileUrl: url });

      return url;
    } catch (e) {
      this.setState({ showLoader: false, uploadPercentage: 0 });
      return '';
    }
  };

  /**
   * Handle Click > Cancel
   */
  onCancelProcess = () => {
    logAmplitudeEvent('Cancel source table processing');

    if (this.props.onCancel) {
      this.props.onCancel();
      return;
    }

    const {
      location: { pathname = '', search = '' },
    } = this.props.history;

    const path = search.replace('?redirectUrl=', '');

    const query = new URLSearchParams(search);
    const id = query.get('id');
    const tab = Number(query.get('activeTab'));

    let url = APP_ROUTES.CREATE_RULE_BASED_MODEL;
    url += `?id=${id}&activeTab=${tab}`;

    if (search.includes('redirectUrl')) {
      this.props.history.push(path);
      return;
    }

    switch (true) {
      case pathname == APP_ROUTES.VIEW_DIMENSIONS_RELOAD_TABLE:
        this.props.history.push(APP_ROUTES.DIMENSIONS);
        break;

      case pathname == APP_ROUTES.VIEW_RULE_BASED_MODEL:
        this.props.history.push(url);
        break;

      default:
        this.props.history.push(APP_ROUTES.SOURCE_TABLES);
        break;
    }
  };

  /**
   * Disable dropdown options as per data type of Source table
   */
  applyDataTypeRules = ({ dataType: data_type, isNewCol }) => {
    const dataTypes = JSON.parse(JSON.stringify(COLUMN_DATA_TYPES));

    if (isNewCol) return dataTypes;

    dataTypes.forEach(type => {
      // In case of alphanumeric
      if (
        data_type == COLUMN_DATA_TYPES_KEYS.alphanumeric &&
        type.value != COLUMN_DATA_TYPES_KEYS.alphanumeric
      ) {
        type.disabled = true;
      }

      // In case of date
      if (
        data_type == COLUMN_DATA_TYPES_KEYS.date &&
        type.value == COLUMN_DATA_TYPES_KEYS.amount
      ) {
        type.disabled = true;
      }

      // In case of Amount
      if (
        data_type == COLUMN_DATA_TYPES_KEYS.amount &&
        type.value == COLUMN_DATA_TYPES_KEYS.date
      ) {
        type.disabled = true;
      }

      return type;
    });

    return dataTypes || [];
  };

  /**
   * Get Columns List for Reload (Target Columns)
   *
   * @param {Object} header
   *
   * @return {Array}
   */
  getTargetColumns = header => {
    const {
      sourceTable: { columns },
    } = this.props;

    const options = columns.map(col => {
      return {
        label: col.display_name,
        value: col.id,
        option: col,
        disabled: header.dataType != col.data_type,
      };
    });

    return options;
  };

  /**
   * On CHnage Target Column
   *
   * @param {Number} i
   * @param {Object} event
   * @param {Any} selectedValue
   *
   * @return {Array}
   */
  onChangeTargetCol = i => (event, selectedValue) => {
    if (selectedValue == null) return;

    const { headers } = this.state;
    const header = headers[i];

    const {
      sourceTable: { columns },
    } = this.props;

    let { value, label } = selectedValue;
    let isNewCol = false;

    if (typeof selectedValue == 'string') {
      isNewCol = true;
      label = selectedValue;
      value = '';
    }

    if (selectedValue.inputValue) {
      isNewCol = true;
      value = '';
      label = selectedValue.inputValue;
    }

    if (isNewCol) {
      const duplicateCol = headers.find(({ newLabel }) => newLabel == label);

      if (duplicateCol) {
        showErrorMsg('Duplicate Column.');
        return;
      }
    }

    const targetHeader =
      columns.find(({ display_name }) => display_name == label) || {};

    const updatedHeader = {
      ...header,

      id: value || '',
      newLabel: label || '',
      newDataType: targetHeader.data_type || '',
      isNewCol: !targetHeader.display_name,
    };

    if (header.forImport) {
      this.headersHistory[header.cellKey] = updatedHeader;
    } else if (headers.length - 1 == i) {
      this.transposeHeadersHistory[1] = updatedHeader;
    } else {
      this.transposeHeadersHistory[0] = updatedHeader;
    }

    headers[i] = updatedHeader;

    let isValidMappings = true;
    if (this.isReloadTable()) {
      isValidMappings = !headers.find(({ newLabel }) => !newLabel);
    }

    this.setState({ headers: [...headers], isValidMappings });
  };

  /**
   * On Change Data Type of Column in Mappings
   *
   * @param {Number} i
   * @param {String} name
   * @param {String} value
   */
  onChangeDataType = i => (name, value) => {
    const { headers } = this.state;
    const header = headers[i];

    const updatedHeader = {
      ...header,
      newDataType: value || '',
    };

    if (header.forImport) {
      this.headersHistory[header.cellKey] = updatedHeader;
    } else if (headers.length - 1 == i) {
      this.transposeHeadersHistory[1] = updatedHeader;
    } else {
      this.transposeHeadersHistory[0] = updatedHeader;
    }

    headers[i] = updatedHeader;
    this.setState({ headers: [...headers] });
  };

  /**
   * On Press KeyDown|Tab in Target Column
   *
   * @param {Number} i
   * @param {Object} event
   */
  onKeyDownDestination = i => event => {
    switch (event.key) {
      case 'Tab':
        const inputValue = event.target.value || '';
        const targetName = this.state.headers[i].newLabel || '';

        if (inputValue.length > 0 && targetName != inputValue) {
          const optionObj = {
            inputValue,
            label: `Add "${inputValue}"`,
          };
          this.onChangeTargetCol(i)(event, optionObj);
        }
        break;

      default:
        break;
    }
  };

  /**
   * Render View
   */
  render() {
    const { sourceTable } = this.props;

    const {
      showLoader,
      isShowPreview,
      selections = [],
      headers,
      rows,
      uploadPercentage,
      activeTab,
      reloadImportType,
      isFillingData,
      isBlockDone,
      isValidMappings,
    } = this.state;

    return (
      <>
        {isFillingData && <Spinner text="Loading..." />}

        <AppHeader
          cancelText="Cancel"
          saveText="Done"
          onSave={this.onSaveTable}
          onCancel={this.onCancelProcess}
          isBlockDone={isBlockDone}
          header={
            <EditTableNameHeader
              name={sourceTable.fileName}
              handleNewName={this.updateTableName}
              onChangeEditingState={value => {
                this.setState({ isBlockDone: value });
              }}
            />
          }
        />

        <UploadLoader
          uploadPercentage={uploadPercentage}
          isVisible={showLoader}
          savingText="Saving..."
        />

        {sourceTable.file && (
          <div className="table-sub-title">
            {headers.length > MAX_COLS_FOR_IMPORT && (
              <FormHelperText error className="max-col-error">
                {getMaxColsMessage(headers.length)}
              </FormHelperText>
            )}
            <Box bgcolor="secondary.dark" pt={1} borderRadius={3}>
              <Box mt={1} mb={1} position="relative">
                <Grid alignItems="center" direction="row" container>
                  <Box ml={1}>
                    <Button
                      color="primary"
                      disabled={selections.length == 0}
                      onClick={this.onClickImport}
                    >
                      Import Column(s)
                    </Button>
                  </Box>
                  <Box ml={1}>
                    <Button
                      color="primary"
                      disabled={selections.length == 0}
                      onClick={this.onClickTransposeColsToRow}
                    >
                      Transpose Column(s)
                    </Button>
                  </Box>

                  <Box ml={1}>
                    <Button className="ml5" onClick={this.resetData}>
                      Reset
                    </Button>
                  </Box>

                  <Box ml={1} className="row-cols-count">
                    <Typography>
                      Total Rows:
                      {getFormattedNumber(sourceTable.totalRows) || 0}
                    </Typography>
                    <Typography>
                      Total Columns:
                      {getFormattedNumber(sourceTable.totalColumns) || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Box>
              <div className="import-selected-table">
                <div ref={this.spreadsheetEle} />
              </div>
            </Box>

            {isShowPreview && (
              <>
                <Box
                  bgcolor="secondary.dark"
                  px={2}
                  pt={1}
                  pb={2}
                  mt={3}
                  borderRadius={4}
                >
                  <Box textAlign="center" mt={1} fontSize={24}>
                    <Tabs
                      value={activeTab}
                      indicatorColor="primary"
                      className="select-table-tab reload-tabs-container"
                      onChange={(evt, activeTab) => {
                        this.setState({ activeTab });
                      }}
                    >
                      {TABS.map((tab, tabIndex) => {
                        if (tabIndex == 1 && !this.isReloadTable()) return null;

                        const getErrorIcon = () => {
                          if (tabIndex == 1 && !isValidMappings) {
                            return (
                              <Tooltip
                                title={
                                  SOURCE_TABLES_MSG.invalid_mappings_in_reload
                                }
                                placement="top"
                                arrow
                                interactive
                              >
                                <ErrorIcon fontSize="small" color="error" />
                              </Tooltip>
                            );
                          }

                          return undefined;
                        };

                        return (
                          <Tab
                            key={tab}
                            label={tab}
                            className="reload-table-tabs"
                            icon={getErrorIcon()}
                          />
                        );
                      })}
                    </Tabs>
                  </Box>

                  {activeTab == 0 && (
                    <Box pt={2} className="preview-table">
                      <ImportedPreview
                        columns={headers}
                        grid={rows}
                        selections={[]}
                        selectedHeaders={{}}
                        updateColumn={this.updateColumn}
                        deleteColumn={this.deleteColumn}
                        showDataType={!this.isReloadTable()}
                        isReloadTable={this.isReloadTable()}
                        scrollHeight="500px"
                      />
                    </Box>
                  )}

                  {activeTab == 1 && this.isReloadTable() && (
                    <Box pt={1}>
                      <Box display="flex" alignItems="center" pb={1}>
                        <Typography variant="h6">
                          How do you want to import records?
                        </Typography>

                        <Box px={1} />

                        {this.importType.map(t => (
                          <Box key={t}>
                            <FormControlLabel
                              control={
                                <Radio
                                  color="primary"
                                  checked={t == reloadImportType}
                                />
                              }
                              label={t}
                              onChange={() =>
                                this.setState({ reloadImportType: t })
                              }
                            />
                          </Box>
                        ))}
                      </Box>

                      {headers.length == 0 && (
                        <Box py={3} px={2} textAlign="center">
                          <Typography variant="body1">
                            It looks like you don't have any columns to import
                            or transpose.
                          </Typography>
                        </Box>
                      )}

                      <Box mt={1} mb={3}>
                        <Divider />
                      </Box>
                      <Box className="copy-table" mt={1} mb={2}>
                        <Grid direction="row" container>
                          <Grid
                            item
                            xs={4}
                            container
                            direction="row"
                            alignItems="center"
                          >
                            <Box ml={5}>
                              <Typography variant="body1" color="textSecondary">
                                Source Table Field Name
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid
                            item
                            xs={4}
                            container
                            direction="row"
                            alignItems="center"
                          >
                            <Box>
                              <Typography variant="body1" color="textSecondary">
                                Destination Field Name
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid
                            item
                            xs={4}
                            container
                            direction="row"
                            alignItems="center"
                          >
                            <Box>
                              <Typography variant="body1" color="textSecondary">
                                Data Type
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {headers.map((header, i) => {
                        const hasError = !header.newLabel;

                        return (
                          <Box
                            key={i}
                            display="flex"
                            alignItems="center"
                            mb={1}
                          >
                            <Box
                              borderRadius={4}
                              className="copy-table"
                              mr={1}
                              bgcolor="secondary.processTable"
                            >
                              <Grid
                                direction="row"
                                container
                                className="create-dialog-grid reload-grid"
                              >
                                <Grid
                                  item
                                  xs={3}
                                  wrap="nowrap"
                                  container
                                  direction="row"
                                  alignItems="center"
                                >
                                  <Box ml={1}>{`#${i + 1}`}</Box>
                                  <Box ml={1}>
                                    <Typography variant="body2">
                                      {header.label}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid
                                  item
                                  xs={1}
                                  container
                                  alignItems="center"
                                  justify="flex-start"
                                >
                                  <ArrowRightAltIcon />
                                </Grid>
                                <Grid
                                  item
                                  xs={4}
                                  container
                                  alignItems="center"
                                  className="border-form-input"
                                >
                                  <Autocomplete
                                    openOnFocus
                                    disableClearable
                                    id={`target-table-field-${i}`}
                                    className={`copy-table-autocomplete ${
                                      header.isNewCol && !header.newLabel
                                        ? 'copy-table-new-tag'
                                        : ''
                                    }`}
                                    value={{
                                      label: header.newLabel || '',
                                    }}
                                    selectOnFocus
                                    clearOnBlur
                                    freeSolo
                                    handleHomeEndKeys
                                    ListboxComponent={ListboxComponent}
                                    options={this.getTargetColumns(header)}
                                    renderOption={option => option.label}
                                    getOptionDisabled={({ label }) => {
                                      return Boolean(
                                        headers.find(h => h.newLabel == label)
                                      );
                                    }}
                                    onChange={this.onChangeTargetCol(i)}
                                    getOptionLabel={option => {
                                      // Add "xxx" option created dynamically
                                      if (option.inputValue) {
                                        return option.inputValue;
                                      }

                                      // Regular option
                                      return option.label;
                                    }}
                                    renderInput={params => (
                                      <TextField
                                        {...params}
                                        placeholder={NEW_FIELD}
                                        onKeyDown={this.onKeyDownDestination(i)}
                                        variant="standard"
                                        error={hasError}
                                      />
                                    )}
                                    filterOptions={(options, params) => {
                                      const filtered = filter(options, params);

                                      // Suggest the creation of a new value
                                      if (params.inputValue !== '') {
                                        filtered.push({
                                          inputValue: params.inputValue,
                                          isNewAdd: true,
                                          label: `Add "${params.inputValue}"`,
                                        });
                                      }

                                      return filtered;
                                    }}
                                  />
                                </Grid>
                                <Grid
                                  item
                                  xs={3}
                                  container
                                  alignItems="center"
                                  className="border-form-input"
                                >
                                  <SingleSelect
                                    variant="standard"
                                    id="copy-data-type"
                                    value={
                                      header.newDataType ||
                                      header.dataType ||
                                      ''
                                    }
                                    name="newDataType"
                                    disabled={!header.isNewCol}
                                    options={this.applyDataTypeRules(header)}
                                    onChange={this.onChangeDataType(i)}
                                  />
                                </Grid>

                                <Grid
                                  item
                                  xs={1}
                                  container
                                  alignItems="center"
                                  justify="flex-end"
                                  className="border-form-input"
                                >
                                  <Box
                                    ml={2}
                                    display="flex"
                                    alignItems="center"
                                  >
                                    <DeleteIcon
                                      className="cursor-pointer"
                                      onClick={() => {
                                        this.deleteColumn({
                                          colIndex: i,
                                          column: header,
                                        });
                                      }}
                                    />
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>

                            {hasError && (
                              <Tooltip
                                title={
                                  SOURCE_TABLES_MSG.invalid_mapping_in_reload
                                }
                                placement="top"
                                arrow
                                interactive
                              >
                                <ErrorIcon color="error" />
                              </Tooltip>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </div>
        )}
      </>
    );
  }
}

ProcessImportedTable.propTypes = {
  onCancel: func,
  onRedirect: func,
  setSourceTable: func.isRequired,
  sourceTable: shape({}).isRequired,
  theme: string.isRequired,
  type: string.isRequired,
};

ProcessImportedTable.defaultProps = {
  type: 'importTable',
};

const mapStateToProps = createStructuredSelector({
  sourceTable: getSourceTable(),
  theme: getTheme(),
});

export default connect(mapStateToProps, { setSourceTable })(
  withRouter(ProcessImportedTable)
);
