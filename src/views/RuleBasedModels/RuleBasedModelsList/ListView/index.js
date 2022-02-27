import React from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, shape, bool, func } from 'prop-types';

import {
  Grid,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@material-ui/core';

import ImgRenderer from '../../../../components/ImgRenderer';
import ListViewLoader from '../../../../components/ContentLoaders/ListViewLoader';

import { APP_ROUTES } from '../../../../configs/routes';
import RuleBasedModelsListActions from '../Actions';

function RuleBasedModelListView({
  list,
  isArchived,
  history,
  updateList,
  onActionCompleted,
  showLoader,
}) {
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
    >
      <TableContainer component={Paper} className="list-view-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rule Based Model Name</TableCell>

              <TableCell>Scenario Name</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {list.map(ruleBasedModel => {
              const {
                id,
                name,
                createdAt,
                updatedAt,
                scenario,
              } = ruleBasedModel;

              const { name: scenarioName = '' } = scenario || {};

              return (
                <TableRow key={id}>
                  <TableCell component="th">
                    <Box
                      className="cursor-pointer"
                      direction="row"
                      display="flex"
                      alignItems="center"
                      onDoubleClick={goToRuleBasedModelWorksheet(id)}
                    >
                      <ImgRenderer
                        style={{ height: '18px', width: '19px' }}
                        src="rule-based-forecasting.svg"
                      />
                      <Box ml={1}>
                        <Typography display="inline" variant="subtitle2">
                          {name || '--'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>{scenarioName || '--'}</TableCell>
                  <TableCell>{createdAt ? createdAt : '--'}</TableCell>
                  <TableCell>{updatedAt ? updatedAt : '--'}</TableCell>

                  <TableCell>
                    <RuleBasedModelsListActions
                      ruleBasedModel={ruleBasedModel}
                      list={list}
                      setList={updateList}
                      isArchived={isArchived}
                      onActionCompleted={onActionCompleted}
                    />
                  </TableCell>
                </TableRow>
              );
            })}

            {list.length > 0 && showLoader && (
              <TableRow>
                <TableCell component="th" colSpan={5}>
                  <ListViewLoader />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
}

RuleBasedModelListView.propTypes = {
  isArchived: bool.isRequired,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

RuleBasedModelListView.defaultProps = {
  list: [],
  onActionCompleted: () => {},
};

export default withRouter(RuleBasedModelListView);
