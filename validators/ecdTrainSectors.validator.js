const { check, body } = require('express-validator');

const addECDTrainSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования поездного участка ЭЦД минимум 1 символ, максимум 32 символа'),
    check('ecdSectorId')
      .exists()
      .withMessage('Не указан id участка ЭЦД для добавления поездного участка ЭЦД'),
  ];
};

const delECDTrainSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого поездного участка ЭЦД'),
  ];
};

const modECDTrainSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования поездного участка ЭЦД минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  addECDTrainSectorValidationRules,
  delECDTrainSectorValidationRules,
  modECDTrainSectorValidationRules,
};
