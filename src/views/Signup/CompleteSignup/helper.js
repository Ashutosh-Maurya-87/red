/**
 * Get Formatted Params tp Update Profile
 *
 * @param {Object} state
 *
 * @return {Object}
 */
export function getFormattedProfileParams(state) {
  const params = {
    name: state.fullName,
    phone_number: state.phoneNumber,
    country: state.country,

    company: state.companyName,
    website_link: state.companyWebsite,
    designation: state.designation,
    users: state.usersCount,

    theme_style: state.theme.toLowerCase(),
  };

  return params;
}
