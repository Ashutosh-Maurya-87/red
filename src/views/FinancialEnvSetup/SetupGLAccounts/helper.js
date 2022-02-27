import {
  GL_ACCOUNT_HEADERS,
  MATH_TYPE,
  // POSITIVE_VARIANCE,
  // REVERSE_SIGN,
} from './configs';

/**
 * Get Valid Cell Value for GL Accounts
 *
 * @param {String} title
 * @param {Any} value
 *
 * @return {String}
 */
export const getValidCellValue = (title, value) => {
  const [
    identifier,
    name,
    rollUp,
    // reverse,
    mathType,
    // positiveVariance,
  ] = GL_ACCOUNT_HEADERS;

  let options = null;

  switch (title) {
    // case reverse.title:
    //   options = REVERSE_SIGN;
    //   break;

    case mathType.title:
      options = MATH_TYPE;
      break;

    // case positiveVariance.title:
    //   options = POSITIVE_VARIANCE;
    //   break;

    case identifier.title:
    case name.title:
    case rollUp.title:
    default:
      return value;
  }

  if (!options) return value;

  const validOpt = options.find(s => s.value == value);

  if (validOpt) return validOpt.label;

  return value;
};
