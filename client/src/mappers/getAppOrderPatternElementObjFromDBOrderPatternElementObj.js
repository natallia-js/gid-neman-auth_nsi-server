import { ORDER_PATTERN_ELEMENT_FIELDS } from '../constants';

/**
 * Преобразует объект элемента шаблона распоряжения, полученный из БД, в объект элемента шаблона распоряжения,
 * с которым работает текущее приложение.
 *
 * @param {object} dbOrderPatternElementObj
 */
const getAppOrderPatternElementObjFromDBOrderPatternElementObj = (dbOrderPatternElementObj) => {
  if (dbOrderPatternElementObj) {
    return {
      [ORDER_PATTERN_ELEMENT_FIELDS.KEY]: dbOrderPatternElementObj._id,
      [ORDER_PATTERN_ELEMENT_FIELDS.TYPE]: dbOrderPatternElementObj.type,
      [ORDER_PATTERN_ELEMENT_FIELDS.SIZE]: dbOrderPatternElementObj.size,
      [ORDER_PATTERN_ELEMENT_FIELDS.REF]: dbOrderPatternElementObj.ref,
      [ORDER_PATTERN_ELEMENT_FIELDS.VALUE]: dbOrderPatternElementObj.value,
    };
  }
  return null;
};

export default getAppOrderPatternElementObjFromDBOrderPatternElementObj;
