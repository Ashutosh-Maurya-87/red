import React from 'react';
import { shape, any, func, bool } from 'prop-types';

import {
  Card,
  Grid,
  Typography,
  Box,
  withStyles,
  CardActions,
  Chip,
} from '@material-ui/core';
import ImgRenderer from '../ImgRenderer';

import { styles } from './styles';
import './styles.scss';

const ThumbnailSelector = ({
  table,
  selectedTable,
  classes: { tableSelected = '', sourceGrid = '', assignLabel = '' } = {},
  onSelect,
  isDisplayScenarioLabel,
}) => {
  const {
    scenario = {},
    id = '',
    display_name = '',
    label = '',
    dimension = {},
  } = table || {};

  const handleTable = () => onSelect(table);
  const labelDisplay =
    isDisplayScenarioLabel && scenario ? scenario?.label : label;
  return (
    <Card
      className={`card-view env-card ${
        selectedTable == id ? tableSelected : ''
      }`}
      onClick={handleTable}
    >
      <Grid
        className={`center-icon ${sourceGrid}`}
        container
        direction="row"
        justify="center"
        alignItems="center"
      >
        <ImgRenderer src="sheet.svg" />
        {labelDisplay && !dimension && (
          <Chip
            color="primary"
            size="small"
            label={labelDisplay}
            className={assignLabel}
          />
        )}
      </Grid>

      <Box>
        <CardActions className="source-card">
          <Typography display="block" variant="subtitle1" noWrap>
            {display_name || '--'}
          </Typography>
        </CardActions>
      </Box>
    </Card>
  );
};

ThumbnailSelector.propTypes = {
  isDisplayScenarioLabel: bool,
  onSelect: func.isRequired,
  selectedTable: any,
  table: shape({}),
};

export default withStyles(styles)(ThumbnailSelector);
