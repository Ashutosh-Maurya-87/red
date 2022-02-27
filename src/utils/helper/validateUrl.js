const URL_PATTERN =
  "^(http|https|ftp)://[a-zA-Z0-9-.]+.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?/?([a-zA-Z0-9-._?,'/\\+&amp;%$#=~])*$";

/**
 * Validate URL
 *
 * @param {String} url
 *
 * @return {Boolean}
 */
export default function validateUrl(url) {
  if (String(url).startsWith('https://http')) return false;

  return new RegExp(URL_PATTERN).test(url);
}
