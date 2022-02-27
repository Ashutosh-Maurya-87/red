import React from 'react';
import { arrayOf, func, string, shape } from 'prop-types';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  withStyles,
} from '@material-ui/core';
import ImgRenderer from '../../../../components/ImgRenderer';

import { styles } from './styles';

function SelectFieldDialog({ title, fields, onDone, onCancel, classes }) {
  const handleDone = field => () => {
    onDone(field);
  };

  return (
    <Dialog open onClose={onCancel} size="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className={classes.container}>
        <Box mb={2} overflow="hidden">
          {fields.map(field => {
            return (
              <Typography variant="body2" color="textSecondary" key={field.id}>
                <Box
                  display="flex"
                  alignItems="center"
                  py={1}
                  mb={1}
                  component="span"
                  fontSize="inherit"
                  className={classes.fieldsList}
                  onClick={handleDone(field)}
                >
                  <ImgRenderer src={`${field.data_type}.svg`} alt="" />
                  &nbsp; &nbsp;
                  {field.display_name || '--'}
                </Box>
              </Typography>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SelectFieldDialog.propTypes = {
  fields: arrayOf(shape({})),
  onCancel: func.isRequired,
  onDone: func.isRequired,
  title: string,
};

SelectFieldDialog.defaultProps = {
  fields: [],
  title: 'Select Field',
};

export default withStyles(styles)(SelectFieldDialog);
