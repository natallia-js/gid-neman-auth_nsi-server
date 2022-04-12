const { check, body } = require('express-validator');

const addBlockValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1, max: 64 })
      .withMessage('Длина наименования перегона минимум 1 символ, максимум 64 символа'),
    check('station1')
      .exists()
      .withMessage('Не определена граничная станция 1 перегона'),
    check('station2')
      .exists()
      .withMessage('Не определена граничная станция 2 перегона'),
  ];
};

const delBlockValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого перегона'),
  ];
};

const modBlockValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id перегона'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 64 })
      .withMessage('Длина наименования перегона минимум 1 символ, максимум 64 символа'),
    check('pensiDNCSectorCode')
      .if(body('pensiDNCSectorCode').exists())
      .trim()
      .isInt({ min: 0 })
      .withMessage('Код участка ДНЦ должен быть числом'),
  ];
};

module.exports = {
  addBlockValidationRules,
  delBlockValidationRules,
  modBlockValidationRules,
};
