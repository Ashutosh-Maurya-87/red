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
} from '@material-ui/core';

import { PROCESS_ACTIONS } from '../configs';
import { APP_ROUTES } from '../../../../configs/routes';

import ImgRenderer from '../../../../components/ImgRenderer';
import GridViewLoader from '../../../../components/ContentLoaders/GridViewLoader';
import ProcessListActions from '../Actions';

import { styles } from './styles';

function ProcessesGridView({
  list,
  classes,
  history,
  updateList,
  onActionCompleted,
  showLoader,
}) {
  const goToViewProcess = id => () => {
    history.push(APP_ROUTES.EDIT_PROCESS.replace(':id', id));
  };

  return (
    <Grid
      container
      direction="row"
      justify="flex-start"
      alignItems="flex-start"
      className="thumb-view"
    >
      {list.map(process => {
        const {
          id,
          name,
          lastRunAt,
          createdAt,
          statusIcon: StatusIcon,
          statusClassName,
        } = process;

        return (
          <Card className="card-view" key={id}>
            <Grid
              className={`center-icon ${classes.sourceGrid}`}
              container
              direction="row"
              justify="center"
              alignItems="center"
              onDoubleClick={goToViewProcess(id)}
            >
              <ImgRenderer src="process-list.svg" />
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
                  <ProcessListActions
                    process={process}
                    list={list}
                    setList={updateList}
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
                              onDoubleClick={handleAction(PROCESS_ACTIONS[1])}
                            >
                              {name || '--'}
                            </Typography>
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
                  </ProcessListActions>
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

ProcessesGridView.propTypes = {
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

ProcessesGridView.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(withStyles(styles)(ProcessesGridView));
