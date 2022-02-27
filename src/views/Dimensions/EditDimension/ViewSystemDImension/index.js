import React from 'react';
import { withRouter } from 'react-router-dom';
import { shape, func, arrayOf, string, bool } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import jexcel from 'jexcel';
import { Typography, Box, Link } from '@material-ui/core';

import Spinner from '../../../../components/Spinner';

import {
  setGLAccounts,
  setGLAccountsMeta,
} from '../../../../reducers/FinancialEnvSetup/actions';
import {
  getGLAccounts,
  getGLAccountsMeta,
} from '../../../../reducers/FinancialEnvSetup/selectors';

import { DEFAULT_JEXCEL_CONFIGS } from '../../../../configs/jexcel';
import { FINANCIAL_SETUP_MSG } from '../../../../configs/messages';
import { HIERARCHY_COL_WIDTH } from '../../../../configs/app';
import { APP_ROUTES } from '../../../../configs/routes';
import { API_URLS } from '../../../../configs/api';
import { TYPES } from '../configs';
import {
  GL_ACCOUNT_HEADERS,
  GL_ACCOUNT_HEADERS_VALUES,
} from '../../../FinancialEnvSetup/SetupGLAccounts/configs';

import { httpGet, httpPost } from '../../../../utils/http';
import { showErrorMsg } from '../../../../utils/notifications';
import programmaticallyLoadByUrl from '../../../../utils/helper/programmaticallyLoadByUrl';
import { getValidCellValue } from '../../../FinancialEnvSetup/SetupGLAccounts/helper';

import './styles.scss';
import { fetchDimension } from '../../../../services/Dimensions';

class ViewSystemDimension extends React.Component {
  state = {
    isImport: false,
    showLoader: false,
    hasGLAccount: true,
    tableHeight: '',
  };

  /**
   * Spreadsheet Element Ref
   */
  glAccountsSheetRef = React.createRef();

  /**
   * Spreadsheet Handler
   */
  spreadsheet;

  /**
   * Runtime Selection of keys
   */
  activeselection = {}; // { x1, y1, ... }

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { glAccounts: data, glAccountsMeta: metadata } = this.props;

    this.fillInitialData({ data, metadata });
  }

  componentWillUnmount() {
    const { type, setGLAccounts, setGLAccountsMeta } = this.props;

    if (type == TYPES[2]) {
      setGLAccounts([]);
      setGLAccountsMeta([]);
    }
  }

  /**
   * Get Calculated Table Height
   *
   * @param {String}
   */
  getTableHeight = () => {
    try {
      if (this.props.tableHeight) {
        return this.props.tableHeight;
      }

      const [ele] = document.getElementsByClassName('full-height-container');

      return `${ele.offsetHeight}px`;
    } catch {
      return DEFAULT_JEXCEL_CONFIGS.tableHeight;
    }
  };

  /**
   * Fill Initial Data
   */
  fillInitialData = async ({ data, metadata } = {}) => {
    if (this.spreadsheet) this.spreadsheet.destroy();

    if (!data || !metadata || metadata.length == 0) {
      ({ data = [], metadata = [] } = await this.fetchGLAccounts(
        this.fetchDimension
      ));
    }

    const columns = this.getFormattedHeaders({ metadata });

    const rows = data.map(row => {
      return metadata.map(({ name, display_name }) => {
        return getValidCellValue(display_name, row[name]);
      });
    });

    const rowsCount = rows.length || 0;
    const colsCount = ((rows && rows[0]) || []).length || 0;

    if (!rowsCount && !colsCount) {
      this.setState({ hasGLAccount: false });
      return;
    }

    const tableHeight = this.getTableHeight();
    this.setState({ tableHeight });

    const jexcelOptions = {
      ...DEFAULT_JEXCEL_CONFIGS,
      tableHeight,
      data: rows,
      columns,
      editable: this.props.type == TYPES[2] ? false : true,
      minDimensions: [colsCount, rowsCount], // Cols * Rows
      onselection: () => {},
      onpaste: () => {},
      onbeforepaste: () => false,
      onafterchanges: this.handleChanges,
    };

    this.spreadsheet = jexcel(this.glAccountsSheetRef.current, jexcelOptions);
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
      width: HIERARCHY_COL_WIDTH,
    };

    const [
      identifier,
      name,
      rollUp,
      // reverse,
      mathType,
      // positiveVariance,
    ] = GL_ACCOUNT_HEADERS;

    const getHeader = ({ display_name: title, name: colName }) => {
      switch (title) {
        case identifier.title:
          return { ...identifier, primaryKey: true };

        case name.title:
          return { ...name, width: 250 };

        case rollUp.title:
          return { ...rollUp };

        // case reverse.title:
        //   return { ...reverse };

        case mathType.title:
          return { ...mathType };

        // case positiveVariance.title:
        //   return { ...positiveVariance };

        default:
          return { title, width: 150 };
      }
    };

    const headers = metadata
      .map(col => {
        if (col.name == 'id') return null;

        const h = getHeader(col);
        if (!h) return null;

        return { ...colStr, ...getHeader(col) };
      })
      .filter(Boolean);

    return [...headers];
  };

  /**
   * Fetch URL for system dimension as per type
   */
  getURLAsPerType = type => {
    switch (type) {
      case TYPES[2]:
        return API_URLS.LIST_TIME_DIMENSION;

      default:
        return API_URLS.LIST_GL_ACCOUNT;
    }
  };

  /**
   * Fetch GL Accounts List from API
   */
  fetchGLAccounts = async callback => {
    try {
      this.setState({ showLoader: true });
      const { type = '' } = this.props;

      let url = this.getURLAsPerType(type);
      url += `?type=${type}`;

      const res = await httpGet(url);

      if (callback) {
        callback();
      }

      this.props.setGLAccounts(res.data);
      this.props.setGLAccountsMeta(res.metadata);

      this.setState({ showLoader: false });

      return res;
    } catch (e) {
      this.props.setGLAccounts([]);
      this.props.setGLAccountsMeta([]);

      this.setState({ showLoader: false });

      return {};
    }
  };

  /**
   * Fetch GL Accounts dimension
   */
  fetchDimension = async () => {
    try {
      this.setState({ showLoader: true });

      const { data = {} } = await fetchDimension(this.props.type);
      this.props.onSetDimension(data);
      this.setState({ showLoader: false });
    } catch (e) {
      this.props.setGLAccounts([]);
      this.props.setGLAccountsMeta([]);

      this.setState({ showLoader: false });
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

      const { glAccounts, glAccountsMeta } = this.props;
      const rows = [];
      let rowToUpdate = {};
      const colNames = glAccountsMeta.map(({ name }) => name);

      let cellName = '';
      let cellValue = '';

      updatedCells.forEach(cell => {
        const { x, y, newValue, oldValue } = cell;

        if (newValue == oldValue) return;

        if (!rows[y]) rows[y] = [];
        if (!rows[y][x]) rows[y][x] = [];

        rows[y][x] = cell;
      });

      rows.forEach(cols => {
        const rowIndex =
          cols && cols.length ? cols[cols.length - 1].y : undefined;

        if (rowIndex == undefined) return;

        const row = glAccounts[rowIndex];

        cols.forEach(cell => {
          const { x, newValue } = cell;
          const cellIndex = Number(x);

          cellName = colNames[cellIndex];
          cellValue = newValue;
          row[cellName] = newValue;
        });

        rowToUpdate = row;
      });

      const { display_name: cellDisplayName = '' } =
        this.props.glAccountsMeta.find(({ name }) => name == cellName) || {};

      const header = GL_ACCOUNT_HEADERS.find(
        ({ title }) => title == cellDisplayName
      );

      if (
        header &&
        header.source &&
        cellValue &&
        // Jexcel internally update the source array
        !header.source.find(({ name }) => name == cellValue)
      ) {
        this.spreadsheet.undo();
        showErrorMsg(FINANCIAL_SETUP_MSG.valid_value_for_gl_dd);
        return;
      }

      const params = {
        id: rowToUpdate.id,
        [cellName]:
          GL_ACCOUNT_HEADERS_VALUES[cellName] ==
          GL_ACCOUNT_HEADERS_VALUES.math_type
            ? // GL_ACCOUNT_HEADERS_VALUES[cellName] ==
              //   GL_ACCOUNT_HEADERS_VALUES.positive_variance ||
              // GL_ACCOUNT_HEADERS_VALUES[cellName] ==
              //   GL_ACCOUNT_HEADERS_VALUES.reverse_sign
              cellValue?.toLowerCase()
            : cellValue,
      };

      await httpPost(API_URLS.UPDATE_GL_ACCOUNT, params);
    } catch (e) {
      this.spreadsheet.undo();
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
   * Export GL Accounts
   */
  exportGLAccount = async () => {
    try {
      this.setState({ showLoader: true });
      if (this.state.showLoader) return;

      const { url } = await httpGet(API_URLS.EXPORT_GL_ACCOUNT);

      programmaticallyLoadByUrl(url, { target: '_blank' });

      this.setState({ showLoader: false });
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Go To Route
   *
   * @param {String} route
   */
  goToRoute = route => () => {
    this.props.history.push(route);
  };

  /**
   * Render View
   */
  render() {
    const { showLoader, hasGLAccount, tableHeight } = this.state;
    const { showHeaderText } = this.props;

    return (
      <>
        {showLoader && <Spinner />}

        <Box className={showHeaderText ? 'gl-header' : ''}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box>
              {showHeaderText && (
                <Box mb={1}>
                  <Typography variant="caption" color="textSecondary">
                    Setup GL Accounts
                  </Typography>
                </Box>
              )}

              <Typography variant="h2">
                {showHeaderText && 'Your GL Accounts Table'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {hasGLAccount && (
          <Box className={tableHeight ? '' : 'full-height-container'}>
            <Box
              className="import-selected-table import-gl-accounts-sheet"
              style={{ height: tableHeight }}
            >
              <div ref={this.glAccountsSheetRef} />
            </Box>
          </Box>
        )}

        {!hasGLAccount && (
          <Box textAlign="center" py={5}>
            <Typography>
              Please add GL Account data in&nbsp;
              <Link
                className="cursor-pointer"
                onClick={this.goToRoute(APP_ROUTES.FINANCIAL_ENV_SETUP)}
              >
                Financial Environment Setup.
              </Link>
            </Typography>
          </Box>
        )}
      </>
    );
  }
}

ViewSystemDimension.propTypes = {
  glAccounts: arrayOf(shape({})),
  glAccountsMeta: arrayOf(shape({})),
  onSetDimension: func.isRequired,
  setGLAccounts: func.isRequired,
  setGLAccountsMeta: func.isRequired,
  showHeaderText: bool,
  tableHeight: string,
  type: string,
};

ViewSystemDimension.defaultProps = {
  tableHeight: '',
  type: '',
  showHeaderText: true,
  onSetDimension: () => {},
};

const mapStateToProps = createStructuredSelector({
  glAccounts: getGLAccounts(),
  glAccountsMeta: getGLAccountsMeta(),
});

export default connect(mapStateToProps, {
  setGLAccounts,
  setGLAccountsMeta,
})(withRouter(ViewSystemDimension));
