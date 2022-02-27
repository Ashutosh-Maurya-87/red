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
