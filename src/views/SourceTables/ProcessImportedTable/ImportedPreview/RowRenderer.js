/* eslint-disable react/prop-types */
import React from 'react';
import { Checkbox } from '@material-ui/core';

/**
 * Redner Row (tr and td section)
 *
 * @param {*} props
 */
const RowRenderer = props => {
  const { row, selected, onSelectChanged } = props;

  return (
    <div className="data-row flex-fill" key={row}>
      {false && (
        <div className="action-cell cell flex-50">
          {/* Checkbox for td */}
          <Checkbox
            className="row-checkbox"
            size="small"
            color="primary"
            checked={selected}
            onChange={e => onSelectChanged(row, e.target.checked)}
          />
        </div>
      )}
      {/* Array of td */}
      {props.children}
    </div>
  );
};

export default RowRenderer;
