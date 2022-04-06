const HTTPResponseError = require('./HTTPResponseError');

const checkStatus = (response) => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
};

module.exports = checkStatus;
