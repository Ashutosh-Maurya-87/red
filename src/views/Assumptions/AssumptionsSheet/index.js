import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { arrayOf, func, shape } from 'prop-types';
import { Box, Button, Popover, TextField, Typography } from '@material-ui/core';

import AssumptionsSheetBase from './base';
import VirtualizedDataSheet from '../../../components/VirtualizedDataSheet';
import InlineRenaming from '../../../components/InlineRenaming';

import RowContextMenu from './RowContextMenu';
import ColumnContextMenu from './ColumnContextMenu';

import {
  setAssumption,
  setGridData,
  setGridHeaders,
} from '../../../reducers/Assumptions/actions';

import {
  getAssumption,
  getGridData,
  getGridHeaders,
} from '../../../reducers/Assumptions/selectors';

import { httpPost } from '../../../utils/http';
import { showErrorMsg, showSuccessMsg } from '../../../utils/notifications';
import { validateName } from '../../../utils/helper/validateName';

import { MAX_ASSUMPTION_NAME } from '../configs';
import { ASSUMPTIONS_API } from '../../../configs/api';
import { ASSUMPTIONS_MSG, ERROR_MESSAGES } from '../../../configs/messages';
import {
  FIXED_COLUMNS,
  FIXED_ROWS,
  ROW_CONTEXT_MENU_ACTIONS_KEYS,
  ROW_HEIGHT,
  COL_CONTEXT_MENU_ACTIONS_KEYS,
} from './configs';

import { DEFAULT_COL_HEADER, makeCopy } from './helper';

import './styles.scss';

class AssumptionsSheet extends AssumptionsSheetBase {
  /**
   * Index of Active Row
   */
  activeRowIndex = -1;

  /**
   * Index of Active Column
   */
  activeColIndex = -1;

  /**
   * State
   */
  state = {
    selected: {},
    rowContextEle: null,
    colContextEle: null,

    tableWidth: 0,
    tableHeight: 0,
    tableMaxHeight: 0,

    isRenaming: false,
    showLoader: false,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('resize', this.updateHeightWidth);

    this.updateHeightWidth();
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateHeightWidth);
  }

  /**
   * Start Renaming Assumption
   */
  startRenaming = () => {
    this.setState({ isRenaming: true });
  };

  /**
   * Handle updated name of Assumption
   *
   * @param {String} newName
   */
  handleUpdateName = async newName => {
    try {
      const { assumption, setAssumption } = this.props;
      const { showLoader } = this.state;

      if (showLoader) return;

      const isValidName = validateName(newName);
      this.setState({ showLoader: true });

      if (!isValidName) {
        showErrorMsg(
          !newName ? ERROR_MESSAGES.required : ERROR_MESSAGES.invalid_name
        );
        this.setState({ isRenaming: true, showLoader: false });

        return;
      }

      if (assumption.name == newName) {
        this.setState({ isRenaming: false, showLoader: false });

        return;
      }

      const url = ASSUMPTIONS_API.RENAME_ASSUMPTION.replace(
        '#ID#',
        assumption.id
      );

      const params = {
        name: newName,
      };

      await httpPost(url, params);

      assumption.name = newName;
      setAssumption(assumption);
      showSuccessMsg(ASSUMPTIONS_MSG.assumption_renamed);

      this.setState({ showLoader: false, isRenaming: false });
    } catch (error) {
      this.setState({ showLoader: false });
    }
  };

  /**
   *	Handle Selected option of Context Menu of Row
   *
   * @param {String} action
   */
  handleRowContextMenuAction = action => () => {
    this.setState({ rowContextEle: null });

    switch (action) {
      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertAbove:
        this.insertRowAbove();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.insertBelow:
        this.insertRowBelow();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.duplicate:
        this.duplicateRow();
        break;

      case ROW_CONTEXT_MENU_ACTIONS_KEYS.delete:
        this.deleteRow();
        break;

      default:
        break;
    }
  };

  /**
   * Insert Row Above
   */
  insertRowAbove = () => {
    const { data, setGridData } = this.props;

    data.splice(this.activeRowIndex, 0, this.getEmptyGridRow());

    setGridData(data);
    this.updateHeightWidth();
  };

  /**
   * Insert Row Below
   */
  insertRowBelow = () => {
    const { data, setGridData } = this.props;

    data.splice(this.activeRowIndex + 1, 0, this.getEmptyGridRow());

    setGridData(data);
    this.updateHeightWidth();
  };

  /**
   * Duplicate Row
   */
  duplicateRow = () => {
    const { data, setGridData } = this.props;

    const rowData = makeCopy(data[this.activeRowIndex]);

    data.splice(this.activeRowIndex + 1, 0, rowData);

    setGridData(data);
    this.updateHeightWidth();
  };

  /**
   * Delete Row
   */
  deleteRow = () => {
    const { data, setGridData } = this.props;

    data.splice(this.activeRowIndex, 1);

    setGridData(data);
    this.updateHeightWidth();
  };

  /**
   *	Handle Selected option of Context Menu of Columns
   *
   * @param {String} action
   */
  handleColContextMenuAction = action => () => {
    this.setState({ colContextEle: null });

    switch (action) {
      case COL_CONTEXT_MENU_ACTIONS_KEYS.insertAfter:
        this.insertColumnAfter();
        break;

      case COL_CONTEXT_MENU_ACTIONS_KEYS.insertBefore:
        this.insertColumnBefore();
        break;

      case COL_CONTEXT_MENU_ACTIONS_KEYS.duplicate:
        this.duplicateColumn();
        break;

      case COL_CONTEXT_MENU_ACTIONS_KEYS.delete:
        this.deleteColumn();
        break;

      default:
        break;
    }
  };

  /**
   * Add New Entity
   */
  addNewEntity = () => {
    this.activeColIndex = this.props.headers.length - 1;

    this.insertColumnAfter();
  };

  /**
   * Insert Column After
   */
  insertColumnAfter = () => {
    const { headers, data, setGridHeaders, setGridData } = this.props;

    let defaultHeaderAtZero = makeCopy(DEFAULT_COL_HEADER[0]);
    defaultHeaderAtZero = {
      ...defaultHeaderAtZero,
      label: `${defaultHeaderAtZero.label} ${(headers.length - 2) / 2 + 1}`,
    };

    headers.splice(this.activeColIndex + 1, 0, defaultHeaderAtZero);
    headers.splice(this.activeColIndex + 2, 0, makeCopy(DEFAULT_COL_HEADER[1]));

    const rowsCount = data.length;

    for (let i = 0; i < rowsCount; i++) {
      data[i].splice(this.activeColIndex + 1, 0, {});
      data[i].splice(this.activeColIndex + 2, 0, {});
    }

    setGridHeaders(headers);
    setGridData(data);
  };

  /**
   * Insert Column Before
   */
  insertColumnBefore = () => {
    const { headers, data, setGridHeaders, setGridData } = this.props;

    headers.splice(this.activeColIndex - 1, 0, makeCopy(DEFAULT_COL_HEADER[0]));
    headers.splice(this.activeColIndex, 0, makeCopy(DEFAULT_COL_HEADER[1]));

    const rowsCount = data.length;

    for (let i = 0; i < rowsCount; i++) {
      data[i].splice(this.activeColIndex - 1, 0, {});
      data[i].splice(this.activeColIndex, 0, {});
    }

    setGridHeaders(headers);
    setGridData(data);
  };

  /**
   * Duplicate Column
   */
  duplicateColumn = () => {
    const { headers, data, setGridHeaders, setGridData } = this.props;

    const header = makeCopy(headers[this.activeColIndex - 1]);

    headers.splice(this.activeColIndex + 1, 0, header);
    headers.splice(this.activeColIndex + 2, 0, makeCopy(DEFAULT_COL_HEADER[1]));

    const rowsCount = data.length;

    for (let i = 0; i < rowsCount; i++) {
      const labelCell = makeCopy(data[i][this.activeColIndex - 1]);
      const valueCell = makeCopy(data[i][this.activeColIndex]);

      data[i].splice(this.activeColIndex + 1, 0, { ...labelCell });
      data[i].splice(this.activeColIndex + 2, 0, { ...valueCell });
    }

    setGridHeaders(headers);
    setGridData(data);
  };

  /**
   * Delete Column
   */
  deleteColumn = () => {
    const { headers, data, setGridHeaders, setGridData } = this.props;

    headers.splice(this.activeColIndex, 1);
    headers.splice(this.activeColIndex - 1, 1);

    const rowsCount = data.length;

    for (let i = 0; i < rowsCount; i++) {
      data[i].splice(this.activeColIndex, 1);
      data[i].splice(this.activeColIndex - 1, 1);
    }

    setGridHeaders(headers);
    setGridData(data);
  };

  /**
   * Toggle Row Context Menu Visibility
   *
   * @param {Object} evt
   */
  toggleRowContextMenu = props => evt => {
    evt.stopPropagation();

    if (props) this.activeRowIndex = props.row;

    if (!this.state.rowContextEle && evt.currentTarget) {
      this.setState({ rowContextEle: evt.currentTarget });

      return;
    }

    this.setState({ rowContextEle: null });
  };

  /**
   * Toggle Column Context Menu Visibility
   *
   * @param {Object} evt
   */
  toggleColContextMenu = props => evt => {
    evt.stopPropagation();

    if (props) this.activeColIndex = props.col;

    if (!this.state.colContextEle && evt.currentTarget) {
      this.setState({ colContextEle: evt.currentTarget });

      return;
    }

    this.setState({ colContextEle: null });
  };

  /**
   * Render View
   */
  render() {
    const {
      assumption: { name = '' } = {},
      headers,
      data,
      onSave,
      onCancel,
      setGridHeaders,
      setGridData,
    } = this.props;

    const {
      selected,
      rowContextEle,
      colContextEle,
      tableWidth,
      tableHeight,
      tableMaxHeight,
      isRenaming,
      showLoader,
    } = this.state;

    return (
      <Box display="flex" flexDirection="column">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            <InlineRenaming
              name={name}
              isEditingEnable={isRenaming}
              onRename={this.handleUpdateName}
              isLoading={showLoader}
              onTitleClick={this.startRenaming}
              max={MAX_ASSUMPTION_NAME}
              fontSize={20}
              required
            />
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="flex-end">
            <Box mr={2} display="inline">
              <Button variant="outlined" color="primary" onClick={onCancel}>
                Exit
              </Button>
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={onSave}
              disabled={isRenaming}
            >
              Save
            </Button>
          </Box>
        </Box>

        {false && (
          <Box my={3}>
            <TextField
              id="outlined-size-small"
              variant="outlined"
              size="small"
              fullWidth
            />
          </Box>
        )}

        <Box display="flex" justifyContent="flex-end" pt={2}>
          <Button size="small" color="primary" onClick={this.addNewEntity}>
            + Add New Entity
          </Button>
        </Box>

        <Box py={1} className="assumptions-grid" height={tableMaxHeight}>
          <VirtualizedDataSheet
            data={data}
            headers={headers}
            rowHeight={ROW_HEIGHT}
            sheetRenderer={this.sheetRenderer}
            rowRenderer={this.rowRenderer}
            cellRenderer={this.cellRenderer}
            headerRenderer={this.headerRenderer}
            valueRenderer={this.valueRenderer}
            dataRenderer={this.dataRenderer}
            onCellsChanged={this.handleCellsChanged}
            tableHeight={tableHeight}
            tableWidth={tableWidth}
            selected={selected}
            onSelect={this.onSelectCells}
            fixedColumnsCustom={FIXED_COLUMNS}
            fixedRowsCustom={FIXED_ROWS}
            getHeaderHeight={this.getHeaderHeight}
          />
        </Box>

        <Popover
          open={Boolean(rowContextEle)}
          anchorEl={rowContextEle}
          onClose={this.toggleRowContextMenu()}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            style: { width: '220px' },
          }}
        >
          <RowContextMenu
            state={this.state}
            handleRowContextMenuAction={this.handleRowContextMenuAction}
            rowsCount={data.length}
          />
        </Popover>

        <Popover
          open={Boolean(colContextEle)}
          anchorEl={colContextEle}
          onClose={this.toggleColContextMenu()}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            style: { width: '220px' },
          }}
        >
          <ColumnContextMenu
            state={this.state}
            handleColContextMenuAction={this.handleColContextMenuAction}
            headers={headers}
            colsCount={headers.length}
            activeColIndex={this.activeColIndex}
            setGridHeaders={setGridHeaders}
            setGridData={setGridData}
            data={data}
          />
        </Popover>
      </Box>
    );
  }
}

AssumptionsSheet.propTypes = {
  assumption: shape({}),
  data: arrayOf(arrayOf(shape({}))),
  headers: arrayOf(shape({})),
  onCancel: func.isRequired,
  onSave: func.isRequired,
  setAssumption: func.isRequired,
};

AssumptionsSheet.defaultProps = {
  data: [],
  headers: [],
  assumption: {},
};

const mapStateToProps = createStructuredSelector({
  assumption: getAssumption(),
  headers: getGridHeaders(),
  data: getGridData(),
});

export default connect(mapStateToProps, {
  setAssumption,
  setGridData,
  setGridHeaders,
})(AssumptionsSheet);
