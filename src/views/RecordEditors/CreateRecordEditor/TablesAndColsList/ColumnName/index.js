import React from 'react';
import { shape } from 'prop-types';
import { Box, Typography, withStyles } from '@material-ui/core';

import { DragIndicator as DragIndicatorIcon } from '@material-ui/icons';
import ImgRenderer from '../../../../../components/ImgRenderer';

import { styles } from './styles';

const ColumnName = ({ classes, column }) => {
  return (
    <Typography
      variant="body2"
      color="textSecondary"
      className={column.isAdded ? 'disabled' : ''}
    >
      <Box
        className={`${classes.createDialogGrid} create-dialog-grid editor-drag-fields`}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={0}
        component="span"
        fontSize="inherit"
      >
        <Box component="span" alignItems="center" display="flex">
          <DragIndicatorIcon className={classes.fieldDragIcon} />

          {column.display_name || ''}
        </Box>

        {column.data_type && <ImgRenderer src={`${column.data_type}.svg`} />}
      </Box>
    </Typography>
  );
};

ColumnName.propTypes = {
  column: shape({}),
};

export default withStyles(styles)(ColumnName);
