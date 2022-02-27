/* eslint-disable react/prop-types */
import React from 'react';
import { Checkbox, Box } from '@material-ui/core';
import { SelectableGroup, createSelectable } from 'react-selectable-fast';

import CustomScrollbars from '../../../../components/ScrollBars';
import HeaderCell from './HeaderCell';

/**
 * Render Sheet (Headings Section)
 *
 * @param {Object} props
 */
const SheetRenderer = props => {
  const {
    className,
    columns,
    selections,
    onSelectAllChanged,
    importedHeaders,
    transposedHeaders,
    selectedHeaders = {},
    handleSelectedHeadings = () => {},
    areHeadersSelectable = false,
    scrollHeight,
  } = props;

  const handleScroll = ({ target }) => {
    const { scrollLeft } = target;

    document.getElementById('data-header').scrollLeft = scrollLeft;
  };

  return (
    <Box mb={2}>
      <div className={className}>
        <div className="data-header" id="data-header">
          <div className="flex-fill">
            {false && (
              <div className="action-cell cell flex-50">
                {/* Checkbox for th */}
                <Checkbox
                  className="row-selection-check"
                  color="primary"
                  checked={selections.every(s => s)}
                  onChange={e => onSelectAllChanged(e.target.checked)}
                />
              </div>
            )}

            {areHeadersSelectable && (
              <SelectableGroup
                className="main"
                clickClassName="tick"
                enableDeselect
                allowClickWithoutSelected
                globalMouse
                tolerance={0}
                deselectOnEsc={false}
                ignoreList={['.not-selectable']}
                onSelectionFinish={selected => {
                  const headers = {};
                  selected.forEach(({ props: sProps, state }) => {
                    headers[sProps.label] = state.isSelected || false;
                  });
                  handleSelectedHeadings(headers);
                }}
              >
                {/* table headings (th) */}
                <div className="flex-fill">
                  {columns.map((column, colIndex) => {
                    const CellCompSelectable = createSelectable(
                      selecatblePorps => (
                        <HeaderCell
                          colIndex={colIndex}
                          {...props}
                          {...selecatblePorps}
                          column={column}
                        />
                      )
                    );

                    return (
                      <CellCompSelectable
                        key={colIndex}
                        isSelected={
                          selectedHeaders[column.label] ||
                          importedHeaders[column.label] ||
                          transposedHeaders[column.label] ||
                          false
                        }
                        label={column.label}
                        colIndex={colIndex}
                      />
                    );
                  })}
                </div>
              </SelectableGroup>
            )}

            {!areHeadersSelectable &&
              columns.map((column, colIndex) => {
                return (
                  <HeaderCell
                    key={`${column.label}-${column.dataType}-${colIndex}`}
                    {...props}
                    column={column}
                    colIndex={colIndex}
                  />
                );
              })}
          </div>
        </div>
        <CustomScrollbars
          style={{ width: '100%', height: scrollHeight }}
          onScroll={handleScroll}
        >
          <div className="data-body">{props.children}</div>
        </CustomScrollbars>
      </div>
    </Box>
  );
};

export default SheetRenderer;
