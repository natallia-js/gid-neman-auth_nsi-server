const { check, body } = require('express-validator');
const isDate = require('./isDate');

const checkCreateOrderDateTime = (val) => {
  if (!isDate(val)) {
    throw new Error('Неверно указано значение параметра даты и времени издания распоряжения');
  }
  return true;
}

/**
 * Пользовательская функция проверки места действия распоряжения.
 *
 * @param {array} val - объект, описывающий место действия распоряжения
 */
const checkOrderPlace = (val) => {
  if (typeof val !== 'object') {
    throw new Error('Место действия распоряжения должно быть объектом');
  }
  if (val) {
    if ((typeof val.place !== 'string') || !val.place.length) {
      throw new Error('Не указан тип места действия распоряжения');
    }
    if (typeof val.value !== 'number') {
    throw new Error('Неверно указан идентификатор места действия распоряжения');
    }
  }
  return true;
}

/**
 * Пользовательская функция проверки времени действия распоряжения.
 *
 * @param {array} val - объект, описывающий время действия распоряжения
 */
const checkOrderTime = (val) => {
  if (typeof val !== 'object') {
    throw new Error('Время действия распоряжения должно быть объектом');
  }
  if (val) {
    if (!isDate(val.start)) {
      throw new Error('Неверно указано время начала действия распоряжения');
    }
    if (val.end && !isDate(val.end)) {
    throw new Error('Неверно указано время окончания действия распоряжения');
    }
    if (typeof val.tillCancellation !== 'boolean') {
      throw new Error('Неверно указано значение параметра действия распоряжения до отмены');
    }
  }
  return true;
}

const checkOrderText = (val) => {
  if (typeof val !== 'object') {
    throw new Error('Текст распоряжения должен быть объектом');
  }
  if (typeof val.orderTextSource !== 'string' || !val.orderTextSource.length) {
    throw new Error('Не указан источник текста распоряжения');
  }
  if (typeof val.orderTitle !== 'string' || !val.orderTitle.length) {
    throw new Error('Не указано наименование распоряжения');
  }
  // ...orderText
  return true;
}

const checkWorkPoligon = (val) => {
  if (typeof val !== 'object') {
    throw new Error('Рабочий полигон издателя распоряжения должен быть объектом');
  }
  if (typeof val.id !== 'number') {
    throw new Error('Не указан id рабочего полигона издателя распоряжения');
  }
  if (typeof val.type !== 'string' || !val.type.length) {
    throw new Error('Не указан тип рабочего полигона издателя распоряжения');
  }
  if (typeof val.title !== 'string' || !val.type.length) {
    throw new Error('Не указано наименование рабочего полигона');
  }
  return true;
}

const checkCreator = (val) => {
  if (typeof val !== 'object') {
    throw new Error('Издатель распоряжения должен быть объектом');
  }
  if (typeof val.id !== 'string' || !val.id.length) {
    throw new Error('Не указан id издателя распоряжения');
  }
  if (typeof val.post !== 'string' || !val.post.length) {
    throw new Error('Не указана должность издателя распоряжения');
  }
  if (typeof val.fio !== 'string' || !val.fio.length) {
    throw new Error('Не указано ФИО издателя распоряжения');
  }
  return true;
}

const addOrderValidationRules = () => {
  return [
    check('type')
      .trim()
      .notEmpty()
      .withMessage('Не указан тип распоряжения'),
    check('number')
      .trim()
      .isInt()
      .withMessage('Номер распоряжения должен быть целым числом'),
    check('createDateTime')
      .trim()
      .custom((val) => checkCreateOrderDateTime(val)),
    check('place')
      .if(body('place').exists())
      .custom((val) => checkOrderPlace(val)),
    check('timeSpan')
      .if(body('timeSpan').exists())
      .custom((val) => checkOrderTime(val)),
    check('orderText')
      .exists()
      .withMessage('Не указан текст распоряжения')
      .bail()
      .custom((val) => checkOrderText(val)),
    // ...dncToSend
    // ...dspToSend
    // ...ecdToSend
    check('workPoligon')
      .exists()
      .withMessage('Не указан рабочий полигон издателя распоряжения')
      .bail()
      .custom((val) => checkWorkPoligon(val)),
    check('creator')
      .exists()
      .withMessage('Не указана информация о создателе распоряжения')
      .bail()
      .custom((val) => checkCreator(val)),
  ];
};

const checkStartDate = (val) => {
  if (!isDate(val)) {
    throw new Error('Неверно указано значение параметра начала временного интервала поиска информации');
  }
  return true;
};

/**
 * Пользовательская функция проверки массива ЕСР-кодов станций.
 *
 * @param {array} val - массив ЕСР-кодов станций
 */
 const checkStationCodes = (val) => {
  val.forEach((el) => {
    if ((typeof el !== 'string') || !el.length) {
      throw new Error(`Неверно указано значение кода станции: ${el}`);
    }
  });
  return true;
};

const getDataForGIDValidationRules = () => {
  return [
    check('startDate')
      .if(body('startDate').exists())
      .trim()
      .custom((val) => checkStartDate(val)),
    check('stations')
      .isArray()
      .withMessage('Список кодов станций должен быть массивом')
      .bail() // stops running validations if any of the previous ones have failed
      .custom((val) => checkStationCodes(val)),
  ];
};

module.exports = {
  addOrderValidationRules,
  getDataForGIDValidationRules,
};
