/**
 * Get Big Number string
 *
 * @returns {String}
 */
/* eslint-disable no-extend-native */
// eslint-disable-next-line func-names
const noExponents = function () {
  const data = String(Number(this)).split(/[eE]/);
  if (data.length == 1) return data[0];

  let z = '';
  const sign = this < 0 ? '-' : '';
  const str = data[0].replace('.', '');
  let mag = Number(data[1]) + 1;

  if (mag < 0) {
    z = `${sign}0.`;
    while (mag++) z += '0';
    // eslint-disable-next-line no-useless-escape
    return z + str.replace(/^\-/, '');
  }
  mag -= str.length;
  while (mag--) z += '0';
  return str + z;
};

// Bind No Exponent custom function to string and number classes
Number.prototype.noExponents = noExponents;
String.prototype.noExponents = noExponents;
