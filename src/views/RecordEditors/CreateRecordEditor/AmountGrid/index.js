import React from 'react';
import { bool, func, number, shape, arrayOf, string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { get, range } from 'lodash';

import ReactDataSheet from 'react-datasheet';
import { Box, IconButton } from '@material-ui/core';
import { Cancel as CancelIcon } from '@material-ui/icons';

import SheetRenderer from './SheetRenderer';
import CellRenderer from './CellRenderer';

import { getUserProfile } from '../../../../reducers/UserProfile/selectors';

import { getGridHeaders, prepareInitialData } from './configs';
import { COLUMN_DATA_TYPES_KEYS } from '../../../../configs/app';
import getFormattedNumber from '../../../../utils/helper/getFormattedNumber';
import { getValueAsPerType } from '../../../SourceTables/ProcessImportedTable/helper';
import { getGridDensity } from '../../../../utils/localStorage';

import { getFiscalTotal } from '../UpdateRecord/helper';
import { DEFAULT_DECIMAL_PLACE_VALUE } from '../configs';

import './styles.scss';
import { updateOriginalDataWithFilteredData } from '../ChartsView/helper';

class AmountGrid extends React.Component {
  /**
   * State
   */
  state = {
    headers: [],
    data: [],
    selected: {},
    filterData: [],
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    if (this.props.headers) return;

    const fiscalMonth = get(
      this.props.userProfile,
      'actual_sce_meta.fiscal_year_beginning'
    );

    const headers = getGridHeaders(fiscalMonth);

    const data = prepareInitialData(headers);

    this.setState({ headers, data });
  }

  componentDidUpdate({ yearsShown: previousYear, data: previousData }) {
    const { yearsShown, data } = this.props;

    if (yearsShown !== previousYear || data !== previousData) {
      const filterData = data.filter((innerArr = []) => {
        const [firstChildItem = {}] = innerArr;
        const { value = '' } = firstChildItem;

        return yearsShown.includes(value.toString()) ? innerArr : null;
      });

      this.setState({ filterData });
    }
  }

  /**
   * Render Sheet
   */
  sheetRenderer = props => {
    const { index, data, headers, yearsShown, updateState } = this.props;

    const { headers: localheaders, data: localData } = this.state;

    const tableHeight = (data || localData).length * 32 + 5 || 40;

    return (
      <SheetRenderer
        {...props}
        updateState={updateState}
        yearsShown={yearsShown}
        index={index}
        columns={headers || localheaders}
        tableHeight={tableHeight}
        data={data}
      />
    );
  };

  /**
   * Render Row
   */
  rowRenderer = props => (
    <div className="data-row flex-fill" key={props.row}>
      {props.children}
    </div>
  );

  /**
   * Render Cell
   */
  cellRenderer = props => {
    const { headers } = this.props;

    const { headers: localheaders } = this.state;
    return (
      <CellRenderer
        {...props}
        onChange={this.handleTypeInCell}
        columns={headers || localheaders}
      />
    );
  };

  /**
   * Handle > On Type in Cell
   *
   * @param {Object} evt
   */
  handleTypeInCell = evt => {
    const { updateState, hasUnsavedChanges } = this.props;

    if (hasUnsavedChanges) return;

    updateState({ hasUnsavedChanges: true });
  };

  /**
   * Handle paste of cells
   *
   * @param {String} pastedText
   * @returns {Array}
   */
  handlePasteCells = pastedText => {
    const cells = pastedText.split(/\r\n|\n|\r/).map(row => row.split('\t'));

    const { start, end } = this.state.selected || {};
    const selectedNumberOfRows = Math.abs(end.i - start.i) + 1;
    const selectedNumberOfCols = Math.abs(end.j - start.j) + 1;

    if (cells.length === 0) return [];

    const rows = Math.max(selectedNumberOfRows, cells.length);
    const cols = Math.max(selectedNumberOfCols, cells[0].length);

    return range(rows).map(row => {
      return range(cols).map(col => {
        const value = cells[row % cells.length][col % cells[0].length];

        return value;
      });
    });
  };

  /**
   * Handle Changed Values of Cells
   *
   * @param {Array} updatedCells
   * @param {Array} newCells
   */
  handleCellsChanged = (updatedCells = [], newCells = []) => {
    const { updateState, data, scenarioMeta } = this.props;
    const { filterData } = this.state;
    const operator = get(scenarioMeta, 'operator');

    const allCells = [...updatedCells];
    const dataType = COLUMN_DATA_TYPES_KEYS.amount;

    // Update Cols
    allCells.forEach(({ row, col, value }, index) => {
      const validValue = Number(getValueAsPerType({ value, dataType })) || '';

      filterData[row][col] = {
        ...filterData[row][col],
        value: value == 0 ? value : validValue,
        realValue: value,
        isUpdated: true,
      };

      // Update fiscal year
      const cells = (filterData[row] || [])
        .filter(
          (value, index) =>
            index > 0 && index != filterData[row].length - 1 && value
        )
        .map(value => value.value || '');

      filterData[row][filterData[row].length - 1] = {
        ...filterData[row][filterData[row].length - 1],
        value: getFiscalTotal(cells, operator),
      };
    });

    const newData = updateOriginalDataWithFilteredData(data, filterData);

    updateState({ data: [...newData], isTableChanges: true });
  };

  /**
   * Render Value in Cell
   *
   * @param {Object} cell
   * @param {Number} rowIndex
   * @param {Number} colIndex
   *
   * @return {String|Number}
   */
  valueRenderer = (cell, rowIndex, colIndex) => {
    if (colIndex == 0) return cell.value;

    // Rounding decimal value
    const decimalValue = {};
    if (Number(DEFAULT_DECIMAL_PLACE_VALUE) > -1) {
      decimalValue.isMaxChars = true;
      decimalValue.maxChars = Number(DEFAULT_DECIMAL_PLACE_VALUE);
      decimalValue.fixedDecimal = true;
    }

    return getFormattedNumber(cell.value, decimalValue);
  };

  /**
   * Render View
   */
  render() {
    const { isRemoveGrid, onRemoveGrid } = this.props;

    const { data: localData, filterData } = this.state;
    const activeDensity = `record-editor-${getGridDensity()?.toLowerCase()}`;

    return (
      <Box className="record-editor-amount-grid">
        <Box
          mt={3}
          mb={1}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* <Typography variant="body1" color="textSecondary">
            {amountColumn.display_name}
          </Typography>

          {scenarioMeta.forecast_start_date && (
            <Typography variant="caption" color="textSecondary">
              Forecast Start Date: {scenarioMeta.forecast_start_date}
            </Typography>
          )} */}
        </Box>

        <Box className={`amt-record-field ${activeDensity}`}>
          {isRemoveGrid && (
            <IconButton
              aria-label="delete"
              className="field-delete-btn"
              size="small"
              color="primary"
              onClick={onRemoveGrid}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          )}

          <ReactDataSheet
            data={filterData || localData}
            sheetRenderer={this.sheetRenderer}
            rowRenderer={this.rowRenderer}
            cellRenderer={this.cellRenderer}
            valueRenderer={this.valueRenderer}
            onSelect={selected => this.setState({ selected })}
            dataRenderer={cell => cell.value}
            onCellsChanged={this.handleCellsChanged}
            parsePaste={this.handlePasteCells}
          />
        </Box>
      </Box>
    );
  }
}

AmountGrid.propTypes = {
  amountColumn: shape({}),

  data: arrayOf(arrayOf(shape({}))),
  hasUnsavedChanges: bool,
  headers: arrayOf(shape({})),
  index: number,
  isRemoveGrid: bool,
  onRemoveGrid: func,
  scenarioMeta: shape({}),
  updateState: func,
  userProfile: shape({}),
  yearsShown: arrayOf(string),
};

AmountGrid.defaultProps = {
  hasUnsavedChanges: true,
  index: 0,
  isRemoveGrid: false,
  onRemoveGrid: () => {},
  updateState: () => {},
  scenarioMeta: {},
  yearsShown: [],
};

const mapStateToProps = createStructuredSelector({
  userProfile: getUserProfile(),
});

export default connect(mapStateToProps, {})(AmountGrid);
