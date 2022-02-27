/**
 * handle add/edit rule
 */
export const addEditRule = props => {
  const {
    singleRBM = {},
    isEditMode = false,
    rule = {},
    rules = [],
    selectedCalculationRules = [],
  } = props;

  const { configuration = {} } = singleRBM || {};
  const { rule_uid = '' } = rule || {};

  const newlyAddedRule = { ...rule };
  const copyOfRules = [...rules];

  const copyIndex = copyOfRules.findIndex(rule => rule.rule_uid == rule_uid);

  newlyAddedRule.isSelected = true;

  let newSingleRBM = {};

  // Add new Rule
  if (!isEditMode) {
    copyOfRules.push(newlyAddedRule);

    const { rules: configRules = [] } = configuration || {};
    configRules.push(rule);

    // Create updated single RBM object
    newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rules: [...configRules],
      },
    };
  }

  if (isEditMode) {
    const indexOfSelectedRule = selectedCalculationRules.findIndex(
      rule => rule.rule_uid == rule_uid
    );

    if (indexOfSelectedRule > -1) {
      selectedCalculationRules[indexOfSelectedRule] = rule;
    }

    // update rule in rules array
    copyOfRules[copyIndex] = newlyAddedRule;

    // Create updated single RBM object
    newSingleRBM = {
      ...singleRBM,
      configuration: {
        ...configuration,
        rules: [...copyOfRules],
      },
    };
  }

  return {
    newSingleRBM,
    copyOfRules,
    copyOfSelectedCalculationRules: [...selectedCalculationRules],
  };
};

/**
 * Delete Rule From All Groups
 *
 * FYI: Used in multiple locations ("RuleListing", "SelectedGroupRules")
 *
 * @param {object} singleRBM
 * @param {function} setSingleRBM
 * @param {String} ruleUid
 * @param {function} callback
 */
export const deleteRuleFromAllGroups = ({
  singleRBM = {},
  setSingleRBM = () => {},
  ruleUid = '',
  callback = () => {},
}) => {
  const { configuration = {} } = singleRBM || {};
  const { entity_type = {}, rules = [], rule_group_mapping } =
    configuration || {};

  const { groups = [] } = entity_type || {};

  let copyOfRules = [...rules];

  // update mappings
  const updatedRuleMappings = rule_group_mapping.filter(
    (group, i) => group.rule_uid != ruleUid
  );

  const newRuleMapping = [];

  // update mapping for each group
  groups.forEach(name => {
    const currentRuleMapping = updatedRuleMappings.filter(
      ({ group }) => group == name
    );

    currentRuleMapping.forEach(({ group, rule_uid }, index) => {
      if (group == name) {
        newRuleMapping.push({
          group: name,
          rule_uid,
          logical_order: index + 1,
        });
      }
    });
  });

  // Remove rule from each rule percentage field array
  const newCopyOfRules = [];

  const ruleIndex = copyOfRules.findIndex(rule => rule.rule_uid == ruleUid);

  copyOfRules.forEach(rule => {
    const copyPercentOf = rule.percent_of.filter(ruleId => ruleId != ruleUid);

    newCopyOfRules.push({
      ...rule,
      percent_of: [...copyPercentOf],
    });
  });

  newCopyOfRules.splice(ruleIndex, 1);

  copyOfRules = newCopyOfRules;

  // Create updated single RBM object
  const newSingleRBM = {
    ...singleRBM,
    configuration: {
      ...configuration,
      rule_group_mapping: [...newRuleMapping],
      rules: [...copyOfRules],
    },
  };

  setSingleRBM(newSingleRBM);

  if (callback) callback();
};

/**
 * Filter rule as per percentage
 * @param {Array} percent_of
 * @returns
 */
export const getPercentageLabels = (
  percent_of = [],
  singleRBM,
  selectedCalculationRules
) => {
  const { configuration = {} } = singleRBM || {};
  const { rules = [] } = configuration || {};

  const percentRules = rules.filter(({ rule_uid = '' }) =>
    percent_of.includes(rule_uid)
  );

  let isHaveError = false;

  percentRules.map(rule => {
    const { rule_uid = '' } = rule || {};
    const ruleIndex = selectedCalculationRules.findIndex(
      ({ rule_uid: scRuleUid = '' }) => scRuleUid == rule_uid
    );

    rule.isDisable = false;

    if (ruleIndex === -1) {
      rule.isDisable = true;
      isHaveError = true;
    }

    return rule;
  });

  return {
    dependRules: percentRules,
    isHaveError,
  };
};
