import React from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, bool, func, shape } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import moment from 'moment';

import {
  Card,
  Grid,
  CardActions,
  Typography,
  Box,
  Tooltip,
  withStyles,
  Chip,
} from '@material-ui/core';

import { getTablesList } from '../../../../reducers/SourceTables/selectors';

import ImgRenderer from '../../../../components/ImgRenderer';
import GridViewLoader from '../../../../components/ContentLoaders/GridViewLoader';

import SourceTableActions, { TABLE_ACTIONS } from '../Actions';

import { APP_ROUTES } from '../../../../configs/routes';

import { styles } from './styles';

function SourceTablesThumbnailView({
  tablesList,
  history,
  classes,
  onActionCompleted,
  showLoader,
}) {
  const goToViewTable = id => () => {
    const route = APP_ROUTES.VIEW_SOURCE_TABLE.replace(':id', id);
    history.push(route);
  };

  return (
    <>
      <Box>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
          className="thumb-view"
        >
          {tablesList.map((table, index) => {
            const { id, display_name, created_at, label = '' } = table;

            return (
              <Card className="card-view" key={id}>
                <Grid
                  className={`center-icon ${classes.sourceGrid}`}
                  container
                  direction="row"
                  justify="center"
                  alignItems="center"
                  onDoubleClick={goToViewTable(id)}
                >
                  <ImgRenderer src="sheet.svg" className={classes.thumb} />
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
                      <SourceTableActions
                        table={table}
                        index={index}
                        onActionCompleted={onActionCompleted}
                      >
                        {handleAction => (
                          <Box>
                            <Grid container direction="column">
                              <Tooltip
                                title={display_name || ''}
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
                                    TABLE_ACTIONS.rename
                                  )}
                                >
                                  {display_name}
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
                      </SourceTableActions>
                    </Grid>
                  </CardActions>
                </Box>
              </Card>
            );
          })}

          {tablesList.length > 0 && showLoader && (
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
      </Box>
    </>
  );
}

SourceTablesThumbnailView.propTypes = {
  onActionCompleted: func.isRequired,
  showLoader: bool,
  tablesList: arrayOf(shape({})),
};

SourceTablesThumbnailView.defaultProps = {
  onActionCompleted: () => {},
};

const mapStateToProps = createStructuredSelector({
  tablesList: getTablesList(),
});

export default connect(
  mapStateToProps,
  {}
)(withRouter(withStyles(styles)(SourceTablesThumbnailView)));
