/* eslint-disable react/prop-types */
import React from 'react';
import { Box } from '@material-ui/core';

import HeaderCell from './HeaderCell';

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
      const id = `data-header-0-wrap`;
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
    const { className, columns } = this.props;

    const { children, ...restProps } = this.props;

    const id = `data-header-0`;

    return (
      <Box mb={2}>
        <div className={className} style={{ position: 'relative' }}>
          <div className="scroll-width">
            <div className="data-header" id={`${id}-wrap`}>
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
      </Box>
    );
  }
}

export default SheetRenderer;
