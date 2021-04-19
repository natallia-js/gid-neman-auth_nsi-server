const { check, body } = require('express-validator');

const addStationValidationRules = () => {
  return [
    check('ESRCode')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина ЕСР-кода станции 1 символ'),
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования станции 1 символ'),
  ];
};

const delStationValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемой станции'),
  ];
};

const modStationValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id станции'),
    check('ESRCode')
      .if(body('ESRCode').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина ЕСР-кода станции 1 символ'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования станции 1 символ'),
  ];
};

module.exports = {
  addStationValidationRules,
  delStationValidationRules,
  modStationValidationRules,
};
