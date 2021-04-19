const { check, body } = require('express-validator');

const addRoleValidationRules = () => {
  return [
    check('englAbbreviation')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры роли 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В аббревиатуре роли допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('description')
      .if(body('description').exists())
      .trim(),
    check('subAdminCanUse')
      .if(body('subAdminCanUse').exists())
      .trim()
      .isIn([true, false])
      .withMessage('Возможность использования роли администратором нижнего уровня может быть лишь true / false'),
    check('apps')
      .isArray()
      .withMessage('Список приложений роли должен быть массивом')
  ];
};

const addCredValidationRules = () => {
  return [
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('credId')
      .exists()
      .withMessage('Не указан id полномочия')
  ];
};

const changeCredsValidationRules = () => {
  return [
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('newCredIds')
      .exists()
      .withMessage('Не указан массив id полномочий')
      .bail()
      .isArray()
      .withMessage('Список id полномочий должен быть массивом')
  ];
};

const delRoleValidationRules = () => {
  return [
    check('roleId')
      .exists()
      .withMessage('Не указан id удаляемой роли'),
  ];
};

const modRoleValidationRules = () => {
  return [
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
    check('englAbbreviation')
      .if(body('englAbbreviation').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры роли 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В аббревиатуре роли допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('description')
      .if(body('description').exists())
      .trim(),
    check('subAdminCanUse')
      .if(body('subAdminCanUse').exists())
      .trim()
      .isIn([true, false])
      .withMessage('Возможность использования роли администратором нижнего уровня может быть лишь true / false'),
    check('apps')
      .if(body('apps').exists())
      .isArray()
      .withMessage('Список приложений роли должен быть массивом')
  ];
};

module.exports = {
  addRoleValidationRules,
  addCredValidationRules,
  changeCredsValidationRules,
  delRoleValidationRules,
  modRoleValidationRules,
};
