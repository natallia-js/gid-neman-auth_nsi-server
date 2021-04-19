const { check, body } = require('express-validator');

const addDNCSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования участка ДНЦ 1 символ'),
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
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования участка ДНЦ 1 символ'),
  ];
};

module.exports = {
  addDNCSectorValidationRules,
  delDNCSectorValidationRules,
  modDNCSectorValidationRules,
};
