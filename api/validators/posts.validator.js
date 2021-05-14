const { check, body } = require('express-validator');

const addPostValidationRules = () => {
  return [
    check('abbrev')
      .trim()
      .isLength({ min: 1, max: 8 })
      .withMessage('Длина аббревиатуры должности минимум 1 символ, максимум 8 символов'),
    check('title')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования должности минимум 1 символ, максимум 32 символа'),
  ];
};

const delPostValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемой должности'),
  ];
};

const modPostValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id должности'),
    check('abbrev')
      .if(body('abbrev').exists())
      .trim()
      .isLength({ min: 1, max: 8 })
      .withMessage('Длина аббревиатуры должности минимум 1 символ, максимум 8 символов'),
    check('title')
      .if(body('title').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования должности минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  addPostValidationRules,
  delPostValidationRules,
  modPostValidationRules,
};
