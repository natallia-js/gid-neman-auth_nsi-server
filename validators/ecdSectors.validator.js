const { check, body } = require('express-validator');

const addECDSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования участка ЭЦД 1 символ'),
  ];
};

const delECDSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого участка ЭЦД'),
  ];
};

const modECDSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id участка ЭЦД'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования участка ЭЦД 1 символ'),
  ];
};

module.exports = {
  addECDSectorValidationRules,
  delECDSectorValidationRules,
  modECDSectorValidationRules,
};
