const { check } = require('express-validator');

const getDefinitUsersValidationRules = () => {
  return [
    check('sectorIds')
      .exists()
      .withMessage('Не указан массив id участков ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id участков ЭЦД должен быть массивом'),
    check('onlyOnline')
      .isBoolean()
      .withMessage('Значение параметра запроса onlyOnline должно принимать логическое значение'),
  ];
};

const changeECDSectorWorkPoligonsValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не определен id пользователя'),
    check('ecdSectorIds')
      .exists()
      .withMessage('Не указан массив id участков ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id участков ЭЦД должен быть массивом'),
  ];
};

module.exports = {
  getDefinitUsersValidationRules,
  changeECDSectorWorkPoligonsValidationRules,
};
