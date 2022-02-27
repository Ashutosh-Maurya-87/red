/* eslint-disable react/prop-types */
import React from 'react';

/**
 * Render Header Cell
 */
const HeaderCell = ({ column }) => {
  const { width, label } = column;
  return (
    <div
      style={{
        width,
        minWidth: width,
        maxWidth: width,
      }}
      className="cell header-cell text-center"
    >
      {label}
    </div>
  );
};

export default HeaderCell;
