import React from 'react';
import { arrayOf, func, shape, string, oneOfType, number } from 'prop-types';

import { Box, ListItem } from '@material-ui/core';
import { DeleteOutline as DeleteOutlineIcon } from '@material-ui/icons';

import './styles.scss';

const AssumptionsListView = ({
  assumptions,
  assumption,
  onSelect,
  onDelete,
  deletingId,
}) => {
  return (
    <Box>
      {assumptions.map((item, index) => {
        const { id, name } = item;

        return (
          <ListItem
            key={index}
            className={`sidebar-menu ${
              id == assumption.id ? 'selected' : 'cursor-pointer'
            } ${deletingId == assumption.id ? 'cursor-not-allowed' : ''}`}
            onClick={onSelect(item)}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <a className="menu-link">{name}</a>

              <Box
                display="flex"
                className="delete-icon cursor-pointer"
                onClick={onDelete(item)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </Box>
            </Box>
          </ListItem>
        );
      })}
    </Box>
  );
};

AssumptionsListView.propTypes = {
  assumption: shape({}),
  assumptions: arrayOf(shape({})),
  deletingId: oneOfType([string, number]),
  onDelete: func.isRequired,
  onSelect: func.isRequired,
};

AssumptionsListView.defaultProps = {
  assumption: {},
  assumptions: [],
  deletingId: '',
};

export default AssumptionsListView;
