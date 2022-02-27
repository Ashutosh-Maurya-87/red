import React from 'react';
import { shape } from 'prop-types';

import { Box } from '@material-ui/core';
import { COLUMN_DATA_TYPES_OBJ } from '../../../../../configs/app';

function CopyPasteEnglishQuery({ step }) {
  const { sourceTable, targetTable = [] } = step;
  let showedExisting = 0;
  let showedAdditional = 0;

  // if (targetTable.id == 'NEW') {
  //   return (
  //     <Box>
  //       {targetTable.id == 'NEW' && (
  //         <>
  //           Create new table&nbsp;
  //           <i>{targetTable.display_name || '<Target Table>'}</i>&nbsp;and copy
  //           all the columns and data from table&nbsp;
  //           <i>{sourceTable.display_name || '<Source Table>'}</i>.
  //         </>
  //       )}
  //     </Box>
  //   );
  // }

  return (
    <Box>
      {targetTable.id == 'NEW' ? (
        <>
          Create new table&nbsp;
          <i>{targetTable.display_name || '<Target Table>'}</i>&nbsp;
        </>
      ) : (
        <>
          Copy data from table&nbsp;
          <i>{sourceTable.display_name || '<Source Table>'}</i>&nbsp;into the
          table &nbsp;<i>{targetTable.display_name || '<Target Table>'}</i>
        </>
      )}

      {sourceTable.columns.map((col, colIndex) => {
        if (!col.isMatched) return null;
        showedExisting++;

        return (
          <Box key={colIndex}>
            {showedExisting == 1 && (
              <Box>
                where for existing same columns of both the tables, copy data
                from:
              </Box>
            )}
            <Box pl={3}>
              Column <i>{col.display_name || '<Column Name>'}</i>&nbsp;of&nbsp;
              <i>{sourceTable.display_name || '<Source Table>'}</i>
              &nbsp;into column&nbsp;
              <i>{col.targetFieldLabel}</i>&nbsp;of&nbsp;
              <i>{targetTable.display_name || '<Target Table>'}</i>
            </Box>
          </Box>
        );
      })}

      {sourceTable.columns.map((col, colIndex) => {
        if (col.isMatched) return null;
        showedAdditional++;

        return (
          <Box key={colIndex}>
            {showedAdditional == 1 && (
              <Box>
                And for following additional columns of&nbsp;
                <i>{sourceTable.display_name || '<Source Table>'}</i>, add new
                columns into the&nbsp;
                <i>{targetTable.display_name || '<Target Table>'}</i>&nbsp;and
                copy data as follows:
              </Box>
            )}
            <Box pl={3}>
              Column <i>{col.display_name || '<Column Name>'}</i>&nbsp;of&nbsp;
              <i>{sourceTable.display_name || '<Source Table>'}</i>
              &nbsp;into column&nbsp;
              <i>{col.targetFieldLabel || col.display_name}</i>
              &nbsp;having&nbsp;
              <i>
                {COLUMN_DATA_TYPES_OBJ[col.newDataType || col.data_type].label}
              </i>
              &nbsp;datatype
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

CopyPasteEnglishQuery.propTypes = {
  step: shape({}).isRequired,
};

export default CopyPasteEnglishQuery;
