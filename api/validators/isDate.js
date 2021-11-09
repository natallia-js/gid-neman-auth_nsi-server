const moment = require('moment');

const isDate = function (str) {
  return moment(str).isValid();
};

module.exports = isDate;

// DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. See: https://mongoosejs.com/docs/deprecations.html#findandmodify
