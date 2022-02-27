/* eslint-disable react/prop-types */
import React from 'react';
import { DEFAULT_COL_WIDTH } from '../../ImportSourceTable';

/**
 * Render Single Cell
 */
const CellRenderer = props => {
  const {
    cell,
    row,
    col,
    columns,
    attributesRenderer,
    selected,
    editing,
    updated,
    style,
    ...rest
  } = props;

  // hey, how about some custom attributes on our cell?
  const attributes = cell.attributes || {};

  let width = DEFAULT_COL_WIDTH;
  if (columns[col]) ({ width } = columns[col]);

  // ignore default style handed to us by the component and roll our own
  attributes.style = {
    width,
    minWidth: width,
    maxWidth: width,
  };

  if (col === 0) attributes.title = cell.label;

  return (
    <div {...rest} {...attributes}>
      {props.children}
    </div>
  );
};

export default CellRenderer;
