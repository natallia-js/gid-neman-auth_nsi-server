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

const addOrderValidationRules = () => {
  return [
    check('type')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина типа распоряжения 1 символ'),
    check('number')
      .trim()
      .isInt()
      .withMessage('Номер распоряжения должен быть целым числом'),
    check('createDateTime')
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

module.exports = {
  addOrderValidationRules,
};
