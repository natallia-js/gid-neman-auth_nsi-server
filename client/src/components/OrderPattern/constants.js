export const DateFormat = 'DD.MM.YYYY';
export const TimeFormat = 'HH:mm';
export const DateTimeFormat = 'DD.MM.YYYY HH:mm';

export const OrderTypes = Object.freeze({
  ORDER: 'распоряжение',
  REQUEST: 'заявка',
  NOTIFICATION: 'уведомление',
  ECD_ORDER: 'приказ',
  ECD_PROHIBITION: 'запрещение',
  ECD_NOTIFICATION: 'уведомление/отмена запрещения',
});

export const OrderPatternsNodeType = Object.freeze({
  SERVICE: 'service',
  ORDER_TYPE: 'orderType',
  ORDER_CATEGORY: 'orderCategory',
  ORDER_PATTERN: 'orderPattern',
});

export const OrderPatternElementType = Object.freeze({
  TEXT: 'text',
  INPUT: 'input',
  TEXT_AREA: 'textArea',
  SELECT: 'select',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  DR_TRAIN_TABLE: 'drTrainTable',
  LINEBREAK: 'linebreak',
});

export const OrderPatternElementTypeShortTitles = Object.freeze({
  TEXT: 'т.',
  INPUT: 'п.в.',
  TEXT_AREA: 'т.о.',
  SELECT: 'в.с.',
  DATE: 'д.',
  TIME: 'в.',
  DATETIME: 'д.-в.',
  DR_TRAIN_TABLE: 'т.п.ДР',
  LINEBREAK: 'п.с.',
});

export const GetOrderPatternElementTypeShortTitle = (elementType) => {
  const key = Object.keys(OrderPatternElementType).find((key) => OrderPatternElementType[key] === elementType);
  if (key) {
    return OrderPatternElementTypeShortTitles[key];
  }
  return null;
};

export const PossibleElementSizes = Object.freeze({
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  AUTO: 'AUTO',
});

export const ElementSizesCorrespondence = Object.freeze({
  SMALL: '5rem',
  MEDIUM: '10rem',
  LARGE: '15rem',
  AUTO: 'auto',
});

// Поначалу данное поле нужно было для обозначения особых категорий поездов, к которым
// имеет отношение распоряжение. Но в дальнейшем значение данного поля стало шире, и
// теперь оно применяется для проставления отметок об особых видах распоряжений.
// Все отметки, кроме ТУ, ЗП, ОП, ЦР, имеют отношение к поездам.
// Отметка ТУ имеет отношение к приказу ЭЦД об отключении/включении коммутационного аппарата по
// телеуправлению.
// Отметки ЗП и ОП имеют отношение к распоряжениям ДНЦ о закрытии и открытии перегона, соответственно.
// Отметка ЦР определяет циркулярное распоряжение ДНЦ.
export const SPECIAL_TRAIN_CATEGORIES = [
  'ВМ', 'Д', 'ДР', 'ЗП', 'Н', 'ОП', 'ПВ', 'ПВПД', 'ПД', 'Т', 'ТД', 'ТУ', 'ЦР',
];
