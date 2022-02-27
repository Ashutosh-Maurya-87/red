import React from 'react';
import { shape } from 'prop-types';
import { Box } from '@material-ui/core';

import {
  DELETE_TYPE_ACTION_KEYS,
  COMPARE_OPERATOR_LABELS,
  COMPARE_FIELD_KEYS,
} from '../../configs';

function DeleteTableEnglishQuery({ step }) {
  return (
    <Box>
      <Box>{getQuery(step)}</Box>
    </Box>
  );
}

function getQuery(step) {
  const { targetTable = {}, colsToDelete = {}, dropColumns = [] } = step;
  const { display_name = '', columns = [] } = targetTable;

  switch (step.actionType) {
    case DELETE_TYPE_ACTION_KEYS.clearAll:
      return (
        <Box>
          Clear all the data from the table&nbsp;
          <i>{display_name || '<Table Name>'}</i>
        </Box>
      );

    case DELETE_TYPE_ACTION_KEYS.clearSelected:
      const { data = [] } = colsToDelete;

      const getCondtion = ({ rel, total }) => (col, i) => {
        if (Array.isArray(col.data)) {
          return (
            <Box pl={3} key={`${col.display_name}-${i}`}>
              {col.data.map(
                getCondtion({ rel: col.relation, total: col.data.length })
              )}
            </Box>
          );
        }

        return (
          <Box pl={3} key={`${col.display_name}-${i}`}>
            <i>{col.display_name || '<Column Name>'}&nbsp;</i>
            {COMPARE_OPERATOR_LABELS[col.operator] || '<Operator>'}&nbsp;
            {col.operator != COMPARE_FIELD_KEYS.between && (
              <i>{col.value || '<Value>'}</i>
            )}
            {col.operator == COMPARE_FIELD_KEYS.between && (
              <>
                <i>{col.value[0] || '<Value 1>'}</i> and&nbsp;
                <i>{col.value[1] || '<Value 2>'}</i>
              </>
            )}
            &nbsp;
            {i < total - 1 && rel}
          </Box>
        );
      };

      return (
        <Box>
          Clear data from the table:&nbsp;
          <i>{display_name ? display_name : '<Table Name>'}</i>&nbsp;where
          <Box>
            {data.map(
              getCondtion({ rel: colsToDelete.relation, total: data.length })
            )}
          </Box>
        </Box>
      );

    case DELETE_TYPE_ACTION_KEYS.dropTable:
      return (
        <Box>
          Delete table&nbsp;
          <i>{display_name || '<Table Name>'}</i>
        </Box>
      );

    case DELETE_TYPE_ACTION_KEYS.dropColumns:
      return (
        <Box>
          Delete following columns from table&nbsp;
          <i>{display_name || '<Table Name>'}</i>
          <Box>
            {dropColumns.length > 0 &&
              columns.map(col => {
                if (!dropColumns.includes(col.name)) return null;

                return (
                  <Box key={col.name}>
                    <i>{col.display_name}</i>
                  </Box>
                );
              })}

            {dropColumns.length == 0 && <i>Please select column(s)</i>}
          </Box>
        </Box>
      );

    case DELETE_TYPE_ACTION_KEYS.clearColumns:
      return (
        <Box>
          Clear following columns from table&nbsp;
          <i>{display_name || '<Table Name>'}</i>
          <Box>
            {dropColumns.length > 0 &&
              columns.map(col => {
                if (!dropColumns.includes(col.name)) return null;

                return (
                  <Box key={col.name}>
                    <i>{col.display_name}</i>
                  </Box>
                );
              })}

            {dropColumns.length == 0 && <i>Please select column(s)</i>}
          </Box>
        </Box>
      );

    default:
      return null;
  }
}

DeleteTableEnglishQuery.propTypes = {
  step: shape({}).isRequired,
};

export default DeleteTableEnglishQuery;
