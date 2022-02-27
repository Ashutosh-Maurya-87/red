import React from 'react';
import { shape, bool } from 'prop-types';
import { Box } from '@material-ui/core';

import { COMPARE_FIELD_KEYS, COMPARE_OPERATOR_LABELS } from '../../configs';
import { getFx } from './helper';

function FormulaBuilderEnglishQuery({ step, isMulti }) {
  return (
    <Box>
      <Box>{getUpdateQuery(step)}</Box>

      {isMulti && (
        <Box>
          <Box pt={2}>When:</Box>
          {getWhereQuery(step)}
        </Box>
      )}
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
    return <i key={fi}>{getFx(fx)}</i>;
  });
};

const getUpdateQuery = step => {
  const { targetTable = {}, colsToUpdate = [] } = step;

  return (
    <Box>
      {colsToUpdate.map((col, i) => {
        const { display_name, isNewCol = false, formula = [] } = col;

        return (
          <Box key={i}>
            {!isNewCol && (
              <>
                Update column <i>{display_name || '<Column Name>'}</i>&nbsp;of
                table&nbsp;
                <i>{targetTable.display_name || '<Target Table>'}</i>
                &nbsp;with the result of the following calculation:
                <Box className="formula-viewer" pl={3}>
                  {getFormulaView(formula)}
                </Box>
              </>
            )}

            {isNewCol && (
              <>
                Add a new column <i>{display_name || '<Column Name>'}</i>
                &nbsp;into the table&nbsp;
                <i>{targetTable.display_name || '<Target Table>'}</i>
                &nbsp;and update it with the result of the following
                calculation:
                <Box className="formula-viewer" pl={3}>
                  {getFormulaView(formula)}
                </Box>
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const getWhereQuery = step => {
  const { colsToCompare = {} } = step;
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
        <i>{col.display_name || '<Column Name>'}</i>&nbsp;of&nbsp;
        <i>{col.tableDisplayName || '<Table Name>'}</i>&nbsp;
        {COMPARE_OPERATOR_LABELS[col.operator] || '<Operator>'}&nbsp;
        {col.compareType == 'Column' && (
          <>
            <i>{compareField.display_name || '<Column Name>'}</i>&nbsp;of&nbsp;
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

FormulaBuilderEnglishQuery.propTypes = {
  isMulti: bool,
  step: shape({}).isRequired,
};

FormulaBuilderEnglishQuery.defaultProps = {
  isMulti: false,
};

export default FormulaBuilderEnglishQuery;
