/* eslint-disable react/prop-types */
import React from 'react';
import { Box } from '@material-ui/core';

import HeaderCell from './HeaderCell';
import HeadingCell from './HeadingCell';
import ColumnsSelection from './ColumnsSelection';

const FIELD_TYPES = ['COMPARE', 'UPDATE'];

class SheetRenderer extends React.Component {
  state = {
    isColumnsModal: false,
    fieldsType: FIELD_TYPES[0],
  };

  openColumnsSeletion = type => () => {
    this.setState({
      isColumnsModal: true,
      fieldsType: type,
    });
  };

  updateHeaderScroll = () => {
    setTimeout(() => {
      const { stepNumber } = this.props;

      const id = `data-header-${stepNumber}-wrap`;
      const ele = document.getElementById(id);

      if (ele && ele.offsetWidth + ele.scrollLeft + 15 == ele.scrollWidth) {
        ele.scrollLeft += 15;
      }
    }, 10);
  };

  handleCloseModal = () => {
    this.setState({ isColumnsModal: false });
    this.updateHeaderScroll();
  };

  handleDone = headers => {
    this.setState({ isColumnsModal: false });

    const { handleCompareFields, handleUpdateFields } = this.props;

    this.state.fieldsType == FIELD_TYPES[0]
      ? handleCompareFields(headers)
      : handleUpdateFields(headers);

    this.updateHeaderScroll();
  };

  handleResizeClick = ({ colIndex }) => evt => {
    try {
      const {
        data,
        headersToCompare,
        headersToUpdate,
        handleCompareFields,
        handleUpdateFields,
        updateState,
        toggleHeaderResize,
      } = this.props;

      const valuesArray = [];
      data.forEach(cols => {
        const { value } = cols[colIndex] || {};
        if (value && Number(value)) valuesArray.push(Number(value));
      });

      const maxNumber = Math.max(...valuesArray);
      const numberLength = String(maxNumber).length;

      let width = numberLength * 9;
      width += 40;
      if (width < 150) width = 150;

      const isCompareHeader = colIndex <= headersToCompare.length;

      const headerIndex = isCompareHeader
        ? colIndex - 1
        : colIndex - headersToCompare.length - 1;

      const headers = isCompareHeader ? headersToCompare : headersToUpdate;

      headers[headerIndex].width = width;

      isCompareHeader
        ? handleCompareFields(headers)
        : handleUpdateFields(headers);

      setTimeout(() => {
        updateState({
          toggleHeaderResize: !toggleHeaderResize,
        });
      }, 300);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Render View
   */
  render() {
    const {
      className,
      columns,
      headersToCompare,
      headings,
      stepNumber,
    } = this.props;

    const { children, ...restProps } = this.props;

    const { isColumnsModal, fieldsType } = this.state;

    const id = `data-header-${stepNumber}`;

    return (
      <Box mb={2}>
        <div className={className} style={{ position: 'relative' }}>
          <div className="scroll-width">
            <div className="data-header" id={`${id}-wrap`}>
              <div id={`${id}-1`}>
                <div className="flex-fill">
                  {columns.map((column, colIndex) => {
                    const isFirstCompareCol = colIndex == 1;
                    const isFirstUpdateCol =
                      colIndex == headersToCompare.length + 1;

                    let isCompareCol = false;
                    let isUpdateCol = false;

                    let headingColIndex = 0;
                    let headingCol = {};

                    if (colIndex > 0) {
                      isCompareCol = colIndex <= headersToCompare.length;
                      isUpdateCol = !isCompareCol;

                      headingColIndex = isCompareCol ? 1 : 2;
                      headingCol = isCompareCol ? headings[1] : headings[2];
                    }

                    return (
                      <HeadingCell
                        {...restProps}
                        headings={headings}
                        key={`${column.label}-${colIndex}`}
                        column={column}
                        colIndex={colIndex}
                        headingCol={headingCol}
                        headingColIndex={headingColIndex}
                        isCompareCol={isCompareCol}
                        isUpdateCol={isUpdateCol}
                        isFirstCompareCol={isFirstCompareCol}
                        isFirstUpdateCol={isFirstUpdateCol}
                        openColumnsSeletion={this.openColumnsSeletion(
                          FIELD_TYPES[headingColIndex - 1]
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              <div id={`${id}-2`}>
                <div className="flex-fill">
                  {columns.map((column, colIndex) => (
                    <HeaderCell
                      {...restProps}
                      key={`${column.label}-${colIndex}`}
                      column={column}
                      colIndex={colIndex}
                      handleResizeClick={this.handleResizeClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="data-body">{children}</div>
        </div>

        {isColumnsModal && (
          <ColumnsSelection
            {...restProps}
            isOpen
            fieldsType={fieldsType}
            handleClose={this.handleCloseModal}
            handleDone={this.handleDone}
          />
        )}
      </Box>
    );
  }
}

export default SheetRenderer;
