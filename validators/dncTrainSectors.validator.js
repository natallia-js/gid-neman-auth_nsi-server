const { check, body } = require('express-validator');

const addDNCTrainSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования поездного участка ДНЦ минимум 1 символ, максимум 32 символа'),
    check('dncSectorId')
      .exists()
      .withMessage('Не указан id участка ДНЦ для добавления поездного участка ДНЦ'),
  ];
};

const delDNCTrainSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого поездного участка ДНЦ'),
  ];
};

const modDNCTrainSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования поездного участка ДНЦ минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  addDNCTrainSectorValidationRules,
  delDNCTrainSectorValidationRules,
  modDNCTrainSectorValidationRules,
};
