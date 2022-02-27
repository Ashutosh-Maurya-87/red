import React from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, shape, func, bool } from 'prop-types';

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
import ModelsListActions, { MODEL_ACTIONS } from '../Actions';

import { styles } from './styles';
import { logAmplitudeEvent } from '../../../../utils/amplitude';
import GridViewLoader from '../../../../components/ContentLoaders/GridViewLoader';

function ModelGridView({
  list,
  classes,
  history,
  updateList,
  isArchived,
  onActionCompleted,
  showLoader,
}) {
  const goToModelWorksheet = id => () => {
    logAmplitudeEvent('Open model');
    if (isArchived) return;

    history.push(APP_ROUTES.MODELS_WORKBOOK.replace(':id', id));
  };

  return (
    <Grid
      container
      direction="row"
      justify="flex-start"
      alignItems="flex-start"
      className="thumb-view"
    >
      {list.map(model => {
        const {
          id,
          name,
          scenario,
          srcIcon,
          srcName,
          statusClassName,
          statusIcon: StatusIcon,
          createdAt,
          lastRunAt,
        } = model;

        return (
          <Card className="card-view" key={id}>
            <Grid
              className={`center-icon ${classes.sourceGrid}`}
              container
              direction="row"
              justify="center"
              alignItems="center"
              onDoubleClick={goToModelWorksheet(id)}
            >
              <ImgRenderer src="model.svg" className={classes.thumb} />
              {scenario && scenario.label && (
                <Chip
                  color="primary"
                  size="small"
                  label={scenario.label}
                  className={classes.assignLabel}
                />
              )}
            </Grid>

            <Box>
              <CardActions className="source-card position-relative">
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  justify="space-between"
                  alignItems="center"
                >
                  <ModelsListActions
                    model={model}
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
                              onDoubleClick={handleAction(MODEL_ACTIONS.rename)}
                            >
                              {name || '--'}
                            </Typography>
                          </Tooltip>
                          <Tooltip
                            title={srcName || ''}
                            placement="top"
                            arrow
                            interactive
                          >
                            <Box display="flex" alignItems="center">
                              {srcIcon && (
                                <ImgRenderer
                                  className={classes.srcIcon}
                                  src={srcIcon}
                                />
                              )}
                              <Typography
                                display="block"
                                variant="caption"
                                color="textSecondary"
                                className="source-table-title"
                                noWrap
                              >
                                {srcName || '--'}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Box>
                            <Tooltip
                              title={createdAt ? createdAt : '--'}
                              placement="bottom"
                              arrow
                            >
                              <Typography
                                display="block"
                                variant="caption"
                                noWrap
                                color="textSecondary"
                                className="source-table-title"
                              >
                                Last Modified -&nbsp;
                                {createdAt ? createdAt : '--'}
                              </Typography>
                            </Tooltip>

                            <Tooltip
                              title={lastRunAt ? lastRunAt : '--'}
                              placement="bottom"
                              arrow
                            >
                              <Typography
                                display="block"
                                variant="caption"
                                noWrap
                                color="textSecondary"
                                className="source-table-title"
                              >
                                {StatusIcon && (
                                  <>
                                    Last Run -&nbsp;
                                    <span
                                      className={`last-executed-status ${statusClassName}`}
                                    >
                                      {StatusIcon && (
                                        <StatusIcon fontSize="small" />
                                      )}
                                    </span>
                                  </>
                                )}
                                {lastRunAt ? lastRunAt : '--'}
                              </Typography>
                            </Tooltip>
                          </Box>
                        </Grid>
                      </Box>
                    )}
                  </ModelsListActions>
                </Grid>
              </CardActions>
            </Box>
          </Card>
        );
      })}

      {list.length > 0 && showLoader && (
        <Card className="card-view">
          <Grid
            className={`center-icon ${classes.sourceGrid} ${classes.contentLoader}`}
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

ModelGridView.propTypes = {
  isArchived: bool.isRequired,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

ModelGridView.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(withStyles(styles)(ModelGridView));
