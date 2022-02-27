/**
 * Format Cell Phone
 *
 * @param {String} phone
 *
 * @return {String}
 */
export default function formatPhone(phone) {
  if (!phone) phone = '';
  let v = phone.replace(/[^\d]/g, '');
  v = v.substring(0, 10);

  switch (v.length) {
    case 4:
    case 5:
    case 6:
      return v.replace(/(\d{3})/, '($1) ');

    case 7:
    case 8:
    case 9:
      return v.replace(/(\d{3})(\d{3})/, '($1) $2-');

    default:
      return v.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
}
