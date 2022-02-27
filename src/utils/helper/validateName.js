// Alphabets, Numbers, Special Characters like +_-() and space
export const VALID_TABLE_NAME_REGX = /^(?:[a-zA-Z0-9+()_-][a-zA-Z0-9 +()_-]*)?$/gm;

// Alphabets, Numbers, Special Characters like hyphen ( - ), underscore( _ ) and space
export const VALID_NAME_WITH_UNDERSCORE_REGEX = /^(?:[a-zA-Z0-9 _-][a-zA-Z0-9 _-]*)?$/gm;

/**
 * Validating name with Alphabets, Numbers, Special Characters like +_-() and space
 *
 * @param {String} displayName
 * @returns {Boolean}  validated name like - new(NAME123)+(__naMe567__--)
 */
export const validateName = (displayName = '') => {
  return (
    displayName.match(VALID_TABLE_NAME_REGX) !== null && displayName.length > 2
  );
};

/**
 *
 * Validating name with Alphabets, Numbers, Special Characters _ (underscore and space)
 *
 * @param {String} name
 * @returns {Boolean} validated name with underscore like 'fieLD_Name 123-145'
 */
export const validateNameWithUnderScore = (name = '') => {
  return (
    name.match(VALID_NAME_WITH_UNDERSCORE_REGEX) !== null && name.length > 2
  );
};
