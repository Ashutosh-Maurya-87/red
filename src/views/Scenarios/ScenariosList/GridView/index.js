import React from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, shape, func, bool } from 'prop-types';
import moment from 'moment';

import {
  Card,
  Grid,
  CardActions,
  Typography,
  Box,
  withStyles,
  Tooltip,
  Chip,
} from '@material-ui/core';

import { APP_ROUTES } from '../../../../configs/routes';

import ImgRenderer from '../../../../components/ImgRenderer';
import GridViewLoader from '../../../../components/ContentLoaders/GridViewLoader';
import ScenarioListActions from '../Actions';
import { SCENARIO_ACTIONS } from '../configs';

import { styles } from './styles';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function ScenarioGridView({
  list,
  classes,
  history,
  updateList,
  isArchived,
  onActionCompleted,
  showLoader,
}) {
  const goToViewScenario = id => () => {
    logAmplitudeEvent('Open scenario');
    if (isArchived) return;

    history.push(APP_ROUTES.VIEW_SCENARIO.replace(':id', id));
  };

  return (
    <Grid
      container
      direction="row"
      justify="flex-start"
      alignItems="flex-start"
      className="thumb-view"
    >
      {list.map(scenario => {
        const {
          id,
          created_at,
          scenario_meta: { dataset_name: name = '' } = {},
          label,
        } = scenario;

        return (
          <Card className="card-view" key={id}>
            <Grid
              className={`center-icon ${classes.sourceGrid}`}
              container
              direction="row"
              justify="center"
              alignItems="center"
              onDoubleClick={goToViewScenario(id)}
            >
              <ImgRenderer src="scenario.svg" className={classes.thumb} />
              {label && (
                <Chip
                  color="primary"
                  size="small"
                  label={label}
                  className={classes.assignLabel}
                />
              )}
            </Grid>
            <Box>
              <CardActions className="source-card">
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  justify="space-between"
                  alignItems="center"
                >
                  <ScenarioListActions
                    scenario={scenario}
                    list={list}
                    setList={updateList}
                    isArchived={isArchived}
                    onActionCompleted={onActionCompleted}
                  >
                    {handleAction => (
                      <Box>
                        <Grid container direction="column">
                          <Tooltip
                            title={name || ''}
                            placement="top"
                            arrow
                            interactive
                          >
                            <Typography
                              display="block"
                              variant="subtitle1"
                              noWrap
                              className="source-table-title"
                              onDoubleClick={handleAction(
                                SCENARIO_ACTIONS.rename
                              )}
                            >
                              {name || '--'}
                            </Typography>
                          </Tooltip>

                          <Typography
                            display="block"
                            variant="caption"
                            color="textSecondary"
                          >
                            {created_at
                              ? moment.utc(created_at).local().calendar()
                              : '--'}
                          </Typography>
                        </Grid>
                      </Box>
                    )}
                  </ScenarioListActions>
                </Grid>
              </CardActions>
            </Box>
          </Card>
        );
      })}

      {list.length > 0 && showLoader && (
        <Card className="card-view">
          <Grid
            className={`center-icon ${classes.sourceGrid}`}
            container
            direction="row"
            justify="center"
            alignItems="center"
          >
            {' '}
            <GridViewLoader />
          </Grid>
        </Card>
      )}
    </Grid>
  );
}

ScenarioGridView.propTypes = {
  isArchived: bool.isRequired,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

ScenarioGridView.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(withStyles(styles)(ScenarioGridView));
