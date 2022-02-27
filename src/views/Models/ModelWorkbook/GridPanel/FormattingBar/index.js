import React from 'react';
import { arrayOf, shape, func } from 'prop-types';
import { CompactPicker } from 'react-color';
import { range } from 'lodash';

import { Box, Popover, TextField, Button } from '@material-ui/core';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import ListboxComponent from '../../../../../components/CustomListBox';

import {
  DEFAULT_COLOR_PALETTE_COLORS,
  FORMATTING_KEYS,
  FORMATTING_TOOLS,
  FORMATTING_TOOLS_WITH_KEYS,
} from './configs';
import ImgRenderer from '../../../../../components/ImgRenderer';
import copyToClipBoard from '../../../../../utils/helper/copyToClipBoard';
import getNumbers from '../../../../../utils/helper/getNumbers';
import { getCellsFromClipBoard } from '../../../../../components/VirtualizedDataSheet/helper';

import './styles.scss';
import { DEFAULT_MAX_CHARS_AFTER_DECIMAL } from '../../../../../configs/app';

const filter = createFilterOptions();

class FormattingBar extends React.Component {
  /**
   * State
   */
  state = {
    formatAction: '',
    colorEle: null,
    color: { r: 231, g: 23, b: 23, a: 1 },
    activeCell: '',
  };

  /**
   * Identify the style key is already present or not
   *
   * @param {Array} data
   * @param {Object} selected
   * @param {String} styles
   * @returns {Bool}
   */
  isAlreadyHaveKey = (data, selected, styles) => {
    const {
      start: { i: iStart, j: jStart },
      end: { i: iEnd, j: jEnd },
    } = selected || {};

    const iFrom = iStart < iEnd ? iStart : iEnd;
    const iTo = iStart > iEnd ? iStart : iEnd;

    const jFrom = jStart < jEnd ? jStart : jEnd;
    const jTo = jStart > jEnd ? jStart : jEnd;

    let alreadyHave = true;

    for (let i = iFrom; i <= iTo; i++) {
      for (let j = jFrom; j <= jTo; j++) {
        const cell = data[i][j];

        // Update Styles
        if (styles) {
          const cellStyles = JSON.parse(JSON.stringify(cell.styles || {}));

          const filteredItem = Object.keys(styles).filter(
            key => cellStyles[key] && cellStyles[key] == styles[key]
          );

          if (filteredItem.length == 0) {
            alreadyHave = false;
            break;
          }
        }
      }
    }

    return alreadyHave;
  };

  /**
   * Identify the style operation is a single/toggle operation
   *
   * @param {String} key
   * @returns {Bool}
   */
  getIsSingleOperationKey = key => {
    return (
      key == FORMATTING_KEYS.backgroundColor ||
      key == FORMATTING_KEYS.color ||
      key == FORMATTING_KEYS.textAlign ||
      key == FORMATTING_KEYS.fontFamily ||
      key == FORMATTING_KEYS.fontSize
    );
  };

  /**
   * Travel Cells to assign styles
   *
   * @param {Object}
   */
  traverseCells = ({ styles, isCopy } = {}) => {
    const {
      selected,
      rowConfigs,
      data,
      setData,
      handleGridUpdated,
    } = this.props;

    const newChanges = {};

    const {
      start: { i: iStart, j: jStart },
      end: { i: iEnd, j: jEnd },
    } = selected;

    const iFrom = iStart < iEnd ? iStart : iEnd;
    const iTo = iStart > iEnd ? iStart : iEnd;

    const jFrom = jStart < jEnd ? jStart : jEnd;
    const jTo = jStart > jEnd ? jStart : jEnd;

    try {
      let textToCopy = '';

      const isAlreadyHaveKey = this.isAlreadyHaveKey(data, selected, styles);

      for (let i = iFrom; i <= iTo; i++) {
        if (!data[i]) data[i] = [];
        const rowConfig = rowConfigs[i] || {};

        for (let j = jFrom; j <= jTo; j++) {
          if (!data[i][j]) data[i][j] = {};
          const cell = data[i][j];

          // Update Styles
          if (styles) {
            const cellStyles = JSON.parse(JSON.stringify(cell.styles || {}));

            Object.keys(styles).forEach(key => {
              const isSelectedKey = this.getIsSingleOperationKey(key);

              // IN CASE OF MULTI SELECTION CELLS
              if (isSelectedKey) {
                cellStyles[key] = styles[key] || {};
                return;
              }

              if (!(iStart == iEnd && jStart == jEnd)) {
                if (!isAlreadyHaveKey) {
                  cellStyles[key] = styles[key] || {};
                } else {
                  delete cellStyles[key];
                }
                return;
              }

              // IN CASE OF SINGLE SELECTION CELL
              if (cellStyles[key] && cellStyles[key] == styles[key]) {
                delete cellStyles[key];
              } else {
                cellStyles[key] = styles[key] || {};
              }
            });

            data[i][j].styles = { ...cellStyles };
            newChanges[`${rowConfig.row_id}--${j}`] = cell.value;
          }

          // Copy to Clip board
          if (isCopy) {
            textToCopy += cell.value || '';
            if (j < jTo) textToCopy += ' \t';
          }
        }

        if (isCopy && i < iTo) textToCopy += '\n';
      }

      if (isCopy) copyToClipBoard(textToCopy);

      setData(data);
      handleGridUpdated(newChanges, {});
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Selected Cell Arrays
   */
  selectedCellArrays = formatting_keys => {
    const { selected, data } = this.props;
    const { formatAction } = this.state;
    const { backgroundColor = '', color = '' } = formatting_keys || {};

    const {
      start: { i: iStart, j: jStart },
      end: { i: iEnd, j: jEnd },
    } = selected;

    const iFrom = iStart < iEnd ? iStart : iEnd;
    const iTo = iStart > iEnd ? iStart : iEnd;

    const jFrom = jStart < jEnd ? jStart : jEnd;
    const jTo = jStart > jEnd ? jStart : jEnd;

    this.setState({ colorEle: null });

    range(iFrom, iTo + 1).map(row => {
      return range(jFrom, jTo + 1).map(col => {
        const cell = data[row][col];
        const { styles: textStyle = {} } = cell;

        if (formatAction == color && textStyle.color) {
          return delete textStyle.color;
        }

        if (formatAction == backgroundColor && textStyle.backgroundColor) {
          return delete textStyle.backgroundColor;
        }

        return cell;
      });
    });
  };

  /**
   * Handle Click on Style
   */
  handleStyle = actionKey => async (evt, opt) => {
    try {
      const { selected } = this.props;

      if (!selected || !selected.start) return;

      let styles = {};

      switch (actionKey) {
        case FORMATTING_KEYS.bold:
        case FORMATTING_KEYS.italic:
        case FORMATTING_KEYS.underlined:
        case FORMATTING_KEYS.textAlignLeft:
        case FORMATTING_KEYS.textAlignCenter:
        case FORMATTING_KEYS.textAlignRight:
          ({ styles } = FORMATTING_TOOLS_WITH_KEYS[actionKey]);
          this.traverseCells({ styles });
          break;

        case FORMATTING_KEYS.fontFamily:
          styles = { fontFamily: opt.value || '' };
          this.traverseCells({ styles });
          break;

        case FORMATTING_KEYS.fontSize:
          let fontSize = '';
          styles = {};

          if (!opt) opt = '';

          if (typeof opt == 'string') {
            fontSize = getNumbers(opt, false);
            if (!fontSize) fontSize = '14';
            fontSize += 'px';

            styles = { fontSize };
            this.traverseCells({ styles });
            break;
          }

          styles = { fontSize: opt.value };
          this.traverseCells({ styles });
          break;

        case FORMATTING_KEYS.color:
        case FORMATTING_KEYS.backgroundColor:
          this.openColorPicker(actionKey)(evt);
          break;

        case FORMATTING_KEYS.noFill:
          this.selectedCellArrays(FORMATTING_KEYS);
          this.traverseCells({ styles });
          break;

        case FORMATTING_KEYS.copy:
          this.traverseCells({ isCopy: true });
          break;

        case FORMATTING_KEYS.paste:
          const { data, handleCellsChanged } = this.props;

          const { changes, additions } = await getCellsFromClipBoard({
            selected,
            data,
          });

          handleCellsChanged(changes, additions);
          break;

        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Open Color Picker Popover
   */
  openColorPicker = actionKey => evt => {
    this.setState({ colorEle: evt.currentTarget, formatAction: actionKey });
  };

  /**
   * Close Color Picker Popover
   */
  closeColorPicker = () => {
    this.setState({ colorEle: null, formatAction: '' });
  };

  /**
   * Handle color change for SketchPicker component
   *
   * @param {Object}
   */
  handleColorChange = ({ rgb }) => {
    this.setState({ color: rgb });
    this.assignColor();
  };

  /**
   * Assign Color to Cell
   *
   * @param {Object}
   */
  assignColor = () => {
    const { formatAction, color } = this.state;

    const styles = {};

    switch (formatAction) {
      case FORMATTING_KEYS.color:
        styles.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        this.traverseCells({ styles });
        break;

      case FORMATTING_KEYS.backgroundColor:
        styles.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        this.traverseCells({ styles });
        break;

      default:
        break;
    }

    this.setState({ colorEle: null, formatAction: '' });
  };

  /**
   * When Component Did Update
   */
  componentDidUpdate(prevProps) {
    if (prevProps.selected != this.props.selected) {
      const { selected, data } = this.props;

      if (selected && selected.start) {
        const { i, j } = selected.start;
        if (i < data.length) {
          let { value = '' } = data[i][j];

          if (j > 1) {
            value = value ? value.noExponents() : '';
          }

          this.setState({
            activeCell: data[i][j].expr ? data[i][j].expr : value,
          });
        }
      }
    }
  }

  /**
   * Handle > Change Input Value
   *
   * @param {Object}
   */
  handleChangeInput = ({ target: { name, value } }) => {
    try {
      this.setState({ [name]: value });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Handle > On keypress Event
   *
   * @param {Object}
   */
  handleKeyDownFormulaBar = ({ target = {}, keyCode = '' }) => {
    if (keyCode === 13 && target) {
      target.blur();
    }
  };

  /**
   * Handle > On Blur
   *
   * @param {Object}
   */
  handleFormulaBarBlur = () => {
    try {
      const { activeCell = '' } = this.state;
      const { selected, data, handleCellsChanged } = this.props;

      if (selected && selected.start) {
        const { i, j } = selected.start;
        let value = activeCell;

        if (j > 1 && String(value).charAt(0) != '=') {
          value = Number(activeCell).toFixed(DEFAULT_MAX_CHARS_AFTER_DECIMAL);
        }

        if (String(value).charAt(0) != '=') {
          value = activeCell.trim();
        }

        const updatedCell = [
          {
            cell: data[i][j],
            col: j,
            row: i,
            value,
          },
        ];

        this.setState({
          activeCell:
            j > 1 && String(value).charAt(0) != '=' && activeCell != ''
              ? Number(activeCell)
                  .toFixed(DEFAULT_MAX_CHARS_AFTER_DECIMAL)
                  .noExponents()
              : activeCell,
        });

        handleCellsChanged(updatedCell, []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Render View
   */
  render() {
    const { colorEle, color, activeCell } = this.state;
    const { selected, data } = this.props;
    let isActionDisabled = !selected || !selected.start;

    let isReadOnly = false;

    let cellStyles = {};
    if (selected && selected.start) {
      const { i, j } = selected.start;
      if (i < data.length) {
        isActionDisabled = data.length - 1 === i || false;
        isReadOnly = data[i][j].readOnly || false;

        if (i == data.length - 1) isActionDisabled = true;

        cellStyles = data[i][j].styles || {};
      }
    }

    return (
      <Box display="flex" alignItems="center" className="grid-format-bar">
        <Box display="flex" alignItems="center" className="formula-bar">
          <ImgRenderer src="fx-sign.svg" />
          <TextField
            value={activeCell}
            variant="outlined"
            name="activeCell"
            disabled={isActionDisabled || isReadOnly}
            onKeyDown={this.handleKeyDownFormulaBar}
            onBlur={this.handleFormulaBarBlur}
            inputProps={{ style: { textTransform: 'uppercase' } }}
            onChange={this.handleChangeInput}
          />
        </Box>
        <span className="format-divider"></span>
        {FORMATTING_TOOLS.map((tool, i) => {
          if (!tool.isVisible) return null;

          let label = '';
          const inputStyles = {};

          if (tool.key == FORMATTING_KEYS.fontFamily) {
            label = cellStyles.fontFamily;
            inputStyles.fontFamily = label || tool.defaultValue;
          } else if (tool.key == FORMATTING_KEYS.fontSize) {
            label = cellStyles.fontSize;
          }

          return (
            <React.Fragment key={`${tool.key}-${i}`}>
              {tool.options && (
                <Box px={1}>
                  <Autocomplete
                    disabled={isActionDisabled}
                    fullWidth
                    value={{ label: label || tool.defaultValue }}
                    openOnFocus
                    selectOnFocus
                    clearOnBlur
                    freeSolo
                    style={tool.inputStyles}
                    ListboxComponent={ListboxComponent}
                    handleHomeEndKeys
                    disableClearable
                    renderOption={({ label, styles }) => (
                      <span style={styles}>{label}</span>
                    )}
                    onChange={this.handleStyle(tool.key)}
                    getOptionLabel={({ label = '' }) => label}
                    options={tool.options.map(item => ({
                      label: `${item.label}`,
                      value: item.value,
                      option: item,
                      styles: item.styles || {},
                    }))}
                    renderInput={params => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder={tool.label}
                        size="small"
                      />
                    )}
                    filterOptions={(options, params) => {
                      return filter(options, params);
                    }}
                  />
                </Box>
              )}

              {tool.key == FORMATTING_KEYS.divider && (
                <span className="format-divider"></span>
              )}

              {tool.icon && (
                <Box
                  px={0.5}
                  display="flex"
                  alignItems="center"
                  className={`${
                    isActionDisabled
                      ? 'cursor-not-allowed action-disabled'
                      : 'cursor-pointer grid-formatting-icons'
                  }`}
                  onClick={this.handleStyle(tool.key)}
                  title={tool.label}
                  py={0.5}
                >
                  {tool.icon}
                </Box>
              )}
            </React.Fragment>
          );
        })}

        <Popover
          open={Boolean(colorEle)}
          anchorEl={colorEle}
          onClose={this.closeColorPicker}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{}}
        >
          <Box
            padding={1}
            display="flex"
            flexDirection="column"
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              textAlign: 'center',
            }}
          >
            <Button
              color="primary"
              variant="outlined"
              className="title-button"
              onClick={this.handleStyle(FORMATTING_KEYS.noFill)}
            >
              No Fill
            </Button>
            <Box mt={1}>
              <CompactPicker
                color={color}
                className="custom-rgb-block"
                width="250px"
                colors={DEFAULT_COLOR_PALETTE_COLORS}
                onChangeComplete={this.handleColorChange}
              />
            </Box>
          </Box>
        </Popover>
      </Box>
    );
  }
}

FormattingBar.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  handleCellsChanged: func,
  handleGridUpdated: func,
  onClickPaste: func,
  rowConfigs: arrayOf(shape({})),
  selected: shape({}),
  setData: func,
};
FormattingBar.defaultProps = {
  data: [],
  setData: () => {},
  selected: {},
  onClickPaste: () => {},
  handleCellsChanged: () => {},
  handleGridUpdated: () => {},
  rowConfigs: [],
};

export default FormattingBar;
