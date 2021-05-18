const { check } = require('express-validator');

const changeStationWorkPoligonsValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не определен id пользователя'),
    check('stationIds')
      .exists()
      .withMessage('Не указан массив id станций')
      .bail()
      .isArray()
      .withMessage('Список id станций должен быть массивом'),
  ];
};

module.exports = {
  changeStationWorkPoligonsValidationRules,
};
