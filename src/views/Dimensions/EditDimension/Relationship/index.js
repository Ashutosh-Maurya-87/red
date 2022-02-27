import React from 'react';
import { any, shape } from 'prop-types';
import { withStyles, Box, TextField } from '@material-ui/core';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';

import RelationshipMap from '../../../ProcessBuilder/CreateProcess/StepCard/RelationshipMap';
import ListboxComponent from '../../../../components/CustomListBox';
import Spinner from '../../../../components/Spinner';

import {
  AI_MODULES_DISPLAY_NAME,
  COLUMN_DATA_TYPES_KEYS,
} from '../../../../configs/app';
import { API_URLS } from '../../../../configs/api';
import { DIMENSIONS_MSG } from '../../../../configs/messages';

import { httpGet, httpPost } from '../../../../utils/http';
import { showErrorMsg, showSuccessMsg } from '../../../../utils/notifications';
import { getColumnsOfSourceTable } from '../../../ProcessBuilder/CreateProcess/helper';
import { getEndTableId, getParamsToSaveRelation } from './helper';

import { styles } from './styles';

const filter = createFilterOptions();

const PAGINATION = {
  total: 0,
  limit: 100,
  page: 1,
};

const RELATION_DATA_STR = {
  colsToCompare: {},
  targetTable: {},
  relatedTables: [],
};

class DimensionRelationship extends React.Component {
  isRalationSave = false;

  /**
   * State
   */
  state = {
    selectedTable: {},
    dimension: {},
    actualTable: {},
    glAccount: {},

    dimensionsList: [],
    pagination: { ...PAGINATION },

    relationData: { ...RELATION_DATA_STR },
    relationsArray: [],

    showLoader: false,
    isFetchingDimensionCols: false,
  };

  /**
   * Component Did Mount
   */
  componentDidMount() {
    this.fillInitialData();
  }

  /**
   * Fill Initial Data
   */
  fillInitialData = async () => {
    const { table } = this.props;

    await this.fetchRelationData();

    // Load Current Dimension Data|Columns
    const { isLoaded, table: dimension } = await this.fetchDimensionColumns(
      table
    );
    this.setState({ dimension });

    // Fetch Dimensions List with Actual Table
    if (isLoaded) this.loadDimensionsList({ callback: this.fillRelationData });
  };

  /**
   * Fetch Relation Data of Dimension
   */
  fetchRelationData = async () => {
    try {
      this.setState({ showLoader: true });

      const { table } = this.props;

      let url = API_URLS.GET_DIMENSION_RELATION_BY_ID;
      url = url.replace('#ID#', table.id);

      let { data = [] } = await httpGet(url);
      if (!Array.isArray(data)) data = [];

      this.setState({ showLoader: false, relationsArray: data });

      return true;
    } catch (err) {
      this.setState({ showLoader: false });
      return false;
    }
  };

  /**
   * Fill Relation Data
   */
  fillRelationData = async () => {
    const { actualTable, dimension, relationsArray } = this.state;

    const colsToCompare = {
      data: [],
      relation: 'AND',
    };

    const [firstRelation = {}] = relationsArray;

    // ID of related table
    const tableId = firstRelation.end_point_id || '';

    // Ref type of related table
    let type = 'actual';
    if (firstRelation.end_point_ref_type == 'dimension') {
      type = 'custom';
    }

    let selectedTable = {};
    if (tableId && type != 'actual') {
      const dimenionInfo = await this.fetchDimension(tableId);

      if (dimenionInfo) {
        ({ table: selectedTable = {} } = await this.fetchDimensionColumns(
          dimenionInfo
        ));
      }
    } else {
      selectedTable = actualTable;
    }

    const endTableId = getEndTableId(selectedTable);

    relationsArray.forEach(relationObj => {
      const {
        start_point_col_id,
        end_point_col_id,
        end_point_id,
      } = relationObj;

      const startFieldData =
        (dimension.columns || []).find(({ id }) => id == start_point_col_id) ||
        {};

      const endFieldData =
        (selectedTable.columns || []).find(
          ({ id }) => id == end_point_col_id && endTableId == end_point_id
        ) || {};

      const compareField = {
        ...endFieldData,
      };

      const colToCompare = {
        ...startFieldData,
        compareField,
      };

      colsToCompare.data.push(colToCompare);
    });

    const relationData = {
      ...RELATION_DATA_STR,
      targetTable: dimension,
      relatedTables: [selectedTable],
      colsToCompare,
      isChangeTable: true,
    };

    this.isRalationSave = true;
    this.setState({ relationData, selectedTable }, () =>
      this.changeIsRelationSave(false)
    );
  };

  /**
   * Update Is relation save
   *
   * @param {Boolean} value
   */
  changeIsRelationSave = value => {
    setTimeout(() => {
      this.isRalationSave = value;
    }, 500);
  };

  /**
   * Fetch Dimension Details
   *
   * @param {String} id
   *
   * @return {Object}
   */
  fetchDimension = async id => {
    try {
      const url = API_URLS.GET_DIMENSION_BY_ID.replace('#ID#', id);
      const { data } = await httpGet(url, { hideError: true });

      if (data && !data.display_name) {
        data.display_name = data.name;
      }

      return data;
    } catch (err) {
      return null;
    }
  };

  /**
   * Update Relation Data
   *
   * @param {Object} relationData
   */
  updateRelationData = relationData => {
    if (this.isRalationSave) return;

    this.setState({ relationData }, () => {
      setTimeout(() => {
        this.saveRelationship();
      }, 100);
    });
  };

  /**
   * Format Table Columns
   *
   * @param {Object}
   *
   * @return {Array}
   */
  formatColumns = ({ columns = [], table = {} } = {}) => {
    const validColumns = columns.map(col => ({
      ...col,
      id: String(col.id),
      data_type: col.data_type || COLUMN_DATA_TYPES_KEYS.alphanumeric,
      tableName: table.name,
      tableDisplayName: table.display_name,
    }));

    return validColumns;
  };

  /**
   * Fetch Dimension COlumns from API
   */
  fetchDimensionColumns = async table => {
    try {
      this.setState({ isFetchingDimensionCols: true });

      let url = API_URLS.GET_COLUMNS_OF_DIMENSION;
      url = url.replace('#TYPE#', table.type || 'custom');
      url = url.replace('#ID#', table.id);

      const { data: columns = [] } = await httpGet(url);
      const validColumns = this.formatColumns({ columns, table });

      this.setState({ isFetchingDimensionCols: false });

      return {
        table: { ...table, columns: validColumns },
        isLoaded: true,
      };
    } catch (e) {
      this.setState({ isFetchingDimensionCols: false });

      return { table: { columns: [] }, isLoaded: false };
    }
  };

  /**
   * Fetch List of Dimensions from API
   */
  loadDimensionsList = async ({ callback } = {}) => {
    try {
      const { search, showLoader, pagination, dimensionsList } = this.state;
      const { limit, page } = pagination;

      if (showLoader) return;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_DIMENSION_LIST;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&sort=name`;
      url += `&order=asc`;

      if (search) url += `&search=${search}`;

      const {
        dimensions_table_info: { data = [], pagination: { count = 1 } = {} },
        gl_account: glAccount = [],
        actual_scnearios,
      } = await httpGet(url);

      const list = page == 1 ? data : [...dimensionsList, ...data];

      let actualTable = {};
      if (actual_scnearios && actual_scnearios.source_id) {
        const { tableData, columns } = await getColumnsOfSourceTable(
          actual_scnearios.source_id
        );

        actualTable = {
          ...tableData,
          columns,
          type: 'actual',
          actual_scenario_id: actual_scnearios.id || '',
        };
      }

      this.setState(
        {
          showLoader: false,
          dimensionsList: list,
          glAccount: glAccount[0] || {},
          actualTable,
          pagination: {
            ...pagination,
            total: count,
          },
        },
        () => callback && callback()
      );
    } catch (e) {
      const { pagination } = this.state;

      this.setState({
        showLoader: false,
        pagination: {
          ...pagination,
          page: pagination.page == 1 ? 1 : pagination.page - 1,
        },
      });
    }
  };

  /**
   * Load more Dimensions List
   */
  loadMoreDimensionsList = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.loadDimensionsList
    );
  };

  /**
   * Get Options List of Dimensions for AUto Complete
   */
  getDimensionsListOptions = () => {
    const { actualTable, dimensionsList } = this.state;

    const tables = [...dimensionsList];

    if (Object.keys(actualTable).length > 0) {
      tables.unshift(actualTable);
    }

    return tables
      .map(opt => {
        if (opt.id == this.props.table.id) return null;

        return {
          label: opt.display_name,
          option: opt,
        };
      })
      .filter(Boolean);
  };

  /**
   * On Change Selected Table
   *
   * @param {Object} evt
   * @param {Object|Null} opt
   */
  onChangeSelectedTable = async (evt, opt) => {
    const { option: table = {} } = opt || {};

    const { relationData } = this.state;

    if (!table.id) {
      this.setState({
        selectedTable: {},
        relationData: {
          ...relationData,
          isChangeTable: true,
          colsToCompare: {},
          relatedTables: [],
        },
      });
      return;
    }

    let selectedTable = {};

    if (table.type == 'actual') {
      const { tableData, columns } = await getColumnsOfSourceTable(table.id);
      selectedTable = {
        ...table,
        ...tableData,
        columns,
      };
    } else {
      ({ table: selectedTable = {} } = await this.fetchDimensionColumns(table));
    }

    this.isRalationSave = true;
    this.setState(
      {
        selectedTable,
        relationData: {
          ...relationData,
          isChangeTable: true,
          colsToCompare: {},
          relatedTables: [selectedTable],
        },
      },
      () => this.changeIsRelationSave(false)
    );
  };

  /**
   * Save Relationship Data
   */
  saveRelationship = async () => {
    try {
      const { showLoader, selectedTable } = this.state;

      // const hasRelations = get(relationData, 'colsToCompare.data.length') > 0;

      if (!selectedTable.id) {
        showErrorMsg(DIMENSIONS_MSG.relationship_required);
        return;
      }

      if (showLoader) return;
      this.setState({ showLoader: true });

      const params = getParamsToSaveRelation(this.state);

      const { data = {} } = await httpPost(
        API_URLS.SAVE_DIMENSION_RELATION,
        params
      );

      this.setState({
        showLoader: false,
        relationsArray: data,
      });

      showSuccessMsg(DIMENSIONS_MSG.relationship_saved);
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const { classes, tableHeight } = this.props;

    const {
      showLoader,
      relationData,
      selectedTable,
      isFetchingDimensionCols,
    } = this.state;

    return (
      <Box>
        {(showLoader || isFetchingDimensionCols) && <Spinner />}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
        >
          <Autocomplete
            label={`Select Actual Table or ${AI_MODULES_DISPLAY_NAME.dimension}`}
            id="dimenion-select"
            style={{ width: 300 }}
            value={{ label: selectedTable.display_name }}
            selectOnFocus
            clearOnBlur
            freeSolo
            disableClearable
            handleHomeEndKeys
            ListboxComponent={ListboxComponent}
            className={`small-select ${classes.formControl}`}
            options={this.getDimensionsListOptions()}
            renderOption={option => option.label}
            getOptionDisabled={({ disabled }) => Boolean(disabled)}
            onChange={this.onChangeSelectedTable}
            getOptionLabel={({ label = '' }) => label}
            renderInput={params => (
              <TextField
                {...params}
                label={`Select Actual Table or ${AI_MODULES_DISPLAY_NAME.dimension}`}
                variant="outlined"
              />
            )}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              return filtered;
            }}
          />

          {/* <Button
            variant="contained"
            color="primary"
            onClick={this.saveRelationship}
          >
            Save
          </Button> */}
        </Box>

        <Box mt={2} textAlign="center" fontSize="24px">
          <RelationshipMap
            setStepData={this.updateRelationData}
            step={relationData}
            stepNumber={0}
            fromProcess={false}
            showDelete
            uniqueRelation
            height={tableHeight}
            relatedTablesKey="relatedTables"
          />
        </Box>
      </Box>
    );
  }
}

DimensionRelationship.propTypes = {
  table: shape({}),
  tableHeight: any,
};

export default withStyles(styles)(DimensionRelationship);
