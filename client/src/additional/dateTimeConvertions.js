/**
 * Позволяет для данного объекта Date получить его строковое представление в формате dd.mm.yyyy.
 *
 * @param {Date} date - объект Date для отображения в виде строки
 * @returns строковое представление заданного объекта Date
 */
 export function getLocaleDateString(date) {
  if (date instanceof Date) {
    return `${date.toLocaleDateString('ru', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
  }
  return '';
}

/**
 * Позволяет для данного объекта Date получить его строковое представление в формате hh:mm:ss.
 *
 * @param {Date} date - объект Date для отображения в виде строки
 * @returns строковое представление заданного объекта Date
 */
 export function getLocaleTimeString(date) {
  if (date instanceof Date) {
    return `${date.toLocaleTimeString('ru', { hour: 'numeric', minute: 'numeric' })}`;
  }
  return '';
}

/**
 * Позволяет для данного объекта Date получить его строковое представление в формате dd.mm.yyyy hh:mm
 * либо формате dd.mm.yyyy hh:mm:ss.
 *
 * @param {Date} date - объект Date для отображения в виде строки
 * @param {boolean} showSeconds - true - показывать секунды, false - не показывать
 * @returns строковое представление заданного объекта Date
 */
export function getLocaleDateTimeString(date, showSeconds) {
  if (date instanceof Date) {
    const timeFormattingObject = { hour: 'numeric', minute: 'numeric' };
    if (showSeconds) {
      timeFormattingObject.second = 'numeric';
    }
    return `${date.toLocaleDateString('ru', { day: 'numeric', month: 'numeric', year: 'numeric' })} ` +
           `${date.toLocaleTimeString('ru', timeFormattingObject)}`;
  }
  return '';
}
