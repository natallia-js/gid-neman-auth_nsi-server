const { check, body } = require('express-validator');

const getDefinitUsersValidationRules = () => {
  return [
    check('sectorIds')
      .exists()
      .withMessage('Не указан массив id участков ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id участков ДНЦ должен быть массивом'),
    check('onlyOnline')
      .isBoolean()
      .withMessage('Значение параметра запроса onlyOnline должно принимать логическое значение'),
    check('credsGroups')
      .if(body('credsGroups').exists())
      .isArray()
      .withMessage('Список credsGroups должен быть массивом'),
  ];
};

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
  getDefinitUsersValidationRules,
  changeDNCSectorWorkPoligonsValidationRules,
};
