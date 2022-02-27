import React from 'react';
import { withRouter } from 'react-router-dom';
import { any, shape, func, bool, string } from 'prop-types';
import { get } from 'lodash';
import { Box, Typography, Link } from '@material-ui/core';

import RelationshipMap from '../../../ProcessBuilder/CreateProcess/StepCard/RelationshipMap';
import Spinner from '../../../../components/Spinner';
import CreateScenarioFooter from '../Footer';

import { API_URLS } from '../../../../configs/api';
import { SCENARIOS_MSG } from '../../../../configs/messages';

import { httpGet } from '../../../../utils/http';
import { showErrorMsg } from '../../../../utils/notifications';
import { getColumnsOfSourceTable } from '../../../ProcessBuilder/CreateProcess/helper';
import { APP_ROUTES } from '../../../../configs/routes';

const RELATION_DATA_STR = {
  colsToCompare: {},
  targetTable: {},
  relatedTables: [],
};

class ScenarioRelationship extends React.Component {
  isSaved = true;

  isRalationSave = false;

  /**
   * State
   */
  state = {
    actualTable: {},
    relationData: { ...RELATION_DATA_STR },

    showLoader: false,
    hasActualData: true,
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
    try {
      this.setState({ showLoader: true });

      const { actual_data } = await httpGet(API_URLS.GET_FINANCIAL_ENV_DATA);

      if (!actual_data || !actual_data.source_id) {
        this.setState({ showLoader: false, hasActualData: false });
        return;
      }

      const { tableData, columns } = await getColumnsOfSourceTable(
        actual_data.source_id
      );

      const actualTable = { ...tableData, columns };

      this.setState({ actualTable, showLoader: false }, this.fillRelationData);
    } catch (err) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Fill Relation Data
   */
  fillRelationData = async () => {
    const { table, apiRelationData } = this.props;
    const { actualTable } = this.state;

    let { colsToCompare } = apiRelationData;

    if (Object.keys(apiRelationData).length == 0) {
      colsToCompare = this.getMappedCols();
    }

    const relationData = {
      ...RELATION_DATA_STR,
      targetTable: actualTable,
      relatedTables: [{ ...table }],
      colsToCompare,
      isChangeTable: true,
    };

    this.isRalationSave = true;
    this.setState({ relationData }, () => {
      this.changeIsRelationSave(false);
    });
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
   * Get Mapped Cols with Relation
   *
   * @return {Object}
   */
  getMappedCols = () => {
    const { actualTable } = this.state;
    const { table } = this.props;

    const cols = [];

    actualTable.columns.forEach(srcCol => {
      table.columns.forEach(targetCol => {
        if (
          srcCol.display_name == targetCol.display_name &&
          srcCol.data_type == targetCol.data_type
        ) {
          cols.push({
            ...srcCol,
            compareField: { ...targetCol },
          });
        }
      });
    });

    return { data: cols };
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
        if (this.props.isAutoSave) this.validateRelationship();
      }, 100);
    });
  };

  /**
   * Validate Relationship Data
   */
  validateRelationship = async () => {
    const { relationData } = this.state;
    const { onNext } = this.props;

    const hasRelations = get(relationData, 'colsToCompare.data.length') > 0;

    if (!hasRelations) {
      showErrorMsg(SCENARIOS_MSG.relationship_required);
      return;
    }

    const params = {
      relation: {
        colsToCompare: relationData.colsToCompare,
      },
    };

    onNext(params);
  };

  /**
   * Go To Route
   */
  goToRoute = route => evt => {
    if (evt) evt.preventDefault();

    this.props.history.push(route);
  };

  /**
   * Render View
   */
  render() {
    const {
      tableHeight,
      onBack,
      showLoader: isSaving,
      backText,
      nextText,
    } = this.props;

    const { showLoader, relationData, hasActualData } = this.state;

    if (showLoader) return <Spinner />;

    return (
      <>
        {isSaving && <Spinner />}

        {!hasActualData && (
          <Box textAlign="center" py={5}>
            <Typography>
              Please add Actuals Data in&nbsp;
              <Link
                className="cursor-pointer"
                onClick={this.goToRoute(APP_ROUTES.FINANCIAL_ENV_SETUP)}
              >
                Financial Environment Setup.
              </Link>
            </Typography>
          </Box>
        )}

        {hasActualData && (
          <>
            <Box px={3} mt={2} textAlign="center" fontSize="24px">
              <RelationshipMap
                setStepData={this.updateRelationData}
                step={relationData}
                stepNumber={0}
                fromProcess={false}
                showDelete
                uniqueRelation
                height={!nextText ? tableHeight + 50 : tableHeight}
                relatedTablesKey="relatedTables"
              />
            </Box>
            {nextText && (
              <CreateScenarioFooter
                backText={backText}
                nextText={nextText}
                onBack={onBack}
                onNext={this.validateRelationship}
              />
            )}
          </>
        )}
      </>
    );
  }
}

ScenarioRelationship.propTypes = {
  apiRelationData: shape({}),
  backText: string,
  isAutoSave: bool,
  nextText: string,
  onBack: func,
  onNext: func.isRequired,
  showLoader: bool.isRequired,
  table: shape({}),
  tableHeight: any,
};

ScenarioRelationship.defaultProps = {
  apiRelationData: {},
  backText: 'Back',
  nextText: 'Create',
  isAutoSave: false,
  onBack: () => {},
};

export default withRouter(ScenarioRelationship);
