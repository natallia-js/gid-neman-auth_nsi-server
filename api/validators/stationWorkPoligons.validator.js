const { check } = require('express-validator');

const getDefinitUsersValidationRules = () => {
  return [
    check('stationIds')
      .exists()
      .withMessage('Не указан массив id станций')
      .bail()
      .isArray()
      .withMessage('Список id станций должен быть массивом'),
    check('onlyOnline')
      .isBoolean()
      .withMessage('Значение параметра запроса onlyOnline должно принимать логическое значение'),
  ];
};

const changeStationWorkPoligonsValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не определен id пользователя'),
    check('poligons')
      .exists()
      .withMessage('Не указан массив рабочих полигонов на станции')
      .bail()
      .isArray()
      .withMessage('Список рабочих полигонов на станции должен быть массивом'),
  ];
};

module.exports = {
  getDefinitUsersValidationRules,
  changeStationWorkPoligonsValidationRules,
};
