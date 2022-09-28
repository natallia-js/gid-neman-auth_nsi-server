const { check, body } = require('express-validator');

const addStationWorkPlaceValidationRules = () => {
  return [
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
    check('name')
      .trim()
      .isLength({ min: 1, max: 64 })
      .withMessage('Длина наименования рабочего места на станции минимум 1 символ, максимум 64 символа'),
    check('type')
      .trim()
      .isLength({ min: 1, max: 1 })
      .withMessage('Длина типа рабочего места на станции ровно 1 символ'),
  ];
};

const delStationWorkPlaceValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого рабочего места на станции'),
  ];
};

const modStationWorkPlaceValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id рабочего места на станции'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 64 })
      .withMessage('Длина наименования рабочего места на станции минимум 1 символ, максимум 64 символа'),
    check('type')
      .if(body('type').exists())
      .trim()
      .isLength({ min: 1, max: 1 })
      .withMessage('Длина типа рабочего места на станции ровно 1 символ'),
  ];
};

module.exports = {
  addStationWorkPlaceValidationRules,
  delStationWorkPlaceValidationRules,
  modStationWorkPlaceValidationRules,
};
