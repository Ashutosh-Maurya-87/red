import React from 'react';
import { shape } from 'prop-types';

import { Box } from '@material-ui/core';

import {
  COLUMN_DATA_TYPES_OBJ,
  COLUMN_DATA_TYPES_KEYS,
} from '../../../../../configs/app';

function CreateTableEnglishQuery({ step }) {
  const { headers = [] } = step;

  return (
    <Box>
      <Box>
        Create new table with name:&nbsp;
        <i>{step.tableName ? step.tableName : '<Table Name>'}</i>&nbsp;with
        following columns:
      </Box>

      <Box>
        {headers.map(({ label, dataType }, i) => {
          if (i == 0) return null;

          if (!dataType) dataType = COLUMN_DATA_TYPES_KEYS.alphanumeric;

          return (
            <Box pl={3} key={label}>
              Column <i>{label || '<Column Name>'}</i>&nbsp;of&nbsp;
              <i>{COLUMN_DATA_TYPES_OBJ[dataType].label}</i>&nbsp;type.
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

CreateTableEnglishQuery.propTypes = {
  step: shape({}).isRequired,
};

export default CreateTableEnglishQuery;
