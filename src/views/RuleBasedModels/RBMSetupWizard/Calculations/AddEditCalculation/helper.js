import { v4 as uuidV4 } from 'uuid';

import {
  ERROR_MESSAGES,
  RULE_BASED_MODELS_MSG,
} from '../../../../../configs/messages';

import { validateNameWithUnderScore } from '../../../../../utils/helper/validateName';
import {
  ADD_CALCULATION_CAP,
  ADD_CALCULATION_END_FORECAST,
  ADD_CALCULATION_START_FORECAST,
  CALCULATION_MIN_MAX_VALUE,
  DATA_SOURCES,
  RULES_TYPES,
} from '../../../configs';

/**
 * Error showing validation on number
 *
 * @returns {string}
 */
export const validatingNumber = ({ value, min, max, name }) => {
  let error;

  if (!String(value)) {
    error = ERROR_MESSAGES.required;
    return error;
  }

  error = ERROR_MESSAGES.number_min_max_range
    .replace('#DATA#', name)
    .replace('#MIN#', min)
    .replace('#MAX#', max);

  if (value < min || value > max) {
    return error;
  }

  return '';
};

/**
 * Name Validation
 *
 * @param {String} name
 * @returns
 */
export const validatingName = name => {
  if (!validateNameWithUnderScore(name)) {
    return !name
      ? ERROR_MESSAGES.required
      : RULE_BASED_MODELS_MSG.invalid_name_message;
  }
  return '';
};

export const validateForm = singleRule => {
  const {
    name = '',
    type = '',
    fixedValue = null,
    termsInMonths = '12',
    percentageOf = [],
    capTerm = {},
    cap = null,
    startForecast = {},
    startMonthDelay = 1,
    endForecast = {},
    endMonthDelay = 0,
  } = singleRule || {};

  const isTypeInput = RULES_TYPES.DIRECT_INPUT.value == type;
  const isTypePercentage = RULES_TYPES.PERCENT.value == type;
  const isTypeCount = RULES_TYPES.COUNT.value == type;

  if (validatingName(name)) return true;

  if (isTypePercentage && percentageOf.length < 1) return true;

  if (
    validatingNumber({
      value: fixedValue,
      min: CALCULATION_MIN_MAX_VALUE.fixedValue.min,
      max: CALCULATION_MIN_MAX_VALUE.fixedValue.max,
      name: 'Quantity',
    })
  )
    return true;

  if (isTypeInput || isTypePercentage) {
    if (
      fixedValue != DATA_SOURCES.columnInData.value &&
      validatingNumber({
        value: fixedValue,
        min: CALCULATION_MIN_MAX_VALUE.fixedValue.min,
        max: CALCULATION_MIN_MAX_VALUE.fixedValue.max,
        name: '',
      })
    )
      return true;

    if (
      validatingNumber({
        value: termsInMonths,
        min: CALCULATION_MIN_MAX_VALUE.termsInMonths.min,
        max: CALCULATION_MIN_MAX_VALUE.termsInMonths.max,
        name: 'Term (months)',
      })
    )
      return true;
  }

  if (!isTypeCount) {
    if (
      capTerm != ADD_CALCULATION_CAP.null.value &&
      validatingNumber({
        value: cap,
        min: CALCULATION_MIN_MAX_VALUE.cap.min,
        max: CALCULATION_MIN_MAX_VALUE.cap.max,
        name: 'Cap Amount',
      })
    )
      return true;
  }

  if (
    startForecast === ADD_CALCULATION_START_FORECAST.DELAY.value &&
    validatingNumber({
      value: startMonthDelay,
      min: CALCULATION_MIN_MAX_VALUE.startForecastDelay.min,
      max: CALCULATION_MIN_MAX_VALUE.startForecastDelay.max,
      name: 'Start Month Delay',
    })
  )
    return true;

  if (
    (endForecast === ADD_CALCULATION_END_FORECAST.DELAY.value ||
      endForecast === ADD_CALCULATION_END_FORECAST.BEFORE.value ||
      endForecast ===
        ADD_CALCULATION_END_FORECAST.MONTHS_AFTER_START_MONTH.value) &&
    validatingNumber({
      value: endMonthDelay,
      min: CALCULATION_MIN_MAX_VALUE.endForecastDelay.min,
      max: CALCULATION_MIN_MAX_VALUE.endForecastDelay.max,
      name: 'End Month Delay',
    })
  )
    return true;
  return false;
};

export const getDefaultStateRule = ({
  commonFields,
  commonFieldsForPercentAndInput,
  typePercentage,
  rules,
  ruleIndex,
  selectedRule,
}) => {
  if (ruleIndex != null && ruleIndex > -1) {
    let copyOfCommonFields = { ...commonFields };
    let copyOfCommonFieldsForPercentAndInput = {
      ...commonFieldsForPercentAndInput,
    };
    let copyOfTypePercentage = {
      ...typePercentage,
    };

    const {
      forecast_label = '',
      gl_id = '',
      gl_id_lookup = '',
      calc_method = '',
      start_forecast = '',
      start_forecast_delay = '',
      end_forecast = '',
      end_forecast_delay = '',
      terms_in_month = '',
      schedule = '',
      cap_term = '',
      cap = '',
      fixed_value = '',
      percent_of = [],
      id,
      rule_uid = '',
    } = selectedRule || {};

    copyOfCommonFields = {
      ...copyOfCommonFields,
      id,
      ruleUid: rule_uid,
      name: forecast_label,
      glId: gl_id_lookup ? gl_id_lookup : gl_id,
      type: calc_method,
      startForecast: start_forecast,
      startMonthDelay: start_forecast_delay,
      endForecast: end_forecast,
      endMonthDelay: end_forecast_delay,
    };

    copyOfCommonFieldsForPercentAndInput = {
      ...copyOfCommonFieldsForPercentAndInput,
      termsInMonths: terms_in_month,
      schedule,
      capTerm: cap_term,
      cap,
      dataSource:
        fixed_value == null
          ? DATA_SOURCES.columnInData.value
          : DATA_SOURCES.fixedValue.value,
      fixedValue: fixed_value ? fixed_value : 1,
    };

    const percentageOf = rules
      .map(({ rule_uid, forecast_label }) => ({
        label: forecast_label,
        value: rule_uid,
      }))
      .filter(({ value = '' }) => percent_of.includes(value));

    copyOfTypePercentage = {
      ...copyOfTypePercentage,
      percentageOf,
      fixedValue: fixed_value ? fixed_value : DATA_SOURCES.columnInData.value,
    };

    return {
      ...copyOfCommonFields,
      ...copyOfCommonFieldsForPercentAndInput,
      ...copyOfTypePercentage,
    };
  }

  return {
    ...commonFields,
    ...commonFieldsForPercentAndInput,
  };
};

/**
 * Save as New / Duplicate
 *
 * @param {Number} index
 * @param {Array} selectedCalculationRules
 * @param {Number} activeGroup
 * @param {Object} singleRBM
 * @param {Boolean} isUnsavedChangesAvailable
 * @param {Function} onSetUnsavedChanges
 */
export const onCopyOrDuplicate = ({
  index,
  selectedCalculationRules,
  activeGroup,
  singleRBM,
  rule,
  onSetUnsavedChanges,
  isUpdateMapping,
  setSelectedCalculationRules,
  setSingleRBM,
}) => {
  const uuid = uuidV4();
  const { configuration = {} } = singleRBM || {};
  const { entity_type = {}, rules = [] } = configuration || {};
  const { rule_group_mapping = [] } = configuration;

  const { groups = [] } = entity_type || {};

  const { forecast_label = '' } = rule || {};

  // Find and generate new rule
  const filterResult =
    selectedCalculationRules &&
    rules.filter(row => row.forecast_label.includes(forecast_label));

  let copyGroupName = '';

  if (filterResult.length > 0) {
    const name = generateRuleName(rules, filterResult.length, forecast_label);

    copyGroupName = name;
  } else {
    copyGroupName = forecast_label;
  }

  const copyRule = {
    ...selectedCalculationRules[index],
    ...rule,
    rule_uid: uuid,
    forecast_label: copyGroupName,
    forecast_column: copyGroupName,
    id: null,
  };

  const copyRuleMapping = {
    group: groups[activeGroup],
    rule_uid: uuid,
    logical_order: selectedCalculationRules.length + 1,
  };

  // insert rule in single RBM -> Rules Array
  const copyOfRBMRules = [...rules];
  copyOfRBMRules.push(copyRule);

  selectedCalculationRules.push(copyRule);

  if (isUpdateMapping) {
    rule_group_mapping.push(copyRuleMapping);
  }

  // Create updated single RBM object
  const newSingleRBM = {
    ...singleRBM,
    configuration: {
      ...configuration,
      rule_group_mapping: [...rule_group_mapping],
      rules: [...copyOfRBMRules],
      entity_type: {
        ...entity_type,
        groups: [...groups],
      },
    },
  };

  onSetUnsavedChanges(true);
  setSingleRBM(newSingleRBM);
  setSelectedCalculationRules(selectedCalculationRules);
};

/**
 * Identify the duplicate Rule name
 *
 * @param {Array} headers
 * @param {String} name
 */
export const isDuplicateRuleExist = (headers, name) => {
  const result = headers.filter(header => header.forecast_label === name);

  return result.length > 0 ? true : false;
};

/**
 * Generate new Rule name
 *
 * @param {Array} headers
 * @param {Number} Count
 * @param {String} ruleName
 *
 * @return {Object}
 */
export const generateRuleName = (headers, count, ruleName) => {
  const id = count + 1;
  const name = `Copy of ${id} - ${ruleName}`;

  if (isDuplicateRuleExist(headers, name)) {
    return generateRuleName(headers, id, ruleName);
  }

  return name;
};
