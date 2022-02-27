import { create, all } from 'mathjs';
import { DEFAULT_MAX_CHARS_AFTER_DECIMAL } from '../../configs/app';

const config = {
  predictable: false,
};

const mathJSInstance = create(all, config);

/**
 * Math JS Configs to pass custom functions
 */
const mathJSConfigs = {
  ASSUMPTION: (args, math, scope) => {
    try {
      const [firstArg] = args || [];
      const { value, name } = firstArg || {};

      const output = math.evaluate(name ? name : value, scope);

      return output;
    } catch (error) {
      return {
        isError: true,
        error,
      };
    }
  },
};

mathJSInstance.import(mathJSConfigs);

// mark the transform function with a "rawArgs" property, so it will be called
// with uncompiled, unevaluated arguments.
mathJSInstance.ASSUMPTION.rawArgs = true;

/**
 * Do Calculation with mathjs library
 *
 * @param {String|Number} value
 *
 * @return {Number|String}
 */
const doCalculations = value => {
  try {
    return mathJSInstance
      .evaluate(value)
      ?.toFixed(DEFAULT_MAX_CHARS_AFTER_DECIMAL);
  } catch (error) {
    return error;
  }
};

export { doCalculations, mathJSInstance };
