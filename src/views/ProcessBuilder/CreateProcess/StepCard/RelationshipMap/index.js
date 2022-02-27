import React from 'react';
import { shape, number, func, string, bool, any } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import ReactFullscreen from 'react-easyfullscreen';

import createEngine, {
  DefaultDiagramState,
  DiagramModel,
} from '@projectstorm/react-diagrams';

// eslint-disable-next-line import/no-extraneous-dependencies
import { CanvasWidget } from '@projectstorm/react-canvas-core';

import {
  Box,
  Divider,
  Link,
  Typography,
  Collapse,
  Tooltip,
} from '@material-ui/core';

import {
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@material-ui/icons';
import CustomScrollbars from '../../../../../components/ScrollBars';

import { AdvancedLinkFactory, AdvancedPortModel } from './custom-link';
import { AdvancedNodeFactory, AdvancedNodeModel } from './custom-node';

import { THEME_CONFIGS } from '../../../../../theme';
import { getTheme } from '../../../../../reducers/Theme/selectors';

import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { showErrorMsg } from '../../../../../utils/notifications';

import './styles.scss';

class RelationshipMap extends React.Component {
  /**
   * State
   */
  state = {
    showMap: true,
    isFullScreen: false,
  };

  /**
   * Create an instance of the engine with all the defaults
   */
  engine = createEngine({
    registerDefaultZoomCanvasAction: false,
    registerDefaultDeleteItemsAction: true,
  });

  /**
   * Timeout Handler to reset Checks
   */
  resetCheckTimeout;

  /**
   * Nodes > List of Tables
   */
  nodes = [];

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    this.engine.getLinkFactories().registerFactory(new AdvancedLinkFactory());
    this.engine.getNodeFactories().registerFactory(new AdvancedNodeFactory());

    const engineState = this.engine.getStateMachine().getCurrentState();
    if (engineState instanceof DefaultDiagramState) {
      engineState.dragNewLink.config.allowLooseLinks = false;
    }
  }

  /**
   * Toggle Visibility of Relationship Map
   */
  toggleMap = () => {
    this.setState({ showMap: !this.state.showMap });
  };

  openFullScreen = func => () => func();

  closeFullScreen = func => () => func();

  handleFullScreenChange = () => {
    this.setState({ isFullScreen: !this.state.isFullScreen });
  };

  /**
   * Create|Update Nodes|Ports|Links
   */
  execute = () => {
    const { step, theme, showDelete, relatedTablesKey } = this.props;

    const themeConfigs = THEME_CONFIGS[theme] || {};
    const { relationshipMap } = themeConfigs;

    if (!relationshipMap) return;

    const {
      targetTable = {},
      colsToCompare = {},
      isChangeTable,
      isChangeOperator,
      isChangeField,
      isChangeCompareField,
    } = step;

    const relatedTables = step[relatedTablesKey] || [];

    if (
      !isChangeTable &&
      !isChangeOperator &&
      !isChangeField &&
      !isChangeCompareField
    ) {
      return;
    }

    const { data: compareData = [] } = colsToCompare;

    const nodes = [];
    const links = [];
    const linksFrom = [];
    const linksTo = [];

    const { columns: targetColumns = [] } = targetTable;

    if (targetColumns.length == 0 || relatedTables.length == 0) return;

    const allTables = [targetTable, ...relatedTables];

    let left = 40;
    const nodeWidth = 250;

    allTables.forEach((table, tableIndex) => {
      const { columns = [] } = table;

      // if (columns.length == 0) return;

      let node;

      if (!isChangeTable && this.nodes[tableIndex]) {
        node = this.nodes[tableIndex];
      } else {
        node = new AdvancedNodeModel({
          name: table.display_name,
          tableName: table.name,
          tableId: table.id,
          tableIndex,
          isLookup: tableIndex > 0,
          background: relationshipMap.nodeBackground,
          titleColor: relationshipMap.titleColor,
          border: relationshipMap.border,
        });

        node.setPosition(left, 0);
        left += nodeWidth;

        columns.forEach((col, colIndex) => {
          const portConfigs = {
            name: col.display_name,
            colName: col.name,
            dataType: col.data_type,
            tableName: table.name,
            tableId: table.id,
            type: 'advanced',
            tableIndex,
            colIndex,
            in: false,
            portInColor: relationshipMap.portInColor,
            linkColor: relationshipMap.portInColor,
            border: relationshipMap.border,
            showDelete,
            onRemoveRelation: showDelete && this.onRemoveRelation,
          };

          node.addPort(new AdvancedPortModel({ ...portConfigs, in: true }));
          node.addPort(new AdvancedPortModel({ ...portConfigs, out: true }));
        });
      }

      if (!node) return;

      const verifyRelation = compareCol => {
        if (compareCol.data && Array.isArray(compareCol.data)) {
          compareCol.data.forEach(verifyRelation);
          return;
        }

        const { compareField = {} } = compareCol;

        const connectedNodeFrom = columns.find(col => {
          return (
            col.user_table_id == compareCol.user_table_id &&
            col.name == compareCol.name
          );
        });

        const connectedNodeTo = columns.find(col => {
          return (
            col.user_table_id == compareField.user_table_id &&
            col.name == compareField.name
          );
        });

        if (connectedNodeFrom && node.ports[connectedNodeFrom.display_name]) {
          linksFrom.push({
            port: node.ports[connectedNodeFrom.display_name],
            compareCol,
          });
        }

        if (connectedNodeTo && node.ports[connectedNodeTo.display_name]) {
          linksTo.push({
            port: node.ports[connectedNodeTo.display_name],
            compareCol,
          });
        }
      };

      compareData.forEach(verifyRelation);

      nodes.push(node);
    });

    linksFrom.forEach(({ port: portFrom, compareCol: compareColFrom = {} }) => {
      const { compareField: compareFieldFrom = {} } = compareColFrom;

      const portTo = linksTo.find(({ compareCol: compareColTo = {} }) => {
        const { compareField: compareFieldTo = {} } = compareColTo;

        return (
          compareColFrom.user_table_id == compareColTo.user_table_id &&
          compareColFrom.name == compareColTo.name &&
          compareFieldFrom.user_table_id == compareFieldTo.user_table_id &&
          compareFieldFrom.name == compareFieldTo.name
        );
      });

      if (portTo) {
        const link = portFrom.link(portTo.port);
        links.push(link);
      }
    });

    const model = new DiagramModel();
    model.addAll(...nodes, ...links);

    const linkEvents = evt => {
      if (evt.isCreated) {
        evt.link.registerListener({
          targetPortChanged: this.onTargetPortChanged,
        });
      }
    };

    model.registerListener({ linksUpdated: linkEvents });

    this.engine.setModel(model);
    this.nodes = nodes;

    if (this.resetCheckTimeout) clearTimeout(this.resetCheckTimeout);
    this.resetCheckTimeout = setTimeout(this.resetChecks, 200);
  };

  /**
   * Reset Checks
   */
  resetChecks = () => {
    const { step, setStepData } = this.props;

    step.isChangeTable = false;
    step.isChangeOperator = false;
    step.isChangeField = false;
    step.isChangeCompareField = false;

    setStepData(step);
  };

  /**
   * Handle Remove Relation
   *
   * @param {Object}
   */
  onRemoveRelation = ({ options }) => {
    const { step, setStepData } = this.props;
    const { tableName, colName } = options;

    const data = step.colsToCompare.data
      .map(col => {
        if (col.tableName == tableName && col.name == colName) {
          return null;
        }

        const { compareField = {} } = col;
        if (
          compareField.tableName == tableName &&
          compareField.name == colName
        ) {
          return null;
        }

        return col;
      })
      .filter(Boolean);

    step.colsToCompare.data = data;

    const newStep = {
      ...step,
      isChangeField: true,
    };

    setStepData(newStep);
  };

  /**
   * Handle > On Target Port Changed
   *
   * @param {Object} evt
   */
  onTargetPortChanged = evt => {
    if (!evt) return;

    const { sourcePort, targetPort } = evt.entity || {};

    if (!sourcePort || !targetPort) return;

    if (this.props.uniqueRelation) {
      if (
        Object.keys(sourcePort.links || {}).length > 1 ||
        Object.keys(targetPort.links || {}).length > 1
      ) {
        const { links } = evt.port || {};
        const linkKeys = Object.keys(links);
        const lastLink = links[linkKeys[linkKeys.length - 1]] || null;

        if (lastLink) {
          lastLink.remove();
          showErrorMsg(PROCESS_MANAGER_MSG.multi_relation_one_col);
          return;
        }
      }
    }

    const {
      options: { tableIndex: sourceTableIndex, colIndex: sourceColIndex },
    } = sourcePort || {};

    const {
      options: { tableIndex: targetTableIndex, colIndex: targetColIndex },
    } = targetPort || {};

    const { step, setStepData } = this.props;
    const { targetTable: targetTableStep = {}, colsToCompare = {} } = step;

    const relatedTables = step[this.props.relatedTablesKey] || [];

    const allTables = [targetTableStep, ...relatedTables];

    const sourceTable = allTables[sourceTableIndex];
    const targetTable = allTables[targetTableIndex];

    const sourceCol = sourceTable.columns[sourceColIndex];
    const targetCol = targetTable.columns[targetColIndex];

    if (!sourceCol || !targetCol) return;

    if (sourceCol.data_type != targetCol.data_type) return;

    if (!colsToCompare.data) colsToCompare.data = [];
    if (!colsToCompare.relation) colsToCompare.relation = 'AND';

    const compareCol = {
      ...sourceCol,
      compareField: { ...targetCol },
      compareType: 'Column',
      operator: '=',
    };

    // Remove first condtion if condition is empty
    if (colsToCompare.data.length == 1) {
      const [firstCompareCol] = colsToCompare.data;
      if (!firstCompareCol.name && !firstCompareCol.operator) {
        colsToCompare.data.splice(0, 1);
      }
    }

    colsToCompare.data.push(compareCol);
    step.colsToCompare = colsToCompare;
    step.isChangeField = true;

    setStepData(step);
  };

  /**
   * Render View
   */
  render() {
    this.execute();

    if (this.nodes.length == 0) return null;

    const { stepNumber, fromProcess, height } = this.props;
    const { showMap, isFullScreen } = this.state;

    const { height: screenHeight } = window.screen || {};

    return (
      <Box
        className="relationship-map-node"
        id={`rl-map-full-screen-${stepNumber}`}
      >
        {fromProcess && (
          <Box mb={3} mt={2}>
            <Divider />
          </Box>
        )}

        {fromProcess && (
          <Box
            mb={2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography>How is the data related?</Typography>

            {!isFullScreen && (
              <Link onClick={this.toggleMap} className="cursor-pointer">
                <Box display="flex" alignItems="center">
                  Relationship Map
                  {showMap ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </Box>
              </Link>
            )}
          </Box>
        )}

        <ReactFullscreen onChange={this.handleFullScreenChange}>
          {({ ref, onRequest, onExit }) => (
            <div ref={ref}>
              <Collapse in={showMap}>
                <Box bgcolor="secondary.processTable" borderRadius={4}>
                  <Box p={3} justifyContent="space-between" display="flex">
                    <Typography variant="body1">Relationship Map</Typography>
                    <Box ml={1} className="cursor-pointer">
                      <Tooltip
                        title={`${
                          isFullScreen ? 'Exit' : 'Open'
                        } full-screen mode`}
                        arrow
                      >
                        {isFullScreen ? (
                          <FullscreenExitIcon
                            onClick={this.closeFullScreen(onExit)}
                          />
                        ) : (
                          <FullscreenIcon
                            onClick={this.openFullScreen(onRequest)}
                          />
                        )}
                      </Tooltip>
                    </Box>
                  </Box>
                  <CustomScrollbars
                    style={{
                      width: '100%',
                      height: isFullScreen ? screenHeight - 80 : height,
                    }}
                  >
                    <Box
                      className="relationship-map"
                      style={{
                        height: isFullScreen ? window.outerHeight : height,
                      }}
                    >
                      <CanvasWidget
                        className="relationship-scroll"
                        engine={this.engine}
                      />
                    </Box>
                  </CustomScrollbars>
                </Box>
              </Collapse>
            </div>
          )}
        </ReactFullscreen>
      </Box>
    );
  }
}

RelationshipMap.propTypes = {
  fromProcess: bool,
  height: any,
  relatedTablesKey: string,
  setStepData: func.isRequired,
  showDelete: bool,
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  theme: string,
  uniqueRelation: bool,
};

RelationshipMap.defaultProps = {
  fromProcess: true,
  showDelete: false,
  uniqueRelation: false,
  height: 400,
  relatedTablesKey: 'lookupTables',
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(RelationshipMap);
