import React from 'react';
import { shape } from 'prop-types';
import { Box } from '@material-ui/core';

import { getFx } from './helper';
import './styles.scss';

function TranslateTableEnglishQuery({ step }) {
  const {
    targetTable = {},
    data = [],
    headersToCompare = [],
    headersToUpdate = [],
  } = step;

  const hasMoreThanThree = data.length > 3;

  return (
    <Box>
      In the table: <i>{targetTable.display_name || '<Table Name>'}</i>
      {[
        data[0] || null,
        data[1] || null,
        data.length > 2 ? data[data.length - 1] : null,
      ].map((row, rowIndex) => {
        if (!row) return null;

        return (
          <Box py={1} key={rowIndex}>
            {hasMoreThanThree && rowIndex == 2 && (
              <Box pb={2} pl={3}>
                .......
              </Box>
            )}

            <Box>Rule {rowIndex + 1}: When </Box>

            {row.map((cell, cellIndex) => {
              if (cellIndex == 0) return null;

              const title = headersToCompare[cellIndex - 1] || {};

              if (cellIndex <= headersToCompare.length) {
                return (
                  <Box pl={3} key={cellIndex}>
                    Column <i>{title.display_name || '<Field Name>'}</i> is
                    equal to value <i>{cell.value || '<Blank Value>'}</i>&nbsp;
                    {cellIndex < headersToCompare.length && 'AND'}
                  </Box>
                );
              }

              return null;
            })}

            <Box pt={2}>Then Update</Box>

            {row.map((cell, cellIndex) => {
              if (cellIndex <= headersToCompare.length) return null;

              const { formula } = cell;
              const title =
                headersToUpdate[cellIndex - 1 - headersToCompare.length] || {};

              return (
                <Box pl={3} key={cellIndex}>
                  Column <i>{title.display_name || '<Field Name>'}</i> as&nbsp;
                  {formula && formula.length > 0 ? (
                    <Box pl={3} className="formula-viewer">
                      {getFormulaView(formula)}
                    </Box>
                  ) : (
                    <i>{cell.value || '<Blank Value>'}</i>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Get View of Formula [Field | Operator]
 *
 * @param {Object} fx
 *
 * @return {HTML|Null}
 */
const getFormulaView = formula => {
  if (formula.length == 0) {
    return `<Copy of Formula>`;
  }

  return formula.map((fx, fi) => {
    return <span key={fi}>{getFx(fx)}</span>;
  });
};

TranslateTableEnglishQuery.propTypes = {
  step: shape({}).isRequired,
};

export default TranslateTableEnglishQuery;
