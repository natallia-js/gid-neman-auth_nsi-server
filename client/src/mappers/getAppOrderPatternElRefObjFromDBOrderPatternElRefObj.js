import { ORDER_PATTERN_ELEMENT_REFS_FIELDS } from '../constants';

/**
 * Преобразует объект возможного смыслового значения элемента шаблона распоряжения, полученный из БД,
 * в объект возможного смыслового значения элемента шаблона распоряжения,
 * с которым работает текущее приложение.
 *
 * @param {object} dbOrderPatternElementRefObj
 */
const getAppOrderPatternElRefObjFromDBOrderPatternElRefObj = (dbOrderPatternElementRefObj) => {
  if (dbOrderPatternElementRefObj) {
    return {
      [ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY]: dbOrderPatternElementRefObj._id,
      [ORDER_PATTERN_ELEMENT_REFS_FIELDS.ELEMENT_TYPE]: dbOrderPatternElementRefObj.elementType,
      [ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]: dbOrderPatternElementRefObj.possibleRefs,
    };
  }
  return null;
};

export default getAppOrderPatternElRefObjFromDBOrderPatternElRefObj;
