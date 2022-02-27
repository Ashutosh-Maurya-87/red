import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import {
  func,
  arrayOf,
  shape,
  oneOfType,
  number,
  string,
  any,
} from 'prop-types';

import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Button,
} from '@material-ui/core';

import {
  ArrowLeft,
  ArrowRight,
  AddCircleOutline as AddCircleOutlineIcon,
  EditRounded as EditRoundedIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@material-ui/icons';

import SortableTree, {
  addNodeUnderParent,
  changeNodeAtPath,
  removeNodeAtPath,
  getNodeAtPath,
  find,
  map,
} from 'react-sortable-tree';
import PerfectScrollbar from 'perfect-scrollbar';
import sortableCustomTheme from '../sortableCustomTheme';

import Spinner from '../../../../../components/Spinner';
import ConfirmationModal from '../../../../../components/ConfirmationModal';
import AddHierarchyModal from '../AddHierarchy';
import RenameHierarchyModal from '../RenameHierarchy';
import LevelsConfigModal from '../LevelsConfigs';

import { getLevelsListing } from '../../../../../reducers/LevelsConfigs/selectors';

import { fetchLevelsConfigs } from '../../../../../services/Dimensions';

import { API_URLS } from '../../../../../configs/api';
import { DIMENSIONS_MSG } from '../../../../../configs/messages';

import { httpGet, httpDelete, httpPost } from '../../../../../utils/http';
import { showSuccessMsg } from '../../../../../utils/notifications';

import { setLevelsListing } from '../../../../../reducers/LevelsConfigs/actions';

import { externalNodeType } from '../configs';

import './styles.scss';
import HierarchyErrorModal from '../HierarchyErrorModal';
import { logAmplitudeEvent } from '../../../../../utils/amplitude';

let hieListElePS = null;

const GLHierarchyListing = ({
  onHierarchySelect,
  hierarchyList,
  onHierarchyUpdate,
  setLevelsListing,
  onUpdateSelection,
  onUpdateChilds,
  hierarchyType,
  dimensionId,
  tableHeight,
  levels,
  rootName,
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [isAddHierarchy, setIsAddHierarchy] = useState(false);
  const [isHavingError, setIsHavingError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setIsMoving] = useState(false);
  const [isRenameHierarchy, setIsRenameHierarchy] = useState(false);
  const [isDeleteHierarchy, setIsDeleteHierarchy] = useState(false);
  const [isVisibleLevels, setVisibleLevels] = useState(false);
  const [itemForAction, seItemForAction] = useState(null);
  const [parentHierarchyId, setParentHierarchyId] = useState(null);
  const [selectedHierarchyName, setHierarchyName] = useState('');
  const [rollupOperator, setRollupOperator] = useState('');

  const [selectedHierarchyIndex, setSelectedHierarchyIndex] = useState(null);

  // Searching
  const [searchFocusIndex, setSearchFocusIndex] = useState(0);
  const [searchFoundCount, setSearchFoundCount] = useState(null);
  const [search, setSearch] = useState('');

  const [tempSelectedNode, setTempNode] = useState(null);

  /**
   * Get Hierarchy Listing
   */
  const getHierarchy = async () => {
    try {
      if (isFetching) return;

      setIsFetching(true);

      let url = API_URLS.MODELS_API.GET_HIERARCHY;
      url += `?id=${dimensionId}&limit=${100000}&page=${1}`;

      const { data = [] } = await httpGet(url);

      // Add root directory manually at top
      const rootHierarchy = [
        {
          affa_h_key_name: rootName,
          affa_level: 0,
          affa_level_name: 'Level 0',
          affa_parent_folder_id: null,
          affa_record_id: data[0]?.affa_parent_folder_id || 0,
          affa_record_type: 'folder',
          expanded: true,
          children: data || [],
        },
      ];

      setIsFetching(false);

      onHierarchyUpdate(rootHierarchy);
      setSelectedHierarchyIndex(rootHierarchy[0].affa_record_id);
      onHierarchySelect(rootHierarchy[0].children);
      setTempNode({ node: rootHierarchy[0], path: [0] });
    } catch (error) {
      setIsFetching(false);

      console.error(error);
    }
  };

  /**
   * Get Hierarchy Levels
   */
  const getHierarchyLevels = async () => {
    try {
      const { data = [] } = await fetchLevelsConfigs(dimensionId);
      setLevelsListing(data);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Callback > Get Hierarchy
   */
  const getHierarchyCallback = useCallback(getHierarchy, []);

  /**
   * Callback > Get Hierarchy Levels
   */
  const getHierarchyLevelsCallback = useCallback(getHierarchyLevels, []);

  /**
   * Load Data on Load Component
   */
  useEffect(() => {
    getHierarchyLevelsCallback();
    getHierarchyCallback();
  }, [getHierarchyCallback, getHierarchyLevelsCallback]);

  /**
   * Load Data on manage perfect scroll bar
   */
  useEffect(() => {
    try {
      if (hierarchyList && hierarchyList.length > 0) {
        setTimeout(() => {
          if (hieListElePS) hieListElePS.destroy();
          const tableEle = document.querySelector(
            '.sortable-hierarchy-list .ReactVirtualized__Grid'
          );

          hieListElePS = new PerfectScrollbar(tableEle);

          hieListElePS.update();
        }, 500);
      }
    } catch (err) {
      console.error(err);
    }
  }, [hierarchyList]);

  /**
   * Handle > Add Hierarchy
   *
   * @param {String|Number} id
   */
  const handleAddHierarchy = id => {
    logAmplitudeEvent('Financial Env. Setup: add hierarchy');

    setIsAddHierarchy(true);
    setParentHierarchyId(id);
  };

  /**
   * Set node key for add/edit/remove operations(React-Sortable)
   *
   * @param {Object} tree
   * @returns {Number}
   */
  const getNodeKey = ({ treeIndex }) => treeIndex;

  /**
   * Handle > Add Hierarchy
   *
   * @param {String|Number} data
   */
  const handleHierarchyAdded = data => {
    const { path } = tempSelectedNode || {};

    const { treeData } = addNodeUnderParent({
      treeData: hierarchyList,
      parentKey: path[path.length - 1],
      expandParent: true,
      getNodeKey,
      newNode: data,
      addAsFirstChild: true,
    });

    onHierarchyUpdate(treeData);
    updateSelectedHierarchies(treeData, path);
  };

  /**
   * Handle > Close Add Hierarchy Modal
   */
  const closeAddHierarchyModal = () => {
    setIsAddHierarchy(false);
    setParentHierarchyId(null);
  };

  /**
   * Handle > Close Rename Hierarchy Modal
   */
  const closeRenameHierarchyModal = () => {
    setIsRenameHierarchy(false);
    setParentHierarchyId(null);
    setHierarchyName('');
    setRollupOperator('');
  };

  /**
   * Handle > Rename Hierarchy
   *
   * @param {String || Number} id
   * @param {String} name
   * @param {String} rollup_op
   */
  const handleRenameHierarchy = (id, name, rollup_op) => {
    setIsRenameHierarchy(true);
    setParentHierarchyId(id);
    setHierarchyName(name);
    setRollupOperator(rollup_op);
  };

  /**
   * Update Path for right table view
   *
   * @param {String || Number} id
   * @param {String} name
   * @param {String} rollup_op
   */
  const removeLastPathWithUpdateTree = (treeData, path) => {
    path.pop(); // remove last element

    const result = getNodeAtPath({
      treeData,
      path,
      getNodeKey,
    });

    // Update right panel(Table view)
    if (result && result.node) {
      const { node = {} } = result || {};

      setTempNode({ node, path });
      updateSelectedHierarchies(treeData, path);
    }
  };

  /**
   * Hamdle > Rename Hierarchy
   *
   * @param {Object} data
   */
  const handleHierarchyRename = data => {
    const { path, node } = tempSelectedNode || {};

    const treeData = changeNodeAtPath({
      treeData: hierarchyList,
      path,
      getNodeKey,
      newNode: { ...node, ...data },
    });

    removeLastPathWithUpdateTree(treeData, path);
    onHierarchyUpdate(treeData);
  };

  /**
   * Handle > Delete Hierarchy
   *
   * @param {Object} data
   */
  const handleDeleteHierarchy = data => {
    logAmplitudeEvent('Financial Env. Setup: remove hierarchy');

    setIsDeleteHierarchy(true);
    seItemForAction(data);
  };

  /**
   * Handle > Delete Confirmations
   *
   * @param {String} action
   */
  const handleDeleteConfirmation = async action => {
    if (!action) {
      setIsDeleteHierarchy(false);
      return;
    }

    try {
      setIsDeleting(true);

      let URL = '';

      if (hierarchyType == 'GLAccounts') {
        URL = API_URLS.DELETE_Level.replace(
          '#ID#',
          itemForAction.affa_record_id
        );
      }

      if (hierarchyType == 'dimensions') {
        URL = API_URLS.DIMENSION_DELETE_Level.replace(
          '#ID#',
          dimensionId
        ).replace('#FOLDER_ID#', itemForAction.affa_record_id);
      }

      await httpDelete(URL);

      // Remove node from react-sortable plugin tree
      const { path, node: { affa_record_type = '' } = {} } =
        tempSelectedNode || {};

      if (affa_record_type == 'folder') {
        getHierarchy(); // Fetch hierarchy again
      } else {
        const treeData = removeNodeAtPath({
          treeData: hierarchyList,
          path,
          getNodeKey,
        });

        removeLastPathWithUpdateTree(treeData, path);
        onHierarchyUpdate(treeData || []);
      }

      showSuccessMsg(
        itemForAction.affa_record_type == 'folder'
          ? DIMENSIONS_MSG.hierarchy_deleted
          : DIMENSIONS_MSG.member_deleted
      );
      setIsDeleting(false);
      setIsDeleteHierarchy(false);
    } catch (error) {
      setIsDeleting(false);
      console.error(error);
    }
  };

  /**
   * Handle > Delete Confirmations
   *
   * @param {String} action
   */
  const handleMoveHierarchy = async (params, recordId) => {
    try {
      setIsMoving(true);

      let URL = '';

      URL = API_URLS.DIMENSION_MOVE_HIERARCHY.replace('#ID#', dimensionId);

      await httpPost(URL, params);

      setIsMoving(false);
    } catch (error) {
      setIsHavingError(true);
      setIsMoving(false);
      console.error(error);
    }
  };

  /**
   * Handle Search Input
   *
   * @param {Event}
   */
  const handleSearch = ({ target }) => {
    if (isFetching) return;

    setSearch(target.value);
  };

  /**
   * Clear Search Inout
   */
  const clearSearch = () => {
    setSearch('');
  };

  const performAction = (action, node, path) => {
    const {
      affa_record_id = '',
      children = [],
      affa_h_key_name = '',
      rollup_op = '',
    } = node || {};

    setTempNode({ node, path }); // Set temp node select for all actions

    switch (action) {
      case 'displayChilds':
        setSelectedHierarchyIndex(node.affa_record_id);
        onUpdateChilds(children);
        break;

      case 'displayLevels':
        setVisibleLevels(true);
        break;

      case 'addFolder':
        handleAddHierarchy(affa_record_id);
        break;

      case 'removeFolder':
        handleDeleteHierarchy(node);
        break;

      case 'editFolder':
        handleRenameHierarchy(affa_record_id, affa_h_key_name, rollup_op);
        break;

      default:
        break;
    }
  };

  const customSearchMethod = ({ node, searchQuery }) =>
    searchQuery &&
    node.affa_h_key_name?.toLowerCase().indexOf(searchQuery?.toLowerCase()) >
      -1;

  /**
   * Display Level Name as per level
   *
   * @param {String || Number} level
   *
   * @returns {String}
   */
  const displayLevels = level => {
    let levelName = '';

    if (levels && levels.length > 0 && level > 0) {
      levelName = levels[Number(level - 1)].level_name || '';
    }

    return levelName || '';
  };

  const renderNodeActions = ({ node, path }) => {
    const { affa_record_type = '', affa_record_id = '', affa_level } =
      node || {};

    // Buttons permissions
    const isVisibleAddHierarchy =
      affa_record_type == 'folder' && affa_level < 10;
    const isVisibleEditHierarchy =
      affa_record_type == 'folder' && path && path.length > 1;
    const isVisibleDeleteHierarchy = path && path.length > 1;
    const isVisibleLevels = path && path.length > 1;

    return {
      search,
      isSelectedNode: affa_record_id == selectedHierarchyIndex,
      onNodeClick: () => performAction('displayChilds', node, path),
      buttons: [
        {
          button: <Box mr={1}>{displayLevels(affa_level)}</Box>,
          isVisible: isVisibleLevels,
        },
        {
          button: (
            <IconButton
              size="small"
              className="hover-icon"
              onClick={() => performAction('editFolder', node, path)}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          ),
          isVisible: isVisibleEditHierarchy,
        },
        {
          button: (
            <IconButton
              size="small"
              className="hover-icon"
              onClick={() => performAction('addFolder', node, path)}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          ),
          isVisible: isVisibleAddHierarchy,
        },
        {
          button: (
            <IconButton
              size="small"
              className="hover-icon"
              onClick={() => performAction('removeFolder', node, path)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ),
          isVisible: isVisibleDeleteHierarchy,
        },
      ],
    };
  };

  /**
   * Update key affa_level as per hierarchy level
   *
   * @param {Array} dataTree
   */
  const updateLevels = dataTree => {
    const updatedTree = map({
      treeData: dataTree,
      getNodeKey: ({ node: TreeNode, treeIndex: number }) => {
        return number;
      },
      callback: nodeObj => {
        const { node, path } = nodeObj;
        node.affa_level = path?.length - 1;

        return node;
      },
      ignoreCollapsed: false,
    });

    return updatedTree || [];
  };

  /**
   * Find and place selected node from right table view
   *
   * @param {object} node
   * @param {Array} path
   * @param {Array} hierarchy
   */
  const moveDataRTL = (hierarchy, path, nextPath, nodes, nextParentNode) => {
    try {
      const removeChild = (index, leftNodes, hierarchy, callback) => {
        if (index < leftNodes.length) {
          const { matches = [] } = find({
            getNodeKey,
            treeData: hierarchy,
            searchQuery: leftNodes[index].affa_record_id,
            searchMethod: ({ searchQuery, node: { affa_record_id } }) =>
              searchQuery == affa_record_id,
          });

          if (matches && matches.length > 0) {
            const [firstNode] = matches;
            hierarchy = removeNodeAtPath({
              treeData: hierarchy,
              path: firstNode.path,
              getNodeKey,
            });
          }

          return removeChild(index + 1, leftNodes, hierarchy, callback);
        }

        if (callback) {
          callback(hierarchy);
        }

        return hierarchy;
      };

      // Remove node from react-sortable plugin tree
      const treeData = removeNodeAtPath({
        treeData: hierarchy,
        path,
        getNodeKey,
      });

      // remove nodes from left tree in view
      const nodesReverse = [...nodes].reverse();
      const ids = nodesReverse.map(({ affa_record_id }) => affa_record_id);

      const { matches = [] } = find({
        getNodeKey,
        treeData: hierarchy,
        searchQuery: ids,
        searchMethod: ({ searchQuery, node: { affa_record_id } }) =>
          searchQuery.includes(affa_record_id),
      });

      const nodesToRm = matches.map(({ node }) => node);

      const removeCallback = dataTree => {
        const { matches = [] } = find({
          getNodeKey,
          treeData: dataTree,
          searchQuery: [nextParentNode.affa_record_id],
          searchMethod: ({ searchQuery, node: { affa_record_id } }) =>
            searchQuery.includes(affa_record_id),
        });

        if (matches.length > 0) {
          const { treeIndex = '' } = matches[0];
          const parentNode = treeIndex;

          /**
           * Call back of add Node
           */
          const addNodeCallback = dataTree => {
            // update levels of all nodes
            const updatedTree = updateLevels(dataTree);

            // Update final tree
            onHierarchyUpdate(updatedTree);
            updateSelectedHierarchies(updatedTree, null);
            setParamsAndSave(nextPath, ids, nextParentNode);
          };

          /**
           * recursive function to add nodes
           */
          const addNode = (
            nodesReverse,
            index,
            treeData,
            parentNode,
            callback
          ) => {
            if (index < nodesReverse.length) {
              try {
                const { treeData: updatedTree } = addNodeUnderParent({
                  treeData,
                  parentKey: parentNode,
                  // parentKey: parentPath < 3 ? parentPath : parentPath - nodesToRm.length,
                  expandParent: true,
                  getNodeKey,
                  newNode: nodesReverse[index],
                });

                return addNode(
                  nodesReverse,
                  index + 1,
                  updatedTree,
                  parentNode,
                  callback
                );
              } catch (error) {
                setIsHavingError(true);
                console.error(error);
              }
            }

            if (callback) {
              callback(treeData);
            }

            return treeData;
          };

          addNode(nodesReverse, 0, dataTree, parentNode, addNodeCallback);
        } else {
          setIsHavingError(true);
        }
      };

      removeChild(0, nodesToRm, treeData, removeCallback);
    } catch (error) {
      setIsHavingError(true);
      console.error(error);
    }
  };

  /**
   * Generate date for api call in case of multi selection
   *
   * @param {Array} nextPath
   * @param {Array} ids
   * @param {Object} nextParentNode
   */
  const setParamsAndSave = (nextPath, ids, nextParentNode) => {
    const { affa_level = '', affa_record_id = '' } = nextParentNode || {};

    const params = {
      action: 'MOVE_IN',
      record_ids: ids,
      destination_id: affa_level == 0 ? '' : affa_record_id,
    };

    handleMoveHierarchy(params, affa_record_id);
  };

  /**
   * Update right table view
   *
   * @param {Array} treeData
   */
  const updateSelectedHierarchies = (treeData, path, ids) => {
    const { path: tempPath, node = {} } = tempSelectedNode || {};
    const nodePath = path ? path : tempPath;
    let selectedNode = node;

    /**
     * Find and set node at path
     */
    const getNode = () => {
      const result = getNodeAtPath({
        treeData,
        path: nodePath,
        getNodeKey,
      });

      const { node = {} } = result || {};
      selectedNode = node;
    };

    if (path) {
      getNode();
    } else {
      const { children = [] } = selectedNode || {};

      if (ids && ids.length > 0) {
        selectedNode.children = children.filter(
          ({ affa_record_id }) => !ids.includes(affa_record_id)
        );
      } else {
        getNode();
      }
    }

    if (selectedNode && selectedNode.affa_record_id) {
      setSelectedHierarchyIndex(selectedNode.affa_record_id);
      onUpdateSelection([]);
      if (selectedNode.children) {
        onHierarchySelect(selectedNode.children);
      }
      setTempNode({ node: selectedNode, path: nodePath });
    }
  };

  /**
   * Event Handler > onMoveNode
   *
   * @param {Object} context
   */
  const handleMoveNode = ({
    treeData: hierarchy = [],
    node = {},
    path = [],
    prevPath = [],
    nextPath = [],
    nextParentNode = [],
  }) => {
    try {
      const { affa_record_id } = node || {};

      // In case of move data from right panel to left panel
      if (prevPath.length == 0) {
        let nodes = [];

        if (affa_record_id) {
          nodes.push(node);
        }

        if (!affa_record_id) {
          nodes = Object.values(node);
        }

        moveDataRTL(hierarchy, path, nextPath, nodes, nextParentNode);
      } else {
        const { children: nextParentChilds } = nextParentNode;
        const isLevelUp = nextPath.length > prevPath.length;
        const isMoveBackward = nextPath.length < prevPath.length;

        const getAction = () => {
          const getMoveAfterBefore = () => {
            const filterIndex = nextParentChilds.findIndex(
              child => child.affa_record_id == node.affa_record_id
            );

            if (filterIndex != -1) {
              if (filterIndex == 0 && nextParentChilds.length <= 1) {
                return 'MOVE_IN';
              }

              if (filterIndex == 0 && nextParentChilds.length > 1) {
                return 'MOVE_BEFORE';
              }
            }

            return 'MOVE_AFTER'; // Default case
          };

          if (isLevelUp || isMoveBackward) {
            if (nextParentChilds.length <= 1) {
              return 'MOVE_IN';
            }
          }

          return getMoveAfterBefore();
        };

        const getDestinationNode = () => {
          if (isLevelUp || isMoveBackward) {
            if (nextParentChilds.length <= 1) {
              return nextParentNode.affa_record_id;
            }
          }

          const filterIndex = nextParentChilds.findIndex(
            child => child.affa_record_id == node.affa_record_id
          );

          if (filterIndex != -1) {
            if (filterIndex == 0 && nextParentChilds.length <= 1) {
              return nextParentNode.affa_record_id;
            }

            if (filterIndex == 0 && nextParentChilds.length > 1) {
              return nextParentChilds[filterIndex + 1].affa_record_id;
            }
          }

          return nextParentChilds[filterIndex - 1]?.affa_record_id; // Default case
        };

        const params = {
          action: getAction(),
          record_ids: [node.affa_record_id],
          destination_id: getDestinationNode(),
        };

        prevPath.pop(); // get parent path

        // update levels of all nodes
        const updatedTree = updateLevels(hierarchy);

        onHierarchyUpdate(updatedTree);
        updateSelectedHierarchies(updatedTree, prevPath, params.record_ids);
        handleMoveHierarchy(params, affa_record_id);
      }
    } catch (error) {
      setIsHavingError(true);
      console.error(error);
    }
  };

  /**
   * Decrement serach focus
   *
   * @returns {Number}
   */
  const selectPrevMatch = () =>
    setSearchFocusIndex(
      searchFocusIndex !== null
        ? (searchFoundCount + searchFocusIndex - 1) % searchFoundCount
        : searchFoundCount - 1
    );

  /**
   * Increment serach focus
   *
   * @returns {Number}
   */
  const selectNextMatch = () =>
    setSearchFocusIndex(
      searchFocusIndex !== null ? (searchFocusIndex + 1) % searchFoundCount : 0
    );

  /**
   * Apply conditions to drop nodes(React-sortable)
   *
   * @param {Object} dropObj
   * @returns {Boolean}
   */
  const canDrop = ({ node, nextParent, prevPath, nextPath }) => {
    const { affa_record_id } = node || {};

    if (nextParent && affa_record_id == nextParent.affa_record_id) {
      return false;
    }

    if (
      !nextParent ||
      (nextPath && nextPath.length < 2 && nextPath[0] == 0) ||
      (nextParent && nextParent.affa_record_type != 'folder')
    ) {
      return false;
    }

    return true;
  };

  return (
    <Box width="100%" height="100%" mt={2}>
      {isFetching && <Spinner />}

      <form
        onSubmit={event => {
          event.preventDefault();
        }}
      >
        {/* Search */}
        <Box mb={4} className="position-relative">
          <TextField
            name="search"
            style={{ width: '100%' }}
            placeholder="Type here to search"
            value={search}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            autoComplete="off"
            InputProps={{
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {search && search.length > 0 && (
            <Box className="dimension-search-options">
              <Button
                size="small"
                disabled={!searchFoundCount}
                onClick={selectPrevMatch}
              >
                <ArrowLeft />
                Prev
              </Button>

              <Button
                size="small"
                type="submit"
                disabled={!searchFoundCount}
                onClick={selectNextMatch}
              >
                Next
                <ArrowRight />
              </Button>

              <span>
                &nbsp;
                {searchFoundCount > 0 ? searchFocusIndex + 1 : 0}
                &nbsp;/&nbsp;
                {searchFoundCount || 0}
              </span>
            </Box>
          )}
        </Box>
      </form>

      {/* Sortable tree section */}
      {hierarchyList && hierarchyList.length > 0 && (
        <div style={{ height: tableHeight }}>
          <SortableTree
            treeData={hierarchyList}
            onChange={treeData => onHierarchyUpdate(treeData)}
            canDrop={canDrop}
            theme={sortableCustomTheme}
            onMoveNode={handleMoveNode}
            generateNodeProps={renderNodeActions}
            dndType={externalNodeType}
            // Search Params
            searchMethod={customSearchMethod}
            searchFocusOffset={searchFocusIndex}
            searchFinishCallback={matches => {
              setSearchFoundCount(matches.length);
              setSearchFocusIndex(
                matches.length > 0 ? searchFocusIndex % matches.length : 0
              );
            }}
            searchQuery={search}
            className="sortable-hierarchy-list"
            onlyExpandSearchedNodes={Boolean(search && search.length > 0)}
          />
        </div>
      )}

      {/* Add Node Popup */}
      {isAddHierarchy && (
        <AddHierarchyModal
          isOpen={isAddHierarchy}
          handleClose={closeAddHierarchyModal}
          onHierarchyAdded={handleHierarchyAdded}
          parentHierarchyId={parentHierarchyId}
          hierarchyType={hierarchyType}
          dimensionId={dimensionId}
        />
      )}

      {/* Add Node Popup */}
      {isVisibleLevels && (
        <LevelsConfigModal
          isOpen={isVisibleLevels}
          handleClose={() => setVisibleLevels(false)}
          title="Rename Levels"
        />
      )}

      {/* Rename Node Popup */}
      {isRenameHierarchy && (
        <RenameHierarchyModal
          isOpen={isRenameHierarchy}
          handleClose={closeRenameHierarchyModal}
          onHierarchyRename={handleHierarchyRename}
          title={
            hierarchyType == 'GLAccounts'
              ? 'Edit Hierarchy'
              : 'Rename Hierarchy'
          }
          name={selectedHierarchyName}
          parentHierarchyId={parentHierarchyId}
          rollupOperator={rollupOperator}
          hierarchyType={hierarchyType}
          dimensionId={dimensionId}
        />
      )}

      {/* Delete Node */}
      {isDeleteHierarchy && (
        <ConfirmationModal
          handleClose={handleDeleteConfirmation}
          isOpen
          showLoader={isDeleting}
          title={`Delete ${
            itemForAction.affa_record_type == 'folder' ? 'Hierarchy' : 'Member'
          }`}
          msg={
            itemForAction.affa_record_type == 'folder'
              ? 'When hierarchy is deleted with members inside the members will move to the very top level.'
              : `Are you sure to delete "${itemForAction.affa_h_key_name}" member?`
          }
          yesText="Delete"
          noText="Cancel"
          action="delete"
        />
      )}

      {isHavingError && (
        <HierarchyErrorModal
          isOpen={isHavingError}
          handleClose={() => setIsHavingError(false)}
        />
      )}
    </Box>
  );
};

GLHierarchyListing.propTypes = {
  dimensionId: oneOfType([number, string]),
  hierarchyList: arrayOf(shape({})).isRequired,
  hierarchyType: string.isRequired,
  levels: arrayOf(shape({})).isRequired,
  onHierarchySelect: func.isRequired,
  onHierarchyUpdate: func.isRequired,
  onUpdateChilds: func.isRequired,
  onUpdateSelection: func.isRequired,
  rootName: string,
  setLevelsListing: func.isRequired,
  tableHeight: any,
};

GLHierarchyListing.defaultProps = {
  hierarchyList: [],
  onHeadersUpdate: () => {},
};
const mapStateToProps = createStructuredSelector({
  levels: getLevelsListing(),
});

export default connect(mapStateToProps, {
  setLevelsListing,
})(GLHierarchyListing);
