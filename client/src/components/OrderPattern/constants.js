export const DateFormat = 'DD.MM.YYYY';
export const TimeFormat = 'hh:mm';
export const DateTimeFormat = 'DD.MM.YYYY hh:mm';

export const OrderTypes = Object.freeze({
  ORDER: 'распоряжение',
  REQUEST: 'заявка',
  NOTIFICATION: 'уведомление',
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
  SELECT: 'select',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  LINEBREAK: 'linebreak',
});

export const OrderPatternElementTypeShortTitles = Object.freeze({
  TEXT: 'т.',
  INPUT: 'п.в.',
  SELECT: 'в.с.',
  DATE: 'д.',
  TIME: 'в.',
  DATETIME: 'д.-в.',
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
