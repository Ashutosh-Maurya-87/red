import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { shape, func, bool, arrayOf, string } from 'prop-types';
import { Box, Tooltip } from '@material-ui/core';

import { Editor, Transforms, Range, createEditor } from 'slate';
import { Slate, Editable, ReactEditor, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
import FieldDropdown from './FieldDropdown';
import SuggestionList from './SuggestionList';
import {
  withMentions,
  Element,
  insertMention,
  Portal,
  insertText,
} from './RichTextEditor';

import { FORMULA_KEYS, BUILDER_OPTIONS, BUILDER_OPT_CONFIGS } from './config';
import {
  getFormattedEditorState,
  getFormattedFormula,
  validateFormula,
} from './helper';

import './styles.scss';

const CHARACTERS = ['row', 'assumption'];
const REGX_TO_SEARCH = /([rowROWASSUMPTIONassumption])\w+/g;

function FormulaBuilder({ formulaGroup, setFormulaGroup, isSubmit, rowId }) {
  // Builder state
  const [formula, setFormula] = useState(formulaGroup);
  const [menuEle, setMenuEle] = useState(null);
  const [activeFxType, setActiveFxType] = useState(null);
  const [activeFxIndex, setActiveFxIndex] = useState(null);
  // const [lastSelectedEle, setLastSelectedText] = useState(null);
  const [lastSelectedCursor, setLastCursor] = useState(null);
  const [selectedRow, setSelectedRow] = useState({});

  // Editor State
  const ref = useRef();
  const [value, setValue] = useState(getFormattedEditorState(formulaGroup));
  const [target, setTarget] = useState();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

  /**
   * Handle on Click event on mention to show suggestion list
   */
  const handleSuggestList = useCallback(
    element => event => {
      ref.current = event.target;
      const { meta } = element;
      const { type = '' } = meta || {};

      setSearch(type?.toLowerCase());

      setTimeout(() => {
        const { selection } = editor;

        if (selection) {
          openSuggestionList(selection, meta);
        }
      }, 100);
    },
    [editor]
  );

  /**
   * Render tag component in editor
   */
  const renderElement = useCallback(
    props => <Element {...props} onSuggestList={handleSuggestList} />,
    [handleSuggestList]
  );

  /**
   * Show manual list of suggestion as per the user typing
   *
   * @param {Object} selection
   * @param {Object} builderElement // it must be a row, assumption or dimension
   */
  const openSuggestionList = (selection, builderElement) => {
    setTarget(selection);
    setSelectedRow(builderElement);
  };

  /**
   * Hook to use as Callback of setFormula
   */
  useEffect(() => {
    setFormulaGroup(formula);
  }, [formula, setFormulaGroup]);

  /**
   * Close `Add Field` Menu
   */
  const closeFieldsList = opt => {
    if (opt && opt.signature) {
      if (activeFxIndex > -1) {
        formula[activeFxIndex] = opt;
      } else {
        formula.push(opt);
      }

      insertMention(editor, opt, lastSelectedCursor); // update state in editor
      setFormula(formula);

      setTimeout(() => {
        manualFocusOnEditor(true);

        if (ReactEditor.isFocused(editor)) {
          Transforms.move(editor);
          Transforms.move(editor);
        }
      }, 100);
    }

    // Reset state
    setMenuEle(null);
    setActiveFxType(null);
    setActiveFxIndex(null);
  };

  /**
   * Get Last element of selection state or formula if no selection founded
   */
  // const getLastKey = lastSelectedEle => {
  //   const { selection } = editor;

  //   const expression = lastSelectedEle
  //     ? String(lastSelectedEle).replace(/\s/g, '')
  //     : '';

  //   if (expression) {
  //     if (expression.match(/^[a-z]+$/i))
  //       return {
  //         type: FORMULA_KEYS.ROW,
  //       };

  //     if (Number(expression))
  //       return {
  //         type: FORMULA_KEYS.CONSTANT,
  //       };

  //     if (['+', '-', '*', '/', '%'].includes(expression))
  //       return {
  //         type: FORMULA_KEYS.OPERATOR,
  //       };

  //     if (['(', ')'].includes(expression))
  //       return {
  //         type: FORMULA_KEYS.GROUP,
  //       };
  //   }

  //   if (selection && !lastSelectedEle) {
  //     const { focus } = selection || {};
  //     const { path, offset } = focus || {};
  //     const [pathStart, pathEnd] = path;

  //     if (pathStart == 0 && pathEnd == 0 && offset < 2) return {};

  //     const [start] = editor.getFragment() || [];
  //     const { children = [] } = start || {};

  //     if (children && children.length > 0) {
  //       const [element] = children;
  //       const { key } = element || {};

  //       const index = key && typeof key == 'string' ? key.split('-')[0] : key;
  //       return formulaGroup[index];
  //     }

  //     return {};
  //   }

  //   return formula[formula.length - 1] || {};
  // };

  /**
   * Check > Is Operator Allowed
   *
   * @param {Object} opt
   *
   * @return {Boolean}
   */
  // const isOperatorAllowed = (opt, lastSelectedEle) => {
  //   const lastKey = getLastKey(lastSelectedEle) || {};

  //   switch (opt.key) {
  //     case FORMULA_KEYS.FIELD:
  //     case FORMULA_KEYS.ROW:
  //     case FORMULA_KEYS.ASSUMPTION:
  //     case FORMULA_KEYS.CONSTANT:
  //       if (
  //         lastKey &&
  //         lastKey.type &&
  //         (lastKey.type == FORMULA_KEYS.FIELD ||
  //           lastKey.type == FORMULA_KEYS.ROW ||
  //           lastKey.type == FORMULA_KEYS.ASSUMPTION ||
  //           lastKey.type == FORMULA_KEYS.CONSTANT)
  //       ) {
  //         return false;
  //       }

  //       return true;

  //     case FORMULA_KEYS.OPERATOR:
  //       if (lastKey.type && lastKey.type != opt.key) {
  //         return true;
  //       }

  //       return false;

  //     case FORMULA_KEYS.GROUP:
  //       if (
  //         (!lastKey.type && opt.operator == '(') ||
  //         (lastKey.type == FORMULA_KEYS.OPERATOR && opt.operator == '(') ||
  //         (lastKey.type == '(' && opt.operator == '(') ||
  //         (lastKey.type == FORMULA_KEYS.ROW && opt.operator == ')') ||
  //         (lastKey.type == FORMULA_KEYS.ASSUMPTION && opt.operator == ')') ||
  //         (lastKey.type == FORMULA_KEYS.CONSTANT && opt.operator == ')')
  //       ) {
  //         return true;
  //       }

  //       return false;

  //     default:
  //       return true;
  //   }
  // };

  /**
   * Handle Click `Add Field | Operation | if`
   *
   * @param {Object} opt
   */
  const onClickOperator = ({ opt, index, isAllowed = true }) => evt => {
    if (!isAllowed) return;
    setActiveFxIndex(null);

    const lastKey = formula[formula.length - 1] || {};

    switch (opt.key) {
      case FORMULA_KEYS.ROW:
      case FORMULA_KEYS.ASSUMPTION:
        setActiveFxIndex(index);
        setActiveFxType(opt.key?.toLowerCase());
        setMenuEle(evt.currentTarget);
        break;

      case FORMULA_KEYS.CONSTANT:
        formula.push({ ...BUILDER_OPT_CONFIGS[opt.key] });
        break;

      case FORMULA_KEYS.GROUP:
      case FORMULA_KEYS.OPERATOR:
        if (
          (!lastKey.type && opt.operator == ')') ||
          (lastKey.operator == '(' && opt.operator == ')')
        ) {
          return;
        }

        formula.push({
          ...BUILDER_OPT_CONFIGS[opt.key],
          ...{ value: opt.operator },
        });

        insertText(editor, ` ${opt.operator} `, lastSelectedCursor);
        break;

      default:
        return;
    }

    setFormula([...formula]);
  };

  /**
   * Filter keywords like row and assumptions
   */
  const chars = CHARACTERS.filter(c =>
    c.startsWith(search?.toLowerCase())
  ).slice(0, 10);

  /**
   * Handle Event > Enter key only
   */
  const handleEnterEvent = useCallback(() => {
    const [start] = editor.getFragment() || [];
    const { children = [] } = start || {};

    if (children && children.length > 0) {
      const [element] = children;
      const { type } = element || {};

      if (type && type == 'mention') {
        const { meta } = element || {};
        const { type: mentionType = '' } = meta || {};

        setSearch(mentionType);

        setTimeout(() => {
          const { selection } = editor;

          if (selection) {
            openSuggestionList(selection, meta);
          }
        }, 100);
      }
    }
  }, [editor]);

  /**
   * Handle on key down event
   */
  const onKeyDown = useCallback(
    event => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();

          if (target) {
            const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
          }
          break;

        case 'ArrowUp':
          event.preventDefault();

          if (target) {
            const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
            setIndex(nextIndex);
          }
          break;
        case 'Tab':
        case 'Enter':
          // case 'c':
          // case 'v':
          // case 'x':
          event.preventDefault();
          if (!target && editor && event.key == 'Enter') {
            handleEnterEvent(editor, event);
          }
          break;

        case '+':
        case '-':
        case '*':
        case '/':
        case '(':
        case ')':
          event.preventDefault();
          Transforms.insertText(editor, ` ${event.key} `);
          break;

        case 'Escape':
          event.preventDefault();
          setTarget(null);
          setSelectedRow({});
          break;

        default:
          break;
      }
    },
    [chars.length, editor, handleEnterEvent, index, target]
  );

  /**
   * Update formatted formula
   *
   * @param {Array} value
   */
  const handleUpdateFormula = value => {
    const [first] = value || [];
    const { children = [] } = first || {};

    const formattedFormula = getFormattedFormula(children);
    setFormula(formattedFormula);
  };

  /**
   * Hook to update ref and position for suggestion list
   */
  useEffect(() => {
    if (target && chars.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();

      if (rect.left + window.pageXOffset < window.innerWidth - 320) {
        el.style.top = `${rect.top + window.pageYOffset + 24}px`;
        el.style.left = `${rect.left + window.pageXOffset}px`;
      } else {
        el.style.top = `${rect.top + window.pageYOffset + 24}px`;
        el.style.left = `${rect.left + window.pageXOffset - 320}px`;
      }
    }
  }, [chars.length, editor, index, search, target]);

  /**
   * Handle Suggestion list on close event
   *
   * @param {Object} selectedItem // It will be Row || Assumption || Dimension(selected Object)
   * @param {Object} prevItem
   */
  const handleSuggestionCloseEvt = (selectedItem, prevItem) => {
    if (target && target.focus && selectedItem) {
      const { focus } = target || {};
      const { offset } = focus || {};

      if (offset == search.length) {
        const lastToken = formulaGroup[formulaGroup.length - 1];
        if (lastToken && lastToken.type == FORMULA_KEYS.CONSTANT) {
          editor.deleteBackward('word'); // remove previous search word

          const { selection } = editor; // Update selection

          Transforms.select(editor, selection);

          insertMention(editor, selectedItem);
          setTarget(null);
          return;
        }
      }

      if (prevItem && Object.keys(prevItem).length > 0) {
        const { selection } = editor;
        Transforms.delete(editor, selection);
      } else {
        editor.deleteBackward('word'); // remove previous search word
        Transforms.select(editor, target);
      }

      insertMention(editor, selectedItem);
      manualFocusOnEditor();

      setTarget(null);
      setSelectedRow({});
    }
  };

  /**
   * Apply manual focus on editor
   *
   * @param {Boolean} isApplyLastSelection
   */
  const manualFocusOnEditor = isApplyLastSelection => {
    // Enable this code if you want to select and focus on specific location
    // editor.select({
    //   anchor: firstPosition,
    //   focus: firstPosition,
    //   isFocused: true,
    // });

    const [firstElement = []] = value;
    const isFirstChar = (firstElement?.children?.length || 0) < 2;

    const firstCharacter = {
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 0, path: [0, 0] },
      isFocused: true,
    };

    if (!ReactEditor.isFocused(editor)) {
      if (isApplyLastSelection && isFirstChar) {
        Transforms.select(editor, firstCharacter);
      }

      if (isApplyLastSelection && lastSelectedCursor) {
        Transforms.select(editor, lastSelectedCursor);
      }

      const editorEl = document.querySelector('.formula-edit-mode');
      editorEl.focus();
    }
  };

  /**
   * Change state of Rich Text Editor
   *
   * @param {Array} value
   */
  const handleOnChangeState = value => {
    setValue(value);

    handleUpdateFormula(value);

    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      setLastCursor(selection);
      handleSelectionChanges(selection);
      return;
    }

    if (
      !selection &&
      lastSelectedCursor &&
      Range.isCollapsed(lastSelectedCursor)
    ) {
      handleSelectionChanges(selection);
      return;
    }

    setTarget(null);
  };

  /**
   * Select first node element of editor while typing
   *
   * @param {Object} selection
   */
  const selectFirstNodeEle = selection => {
    try {
      const { children = [] } = editor || {};
      const [firstItem = {}] = children || [];
      const { children: builderStates = [] } = firstItem || {};
      const [firstEle] = builderStates || [];
      const { text = '' } = firstEle || {};
      const matchedTextArr = text.match(REGX_TO_SEARCH);

      if (matchedTextArr) {
        setTarget(selection);
        setSearch(matchedTextArr[0]);
        setIndex(0);
        return;
      }

      setTarget(null);
    } catch (error) {
      setTarget(null);
      console.error(error);
    }
  };

  /**
   * Handle section and typing of editor
   *
   * @param {Object} selection
   */
  const handleSelectionChanges = selection => {
    try {
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const wordBefore = Editor.before(editor, start, { unit: 'word' });
        const before = wordBefore && Editor.before(editor, wordBefore);
        const beforeRange = before && Editor.range(editor, before, start);
        const beforeText = beforeRange && Editor.string(editor, beforeRange);

        // if (beforeText) {
        //   setLastSelectedText(beforeText);
        // } else {
        //   setLastSelectedText(null);
        // }

        const beforeMatch = beforeText && beforeText.match(REGX_TO_SEARCH);
        const after = Editor.after(editor, start);
        const afterRange = Editor.range(editor, start, after);
        const afterText = Editor.string(editor, afterRange);
        const afterMatch = afterText.match(/^(\s|$)/);

        if (beforeMatch && afterMatch) {
          setTarget(beforeRange);
          setSearch(beforeMatch[0]);
          setIndex(0);
          return;
        }

        selectFirstNodeEle(selection);
        return;
      }

      if (formulaGroup.length > 1) {
        setTarget(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Validate Realtime Formula
   *
   * @returns {Boolean}
   */
  const isFormulaValid = () => {
    const { error } = validateFormula(formulaGroup);

    return error ? false : true;
  };

  /**
   * Validate Realtime Formula msg
   *
   * @returns {String}
   */
  const getFormulaValidationMsg = () => {
    const { error } = validateFormula(formulaGroup);

    return error ? error : '';
  };

  return (
    <>
      <Box className={`formula-builder-wrap`}>
        <span
          onClick={() => manualFocusOnEditor(true)}
          className="overlay"
        ></span>
        <Box
          display="inline-flex"
          alignItems="center"
          flexWrap="wrap"
          style={{ position: 'relative', zIndex: '1' }}
        >
          {BUILDER_OPTIONS.map(opt => {
            const isAllowed = true;

            return (
              <Box
                className={`operators-list ${
                  isAllowed ? '' : 'disable-operator'
                }`}
                m={1}
                key={opt.label}
                onClick={onClickOperator({ opt, isAllowed })}
              >
                {opt.label}
              </Box>
            );
          })}
        </Box>

        {menuEle && (
          <FieldDropdown
            type={activeFxType}
            rowId={rowId}
            selectedItem={formula[activeFxIndex] || {}}
            menuEle={menuEle}
            onClose={closeFieldsList}
          />
        )}

        {/* Content Editor */}
        <Slate editor={editor} value={value} onChange={handleOnChangeState}>
          <Editable
            autoFocus
            className="formula-edit-mode"
            renderElement={renderElement}
            onKeyDown={onKeyDown}
            onPaste={event => {
              event.preventDefault();
            }}
            placeholder="Enter some text..."
          />
          {target && chars.length > 0 && (
            <Portal>
              <div ref={ref} className="suggestion-popover">
                {ref && ref.current && (
                  <SuggestionList
                    menuEle={ref.current}
                    rowId={rowId}
                    type={chars[0]}
                    selectedItem={selectedRow || {}}
                    onClose={handleSuggestionCloseEvt}
                  />
                )}
              </div>
            </Portal>
          )}
        </Slate>
        {formulaGroup && formulaGroup.length > 0 && !isFormulaValid() && (
          <Box className="formula-error-icon">
            <Tooltip title={getFormulaValidationMsg()} placement="top">
              <WarningRoundedIcon color="error" />
            </Tooltip>
          </Box>
        )}
      </Box>
    </>
  );
}

FormulaBuilder.propTypes = {
  formulaGroup: arrayOf(shape({})).isRequired,
  isSubmit: bool,
  rowId: string.isRequired,
  setFormulaGroup: func.isRequired,
};

FormulaBuilder.defaultProps = {
  formulaGroup: [],
  rowId: '',
  isSubmit: false,
  setFormulaGroup: () => {},
};

export default FormulaBuilder;
