import React from 'react';
import { arrayOf, bool, func, shape } from 'prop-types';
import { AutoSizer, Grid as VGrid } from 'react-virtualized';

import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Tooltip,
} from '@material-ui/core';
import { ArrowDropDown, ArrowRight, Clear, Search } from '@material-ui/icons';

import ConditionalWrapper from '../../../../components/ConditionalWrapper';
import ImgRenderer from '../../../../components/ImgRenderer';
import CustomScrollbars from '../../../../components/ScrollBars';
import SelectedHierarchyList from './SelectedHierarchyList';

import { MODELS_MSG } from '../../../../configs/messages';

import { getChilds, formatFlatDataWithId } from './helper';
import './styles.scss';

const MIN_SEARCH_CHAR = 2;

class HierarchyWithSelection extends React.Component {
  /**
   * State
   */
  state = {
    hierarchyList: [],
    flatHierarchyList: [],
    filteredSearchList: [],
    selectedMappings: [],
    singleSelectedMapping: null,

    search: '',
    isSelectAll: true,

    isLoadedHierarchyOnce: false,
  };

  /**
   * Virtual Grid Ref
   */
  listRef = React.createRef();

  /**
   * Search timeout Handler
   */
  searchTimeout;

  /**
   * Used to detect up|down scroll of table
   */
  lastScrollTop = 0;

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { list } = this.props;

    if (list.length > 0) {
      this.formatState(list);
    }
  }

  /**
   * When Component Did Update
   */
  shouldComponentUpdate(nextProps) {
    if (nextProps.list !== this.props.list) {
      this.formatState(nextProps.list);
    }

    const { isLoadedHierarchyOnce, isSelectAll } = this.state;

    if (
      !isLoadedHierarchyOnce &&
      nextProps.selectedHierarchies !== this.props.selectedHierarchies
    ) {
      if (this.props.isMulti) {
        this.setState({
          selectedMappings: nextProps.selectedHierarchies,
          isLoadedHierarchyOnce: true,
          isSelectAll:
            nextProps.selectedHierarchies.length > 0 ? false : isSelectAll,
        });
      } else {
        const [item] = nextProps.selectedHierarchies;

        this.setState({
          singleSelectedMapping: item,
          isLoadedHierarchyOnce: true,
          isSelectAll: false,
        });
      }
    }

    return true;
  }

  /**
   * Format the state of list
   *
   * @param {Array} list
   */
  formatState = list => {
    const { selectedHierarchies, isMulti } = this.props;
    const { search } = this.state;

    let hierarchyToMap = [...selectedHierarchies];

    const fieldToMap = isMulti ? 'selectedMappings' : 'singleSelectedMapping';

    if (!isMulti) {
      const [item] = selectedHierarchies;
      hierarchyToMap = item;
    }

    let state = {
      [fieldToMap]: hierarchyToMap,
      isSelectAll:
        selectedHierarchies.length > 0 ? false : this.state.isSelectAll,
    };

    if (search && search.length >= MIN_SEARCH_CHAR) {
      state = {
        ...state,
        hierarchyList: [],
        filteredSearchList: JSON.parse(JSON.stringify(list)),
      };
      state.filteredSearchList = JSON.parse(JSON.stringify(list));
    } else {
      state = {
        ...state,
        hierarchyList: JSON.parse(JSON.stringify(list)),
        filteredSearchList: [],
      };
    }

    this.setState(state);
  };

  /**
   * Expand selected node
   *
   * @param {Number} index
   * @param {Array} children
   * @param {Array} hierarchyState
   */
  expandNode = (index, children, hierarchyState) => {
    hierarchyState[index].isCollapse = !hierarchyState[index].isCollapse;
    hierarchyState.splice(index + 1, 0, ...children);

    this.setState({ hierarchyList: hierarchyState });
  };

  /**
   * Handle > Collpase Hierarchy
   *
   * @param {String/Number} index
   * @param {String/Number} id
   * @param {Array} hierarchyFromProps
   * @param {Array} hierarchyState
   */
  collpaseNode = (index, id, hierarchyFromProps, hierarchyState) => {
    hierarchyState[index].isCollapse = !hierarchyState[index].isCollapse;

    const hierarchyList = formatFlatDataWithId(id, hierarchyFromProps, []);

    const result = hierarchyState.filter(o1 => {
      return hierarchyList.some(o2 => o1.affa_record_id == o2.affa_record_id);
    });

    this.setState({ hierarchyList: result });
  };

  /**
   * Handle Click > Collpase Hierarchy
   *
   * @param {String/Number} id
   * @param {String/Number} index
   */
  onCollapsed = (id, index) => () => {
    const { list = [] } = this.props;

    const { hierarchyList = [] } = this.state;
    const tempList = [...hierarchyList];

    if (!tempList[index].isCollapse) {
      const children = getChilds(id, JSON.parse(JSON.stringify(list)));
      this.expandNode(index, children, tempList);
      return;
    }

    this.collpaseNode(index, id, JSON.parse(JSON.stringify(list)), tempList);
  };

  /**
   * Toggle checkbox section in list
   *
   * @param {Object} Node
   */
  toggleSelectionNode = node => event => {
    const { selectedMappings = [] } = this.state;
    let selectedItems = [];

    if (event.target.checked) {
      selectedMappings.push(node);
      selectedItems = selectedMappings;
    } else {
      const { affa_record_id = '' } = node || {};
      selectedItems = selectedMappings.filter(
        item => item.affa_record_id != affa_record_id
      );
    }

    this.setState(
      {
        selectedMappings: selectedItems,
        isSelectAll: false,
      },
      () => {
        this.props.onSelection(this.state.selectedMappings, this.props.isMulti);
      }
    );
  };

  /**
   * Handle Click > Radio selection
   *
   * @param {Object} node
   */
  onSingleSelectNode = node => () => {
    this.setState({ singleSelectedMapping: node }, () => {
      this.props.onSelection(
        [this.state.singleSelectedMapping],
        this.props.isMulti
      );
    });
  };

  /**
   * Identify the current node is selected or not
   *
   * @param {Number} affaRecordId
   */
  isNodeSelected = affaRecordId => {
    const { selectedMappings = [] } = this.state;

    const ids = selectedMappings.map(({ affa_record_id }) =>
      String(affa_record_id)
    );

    return ids.indexOf(String(affaRecordId)) !== -1;
  };

  /**
   * Filter Data for search
   *
   * @param {String} search
   */
  onSearch = search => {
    this.props.onSearch(search);
  };

  /**
   * Handle Search Input
   *
   * @param {Event}
   */
  handleSearch = ({ target }) => {
    const { value: search } = target;
    const { search: searchRes } = this.state;

    const state = {
      search,
    };

    if (searchRes) {
      if (search && search.length < MIN_SEARCH_CHAR) {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.setState(state);
        this.onSearch('');
        return;
      }
    }

    this.setState(state);

    // Clear prev result
    if (search && search.length >= MIN_SEARCH_CHAR) {
      state.flatHierarchyList = [];
    }

    if (!search || (search && search.length < MIN_SEARCH_CHAR)) return;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.onSearch(search), 300);
  };

  /**
   * Clear Search Inout
   */
  clearSearch = () => {
    this.setState(
      {
        search: '',
        filteredSearchList: [],
      },
      () => this.onSearch('')
    );

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  };

  /**
   * Remove selected item
   *
   * @param {Number/String} id
   */
  removeSelectedItem = id => {
    if (!id) return;

    const { isMulti } = this.props;

    const { selectedMappings } = this.state;

    if (isMulti) {
      const removedItem = selectedMappings.filter(
        item => item.affa_record_id !== id
      );

      this.setState({ selectedMappings: removedItem }, () => {
        this.props.onSelection(this.state.selectedMappings, this.props.isMulti);
      });
      return;
    }

    this.setState({ singleSelectedMapping: null }, () => {
      this.props.onSelection([], this.props.isMulti);
    });
  };

  /**
   * Handle select all checkbox behaviour
   */
  handleSelectAll = () => {
    const { isSelectAll } = this.state;
    const { isMulti, onSelection } = this.props;

    if (!isSelectAll) {
      onSelection([], isMulti);

      if (isMulti) {
        this.setState({ isSelectAll: !isSelectAll, selectedMappings: [] });
        return;
      }

      this.setState({ isSelectAll: !isSelectAll, singleSelectedMapping: null });
      return;
    }

    this.setState({ isSelectAll: !isSelectAll });
  };

  /**
   * Display Filter > Highlight search keyword in path
   * @param {String} path
   */
  highLightNodePath = path => {
    const { search } = this.state;

    if (!path || !search) return path;

    return path.replace(
      search,
      `<span class="highlight-search">${search}</span>`
    );
  };

  /**
   * Render list row content
   *
   * @param {Array} list
   */
  rowRenderer = list => props => {
    const { style, rowIndex: index } = props;

    const {
      affa_level = 0,
      affa_record_id = '',
      affa_h_key_name = '',
      affa_record_type = '',
      node_path = '',
      isCollapse = false,
      children = [],
    } = list[index] || {};

    const item = list[index];

    const { isMulti, isLoading } = this.props;

    const { singleSelectedMapping, search } = this.state;

    const isSelected = this.isNodeSelected(affa_record_id);

    const isSingleNodeSelected = Boolean(
      singleSelectedMapping &&
        String(singleSelectedMapping.affa_record_id) == String(affa_record_id)
    );

    return (
      <Box key={index} style={style} className={` level-${affa_level}`}>
        <Box
          display="flex"
          height="100%"
          alignItems="center"
          className="cursor-pointer position-relative"
        >
          <Box
            style={{
              position: 'relative',
              height: '24px',
              width: '26px',
              zIndex: '2',
            }}
            className={`${isCollapse ? 'hierarchy-expanded' : ''}`}
          >
            {children && children.length > 0 && (
              <Box
                height={24}
                width={24}
                onClick={this.onCollapsed(affa_record_id, index)}
              >
                {(!search || search.length < MIN_SEARCH_CHAR) &&
                  affa_record_type === 'folder' &&
                  (!isCollapse ? <ArrowRight /> : <ArrowDropDown />)}
              </Box>
            )}
          </Box>

          {isMulti && (
            <Box>
              <FormControlLabel
                disabled={isLoading}
                control={
                  <Checkbox
                    checked={isSelected}
                    color="primary"
                    onChange={this.toggleSelectionNode(item)}
                  />
                }
                label={
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <Box>
                      {affa_record_type === 'folder' ? (
                        <ImgRenderer className="folder-icon" src="folder.svg" />
                      ) : (
                        <ImgRenderer className="folder-icon" src="files.svg" />
                      )}
                    </Box>
                    <Box>
                      <Box>{affa_h_key_name}</Box>
                      {search && search.length >= MIN_SEARCH_CHAR && node_path && (
                        <Box
                          fontSize="11px"
                          color="text.secondary"
                          dangerouslySetInnerHTML={{
                            __html: this.highLightNodePath(node_path) || '',
                          }}
                        ></Box>
                      )}
                    </Box>
                  </Box>
                }
              />
            </Box>
          )}

          {!isMulti && (
            <Box>
              <ConditionalWrapper
                condition={affa_record_type == 'folder'}
                wrapper={children => (
                  <Tooltip
                    title={MODELS_MSG.invalid_posting_selection}
                    placement="right"
                  >
                    {children}
                  </Tooltip>
                )}
              >
                <FormControlLabel
                  control={
                    <Radio
                      className="hierarchy-select-radio"
                      color="primary"
                      disabled={affa_record_type === 'folder'}
                      checked={isSingleNodeSelected}
                      onChange={this.onSingleSelectNode(item)}
                      name="hierarchy-radio-button"
                    />
                  }
                  label={
                    <Box display="flex" flexDirection="row" alignItems="center">
                      <Box>
                        {affa_record_type === 'folder' ? (
                          <ImgRenderer
                            className="folder-icon"
                            src="folder.svg"
                          />
                        ) : (
                          <ImgRenderer
                            className="folder-icon"
                            src="files.svg"
                          />
                        )}
                      </Box>
                      <Box>
                        <Box>{affa_h_key_name}</Box>
                        {search &&
                          search.length >= MIN_SEARCH_CHAR &&
                          node_path && (
                            <Box
                              fontSize="11px"
                              color="text.secondary"
                              dangerouslySetInnerHTML={{
                                __html: this.highLightNodePath(node_path) || '',
                              }}
                            />
                          )}
                      </Box>
                    </Box>
                  }
                />
              </ConditionalWrapper>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  /**
   * Callback > Load more
   */
  loadMore = () => {
    const { loadMore, hasMore } = this.props;

    if (hasMore) loadMore();
  };

  /**
   * Handle Scrolling
   *
   * @param {Object}
   */
  handleScrollEvent = ({ target }) => {
    if (!this.listRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    const height = scrollTop + clientHeight;

    if (scrollTop > this.lastScrollTop && height >= scrollHeight - 80) {
      this.loadMore();
    }

    this.lastScrollTop = scrollTop;
    this.listRef.current.handleScrollEvent(target);
  };

  /**
   * Render View
   */
  render() {
    const {
      hierarchyList,
      filteredSearchList,
      selectedMappings,
      singleSelectedMapping,

      search,
      isSelectAll,
    } = this.state;

    const { isMulti, isLoading } = this.props;

    const list =
      !search || (search && search.length < MIN_SEARCH_CHAR)
        ? hierarchyList
        : filteredSearchList;

    const selectedList =
      !isMulti && singleSelectedMapping
        ? [singleSelectedMapping]
        : selectedMappings;

    return (
      <>
        <Grid direction="row" container>
          <Grid item xs={8} container direction="row">
            <Box
              width="100%"
              display="flex"
              flexDirection="column"
              minHeight={300}
              mr={3}
              py={2}
              border={1}
              borderRadius={5}
              borderColor="secondary.stepBorderColor"
            >
              <Box mb={1} px={2}>
                <TextField
                  name="search"
                  fullWidth
                  placeholder="Search..."
                  value={search}
                  onChange={this.handleSearch}
                  variant="outlined"
                  size="small"
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={this.clearSearch}
                          edge="end"
                        >
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {isMulti && (
                <Box pl={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        disabled={isLoading}
                        checked={isSelectAll}
                        color="primary"
                        onChange={this.handleSelectAll}
                      />
                    }
                    label={
                      <Typography variant="caption">
                        Select All / Deselect all
                      </Typography>
                    }
                  />
                </Box>
              )}

              {!isLoading && list.length === 0 && (
                <Box p={2}>No Record Found</Box>
              )}

              {list.length > 0 && (
                <Box
                  display="flex"
                  style={{ height: '100%' }}
                  className={`${
                    search && search.length >= MIN_SEARCH_CHAR
                      ? 'hierarchy-search-enable'
                      : ''
                  }`}
                >
                  <div style={{ flex: '1 1 auto', height: '100%' }}>
                    <AutoSizer>
                      {({ width, height }) => (
                        <CustomScrollbars
                          style={{ width, height }}
                          onScroll={this.handleScrollEvent}
                        >
                          <VGrid
                            ref={this.listRef}
                            width={width}
                            columnWidth={width}
                            height={height}
                            rowCount={list.length}
                            overscanRowCount={10}
                            columnCount={1}
                            rowHeight={
                              search && search.length >= MIN_SEARCH_CHAR
                                ? 42
                                : 34
                            }
                            cellRenderer={this.rowRenderer(list)}
                            style={{
                              overflowX: 'visible',
                              overflowY: 'visible',
                            }}
                          />
                        </CustomScrollbars>
                      )}
                    </AutoSizer>
                  </div>
                </Box>
              )}

              {isLoading && (
                <Box display="flex" justifyContent="center">
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          </Grid>
          <Grid
            item
            xs={4}
            container
            direction="row"
            className="translate-drag-col"
          >
            <Box
              width="100%"
              display="flex"
              minHeight={300}
              mr={3}
              py={2}
              pl={2}
              pr={1}
              border={1}
              borderRadius={5}
              borderColor="secondary.stepBorderColor"
            >
              {selectedList.length > 0 && (
                <SelectedHierarchyList
                  list={selectedList}
                  onRemoveItem={this.removeSelectedItem}
                />
              )}

              {selectedList.length === 0 && (
                <Box
                  display="flex"
                  justifyContent="center"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  No Member Selected
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </>
    );
  }
}

HierarchyWithSelection.propTypes = {
  hasMore: bool.isRequired,
  isLoading: bool.isRequired,
  isMulti: bool.isRequired,
  list: arrayOf(shape({})),
  loadMore: func.isRequired,
  onSearch: func.isRequired,
  onSelection: func.isRequired,
  selectedHierarchies: arrayOf(shape({})),
};

HierarchyWithSelection.defaultProps = {
  isLoading: false,
  isMulti: false,
  hasMore: false,
  list: [],
  onSelection: () => {},
  onSearch: () => {},
  loadMore: () => {},
  selectedHierarchies: [],
};

export default HierarchyWithSelection;
