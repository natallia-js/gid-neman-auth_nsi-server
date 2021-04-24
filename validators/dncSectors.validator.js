const { check, body } = require('express-validator');

const addDNCSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования участка ДНЦ минимум 1 символ, максимум 32 символа'),
  ];
};

const delDNCSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого участка ДНЦ'),
  ];
};

const modDNCSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id участка ДНЦ'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования участка ДНЦ минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  addDNCSectorValidationRules,
  delDNCSectorValidationRules,
  modDNCSectorValidationRules,
};
