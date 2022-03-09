const { check, body } = require('express-validator');
const isDate = require('./isDate');

const checkDate = (val, required, errMessageRequired, errMessageWrongValue) => {
  if (required && !val) {
    throw new Error(errMessageRequired);
  }
  if (val && !isDate(val)) {
    throw new Error(errMessageWrongValue);
  }
  return true;
};

const isPositiveInt = (val, errMessage) => {
  if (val <= 0) {
    throw new Error(errMessage);
  }
  return true;
};

const getLogsRules = () => {
  return [
    check('datetimeStart')
      .exists()
      .withMessage('Не указана дата начала поиска информации')
      .bail()
      .custom((val) => checkDate(val, true, 'Не указана дата начала поиска информации', 'Неверно указано значение начальной даты поиска информации')),
    check('datetimeEnd')
      .if(body('datetimeEnd').exists())
      .custom((val) => checkDate(val, false, 'Неверно указано значение конечной даты поиска информации')),
    check('page')
      .exists()
      .withMessage('Не указан номер страницы для извлечения данных')
      .bail()
      .isInt()
      .withMessage('Номер страницы должен быть целым числом')
      .bail()
      .custom((val) => isPositiveInt(val, 'Номер страницы должен быть положительным числом')),
    check('docsCount')
      .exists()
      .withMessage('Не указано количество записей на странице')
      .bail()
      .isInt()
      .withMessage('Количество записей на странице должно быть целым числом')
      .bail()
      .custom((val) => isPositiveInt(val, 'Количество записей на странице должно быть положительным числом')),
  ];
};

module.exports = {
  getLogsRules,
};
