/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
  Checkbox,
  Typography,
  Popover,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Box,
  Grid,
  Button,
  Radio,
  Tooltip,
  IconButton,
  Select,
  InputLabel,
  MenuItem,
} from '@material-ui/core';

import {
  Delete as DeleteIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@material-ui/icons';

import ImgRenderer from '../../../../components/ImgRenderer';

import {
  COLUMN_DATA_TYPES,
  COLUMN_DATA_TYPES_KEYS,
  EXCEL_DATE_FORMATS,
} from '../../../../configs/app';
import { ERROR_MESSAGES } from '../../../../configs/messages';

/**
 * Render Header Cell
 */
const HeaderCell = props => {
  const {
    selectableRef = null,
    column,
    isSelected,
    isSelecting,
    isHeaderCheckbox,
    showDataType,
    selectedHeaders,
    importedHeaders,
    transposedHeaders,
    updateColumn,
    deleteColumn,
    colIndex,
    columns,
    isReloadTable,
  } = props;

  const [popEl, setPopEl] = useState(null);
  const [title, setTitle] = useState(column.label || '');
  const [dataType, setDataType] = useState(column.dataType || '');
  const [err, setError] = useState('');
  const [dateFormat, setDateFormat] = useState(
    column.dateFormat || EXCEL_DATE_FORMATS[0].value
  );

  const onChangeTitle = ({ target }) => {
    setTitle(target.value);
  };

  const onChangeDataType = ({ target }) => {
    setDataType(target.value);
  };

  const openPopover = ({ currentTarget }) => {
    if (showDataType) setPopEl(currentTarget);
  };

  const closePopover = () => {
    setPopEl(null);
  };

  const handleDone = evt => {
    evt.preventDefault();

    const validTitle = String(title).trim();

    if (!validTitle) {
      setError(ERROR_MESSAGES.required);
      return;
    }

    const isDuplicate = columns.find(({ label }, index) => {
      if (label == validTitle.trim() && colIndex != index) return true;

      return false;
    });

    setError(isDuplicate ? 'Duplicate Name' : '');

    if (isDuplicate) return;

    if (dataType == COLUMN_DATA_TYPES_KEYS.date && !dateFormat) return;

    updateColumn({
      colIndex,
      oldTitle: column.label,
      title: validTitle,
      dataType,
      dateFormat,
    });

    closePopover();
  };

  const handleDelete = evt => {
    evt.preventDefault();

    deleteColumn({ colIndex, column });
    closePopover();
  };

  const handleCancel = () => {
    setTitle(column.label || '');
    setDataType(column.dataType || '');
    setError('');
    closePopover();
  };

  const getHeaderCellStyles = () => {
    let classes = 'cell header-cell';

    if (selectedHeaders[column.label] || column.forImport) {
      classes += ' header-selected-import';
    }

    if (importedHeaders[column.label]) {
      classes += ' header-selected-disabled';
    }

    if (column.forTranspose || transposedHeaders[column.label]) {
      classes += ' header-selected-transpose';
    }

    if (isSelected) classes += ' header-selected';
    if (isSelecting) classes += ' header-selecting';

    return classes;
  };

  const handleDateFormat = evt => {
    const { value = '' } = evt.target;
    setDateFormat(value);
  };

  return (
    <div
      ref={selectableRef}
      style={{
        width: column.width,
        minWidth: column.width,
        maxWidth: column.width,
      }}
      className={getHeaderCellStyles()}
    >
      <Grid
        container
        justify="space-between"
        alignItems="center"
        className="cursor-pointer"
        onClick={openPopover}
      >
        {column.transposedColumn || column.transposedValue ? (
          <>
            <Box className="table-header">
              <Typography variant="caption" color="primary">
                {column.transposedColumn && 'Transposed Column'}
                {column.transposedValue && 'Transposed Value'}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" noWrap>
                <Tooltip title={column.label || ''} placement="top-start">
                  <span>{column.label || ''}</span>
                </Tooltip>
              </Typography>
            </Box>
          </>
        ) : (
          <Typography
            variant="subtitle2"
            className="table-header"
            color="textSecondary"
          >
            <Tooltip title={column.label || ''} placement="top-start">
              <span>{column.label || ''}</span>
            </Tooltip>
          </Typography>
        )}

        {showDataType && (
          <Box align="right">
            <ImgRenderer
              src={`${
                column.dataType || COLUMN_DATA_TYPES_KEYS.alphanumeric
              }.svg`}
              alt=""
            />
            {showDataType && <ArrowDropDownIcon color="primary" />}
          </Box>
        )}

        {isReloadTable && (
          <Box align="right">
            <DeleteIcon color="error" fontSize="small" onClick={handleDelete} />
          </Box>
        )}

        {isHeaderCheckbox && (
          <Checkbox
            color="primary"
            size="small"
            checked={isSelected || isSelecting}
            onChange={() => {}}
          />
        )}
      </Grid>

      {showDataType && (
        <Popover
          id="data-type-popover"
          open={Boolean(popEl)}
          anchorEl={popEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          onClose={handleDone}
          disableRestoreFocus
        >
          <Box className="transpose-popover">
            <form noValidate onSubmit={handleDone}>
              <Box mb={1}>
                <Typography variant="caption" color="primary" display="block">
                  Column Title
                </Typography>
              </Box>
              <TextField
                name={String(title)}
                value={String(title)}
                onChange={onChangeTitle}
                required
                autoComplete="none"
                autoFocus
                color="primary"
                size="small"
                error={Boolean(err)}
                helperText={err}
                variant="outlined"
                className="column-title"
              />
              <Box my={2}>
                <FormControl size="small">
                  <Typography variant="caption" color="primary">
                    Data Type
                  </Typography>
                  <RadioGroup
                    defaultValue={column.dataType || ''}
                    aria-label="dataType"
                    name="dataType"
                  >
                    {COLUMN_DATA_TYPES.map(({ label, value }) => (
                      <FormControlLabel
                        key={label}
                        label={label}
                        control={
                          <>
                            <Radio
                              key={value}
                              size="small"
                              color="primary"
                              name="dataType"
                              value={value}
                              onChange={onChangeDataType}
                            />
                            <ImgRenderer src={`${value}.svg`} alt="" />
                            &nbsp;&nbsp;
                          </>
                        }
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>

              {dataType == COLUMN_DATA_TYPES_KEYS.date && (
                <Box display="block" mb={1}>
                  <FormControl
                    variant="outlined"
                    size="small"
                    className="date-select"
                  >
                    <InputLabel error={!dateFormat}>Date Format</InputLabel>
                    <Select
                      id="data-type-select"
                      label="Date Format"
                      value={dateFormat}
                      name="dateFormat"
                      onChange={handleDateFormat}
                      error={!dateFormat}
                      defaultValue=""
                    >
                      {EXCEL_DATE_FORMATS.map(opt => {
                        return (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
              )}

              <Grid container justify="space-between" alignItems="center">
                <IconButton
                  color="primary"
                  aria-label="delete"
                  onClick={handleDelete}
                >
                  <DeleteIcon fontSize="small" className="delete-icon" />
                </IconButton>
                <Box>
                  <Button color="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" onClick={handleDone}>
                    Done
                  </Button>
                </Box>
              </Grid>
            </form>
          </Box>
        </Popover>
      )}
    </div>
  );
};

export default HeaderCell;
