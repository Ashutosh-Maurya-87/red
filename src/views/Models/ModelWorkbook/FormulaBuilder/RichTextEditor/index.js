import React from 'react';
import ReactDOM from 'react-dom';
import { func, shape } from 'prop-types';

import { Button } from '@material-ui/core';
import { Transforms } from 'slate';
import { useSelected, useFocused } from 'slate-react';
import { getFilledSignature } from '../SuggestionList/helper';

/**
 * Create react portal to show suggestion list in slate editor
 *
 * @param {Object} Props
 * @returns {HTMLElement}
 */
export const Portal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

/**
 * Bind Mention state in slate js component
 *
 * @param {Object} editor
 */
export const withMentions = editor => {
  const { isInline, isVoid } = editor;

  editor.isInline = element => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = element => {
    return element.type === 'mention' ? true : isVoid(element);
  };

  return editor;
};

/**
 * Insert Mention state in slate js Editor
 *
 * @param {Object} editor
 * @param {Object} selectedItem
 * @param {Object} selection
 */
export const insertMention = (editor, selectedItem, selection) => {
  const { signature, params } = selectedItem || {};

  const mention = {
    type: 'mention',
    character: getFilledSignature(signature, params),
    children: [{ text: '' }],
    meta: selectedItem,
  };

  if (selection) {
    Transforms.select(editor, selection);
  }
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

/**
 * Insert Text state in slate js Editor
 *
 * @param {Object} editor
 * @param {String} text
 */
export const insertText = (editor, text, selection) => {
  const mention = {
    text,
  };

  if (selection) {
    Transforms.select(editor, selection);
  }

  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

/**
 * Display editor state(Text || Mention)
 *
 * @param {Object} Props
 * @returns {HTMLElement}
 */
export const Element = props => {
  const { attributes, children, element } = props;

  const {
    element: { key },
  } = props;

  switch (element.type) {
    case 'mention':
      return <MentionElement key={key} {...props} />;
    default:
      return (
        <p key={key} {...attributes}>
          {children}
        </p>
      );
  }
};

Element.propTypes = {
  attributes: shape({}),
  children: shape({}),
  element: shape({}),
};

Element.defaultTypes = {
  attributes: {},
  children: {},
  element: {},
};

/**
 * Component to create mention tag in slate js editor
 *
 * @param {Object} Props
 * @returns {HTMLElement}
 */
export const MentionElement = ({
  attributes: { contentEditable, ...attributes },
  children,
  element,
  onSuggestList,
}) => {
  const selected = useSelected();
  const focused = useFocused();

  const warning =
    element?.character.includes('Assumption') &&
    element?.character.includes('null');

  return (
    <>
      <Button
        {...attributes}
        color="primary"
        size="small"
        className={`${selected && focused ? 'formula-btn-focused' : ''} ${
          warning ? 'formula-error-btn' : ''
        }`}
        onClick={onSuggestList(element)}
      >
        <span contentEditable={contentEditable}>{element?.character}</span>
        {children}
      </Button>
    </>
  );
};

MentionElement.propTypes = {
  attributes: shape({}),
  children: shape({}),
  element: shape({}),
  onSuggestList: func,
};

MentionElement.defaultTypes = {
  attributes: {},
  children: {},
  element: {},
};
