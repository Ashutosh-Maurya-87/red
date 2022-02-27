/* eslint-disable react/prop-types */
import React from 'react';
import RowLabelCell from '../RowLabelCell';

/**
 * Render Single Cell
 */
const CellRenderer = (props = {}) => {
  const {
    cell,
    row, // Row Index
    col, // Column Index
    headers,
    attributesRenderer,
    selected,
    editing,
    updated,
    style,
    children,
    toggleSetupRow,
    toggleRowContextMenu,
    toggleColContextMenu,
    rowConfigs,
    labelCell,
    data,
    ...restProps
  } = props;

  const { width } = headers[col];
  const attributes = cell.attributes || {};
  attributes.style = {
    width,
    minWidth: width,
    maxWidth: width,
  };

  if (col == 0) {
    restProps.className += ' header-cell text-center';
    attributes.style.justifyContent = 'center';
    attributes.style.height = '32px';
  }

  if (col > 1 && cell.readOnly) restProps.className += ' read-only';
  if (cell.error) restProps.className += ' cell-formula-error';

  /**
   * Render Cell
   */
  const renderCellItem = () => {
    switch (col) {
      case 0:
        return row + 1;

      case 1:
        if (editing) return children;

        return (
          <RowLabelCell
            rowConfig={{}}
            row={row}
            toggleSetupRow={toggleSetupRow}
            toggleRowContextMenu={toggleRowContextMenu}
            cell={cell}
            totalRows={data.length}
          >
            {children}
          </RowLabelCell>
        );

      default:
        return children;
    }
  };

  return (
    <div {...restProps} {...attributes} title={cell.value}>
      {renderCellItem()}
    </div>
  );
};

CellRenderer.defaultProps = {
  cell: {},
  toggleSetupRow: () => () => {},
  toggleRowContextMenu: () => () => {},
};

export default CellRenderer;
