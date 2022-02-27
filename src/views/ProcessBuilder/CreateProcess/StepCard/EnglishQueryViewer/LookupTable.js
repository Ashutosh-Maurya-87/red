import React from 'react';
import { shape } from 'prop-types';
import { Box } from '@material-ui/core';

import { COMPARE_FIELD_KEYS, COMPARE_OPERATOR_LABELS } from '../../configs';

function LookupTableEnglishQuery({ step }) {
  const {
    targetTable = {},
    lookupTables = [],
    colsToUpdate = [],
    colsToCompare = {},
  } = step;

  const ismulti = lookupTables.length > 1;

  const { display_name = '' } = targetTable;

  return (
    <Box>
      <Box>
        From the Lookup Table{ismulti && 's'}&nbsp;
        <i>
          {lookupTables.map(({ display_name }) => display_name).join(', ') ||
            '<Table Name>'}
        </i>
        &nbsp;&amp; the Target Table&nbsp;
        <i>{display_name || '<Table Name>'}</i>
      </Box>

      <Box>
        <Box pt={2}>Update</Box>
        {getUpdateQuery(colsToUpdate)}
      </Box>

      <Box>
        <Box pt={2}>Where</Box>
        {getWhereQuery(colsToCompare)}
      </Box>
    </Box>
  );
}

const getUpdateQuery = colsToUpdate => {
  return (
    <Box pl={3}>
      {colsToUpdate.map((col, i) => {
        const { target = {} } = col;

        return (
          <Box key={i}>
            Column&nbsp;<i>{target.display_name || '<Column Name>'}</i> with
            values from column&nbsp;
            <i>{col.display_name || '<Columns Name>'}</i> of&nbsp;
            <i>{col.tableDisplayName || '<Table Name>'}</i>
            {target.isNewCol && (
              <span>&nbsp;(Default - {col.default || 'Leave blank'})</span>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const getWhereQuery = colsToCompare => {
  const { data = [] } = colsToCompare;

  const getCondtion = ({ rel, total, isGroup }) => (col, i) => {
    if (Array.isArray(col.data)) {
      return (
        <Box pl={3} key={`${col.display_name}-${i}`}>
          {col.data.map(
            getCondtion({
              rel: col.relation,
              total: col.data.length,
              isGroup: true,
            })
          )}
        </Box>
      );
    }

    const { compareField = {} } = col;

    return (
      <Box pl={3} key={`${col.display_name}-${i}`}>
        Column <i>{col.display_name || '<Column Name>'}</i> of&nbsp;
        <i>{col.tableDisplayName || '<Table Name>'}</i>&nbsp;
        {COMPARE_OPERATOR_LABELS[col.operator] || '<Operator>'}&nbsp;
        {col.compareType == 'Column' && (
          <>
            column <i>{compareField.display_name || '<Column Name>'}</i>
            &nbsp;of&nbsp;
            <i>{compareField.tableDisplayName || '<Table Name>'}</i>
          </>
        )}
        {col.compareType == 'Value' &&
          col.operator != COMPARE_FIELD_KEYS.between && <i>{col.value}</i>}
        {col.compareType == 'Value' &&
          col.operator == COMPARE_FIELD_KEYS.between && (
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
      {data.map(
        getCondtion({ rel: colsToCompare.relation, total: data.length })
      )}
    </Box>
  );
};

LookupTableEnglishQuery.propTypes = {
  step: shape({}).isRequired,
};

export default LookupTableEnglishQuery;
