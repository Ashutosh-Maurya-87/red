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
import ModelsListActions from '../Actions';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function ModelsListView({
  list,
  isArchived,
  history,
  updateList,
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
    >
      <TableContainer component={Paper} className="list-view-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model Name</TableCell>
              <TableCell>Scenario Name</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {list.map(model => {
              const {
                id,
                name,
                srcName,
                statusClassName,
                statusIcon: StatusIcon,
                createdAt,
                updatedAt,
                lastRunAt,
              } = model;

              return (
                <TableRow key={id}>
                  <TableCell component="th">
                    <Box
                      className="cursor-pointer"
                      direction="row"
                      display="flex"
                      alignItems="center"
                      onDoubleClick={goToModelWorksheet(id)}
                    >
                      <ImgRenderer
                        style={{ height: '18px', width: '19px' }}
                        src="model.svg"
                      />
                      <Box ml={1}>
                        <Typography display="inline" variant="subtitle2">
                          {name || '--'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{srcName || '--'}</TableCell>
                  <TableCell>{createdAt ? createdAt : '--'}</TableCell>
                  <TableCell>{updatedAt ? updatedAt : '--'}</TableCell>
                  <TableCell>
                    <span className={`last-executed-status ${statusClassName}`}>
                      {StatusIcon && <StatusIcon fontSize="small" />}
                    </span>
                    {lastRunAt ? lastRunAt : '--'}
                  </TableCell>
                  <TableCell>
                    <ModelsListActions
                      model={model}
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
                <TableCell component="th" colSpan={6}>
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

ModelsListView.propTypes = {
  isArchived: bool.isRequired,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  showLoader: bool,
  updateList: func.isRequired,
};

ModelsListView.defaultProps = {
  list: [],
  onActionCompleted: () => {},
};

export default withRouter(ModelsListView);
