/* eslint-disable react/prop-types */
import React from 'react';
import { DEFAULT_DENSITY_WIDTH_RE } from '../../../../configs/density';

/**
 * Render Single Cell
 */
const CellRenderer = (props = {}) => {
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

  const attributes = cell.attributes || {};

  /**
   * Density
   */

  const { width = DEFAULT_DENSITY_WIDTH_RE } = columns.find(gridWidth => {
    return gridWidth;
  });

  attributes.style = {
    width,
    minWidth: width,
    maxWidth: width,
  };

  if (!rest.className) rest.className = '';

  if (col == 0) {
    rest.className += ' header-cell text-center';
  }

  if (columns.length - 1 === col) {
    cell.isForecast = false;
  }

  if (col > 0 && cell.readOnly) {
    rest.className += ' disabled';
  }

  if (cell.isForecast || !cell.readOnly) rest.className += ' forecast-color';

  /**
   * Get display year for index column
   *
   * @param {String} value
   * @returns {String}
   */
  const getDisplayYear = value => {
    if (!value) return '';

    return !String(value).includes('-')
      ? value
      : String(value).split('-')[0] || '';
  };

  return (
    <div {...rest} {...attributes} title={cell.value}>
      {col === 0 ? getDisplayYear(cell.value) : props.children}
    </div>
  );
};

CellRenderer.defaultProps = {
  cell: {},
  className: '',
};

export default CellRenderer;
