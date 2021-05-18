const { check } = require('express-validator');

const changeDNCSectorWorkPoligonsValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не определен id пользователя'),
    check('dncSectorIds')
      .exists()
      .withMessage('Не указан массив id участков ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id участков ДНЦ должен быть массивом'),
  ];
};

module.exports = {
  changeDNCSectorWorkPoligonsValidationRules,
};
