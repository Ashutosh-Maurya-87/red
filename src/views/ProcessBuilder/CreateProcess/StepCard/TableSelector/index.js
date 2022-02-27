import React from 'react';
import {
  func,
  string,
  bool,
  arrayOf,
  oneOfType,
  number,
  shape,
} from 'prop-types';

import {
  withStyles,
  TextField,
  ListSubheader,
  Typography,
} from '@material-ui/core';

import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';

import { VariableSizeList } from 'react-window';
import InfiniteScroll from 'react-infinite-scroll-component';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Spinner from '../../../../../components/Spinner';

import { API_URLS } from '../../../../../configs/api';
import { httpGet } from '../../../../../utils/http';
import { convertStringToSQLColumn } from '../../helper';

import { styles } from './styles';
import './styles.scss';

const filter = createFilterOptions();

const INITIAL_PAGINATION = {
  total: 0,
  limit: 500,
  page: 1,
};

const OuterElementContext = React.createContext({});
const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);

  return <PerfectScrollbar ref={ref} {...props} {...outerProps} />;
  // return <div ref={ref} {...props} {...outerProps} />;
});

class TableSelector extends React.Component {
  /**
   * Handle > are Selected options updated?
   */
  isChanged = false;

  /**
   * Handle Timeout > CLose Select for Multiple
   */
  timeoutCloseSelect;

  /**
   * State
   */
  state = {
    showLoader: false,
    tablesList: [],
    search: '',
    pagination: { ...INITIAL_PAGINATION },
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.fetchSourceTables();

    const {
      name,
      value = '',
      multiple,
      onChange,
      onCloseSelect,
      isUpdatePrimary,
    } = this.props;

    const { tablesList = [] } = this.state;

    if (!isUpdatePrimary && value && value != 'NEW' && tablesList.length == 0) {
      if (multiple) {
        onCloseSelect({ isEditMode: true });
        return;
      }
      onChange(name, value, { id: value, isEditMode: true });
    }
  }

  /**
   * Fetch Source Tables from API
   */
  fetchSourceTables = async () => {
    try {
      const { search, showLoader, pagination, tablesList } = this.state;
      const { limit, page } = pagination;

      if (showLoader) return;

      this.setState({ showLoader: true });

      let url = API_URLS.GET_SOURCE_TABLES;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;
      url += `&sort=display_name`;
      url += `&order=asc`;

      if (search) url += `&search=${search}`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const list = page == 1 ? data : [...tablesList, ...data];

      this.setState(
        {
          showLoader: false,
          tablesList: list,
          pagination: {
            ...pagination,
            total: count,
          },
        },
        () => {
          const {
            selectedValue: { option },
          } = this.getSelectedTable();
          const { name, value, onChange, isUpdatePrimary } = this.props;

          if (isUpdatePrimary && value && value != 'NEW') {
            onChange(name, value, {
              id: value,
              isEditMode: true,
              is_primary: option?.is_primary || false,
            });
          }
        }
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
   * Load more Source Tables
   */
  loadMoreTables = () => {
    const { pagination } = this.state;

    this.setState(
      {
        pagination: {
          ...pagination,
          page: pagination.page + 1,
        },
      },
      this.fetchSourceTables
    );
  };

  /**
   * Handle > Select Source Table
   *
   * @param {Object} evt
   * @param {Object} opt
   */
  handleOnChange = (evt, opt) => {
    if (this.timeoutCloseSelect) clearTimeout(this.timeoutCloseSelect);
    this.isChanged = true;

    const { name, multiple, onChange, isCreateTable } = this.props;
    const { option = [] } = opt[1] || opt[0] || opt;

    if (opt && opt.inputValue && isCreateTable) {
      const { tablesList } = this.state;
      const { inputValue } = opt;
      const id = `NEW`;

      if (tablesList[0] && tablesList[0].id === id) {
        tablesList.shift();
      }

      const newTable = {
        id,
        name: convertStringToSQLColumn(inputValue),
        display_name: inputValue,
      };

      tablesList.unshift(newTable);
      this.setState({ tablesList });

      onChange(name, inputValue, { isCreateTable: true, id });
      return;
    }

    let val = opt.id;
    if (Array.isArray(opt)) {
      val = opt
        .map(({ id }) => String(id))
        .filter((v, i, a) => a.indexOf(v) == i);

      if (multiple) this.handleCloseSelect();
    }

    onChange(name, val, option);
  };

  /**
   * Handle > CLose Select
   */
  handleCloseSelect = () => {
    const { multiple, onCloseSelect } = this.props;

    if (multiple && this.isChanged) {
      this.timeoutCloseSelect = setTimeout(onCloseSelect, 100);
    }

    this.isChanged = false;
  };

  /**
   * Get Selectd Values for Input
   *
   * @return {Array|Object|String}
   */
  getSelectedValues = () => {
    const { value, multiple, inputValue } = this.props;
    const { tablesList } = this.state;

    if (value == 'NEW') {
      return { selectedValue: { label: inputValue } };
    }

    let selectedValue = multiple ? [] : '';

    if (tablesList.length) {
      if (multiple) {
        selectedValue = tablesList
          .map(({ id, display_name }) => {
            if (!value.includes(String(id))) return '';

            return { label: display_name, id: String(id) };
          })
          .filter(Boolean);
      } else {
        const table = tablesList.find(({ id }) => id == value) || {};
        selectedValue = { label: String(table.display_name || '') };
      }
    }

    return { selectedValue };
  };

  /**
   * Get Selectd table option
   *
   * @return {Array|Object|String}
   */
  getSelectedTable = () => {
    const { value, multiple, inputValue } = this.props;
    const { tablesList } = this.state;

    if (value == 'NEW') {
      return { selectedValue: { label: inputValue } };
    }

    let selectedValue = multiple ? [] : '';

    if (tablesList.length) {
      if (multiple) {
        selectedValue = tablesList
          .map(table => {
            if (!value.includes(String(table?.id))) return '';

            return { option: table };
          })
          .filter(Boolean);
      } else {
        const table = tablesList.find(({ id }) => id == value) || {};
        selectedValue = { option: table };
      }
    }

    return { selectedValue };
  };

  /**
   * Custom list component
   *
   * @param {object} props
   * @param {object} ref
   */
  // Adapter for react-window

  ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    // eslint-disable-next-line react/prop-types
    const { children, state, loadMoreTables, ...other } = props;
    const { tablesList, pagination } = state || {};
    const { limit, total, page } = pagination;

    const child1 = React.Children.toArray(children);
    const itemData = React.Children.toArray(child1[0].props.children[1]);

    const totalPages = total / limit;
    const hasNextPage = page <= totalPages;

    const getChildSize = child => {
      if (React.isValidElement(child) && child.type === ListSubheader) {
        return 48;
      }

      return tablesList.length;
    };

    const getDropdownHeight = () => {
      return tablesList.length > 5 ? 250 : tablesList.length * 42;
    };

    const Item = ({ data, index, style }) => {
      const option = data[index];

      return <li style={style}>{option}</li>;
    };

    return (
      <div ref={ref}>
        <InfiniteScroll
          className="source-table-infinite-scroll"
          dataLength={tablesList.length}
          next={loadMoreTables}
          hasMore={hasNextPage}
          scrollableTarget="delete-clear-target-table-popup"
        >
          <OuterElementContext.Provider value={other}>
            <VariableSizeList
              itemData={itemData}
              height={getDropdownHeight()}
              width="100%"
              outerElementType={OuterElementType}
              itemSize={index => getChildSize(itemData[index])}
              overscanCount={5}
              itemCount={1}
              {...props}
            >
              {Item}
            </VariableSizeList>
          </OuterElementContext.Provider>
        </InfiniteScroll>
      </div>
    );
  });

  /**
   * Verify > Is listed option disabled
   *
   * @param {String|Number} id
   */
  isDisabled = id => {
    const { disabledTable } = this.props;

    if (Array.isArray(disabledTable)) {
      return Boolean(disabledTable.find(val => val == id));
    }

    return id == disabledTable;
  };

  /**
   * Render View
   */
  render() {
    const {
      label,
      id,
      name,
      classes,
      error,
      helperText,
      multiple,
      coreProps,
      limitTags,
      isCreateTable,
    } = this.props;

    const { showLoader, tablesList } = this.state;
    const { selectedValue } = this.getSelectedValues();

    return (
      <>
        {showLoader && <Spinner />}

        <Autocomplete
          openOnFocus
          autoComplete
          autoHighlight
          clearOnBlur
          selectOnFocus
          freeSolo
          disableClearable
          disableListWrap
          handleHomeEndKeys
          limitTags={limitTags}
          multiple={multiple}
          id={id}
          name={name}
          value={selectedValue}
          className={`small-select ${classes.formControl}`}
          ListboxComponent={this.ListboxComponent}
          ListboxProps={{
            state: this.state,
            loadMoreTables: this.loadMoreTables,
          }}
          groupBy={({ tableDisplayName = '' }) => tableDisplayName}
          options={tablesList.map(table => ({
            label: table.display_name,
            id: String(table.id),
            option: table,
          }))}
          onChange={this.handleOnChange}
          getOptionLabel={({ label = '' }) => label}
          renderOption={({ label }) => <Typography noWrap>{label}</Typography>}
          renderInput={params => (
            <TextField
              {...params}
              label={label}
              variant="outlined"
              placeholder="Select"
              error={error}
              helperText={helperText}
            />
          )}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            const isMatchedName = filtered.findIndex(
              ({ label }) =>
                label.toUpperCase() == params.inputValue.toUpperCase()
            );

            // Suggest the creation of a new table
            if (isMatchedName && isCreateTable && params.inputValue !== '') {
              filtered.push({
                inputValue: params.inputValue,
                label: `Create "${params.inputValue}"`,
              });
            }

            return filtered;
          }}
          getOptionDisabled={({ id }) => this.isDisabled(id)}
          {...coreProps}
        />
      </>
    );
  }
}

TableSelector.propTypes = {
  coreProps: shape({}),
  disabledTable: oneOfType([number, string, arrayOf(string)]),
  error: bool,
  helperText: string,
  id: string.isRequired,
  inputValue: string,
  isCreateTable: bool,
  isUpdatePrimary: bool,
  label: string.isRequired,
  limitTags: number,
  multiple: bool,
  name: string.isRequired,
  onChange: func.isRequired,
  onCloseSelect: func,
  value: oneOfType([string, arrayOf(string), number]),
};

TableSelector.defaultProps = {
  coreProps: {},
  value: '',
  disabledTable: '',
  helperText: '',
  error: false,
  multiple: false,
  onCloseSelect: () => {},
  limitTags: 1,
  isCreateTable: false,
  isUpdatePrimary: true,
  inputValue: '',
};

export default withStyles(styles)(TableSelector);
