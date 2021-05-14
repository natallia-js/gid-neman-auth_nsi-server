const { check, body } = require('express-validator');

const addServiceValidationRules = () => {
  return [
    check('abbrev')
      .trim()
      .isLength({ min: 1, max: 8 })
      .withMessage('Длина аббревиатуры службы минимум 1 символ, максимум 8 символов'),
    check('title')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования службы минимум 1 символ, максимум 32 символа'),
  ];
};

const delServiceValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемой службы'),
  ];
};

const modServiceValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id службы'),
    check('abbrev')
      .if(body('abbrev').exists())
      .trim()
      .isLength({ min: 1, max: 8 })
      .withMessage('Длина аббревиатуры службы минимум 1 символ, максимум 8 символов'),
    check('title')
      .if(body('title').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования службы минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  addServiceValidationRules,
  delServiceValidationRules,
  modServiceValidationRules,
};
