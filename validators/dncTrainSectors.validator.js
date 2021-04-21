const { check, body } = require('express-validator');

const addDNCTrainSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования поездного участка ДНЦ 1 символ'),
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
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования поездного участка ДНЦ 1 символ'),
  ];
};

module.exports = {
  addDNCTrainSectorValidationRules,
  delDNCTrainSectorValidationRules,
  modDNCTrainSectorValidationRules,
};
