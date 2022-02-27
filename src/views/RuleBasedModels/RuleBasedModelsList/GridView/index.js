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
import GridViewLoader from '../../../../components/ContentLoaders/GridViewLoader';
import RuleBasedModelsListActions from '../Actions';
import { RULE_BASED_MODEL_ACTIONS } from '../../configs';

import { styles } from './styles';

function RuleBasedModelGridView({
  list,
  classes,
  history,
  updateList,
  isArchived,
  onActionCompleted,
  showLoader,
}) {
  const { sourceGrid = '', thumb = '', srcIcon: sourceIcon = '' } =
    classes || {};

  const goToRuleBasedModelWorksheet = id => () => {
    if (isArchived) return;

    history.push(APP_ROUTES.RULE_BASED_MODEL.replace(':id', id));
  };

  return (
    <Grid
      container
      direction="row"
      justify="flex-start"
      alignItems="flex-start"
      className="thumb-view"
    >
      {list.map((ruleBasedModel, index) => {
        const {
          id,
          name,
          scenario,
          srcIcon,
          srcName,
          createdAt,
          label = '',
        } = ruleBasedModel;

        const { name: scenarioName = '' } = scenario || {};

        return (
          <Card className="card-view" key={id}>
            <Grid
              className={`center-icon ${sourceGrid}`}
              container
              direction="row"
              justify="center"
              alignItems="center"
              onDoubleClick={goToRuleBasedModelWorksheet(id)}
            >
              <ImgRenderer src="rule-based-forecasting.svg" className={thumb} />
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
              <CardActions className="source-card position-relative">
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  justify="space-between"
                  alignItems="center"
                >
                  <RuleBasedModelsListActions
                    ruleBasedModel={ruleBasedModel}
                    list={list}
                    index={index}
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
                                RULE_BASED_MODEL_ACTIONS.rename
                              )}
                            >
                              {name || '--'}
                            </Typography>
                          </Tooltip>

                          {/* Scenario */}
                          <Tooltip
                            title={srcName || ''}
                            placement="top"
                            arrow
                            interactive
                          >
                            <Box display="flex" alignItems="center">
                              {srcIcon && (
                                <ImgRenderer
                                  className={sourceIcon}
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
                                {scenarioName || '--'}
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
                          </Box>
                        </Grid>
                      </Box>
                    )}
                  </RuleBasedModelsListActions>
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

RuleBasedModelGridView.propTypes = {
  isArchived: bool.isRequired,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

RuleBasedModelGridView.defaultProps = {
  onActionCompleted: () => {},
};

export default withRouter(withStyles(styles)(RuleBasedModelGridView));
