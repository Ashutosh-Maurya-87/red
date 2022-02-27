/**
 * Fill Formula Signature
 *
 * @param {string} signature
 * @param {Array} params
 *
 * @return {String}
 */
export const getFilledSignature = (signature, params) => {
  if (!signature || !params) return '';

  let validSignature = signature;

  params.forEach(({ key, value }) => {
    validSignature = validSignature.replace(key, value);
  });

  return validSignature;
};
