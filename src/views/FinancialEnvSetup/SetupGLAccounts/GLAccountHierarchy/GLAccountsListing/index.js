/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { DragSource } from 'react-dnd';
import clsx from 'classnames';

import {
  arrayOf,
  shape,
  func,
  string,
  oneOfType,
  number,
  any,
} from 'prop-types';

import {
  Box,
  TableCell,
  TableContainer,
  Checkbox,
  withStyles,
  Tooltip,
} from '@material-ui/core';

import {
  HelpOutlineOutlined as HelpOutlineOutlinedIcon,
  Settings as SettingsIcon,
} from '@material-ui/icons';

import { AutoSizer, Column, Table as VirtualTable } from 'react-virtualized';
import PerfectScrollbar from 'perfect-scrollbar';

import { externalNodeType } from '../configs';
import { GL_ACCOUNT_HEADERS_VALUES } from '../../configs';
import ImgRenderer from '../../../../../components/ImgRenderer';
import { getValueAsPerType } from '../../../../SourceTables/ProcessImportedTable/helper';
import { getSelectedNodes } from './helper';

import { styles } from './styles';
import './styles.scss';

let tableElePS = null;
let tableRowsElePS = null;

const externalNodeSpec = {
  // This needs to return an object with a property `node` in it.
  // Object rest spread is recommended to avoid side effects of
  // referencing the same object in different trees.
  beginDrag: componentProps => ({
    node: getSelectedNodes(componentProps.node, componentProps.data),
  }),
};

const externalNodeCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreView: connect.dragPreview(),

  // Add props via react-dnd APIs to enable more visual
  // customization of your component
  // isDragging: monitor.isDragging(),
  // didDrop: monitor.didDrop(),
});

class externalNodeBaseComponent extends React.Component {
  render() {
    const { connectDragSource, children } = this.props;

    return connectDragSource(children, {
      dropEffect: 'copy',
    });
  }
}

const YourExternalNodeComponent = DragSource(
  externalNodeType,
  externalNodeSpec,
  externalNodeCollect
)(externalNodeBaseComponent);

function GLAccountsTable({
  classes,
  headers,
  data,
  onSelect,
  selectedGLAccount,
  hierarchyType,
  onSettingsClick,
  tableHeight,
}) {
  const [selected, setSelected] = React.useState(selectedGLAccount);

  /**
   * Verify > is item selected or not
   *
   * @param {String} name
   *
   * @return {Boolean}
   */
  const verifySelected = name => selected.indexOf(name) !== -1;

  /**
   * Handle Select All action
   *
   * @param {Object}
   */
  const handleSelectAll = ({ target }) => {
    if (!target.checked) {
      setSelected([]);
      onSelect([]);
      return;
    }

    const newSelected = data.map(({ affa_record_id }) => affa_record_id);
    setSelected(newSelected);
    onSelect(newSelected);
  };

  /**
   * Load Data on Load Component
   */
  useEffect(() => {
    try {
      setSelected(selectedGLAccount);

      if (data && data.length > 0) {
        if (tableElePS) tableElePS.destroy();
        const tableEle = document.querySelector('.gl-account-table-col');
        tableElePS = new PerfectScrollbar(tableEle);

        if (tableRowsElePS) tableRowsElePS.destroy();

        const tableRowsEle = document.querySelector(
          '.ReactVirtualized__Grid.ReactVirtualized__Table__Grid'
        );

        tableRowsElePS = new PerfectScrollbar(tableRowsEle, {
          wheelSpeed: 1,
          minScrollbarLength: 30,
        });

        tableElePS.update();
        tableRowsElePS.update();
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedGLAccount, data]);

  /**
   * Handle Single Selection action
   *
   * @param {String} name
   * @param {Object} evt
   */
  const handleSelect = name => evt => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
    onSelect(newSelected);
  };

  /**
   * Render Header Row of Table
   *
   * @param {Object} props
   *
   * @return {HTML}
   */
  const headerRowRenderer = props => {
    return (
      <div
        className={`${props.className} ${
          selected.length > 0 ? 'data-selected' : ''
        }`}
        style={props.style}
      >
        {props.columns}
      </div>
    );
  };

  /**
   * Render Header Cell of Table
   *
   * @param {Object} props
   *
   * @return {HTML}
   */
  const headerRenderer = props => {
    const { columnData: header = {}, dataKey } = props;
    const [, firstHeader] = headers;

    let selectedLabel = '';
    if (selected.length > 0 && dataKey !== 'checkbox_gl_hierarchy') {
      if (firstHeader.name == dataKey) {
        selectedLabel = 'Drag and drop into hierarchy level on the left.';
      } else {
        return null;
      }
    }

    return (
      <>
        {dataKey === 'checkbox_gl_hierarchy' && (
          <TableCell
            component="div"
            variant="head"
            className={classes.headerCell}
          >
            <Checkbox
              color="primary"
              indeterminate={
                selected.length > 0 && selected.length < data.length
              }
              checked={selected.length > 0 && selected.length === data.length}
              onChange={handleSelectAll}
            />
          </TableCell>
        )}

        {dataKey !== 'checkbox_gl_hierarchy' && (
          <TableCell
            className={classes.headerCell}
            component="div"
            variant="head"
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              maxWidth="100%"
              whiteSpace="noWrap"
            >
              {selectedLabel || (
                <>
                  {header.display_name || ''}
                  &nbsp;
                  {header.info && (
                    <Tooltip arrow title={header.info} placement="top">
                      <HelpOutlineOutlinedIcon />
                    </Tooltip>
                  )}
                </>
              )}
            </Box>
          </TableCell>
        )}

        {dataKey === 'settings_gl_hierarchy' && (
          <TableCell
            component="div"
            variant="head"
            className={classes.tableCell}
          />
        )}
      </>
    );
  };

  /**
   * Render Row of Table
   *
   * @param {Object} props
   *
   * @return {HTML}
   */
  const rowRenderer = props => {
    const { columns, className, index, key, style, rowData } = props;
    const bindProps = { className, index, key, style };

    const isItemSelected = verifySelected(rowData.affa_record_id);
    if (selected.length > 0 && !isItemSelected) {
      style.cursor = 'not-allowed';
    }

    return (
      <YourExternalNodeComponent
        {...bindProps}
        node={selected.length > 0 ? selected : [rowData.affa_record_id]}
        data={data}
        children={<div {...bindProps}>{columns}</div>}
      />
    );
  };

  /**
   * Render Cell of Table
   *
   * @param {Object} props
   *
   * @return {HTML}
   */
  const cellRenderer = props => {
    const { cellData, rowData: row, dataKey, columnIndex } = props;

    const isItemSelected = verifySelected(row.affa_record_id);

    if (dataKey === 'checkbox_gl_hierarchy') {
      return (
        <TableCell
          component="div"
          className={classes.tableCell}
          onClick={handleSelect(row.affa_record_id)}
        >
          <Checkbox color="primary" checked={isItemSelected} />
        </TableCell>
      );
    }

    if (row.affa_record_type === 'folder') {
      return (
        <>
          {columnIndex === 1 && (
            <TableCell
              padding="default"
              colSpan={hierarchyType === 'GLAccounts' ? 2 : headers.length}
              className={classes.tableCell}
              component="div"
            >
              <Box display="flex" alignItems="center">
                <ImgRenderer
                  src="folder.svg"
                  className="folder-icon-dimension"
                />
                &nbsp;
                {row.affa_h_key_name}
              </Box>
            </TableCell>
          )}

          {dataKey === 'rollup_op' && (
            <TableCell
              padding="default"
              colSpan={headers.length - 2}
              className={classes.tableCell}
              component="div"
            >
              {row[dataKey]}
            </TableCell>
          )}
        </>
      );
    }

    if (row.affa_record_type !== 'folder') {
      const { data_type: dataType, date_format: dateFormat } =
        headers[columnIndex] || {};

      return (
        <>
          {dataKey !== 'settings_gl_hierarchy' && (
            <TableCell
              key={dataKey}
              id={`table-checkbox-${dataKey}`}
              className={classes.tableCell}
              component="div"
              padding="default"
              align="left"
            >
              <Box display="flex" alignItems="center">
                <Box
                  className={`account-name ${
                    dataKey == GL_ACCOUNT_HEADERS_VALUES.math_type
                      ? // dataKey == GL_ACCOUNT_HEADERS_VALUES.positive_variance ||
                        // dataKey == GL_ACCOUNT_HEADERS_VALUES.reverse_sign
                        'capitalizedText'
                      : ''
                  }`}
                  width="280px"
                >
                  {getValueAsPerType({ value: cellData, dataType, dateFormat })}
                </Box>
              </Box>
            </TableCell>
          )}

          {dataKey === 'settings_gl_hierarchy' && (
            <TableCell
              component="div"
              variant="head"
              className={classes.tableCell}
            >
              <Box
                display="flex"
                className="cursor-pointer"
                alignItems="center"
                onClick={onSettingsClick(row)}
              >
                <SettingsIcon />
              </Box>
            </TableCell>
          )}
        </>
      );
    }

    return <TableCell />;
  };

  /**
   * Get style classes for Row
   *
   * @param {Object}
   *
   * @return {Object}
   */
  const getRowClassName = ({ index, ...other }) => {
    const row = data[index] || {};
    const isChecked = verifySelected(row.affa_record_id);

    return clsx(classes.tableRow, classes.flexContainer, {
      [classes.tableRowHover]: index !== -1,
      [classes.tableRowChecked]: isChecked,
    });
  };

  /**
   * Get Table Width
   *
   * @return {Number}
   */
  const getTableWidth = () => {
    if (headers.length > 0) {
      let tableWidth = 0;

      headers.map(({ width }) => {
        tableWidth += width;

        return width;
      });

      return tableWidth;
    }

    return 400;
  };

  return (
    <div
      className={`hierarchy-accounts-list ${classes.root}`}
      style={{ height: tableHeight }}
    >
      <TableContainer
        className={`gl-account-table-col ${classes.container}`}
        style={{ height: tableHeight }}
      >
        <AutoSizer>
          {({ height, width }) => (
            <VirtualTable
              height={height}
              headerRowRenderer={headerRowRenderer}
              width={getTableWidth()}
              rowHeight={52}
              headerHeight={56}
              className={classes.table}
              gridStyle={{
                direction: 'inherit',
              }}
              rowCount={data.length}
              rowGetter={({ index }) => data[index]}
              rowRenderer={rowRenderer}
              rowClassName={getRowClassName}
              overscanColumnCount={5}
              overscanRowCount={5}
            >
              {headers.map(header => {
                return (
                  <Column
                    key={header.name}
                    dataKey={header.name}
                    headerRenderer={headerRenderer}
                    cellRenderer={cellRenderer}
                    width={Number(header.width)}
                    flexShrink={0}
                    header={header}
                    columnData={header}
                    label={header.display_name}
                    disableSort
                    style={{ margin: 0 }}
                  />
                );
              })}
            </VirtualTable>
          )}
        </AutoSizer>
      </TableContainer>
    </div>
  );
}

GLAccountsTable.propTypes = {
  data: arrayOf(shape({})),
  headers: arrayOf(shape({})),
  hierarchyType: string.isRequired,
  onSelect: func.isRequired,
  onSettingsClick: func,
  selectedGLAccount: arrayOf(oneOfType([string, number])),
  tableHeight: any,
};

GLAccountsTable.defaultProps = {
  data: [],
  headers: [],
  selectedGLAccount: [],
  onSettingsClick: () => {},
};

export default withStyles(styles)(GLAccountsTable);
