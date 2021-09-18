const moment = require('moment');

const isDate = function (str) {console.log(str, moment(str).isValid())
  return moment(str).isValid();
};

module.exports = isDate;

// DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. See: https://mongoosejs.com/docs/deprecations.html#findandmodify
