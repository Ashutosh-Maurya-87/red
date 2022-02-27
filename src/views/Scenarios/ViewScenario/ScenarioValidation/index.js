import React, { useCallback, useEffect, useState } from 'react';
import { number, oneOfType, string } from 'prop-types';

import {
  Box,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Grid,
  Typography,
} from '@material-ui/core';
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

import { API_URLS } from '../../../../configs/api';
import { PRE_DEFINED_LABELS } from '../../../../configs/app';

import Spinner from '../../../../components/Spinner';
import NoErrorFound from '../../../../components/NoErrorFound';

import { httpGet } from '../../../../utils/http';

const ScenarioValidation = ({ scenarioId }) => {
  // States
  const [scenarioData, setScenarioData] = useState([]);
  const [showLoader, setLoader] = useState(false);

  /**
   * Fetch all the data in which are having error
   *
   * @returns {Array} data
   */
  const fetchValidatedScenario = async () => {
    try {
      if (showLoader) return;

      setLoader(true);
      const url = API_URLS.SCENARIO_VALIDATION.replace('#ID#', scenarioId);

      const { data = {} } = await httpGet(url);

      setScenarioData(data);
      setLoader(false);
    } catch (error) {
      console.error(error);
      setLoader(false);
    }
  };

  /**
   * Call back function to call api to fetch data
   */
  const getDataCallBack = useCallback(fetchValidatedScenario, []);

  /**
   *  Component did mount
   */
  useEffect(() => {
    getDataCallBack();
  }, [getDataCallBack]);

  return (
    <Box px={3} className="scenario-validation">
      {showLoader && <Spinner />}
      <Grid container>
        <Grid item xs={12} sm={12} md={7}>
          {scenarioData &&
            scenarioData.length > 0 &&
            scenarioData.map((scenario, sceIndex) => {
              const {
                display_name = '',
                dimension: { name = '' } = {},
                values = [],
              } = scenario || {};

              return (
                <>
                  {values && values.length > 0 && !showLoader && (
                    <ExpansionPanel
                      className="field-expansion-panel"
                      key={sceIndex}
                    >
                      <ExpansionPanelSummary
                        key={sceIndex}
                        className="field-expansion-panel-summary"
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel-content"
                        id="panel-header"
                      >
                        {display_name} ({name})
                      </ExpansionPanelSummary>

                      <ExpansionPanelDetails
                        className="field-expansion-panel-detail"
                        key={sceIndex}
                      >
                        <Grid container>
                          {values.length > 0 &&
                            values.map((value = '', index) => {
                              return (
                                <Grid item xs={12} sm={12} md={6} key={index}>
                                  <Typography
                                    key={index}
                                    variant="caption"
                                    noWrap
                                    gutterBottom
                                  >
                                    {value}
                                  </Typography>
                                </Grid>
                              );
                            })}
                        </Grid>
                      </ExpansionPanelDetails>
                    </ExpansionPanel>
                  )}
                </>
              );
            })}
        </Grid>
      </Grid>

      {/* When there is no Value in the scenario */}
      {!showLoader &&
        scenarioData.length == 1 &&
        scenarioData.map(({ values }, index) => {
          return (
            values.length == 0 && (
              <NoErrorFound
                key={index}
                type={`${PRE_DEFINED_LABELS.scenarios.label}`}
              />
            )
          );
        })}

      {/* When there is no error in scenario */}
      {scenarioData.length == 0 && !showLoader && (
        <NoErrorFound type={`${PRE_DEFINED_LABELS.scenarios.label}`} />
      )}
    </Box>
  );
};

// Props validation
ScenarioValidation.propTypes = {
  scenarioId: oneOfType([number, string]).isRequired,
};

// Default Props
ScenarioValidation.defaultProps = {
  scenarioId: '' || 0,
};

export default ScenarioValidation;
