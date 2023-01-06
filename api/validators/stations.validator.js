const { check, body } = require('express-validator');

const getDefiniteStationValidationRules = () => {
  return [
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
  ];
};

const getDefiniteStationsValidationRules = () => {
  return [
    check('stationIds')
      .exists()
      .withMessage('Не указан массив id станций')
      .bail()
      .isArray()
      .withMessage('Список id станций должен быть массивом'),
  ];
};

const addStationValidationRules = () => {
  return [
    check('ESRCode')
      .trim()
      .isLength({ min: 1, max: 6 })
      .withMessage('Длина ЕСР-кода станции минимум 1 символ, максимум 6 символов'),
    check('GID_ESRCode')
      .trim()
      .isLength({ min: 1, max: 6 })
      .withMessage('Длина ЕСР-кода ГИД станции минимум 1 символ, максимум 6 символов'),
    check('name')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования станции минимум 1 символ, максимум 32 символа'),
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
      .isLength({ min: 1, max: 6 })
      .withMessage('Длина ЕСР-кода станции минимум 1 символ, максимум 6 символов'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования станции минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  getDefiniteStationValidationRules,
  getDefiniteStationsValidationRules,
  addStationValidationRules,
  delStationValidationRules,
  modStationValidationRules,
};
