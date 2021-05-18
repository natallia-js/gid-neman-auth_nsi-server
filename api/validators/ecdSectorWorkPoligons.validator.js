const { check } = require('express-validator');

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
  changeECDSectorWorkPoligonsValidationRules,
};
