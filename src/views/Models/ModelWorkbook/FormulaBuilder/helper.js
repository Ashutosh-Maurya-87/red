import { MODELS_MSG } from '../../../../configs/messages';
import { FORMULA_KEYS, BUILDER_OPTIONS, BUILDER_OPT_CONFIGS } from './config';

const FormulaParser = require('hot-formula-parser').Parser;

const parser = new FormulaParser();

/**
 * Validate formula and execute math expression in FE
 *
 * @param {Array} formula
 * @returns Object
 */
export const validateFormula = formula => {
  let error = '';

  if (formula && formula.length == 0) {
    return { error: MODELS_MSG.fx_required };
  }

  const str = formula
    .map(fx => {
      switch (fx.type) {
        case FORMULA_KEYS.CONSTANT:
          const inputValue = String(fx.value == undefined ? '' : fx.value);

          if (!inputValue) {
            error = MODELS_MSG.add_valid_input_fx;
          }

          return inputValue;

        case FORMULA_KEYS.ROW:
        case FORMULA_KEYS.ASSUMPTION:
          if (!fx.value) {
            error = MODELS_MSG.add_valid_field_fx;
          }

          if (fx?.error_message) {
            error = fx?.error_message;
          }
          return 'FIELD';
        case FORMULA_KEYS.GROUP:
        case FORMULA_KEYS.OPERATOR:
          return fx.value;

        default:
          return null;
      }
    })
    .filter(Boolean)
    .join(' ')
    .replace(/FIELD/g, 1);

  if (error) return { error };

  const res = parser.parse(str);

  if (formula && formula.length > 0 && formula[0].value.includes('=')) {
    error = MODELS_MSG.fx_cant_start_with_equal;
    return { error };
  }

  if (res.error == '#DIV/0!') {
    error = MODELS_MSG.fx_not_divided_by_zero;
    return { error };
  }

  if (res.error) {
    error = MODELS_MSG.invalid_fx;
  }

  return { error };
};

/**
 * fill signature
 *
 * @param {string} signature
 * @param {Array} params
 */
export const getFilledSignature = (signature, params) => {
  if (!signature || !params) return '';

  params.forEach(({ key, value }) => {
    signature = signature.replace(key, value);
  });

  return signature;
};

/**
 * Convert formatted data for rich text component
 *
 * @param {Array} formula
 *
 * @return {Array}
 */
export const getFormattedEditorState = formula => {
  if (!formula || (formula && formula.length == 0))
    return [
      {
        children: [
          {
            text: '',
          },
        ],
      },
    ];

  const formattedState = [];

  formula.forEach((token, index) => {
    formattedState.push(getFormattedState(token, index));

    const emptyTextState = {
      key: `${index}-${index}`,
      text: '',
    };

    if (
      token &&
      (token.type == FORMULA_KEYS.ROW || token.type == FORMULA_KEYS.ASSUMPTION)
    ) {
      formattedState.push(emptyTextState);
    }
  });

  return [
    {
      children: formattedState,
    },
  ];
};

/**
 * Get editor state as per formula token
 *
 * @param {Object} token
 * @returns {Object}
 */
export const getFormattedState = (token, index) => {
  if (!token) return {};

  const { type = '', value = '', signature = '', params = [] } = token;

  let state = {};

  switch (type) {
    case FORMULA_KEYS.ROW:
    case FORMULA_KEYS.ASSUMPTION:
      state = {
        type: 'mention',
        key: index,
        character: getFilledSignature(signature, params),
        children: [{ text: '' }],
        meta: token,
      };
      break;

    case FORMULA_KEYS.OPERATOR:
    case FORMULA_KEYS.GROUP:
    case FORMULA_KEYS.CONSTANT:
      state = {
        key: index,
        text: ` ${value} `,
      };
      break;

    default:
      break;
  }

  return state;
};

/**
 * Convert formatted data for rich text component
 *
 * @param {Array} formula
 *
 * @return {Array}
 */
export const getFormattedFormula = formula => {
  if (formula && formula.length == 0) return [];

  let formattedState = [];

  formula.forEach(token => {
    const { type = '', meta = {}, text = '' } = token;

    switch (type) {
      case 'mention':
        formattedState.push(meta);
        break;

      default:
        formattedState = [...formattedState, ...getStringToFormula(text)];
        break;
    }
  });

  return formattedState;
};

/**
 * Convert combine string of math expression(ex: 10 + 20 + 30) into formula token objects
 *
 * @param {String} text
 * @returns {Array}
 */
export const getStringToFormula = text => {
  if (!text) return [];

  const state = [];

  const groupOfTokens = splitMathExpression(text);

  groupOfTokens.forEach(token => {
    if (token) {
      let value = {};

      const opt = BUILDER_OPTIONS.filter(
        ({ operator = '' }) => operator == token
      );

      value = {
        ...(opt && opt.length > 0 && opt[0].key
          ? BUILDER_OPT_CONFIGS[opt[0].key]
          : BUILDER_OPT_CONFIGS[FORMULA_KEYS.CONSTANT]),
        value: token,
      };

      state.push(value);
    }
  });

  return state;
};

/**
 * Split Math Expression into array of string
 * Output: (EX: "10 + 20" into ['10', '+', '20'])
 *
 * @param {String} expression
 * @returns {Array}
 */
export const splitMathExpression = expression => {
  const copyOfExpression = expression;

  expression = expression.replace(/[0-9.]+/g, '#');

  // eslint-disable-next-line no-useless-escape
  const numbers = copyOfExpression.split(/[^0-9\.]+/);

  const operators = expression.split('#').filter(n => {
    return n;
  });

  let result = [];

  numbers.forEach((number, i) => {
    result.push(number);

    if (i < operators.length) {
      if (operators[i].match(/\./)) return;

      const operatorsArr = operators[i].replace(/\s/g, '').match(/.{1,1}/g);

      if (operatorsArr && operatorsArr.length > 0) {
        result = [...result, ...operatorsArr];
      } else {
        result.push(operators[i].replace(/\s/g, ''));
      }
    }
  });

  return result;
};
