const { check, body } = require('express-validator');

/**
 * Пользовательская функция проверки списка полномочий приложения.
 *
 * @param {array} val - массив полномочий
 */
 const checkCredentials = (val) => {
  let abbrs = [];

  val.forEach((el) => {
    if ((typeof el.englAbbreviation !== 'string') || !el.englAbbreviation.length) {
      throw new Error('Минимальная длина аббревиатуры полномочия приложения 1 символ');
    }
    if (typeof el.description !== 'string') {
      throw new Error('Неверный формат описания полномочия приложения');
    }
    if (!abbrs.includes(el.englAbbreviation)) {
      abbrs.push(el.englAbbreviation);
    } else {
      throw new Error('Полномочие с такой аббревиатурой уже существует');
    }
  });

  abbrs = null;
  return true;
}

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
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры полномочия приложения 1 символ'),
    check('description')
      .if(body('description').exists())
      .trim()
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
      .trim()
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
