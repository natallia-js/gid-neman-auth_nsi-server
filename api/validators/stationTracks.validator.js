const { check, body } = require('express-validator');

const addStationTrackValidationRules = () => {
  return [
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
    check('name')
      .trim()
      .isLength({ min: 1, max: 16 })
      .withMessage('Длина наименования пути станции минимум 1 символ, максимум 16 символов'),
  ];
};

const delStationTrackValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого пути станции'),
  ];
};

const modStationTrackValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id пути станции'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 16 })
      .withMessage('Длина наименования пути станции минимум 1 символ, максимум 16 символов'),
  ];
};

module.exports = {
  addStationTrackValidationRules,
  delStationTrackValidationRules,
  modStationTrackValidationRules,
};
