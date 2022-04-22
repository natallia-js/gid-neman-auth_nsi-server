const DEFAULT_ENCODING = 'utf-8';

function getResponseEncoding(response) {
  if (!response || !response.headers) {
    return DEFAULT_ENCODING;
  }
  const contentType = response.headers.get('Content-Type');
  const contentTypeAsArray = contentType.split(';');
  let encoding = contentTypeAsArray.find((el) => el.indexOf('charset') > -1);
  if (encoding) {
    encoding = encoding.split('=')[1];
  } else {
    encoding = DEFAULT_ENCODING;
  }
  return encoding;
};

module.exports = {
  DEFAULT_ENCODING,
  getResponseEncoding,
};
