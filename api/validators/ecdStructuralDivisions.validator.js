const { check, body } = require('express-validator');

const addStructuralDivisionValidationRules = () => {
  return [
    check('title')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования структурного подразделения минимум 1 символ, максимум 32 символа'),
    check('post')
      .if(body('post').exists())
      .trim()
      .isLength({ max: 32 })
      .withMessage('Длина наименования должности максимум 32 символа'),
    check('fio')
      .if(body('fio').exists())
      .trim()
      .isLength({ max: 64 })
      .withMessage('Длина ФИО максимум 64 символа'),
    check('ecdSectorId')
      .exists()
      .withMessage('Не указан id участка ЭЦД'),
    check('position')
      .if(body('position').exists())
      .trim()
      .isInt({ min: 0, max: 255 })
      .withMessage('Позиция записи должна находиться в промежутке [0,255]'),
  ];
};

const delStructuralDivisionValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого структурного подразделения'),
  ];
};

const modStructuralDivisionValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id структурного подразделения'),
    check('title')
      .if(body('title').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования структурного подразделения минимум 1 символ, максимум 32 символа'),
    check('post')
      .if(body('post').exists())
      .trim()
      .isLength({ max: 32 })
      .withMessage('Длина наименования должности максимум 32 символа'),
    check('fio')
      .if(body('fio').exists())
      .trim()
      .isLength({ max: 64 })
      .withMessage('Длина ФИО максимум 64 символа'),
    check('position')
      .if(body('position').exists())
      .trim()
      .isInt({ min: 0, max: 255 })
      .withMessage('Позиция записи должна находиться в промежутке [0,255]'),
  ];
};

module.exports = {
  addStructuralDivisionValidationRules,
  delStructuralDivisionValidationRules,
  modStructuralDivisionValidationRules,
};
