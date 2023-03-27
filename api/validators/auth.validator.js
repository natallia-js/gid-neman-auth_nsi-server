const { check, body } = require('express-validator');

const registerValidationRules = () => {
  return [
    check('login')
      .isLength({ min: 1 })
      .withMessage('Минимальная длина логина 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В логине допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Минимальная длина пароля 6 символов')
      .bail()
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В пароле допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина имени 1 символ'),
    check('fatherName')
      .if(body('fatherName').exists())
      .trim(),
    check('surname')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина фамилии 1 символ'),
    check('post')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина должности 1 символ'),
    check('service')
      .if(body('service').exists())
      .trim(),
    check('userService')
      .if(body('userService').exists())
      .trim(),
    check('roles')
      .if(body('roles').exists())
      .isArray()
      .withMessage('Список ролей пользователя должен быть массивом'),
    check('stations')
      .if(body('stations').exists())
      .isArray()
      .withMessage('Список рабочих полигонов-станций пользователя должен быть массивом'),
    check('dncSectors')
      .if(body('dncSectors').exists())
      .isArray()
      .withMessage('Список рабочих полигонов-участков ДНЦ пользователя должен быть массивом'),
    check('ecdSectors')
      .if(body('ecdSectors').exists())
      .isArray()
      .withMessage('Список рабочих полигонов-участков ЭЦД пользователя должен быть массивом'),
  ];
};

const addRoleValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
    check('roleId')
      .exists()
      .withMessage('Не указан id роли')
  ];
};

const loginValidationRules = () => {
  return [
    check('login')
      .exists()
      .withMessage('Введите логин'),
    check('password')
      .exists()
      .withMessage('Введите пароль')
  ];
};

const startWorkWithOrWithoutTakingDutyValidationRules = () => {
  return [
    check('workPoligonType')
      .exists()
      .withMessage('Не определен тип рабочего полигона'),
    check('workPoligonId')
      .exists()
      .withMessage('Не определен id рабочего полигона'),
    // workSubPoligonId не проверяю: может отсутствовать
    // specialCredentials не проверяю: могут отсутствовать
  ];
};

const delUserValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не указан id удаляемого пользователя'),
  ];
};

const delRoleValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
  ];
};

const modUserValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
    check('login')
      .if(body('login').exists())
      .isLength({ min: 1 })
      .withMessage('Минимальная длина логина 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В логине допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('password')
      .if(body('password').exists())
      .isLength({ min: 6 })
      .withMessage('Минимальная длина пароля 6 символов')
      .bail()
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В пароле допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина имени 1 символ'),
    check('fatherName')
      .if(body('fatherName').exists())
      .trim(),
    check('surname')
      .if(body('surname').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина фамилии 1 символ'),
    check('post')
      .if(body('post').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина должности 1 символ'),
    check('service')
      .if(body('service').exists())
      .trim(),
    check('userService')
      .if(body('userService').exists())
      .trim(),
    check('roles')
      .if(body('roles').exists())
      .isArray()
      .withMessage('Список ролей пользователя должен быть массивом')
  ];
};

const confirmUserRegistrationValidationRules = () => {
  return [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
  ];
};

module.exports = {
  registerValidationRules,
  addRoleValidationRules,
  loginValidationRules,
  startWorkWithOrWithoutTakingDutyValidationRules,
  delUserValidationRules,
  delRoleValidationRules,
  modUserValidationRules,
  confirmUserRegistrationValidationRules,
};
