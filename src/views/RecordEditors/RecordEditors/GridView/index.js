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
import RecordEditorThumbnailActions, {
  RECORD_EDITOR_ACTIONS,
} from '../Actions';

import { styles } from './styles';

function RecordEditorGridView({
  list,
  classes,
  history,
  updateList,
  isArchived,
  onActionCompleted,
  showLoader,
}) {
  const goToView = id => () => {
    if (isArchived) return;

    history.push(APP_ROUTES.EDIT_RECORD_EDITOR.replace(':id', id));
  };

  return (
    <Grid
      container
      direction="row"
      justify="flex-start"
      alignItems="flex-start"
      className="thumb-view"
    >
      {list.map((item, index) => {
        const { id, name, updated_at, srcName, srcIcon, label = '' } =
          item || {};

        return (
          <Card className="card-view" key={id}>
            <Grid
              className={`center-icon ${classes.sourceGrid}`}
              container
              direction="row"
              justify="center"
              alignItems="center"
              onDoubleClick={goToView(id)}
            >
              <ImgRenderer src="record-editor.svg" className={classes.thumb} />
              {label && (
                <Chip
                  color="primary"
                  size="small"
                  label={label || ''}
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
                  <RecordEditorThumbnailActions
                    item={item}
                    index={index}
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
                                RECORD_EDITOR_ACTIONS.rename
                              )}
                            >
                              {name || '--'}
                            </Typography>
                          </Tooltip>

                          <Tooltip
                            title={srcName || ''}
                            placement="bottom"
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
                          <Typography
                            display="block"
                            variant="caption"
                            color="textSecondary"
                          >
                            {updated_at
                              ? moment.utc(updated_at).local().calendar()
                              : '--'}
                          </Typography>
                        </Grid>
                      </Box>
                    )}
                  </RecordEditorThumbnailActions>
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

RecordEditorGridView.propTypes = {
  isArchived: bool.isRequired,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

RecordEditorGridView.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(withStyles(styles)(RecordEditorGridView));
