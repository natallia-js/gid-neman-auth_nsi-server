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
  ];
};

module.exports = {
  addStationWorkPlaceValidationRules,
  delStationWorkPlaceValidationRules,
  modStationWorkPlaceValidationRules,
};
