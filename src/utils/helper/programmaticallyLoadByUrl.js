/**
 * Programmatically Load By Url
 *
 * @param {String} url
 * @param {Object} attributes
 */
export default function programmaticallyLoadByUrl(url, { target, name } = {}) {
  const downloadLink = document.createElement('a');

  downloadLink.href = url;
  downloadLink.target = target;
  downloadLink.download = name;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
