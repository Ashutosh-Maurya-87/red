import React from 'react';
import { withRouter, Prompt } from 'react-router-dom';
import { func, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { get } from 'lodash';

import { Box, withStyles } from '@material-ui/core';
import { DragDropContext } from 'react-beautiful-dnd';

import { API_URLS } from '../../../configs/api';
import { httpGet, httpPost } from '../../../utils/http';

import { setSelectedTable } from '../../../reducers/RecordEditor/actions';
import { getSelectedTable } from '../../../reducers/RecordEditor/selectors';

import AppHeader from '../../../components/AppHeader';
import Spinner from '../../../components/Spinner';
import UnsavedChangesDialog from '../../../components/UnsavedChangesDialog';
import UnsavedChangesBase from '../../../components/UnsavedChangesDialog/base';
import ConfirmationModal from '../../../components/ConfirmationModal';

import EditRecordEditorNameHeader from './EditRecordEditorNameHeader';
import HeaderActions from './HeaderActions';
import TablesAndColsList from './TablesAndColsList';
import CreateStructure from './CreateStructure';
import UpdateRecord from './UpdateRecord';
import SelectFieldDialog from './SelectFieldDialog';
import SideBar from './ChartsView/SideBar/SideBar';

import { APP_ROUTES } from '../../../configs/routes';
import {
  COLUMN_DATA_TYPES_KEYS,
  COLUMN_DATA_TYPES_OBJ,
} from '../../../configs/app';
import { DEFAULT_DENSITY } from '../../../configs/density';
import { FIELD_DEFAULT_WIDTH, MAX_RE_NAME } from './configs';
import { RECORD_EDITOR_MSG } from '../../../configs/messages';

import { showErrorMsg, showSuccessMsg } from '../../../utils/notifications';
import { getParamsToSaveStrucure } from './helper';

import { styles } from './styles';
import './styles.scss';

class CreateRecordEditor extends UnsavedChangesBase {
  /**
   * State
   */
  state = {
    id: '',
    name: 'New Record Editor',
    builderWidth: 0,
    builderHeight: 0,

    tables: [],
    selectedFields: [],
    amountColumns: [],
    dateColumns: [],
    isLoading: false,
    selectedChart: '1',
    showDataPoints: true,
    showDataLabels: false,

    isSubmit: true,
    showLoader: false,
    isUpdateRecordMode: false,
    isUnsavedStructure: false,
    isVisibleUnsavedChanges: false,
    discardAction: null,
    askCreateGridModalCallback: null,

    draggedField: null,
    selectFieldType: '',
    fieldsToSelect: [],
    density: DEFAULT_DENSITY,

    firstAmountCol: null,
    firstDateCol: null,

    isBlockDone: false,
  };

  /**
   * Update Record Component Reference
   */
  updateRecordRef = React.createRef();

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { selectedTable, history, match } = this.props;
    const id = get(match, 'params.id');

    if (!id && !selectedTable.id) {
      history.push(APP_ROUTES.RECORD_EDITORS);
      return;
    }

    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();

    this.subscribeConfirmLeavePage();

    if (!id) {
      this.fillInitialData();
      this.fetchTablesAndCols();
      return;
    }

    this.setState({ id, isLoading: true }, this.loadRecordEditor);
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    this.props.setSelectedTable({});

    window.removeEventListener('resize', this.handleWindowResize);
    this.unsubscribeConfirmLeavePage();
  }

  /**
   * Verify > Has Unsaved Changes
   *
   * @return {Boolean}
   */
  hasUnsavedChanges = () => {
    const { isUpdateRecordMode, isUnsavedStructure } = this.state;

    if (!isUpdateRecordMode && isUnsavedStructure) return true;

    const { current } = this.updateRecordRef;
    if (
      isUpdateRecordMode &&
      current &&
      current.state &&
      current.state.hasUnsavedChanges
    ) {
      return true;
    }

    return false;
  };

  /**
   * Handle Window Resize
   */
  handleWindowResize = () => {
    const ele = document.getElementById('record-editor-builder');

    const builderWidth = (ele.offsetWidth || 0) - 48; // Reduce Padding 48
    const builderHeight = window.innerHeight - 140;

    this.setState({ builderWidth, builderHeight });
  };

  /**
   * Fetch Tables with columns
   */
  fetchTablesAndCols = async () => {
    try {
      const { selectedFields, amountColumns, dateColumns } = this.state;

      let firstAmountCol = null;
      let firstDateCol = null;

      this.setState({ showLoader: true });

      const {
        selectedTable: { selectionType, id },
      } = this.props;

      let url = API_URLS.GET_COLUMNS_BY.replace('#ID#', id);
      url += `?source_type=${selectionType}`;

      const { data } = await httpGet(url);
      const { related_fields: relatedTables = [], ...baseTable } = data || {};

      const allTables = [baseTable, ...relatedTables];
      const allSelectedFields = [
        ...selectedFields,
        ...amountColumns,
        ...dateColumns,
      ];

      const tables = allTables.map((table, index) => {
        (table.columns || []).forEach((tableCol, tableColIndex) => {
          table.columns[tableColIndex].is_editable = index == 0;

          const matchedCol = allSelectedFields.find(
            sf =>
              sf.id == tableCol.id && sf.user_table_id == tableCol.user_table_id
          );

          table.columns[tableColIndex].isAdded = Boolean(matchedCol);
        });

        return {
          ...table,
          isExpanded: true,
          is_editable: index == 0,
        };
      });

      // disable related fields
      allSelectedFields.forEach(field => {
        const { dimension = null } = field || {};

        if (dimension) {
          const { dimension_id = '', identifier = '', name_col = '' } =
            dimension || {};
          const dimesionTableIndex = tables.findIndex(
            ({ dimension_id: tableDimesionId }) =>
              tableDimesionId == dimension_id
          );

          if (dimesionTableIndex > -1) {
            const { columns } = tables[dimesionTableIndex] || {};
            columns.filter((col, colIndex) => {
              if (col.name == name_col || col.name == identifier) {
                allTables[dimesionTableIndex].columns[colIndex].isAdded = true;
                return col;
              }
              return false;
            });
          }
        }
      });

      (baseTable.columns || []).forEach(col => {
        if (!firstAmountCol && col.data_type == COLUMN_DATA_TYPES_KEYS.amount) {
          firstAmountCol = { ...col };
        }

        if (!firstDateCol && col.data_type == COLUMN_DATA_TYPES_KEYS.date) {
          firstDateCol = { ...col };
        }
      });

      const isUpdateRecordMode = allSelectedFields.length > 0;

      this.setState({
        showLoader: false,
        tables,
        isUpdateRecordMode,
        firstAmountCol,
        firstDateCol,
        isLoading: false,
      });
    } catch (e) {
      this.setState({ showLoader: false, isLoading: false });
    }
  };

  /**
   * Fill Initial Data
   */
  fillInitialData = () => {
    const { selectedTable } = this.props;

    let name = String(selectedTable.display_name)
      .trim()
      .substring(0, MAX_RE_NAME - 16);
    name += ' - Record Editor';

    this.setState({ name, isUnsavedStructure: true });
  };

  /**
   * Load Record Editor in Edit Mode
   */
  loadRecordEditor = async () => {
    try {
      const { id } = this.state;
      const { setSelectedTable } = this.props;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_RECORD_EDITOR_BY_ID;
      url = url.replace('#ID#', id);

      const { data } = await httpGet(url);
      const { name, fields_list, ref_id, ref_type, is_grid_disabled } = data;

      const selectedTable = { id: ref_id, selectionType: ref_type };
      setSelectedTable(selectedTable);

      let hasAmountColumn = false;
      let hasDateColumn = false;

      const selectedFields = [];
      const amountColumns = [];
      const dateColumns = [];

      if (fields_list) {
        // Check Amount / Date fields & exclude dimension columns
        fields_list.forEach(({ config }) => {
          if (!config || !config.data_type) return;

          if (
            !is_grid_disabled &&
            config.data_type == COLUMN_DATA_TYPES_KEYS.amount &&
            !config.dimension_id
          ) {
            hasAmountColumn = true;
            return;
          }

          if (
            config.data_type == COLUMN_DATA_TYPES_KEYS.date &&
            !config.dimension_id
          ) {
            hasDateColumn = true;
          }
        });

        // Fill fields & exclude dimension columns
        fields_list.forEach(({ config }) => {
          if (!config || !config.data_type) return;

          if (
            !is_grid_disabled &&
            hasDateColumn &&
            config.data_type == COLUMN_DATA_TYPES_KEYS.amount &&
            !config.dimension_id
          ) {
            amountColumns.push({ ...config });
            return;
          }

          if (
            hasAmountColumn &&
            config.data_type == COLUMN_DATA_TYPES_KEYS.date &&
            !config.dimension_id
          ) {
            dateColumns.push({ ...config });
            return;
          }

          selectedFields.push({ ...config });
        });
      }

      this.setState(
        {
          showLoader: false,
          name,
          selectedFields,
          amountColumns,
          dateColumns,
        },
        this.fetchTablesAndCols
      );
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false, isLoading: false });
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
   * Update Mode > Update  Record Mode
   *
   * @param {Boolean} value
   */
  setUpdateRecordMode = (value = false) => {
    this.setState({ isUpdateRecordMode: value });
  };

  /**
   * Handle updated New Name
   *
   * @param {String} name
   */
  handleNewName = name => {
    this.setState({ name });
  };

  /**
   * Save Structure of Record Editor
   */
  saveStructure = async () => {
    try {
      const { showLoader, id, isUnsavedStructure } = this.state;

      if (showLoader) return;

      const onSaved = id => {
        showSuccessMsg(RECORD_EDITOR_MSG.editor_saved);

        this.setUpdateRecordMode(true);

        if (id) {
          const route = APP_ROUTES.EDIT_RECORD_EDITOR.replace(':id', id);
          this.props.history.push({ pathname: route });
        }
      };

      // Skip if no changes
      if (!isUnsavedStructure) {
        onSaved();
        return;
      }

      const { err, params } = getParamsToSaveStrucure(this.state, this.props);

      if (err) {
        showErrorMsg(err);
        return;
      }

      const url = id
        ? API_URLS.UPDATE_RECORD_EDITOR.replace('#ID#', id)
        : API_URLS.SAVE_RECORD_EDITOR;

      this.setState({ showLoader: true });

      const { data } = await httpPost(url, params);

      const { id: recordId } = data;

      this.setState({
        showLoader: false,
        id: recordId,
        isUnsavedStructure: false,
      });

      onSaved(recordId);
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * On Click > Add New Record
   */
  onAddNewRecord = () => {
    const { current } = this.updateRecordRef;

    if (!current || !current.addNewRecord) return;

    current.addNewRecord();
  };

  /**
   * Update State Conditionally
   *
   * @param {Object} updatedState
   */
  updateState = (updatedState = {}) => {
    const newState = { isUnsavedStructure: true, ...updatedState };

    this.setState(newState);
  };

  /**
   * Handle Drag-Drop
   */
  onDragEndMoveFields = async ({ source, destination }) => {
    try {
      if (!source || !destination) return;

      const { droppableId, index } = source;
      const { selectedFields, amountColumns, dateColumns, tables } = this.state;

      if (!droppableId) return;

      const tableIndex = droppableId.split('-')[2]; // Table Index
      const table = tables[tableIndex];
      const column = table.columns[index];

      const getColsList = () => {
        switch (column.data_type) {
          case COLUMN_DATA_TYPES_KEYS.amount:
            return amountColumns;

          case COLUMN_DATA_TYPES_KEYS.date:
            return dateColumns;

          default:
            return selectedFields;
        }
      };

      const colsList = getColsList() || [];

      // Check is already added
      const col = colsList.find(
        ({ id, user_table_id }) => user_table_id == table.id && column.id == id
      );

      if (col) {
        showErrorMsg(RECORD_EDITOR_MSG.field_already_dragged);
        return;
      }

      const relatedFields = [];

      // Add related fields from dimensions and GL Accounts
      if (table?.src_type === 'dimension' || table?.src_type === 'gl_account') {
        const [firstTable] = tables || [];
        const { columns = [] } = firstTable || {};

        const fields = [];
        columns.find((col, colIndex) => {
          const { dimension = null } = col || {};
          if (
            dimension &&
            dimension.dimension_id == table.dimension_id &&
            (column.name == dimension.name_col ||
              column.name == dimension.identifier)
          ) {
            tables[0].columns[colIndex].isAdded = true;
            fields.push(col);
          }
          return false;
        });

        if (
          fields &&
          fields.length > 0 &&
          selectedFields.filter(field => field.id === fields[0].id).length == 0
        ) {
          const [firstField = {}] = fields || [];
          const { dimension: { identifier = '', name_col = '' } = {} } =
            firstField || {};

          table.columns.filter((col, colIndex) => {
            if (col.name == name_col || col.name == identifier) {
              tables[tableIndex].columns[colIndex].isAdded = true;
              return col;
            }

            return false;
          });

          relatedFields.push({ ...firstField, width: FIELD_DEFAULT_WIDTH });
        }
      }

      // Add related fields from Scenario
      if (table?.src_type === 'scenario') {
        const { dimension = null } = column || {};

        if (dimension) {
          const { dimension_id = '', identifier = '', name_col = '' } =
            dimension || {};
          const dimesionTableIndex = tables.findIndex(
            ({ dimension_id: tableDimesionId }) =>
              tableDimesionId == dimension_id
          );

          const { columns } = tables[dimesionTableIndex] || {};

          columns.filter((col, colIndex) => {
            if (col.name == name_col || col.name == identifier) {
              tables[dimesionTableIndex].columns[colIndex].isAdded = true;
              return col;
            }

            return false;
          });
        }
      }

      const field = {
        ...column,
        width: FIELD_DEFAULT_WIDTH,
      };

      let combineFields = [];

      if (relatedFields.length === 0) {
        combineFields.push(field);
      }

      if (relatedFields.length > 0) {
        combineFields = [...combineFields, ...relatedFields];
      }

      if (table.is_editable) {
        // Handle Amount Field
        if (field.data_type == COLUMN_DATA_TYPES_KEYS.amount) {
          this.handleAmountFieldDrop({ field, tableIndex, index });
          return;
        }

        // Handle Date Field
        if (field.data_type == COLUMN_DATA_TYPES_KEYS.date) {
          this.handleDateFieldDrop({ field, tableIndex, index });
          return;
        }
      }

      const newFiellds = [...selectedFields, ...combineFields];
      tables[tableIndex].columns[index].isAdded = true;

      this.setState({ selectedFields: newFiellds, isUnsavedStructure: true });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Mark Field Added in tables list
   */
  markAdded = ({ tableIndex, colIndex } = {}) => {
    const { tables, amountColumns, dateColumns } = this.state;

    if (!amountColumns.length || !dateColumns.length) {
      tables[tableIndex].columns[colIndex].isAdded = true;

      this.setState({ tables });
      return;
    }

    const [amountCol] = amountColumns;
    const [dateCol] = dateColumns;

    const updatedTables = tables.map(table => {
      const cols = table.columns || [];

      const columns = cols.map(col => {
        let isAdded = col.isAdded || false;

        if (
          (col.data_type == COLUMN_DATA_TYPES_KEYS.amount &&
            !col.dimension_id) ||
          (col.data_type == COLUMN_DATA_TYPES_KEYS.date && !col.dimension_id)
        ) {
          isAdded = false;
        }

        if (
          amountCol.id == col.id &&
          amountCol.user_table_id == col.user_table_id
        ) {
          isAdded = true;
        }

        if (
          dateCol.id == col.id &&
          dateCol.user_table_id == col.user_table_id
        ) {
          isAdded = true;
        }

        return { ...col, isAdded };
      });

      return { ...table, columns: [...columns] };
    });

    this.setState({ tables: updatedTables });
  };

  /**
   * Handle Amount Field Drop
   *
   * @param {Object}
   */
  handleAmountFieldDrop = ({ field, tableIndex, index, isCreateGrid }) => {
    const { tables, selectedFields, dateColumns, amountColumns } = this.state;

    // If already added Date and Amount columns
    if (dateColumns.length > 0 && amountColumns.length > 0) {
      this.setState(
        {
          isUnsavedStructure: true,
          amountColumns: [{ ...field }],
        },
        () => this.markAdded({ tableIndex, colIndex: index })
      );
      return;
    }

    // Available Date columns in table & exclude dimension columns
    const dateFields = tables[tableIndex].columns.filter(
      ({ data_type }) => data_type == COLUMN_DATA_TYPES_KEYS.date
    );

    // selected Amount columns & exclude dimension columns
    const selectedAmountFields = selectedFields.filter(
      ({ data_type, dimension_id }) =>
        data_type == COLUMN_DATA_TYPES_KEYS.amount && !dimension_id
    );

    // selected Date columns
    const selectedDateFields = selectedFields.filter(
      ({ data_type, dimension_id }) =>
        data_type == COLUMN_DATA_TYPES_KEYS.date && !dimension_id
    );

    // If no Date column in table
    if (
      dateFields.length == 0 ||
      isCreateGrid === false ||
      selectedAmountFields.length > 0 ||
      selectedDateFields.length > 1
    ) {
      selectedFields.push({ ...field });

      this.setState(
        {
          isUnsavedStructure: true,
          selectedFields,
        },
        () => this.markAdded({ tableIndex, colIndex: index })
      );
      return;
    }

    // Remove Selected Date Field and Create Grid
    if (selectedDateFields.length == 1 && isCreateGrid) {
      const dateColIndex = selectedFields.findIndex(f => {
        return f.data_type == COLUMN_DATA_TYPES_KEYS.date && !f.dimension_id;
      });

      selectedFields.splice(dateColIndex, 1);
      const selectedDateField = { ...selectedDateFields[0] };

      this.setState(
        {
          isUnsavedStructure: true,
          selectedFields,
          amountColumns: [{ ...field }],
          dateColumns: [selectedDateField],
        },
        () => this.markAdded({ tableIndex, colIndex: index })
      );
      return;
    }

    // If Date column exists in Table
    if (
      !tables[tableIndex].dimension &&
      dateFields.length > 0 &&
      isCreateGrid == undefined &&
      selectedAmountFields.length == 0
    ) {
      const askCreateGridModalCallback = isCreateGrid => {
        this.setState({ askCreateGridModalCallback: null }, () =>
          this.handleAmountFieldDrop({ field, tableIndex, index, isCreateGrid })
        );
      };

      this.setState({ askCreateGridModalCallback });
      return;
    }

    // If only one Date column in table
    if (dateFields.length == 1) {
      let stateObj = {
        isUnsavedStructure: true,
      };

      const callback = tables[tableIndex].dimension
        ? this.markAdded({ tableIndex, colIndex: index })
        : this.markAdded;

      // when user create RE on source table (PAI-987)
      if (!tables[tableIndex].dimension) {
        stateObj = {
          ...stateObj,
          amountColumns: [{ ...field }],
          dateColumns: [{ ...dateFields[0] }],
        };
      }

      // when user create RE on Dimension (PAI-987)
      if (tables[tableIndex].dimension) {
        selectedFields.push({ ...field });

        stateObj = {
          ...stateObj,
          selectedFields,
        };
      }

      this.setState(stateObj, callback);
      return;
    }

    // Select Date column from Dialog
    if (dateFields.length > 1) {
      let stateObj = {};

      const callback = tables[tableIndex].dimension
        ? this.markAdded({ tableIndex, colIndex: index })
        : null;

      // when user create RE on source table (PAI-1065)
      if (!tables[tableIndex].dimension) {
        stateObj = {
          draggedField: field,
          selectFieldType: COLUMN_DATA_TYPES_KEYS.date,
          fieldsToSelect: dateFields,
        };
      }

      // when user create RE on Dimension (PAI-1065)
      if (tables[tableIndex].dimension) {
        selectedFields.push({ ...field });

        stateObj = {
          selectedFields,
        };
      }

      this.setState(stateObj, callback);
    }
  };

  /**
   * Handle Date Field Drop
   *
   * @param {Object}
   */
  handleDateFieldDrop = ({ field, tableIndex, index }) => {
    const { tables, amountColumns, dateColumns } = this.state;

    // If already added Date and Amount columns
    if (dateColumns.length > 0 && amountColumns.length > 0) {
      this.setState(
        {
          isUnsavedStructure: true,
          dateColumns: [{ ...field }],
        },
        () => this.markAdded({ tableIndex, colIndex: index })
      );
      return;
    }

    // Available Amount columns in table
    const amountFields = tables[tableIndex].columns.filter(
      ({ data_type }) => data_type == COLUMN_DATA_TYPES_KEYS.amount
    );

    // If no Amount column in table or No Amount column added
    if (amountFields.length == 0 || amountColumns.length == 0) {
      const { selectedFields } = this.state;
      selectedFields.push({ ...field });

      this.setState(
        {
          isUnsavedStructure: true,
          selectedFields,
        },
        () => this.markAdded({ tableIndex, colIndex: index })
      );
      return;
    }

    // If only one Amount column in table
    if (amountFields.length == 1) {
      this.setState(
        {
          isUnsavedStructure: true,
          amountColumns: [{ ...amountFields[0] }],
          dateColumns: [{ ...field }],
        },
        this.markAdded
      );
      return;
    }

    // Select Date column from Dialog
    if (amountFields.length > 1) {
      this.setState({
        draggedField: field,
        selectFieldType: COLUMN_DATA_TYPES_KEYS.amount,
        fieldsToSelect: amountFields,
      });
    }
  };

  /**
   * Handle Create Grid Confirmation Response
   *
   * @param {String|Boolean} res
   */
  handleCreateAmountGridConfRes = res => {
    try {
      if (res == undefined) {
        this.setState({ askCreateGridModalCallback: null });
        return;
      }

      const { askCreateGridModalCallback } = this.state;
      if (askCreateGridModalCallback) askCreateGridModalCallback(Boolean(res));
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Close Select Field Dialog
   */
  closeSelectFieldDialog = () => {
    this.setState({
      selectFieldType: '',
      fieldsToSelect: [],
      draggedField: null,
    });
  };

  /**
   * Handle elected field from Dialog
   *
   * @param {Object} field
   */
  handleSelectedField = field => {
    const { selectFieldType, draggedField } = this.state;

    if (!draggedField) return;

    let amountColumns = [];
    let dateColumns = [];

    switch (selectFieldType) {
      case COLUMN_DATA_TYPES_KEYS.amount:
        amountColumns = [{ ...field }];
        dateColumns = [{ ...draggedField }];
        break;

      case COLUMN_DATA_TYPES_KEYS.date:
        amountColumns = [{ ...draggedField }];
        dateColumns = [{ ...field }];
        break;

      default:
        break;
    }

    this.setState(
      { isUnsavedStructure: true, amountColumns, dateColumns },
      this.markAdded
    );
    this.closeSelectFieldDialog();
  };

  /**
   * Update seletedFields state
   *
   * @param {Array} fields
   */
  handleSetFields = fields => {
    this.setState({ selectedFields: fields, isUnsavedStructure: true });
  };

  updateDensity = density => {
    this.setState({ density });
  };

  /**
   * Render View
   */
  render() {
    const {
      isLoading,
      showLoader,
      isUpdateRecordMode,
      askCreateGridModalCallback,

      selectFieldType,
      fieldsToSelect,

      id,
      name,
      selectedFields,
      amountColumns,
      dateColumns,
      tables,

      builderWidth,
      builderHeight,
      isVisibleUnsavedChanges,

      isBlockDone,
      density,

      selectedChart,
      showDataPoints,
      showDataLabels,
    } = this.state;

    const { history } = this.props;

    const { state: { isAddNew = false } = {} } =
      this.updateRecordRef.current || {};

    return (
      <>
        <Prompt when message={this.handleBlockedNavigation} />

        <ConfirmationModal
          action="YES"
          isOpen={Boolean(askCreateGridModalCallback)}
          msg="Do you want to see this as a trend?"
          handleClose={this.handleCreateAmountGridConfRes}
        />

        {isVisibleUnsavedChanges && (
          <UnsavedChangesDialog handleUnsavedConf={this.handleUnsavedConf} />
        )}

        <AppHeader
          showBreadcrumbs={false}
          header={
            <EditRecordEditorNameHeader
              name={name}
              id={id}
              isUpdateRecordMode={isUpdateRecordMode}
              handleNewName={this.handleNewName}
              onChangeEditingState={value => {
                this.setState({ isBlockDone: value });
              }}
            />
          }
          headerActions={
            <HeaderActions
              isAddNew={isAddNew}
              isUpdateRecordMode={isUpdateRecordMode}
              onAddNewRecord={this.onAddNewRecord}
              onCancel={this.goToRoute(APP_ROUTES.RECORD_EDITORS)}
              onSave={this.saveStructure}
              isButtonBlockDone={isBlockDone}
              onDensityChange={this.updateDensity}
            />
          }
        />

        <SideBar
          selectedChart={selectedChart}
          showDataPoints={showDataPoints}
          showDataLabels={showDataLabels}
          updateState={this.updateState}
        />

        {(showLoader || isLoading) && <Spinner />}

        <Box p={3} display={isLoading ? 'none' : 'block'}>
          <Box display="flex">
            {!isUpdateRecordMode && (
              <DragDropContext onDragEnd={this.onDragEndMoveFields}>
                <Box flexGrow={1}>
                  <CreateStructure
                    fields={selectedFields}
                    updateState={this.updateState}
                    width={builderWidth}
                    height={builderHeight}
                    amountColumns={amountColumns}
                    dateColumns={dateColumns}
                    tables={tables}
                  />
                </Box>
                <Box width="362px" ml={4}>
                  {tables.length > 0 && (
                    <TablesAndColsList
                      tables={tables}
                      height={builderHeight}
                      updateState={this.updateState}
                    />
                  )}
                </Box>
              </DragDropContext>
            )}

            {isUpdateRecordMode && (
              <Box flexGrow={1}>
                <UpdateRecord
                  ref={this.updateRecordRef}
                  id={id}
                  height={builderHeight}
                  selectedFields={selectedFields}
                  setUpdateRecordMode={this.setUpdateRecordMode}
                  amountColumns={amountColumns}
                  history={history}
                  density={density}
                  updateState={this.updateState}
                  isButtonBlockDone={isBlockDone}
                  selectedChart={selectedChart}
                  showDataPoints={showDataPoints}
                  showDataLabels={showDataLabels}
                />
              </Box>
            )}
          </Box>

          {selectFieldType && (
            <SelectFieldDialog
              title={`Select ${COLUMN_DATA_TYPES_OBJ[selectFieldType].label} Field`}
              fields={fieldsToSelect}
              onDone={this.handleSelectedField}
              onCancel={this.closeSelectFieldDialog}
            />
          )}
        </Box>
      </>
    );
  }
}

CreateRecordEditor.propTypes = {
  selectedTable: shape({}),
  setSelectedTable: func.isRequired,
};

CreateRecordEditor.defaultProps = {
  selectedTable: {},
};

const mapStateToProps = createStructuredSelector({
  selectedTable: getSelectedTable(),
});

export default connect(mapStateToProps, { setSelectedTable })(
  withRouter(withStyles(styles)(CreateRecordEditor))
);
