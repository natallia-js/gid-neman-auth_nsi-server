const { check, body } = require('express-validator');

/**
 * Пользовательская функция проверки списка элементов шаблона распоряжения.
 *
 * @param {array} val - массив элементов шаблона распоряжения
 */
 const checkPatternElements = (val) => {
  val.forEach((el) => {
    if ((typeof el.type !== 'string') || !el.type.length) {
      throw new Error('Минимальная длина типа элемента шаблона 1 символ');
    }
    if (el.size && (typeof el.size !== 'string')) {
      throw new Error('Неверный формат описания размера элемента шаблона');
    }
    if (el.ref && (typeof el.ref !== 'string')) {
      throw new Error('Неверный формат описания содержимого элемента шаблона');
    }
    if (el.value && (typeof el.value !== 'string')) {
      throw new Error('Неверный формат описания значения элемента шаблона');
    }
  });
  return true;
}

/**
 * Пользовательская функция проверки списка элементов соответствия параметров базового и дочернего
 * шаблонов распоряжений.
 *
 * @param {array} val - массив элементов соответствия параметров базового и дочернего шаблонов распоряжений
 */
 const checkCorrespPatternsElements = (val) => {
  val.forEach((el) => {
    if ((typeof el.baseParamId !== 'string') || !el.baseParamId.length) {
      throw new Error('Не определен идентификатор параметра базового шаблона');
    }
    if ((typeof el.childParamId !== 'string') || !el.childParamId.length) {
      throw new Error('Не определен идентификатор параметра дочернего шаблона');
    }
  });
  return true;
}

const addOrderPatternValidationRules = () => {
  return [
    check('service')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры службы 1 символ'),
    check('type')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина типа распоряжения 1 символ'),
    check('category')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина категории распоряжения 1 символ'),
    check('title')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования распоряжения 1 символ'),
    check('elements')
      .isArray()
      .withMessage('Список элементов шаблона распоряжения должен быть массивом')
      .bail() // stops running validations if any of the previous ones have failed
      .custom((val) => checkPatternElements(val)),
    check('isPersonalPattern')
      .exists()
      .withMessage('Не указан признак принадлежности шаблона распоряжения'),
  ];
};

const delOrderPatternValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого шаблона распоряжения'),
  ];
};

const modOrderPatternValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id шаблона распоряжения'),
    check('title')
      .if(body('title').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования шаблона распоряжения 1 символ'),
    check('elements')
      .if(body('elements').exists())
      .isArray()
      .withMessage('Список элементов шаблона распоряжения должен быть массивом')
      .bail()
      .custom((val) => checkPatternElements(val))
  ];
};

const modOrderPatternsCategoryValidationRules = () => {
  return [
    check('service')
      .exists()
      .withMessage('Не указано наименование службы'),
    check('orderType')
      .exists()
      .withMessage('Не указано наименование типа шаблонов распоряжений'),
    check('title')
      .exists()
      .withMessage('Не указано исходное наименование категории шаблонов распоряжений'),
    check('newTitle')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования категории шаблонов распоряжений 1 символ'),
  ];
};

const addOrderChildPatternValidationRules = () => {
  return [
    check('basePatternId')
      .exists()
      .withMessage('Не указан id базового шаблона распоряжения'),
    check('childPatternId')
      .exists()
      .withMessage('Не указан id дочернего шаблона распоряжения'),
    check('patternsParamsMatchingTable')
      .isArray()
      .withMessage('Список соответствия параметров базового и дочернего шаблонов должен быть массивом')
      .bail()
      .custom((val) => checkCorrespPatternsElements(val)),
  ];
};

const delOrderChildPatternValidationRules = () => {
  return [
    check('basePatternId')
      .exists()
      .withMessage('Не указан id базового шаблона распоряжения'),
    check('childPatternId')
      .exists()
      .withMessage('Не указан id дочернего шаблона распоряжения'),
  ];
};

module.exports = {
  addOrderPatternValidationRules,
  delOrderPatternValidationRules,
  modOrderPatternValidationRules,
  modOrderPatternsCategoryValidationRules,
  addOrderChildPatternValidationRules,
  delOrderChildPatternValidationRules,
};
