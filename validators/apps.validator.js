const { check, body } = require('express-validator');

const addAppValidationRules = () => {
  return [
    check('shortTitle')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры приложения 1 символ'),
    check('title')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования приложения 1 символ'),
    check('credentials')
      .isArray()
      .withMessage('Список допустимых полномочий пользователей должен быть массивом')
      .bail() // stops running validations if any of the previous ones have failed
      .custom(val => checkCredentials(val))
  ];
};

const addCredValidationRules = () => {
  return [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('englAbbreviation')
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры полномочия приложения 1 символ'),
    check('description')
      .custom(val => {
        if (typeof val !== 'string') {
          throw new Error('Неверный формат описания полномочия приложения');
        }
        return true;
      })
  ];
};

const delAppValidationRules = () => {
  return [
    check('appId')
      .exists()
      .withMessage('Не указан id удаляемого приложения'),
  ];
};

const delCredValidationRules = () => {
  return [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('credId')
      .exists()
      .withMessage('Не указан id полномочия')
  ];
};

const modAppValidationRules = () => {
  return [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('shortTitle')
      .if(body('shortTitle').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры приложения 1 символ'),
    check('title')
      .if(body('title').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования приложения 1 символ'),
    check('credentials')
      .if(body('credentials').exists())
      .isArray()
      .withMessage('Список допустимых полномочий пользователей должен быть массивом')
      .bail()
      .custom(val => checkCredentials(val))
  ];
};

const modCredValidationRules = () => {
  return [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('credId')
      .exists()
      .withMessage('Не указан id полномочия'),
    check('englAbbreviation')
      .if(body('englAbbreviation').exists())
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры полномочия приложения 1 символ'),
    check('description')
      .if(body('description').exists())
      .custom(val => {
        if (typeof val !== 'string') {
          throw new Error('Неверный формат описания полномочия приложения');
        }
        return true;
      })
  ];
};

module.exports = {
  addAppValidationRules,
  addCredValidationRules,
  delAppValidationRules,
  delCredValidationRules,
  modAppValidationRules,
  modCredValidationRules,
};
