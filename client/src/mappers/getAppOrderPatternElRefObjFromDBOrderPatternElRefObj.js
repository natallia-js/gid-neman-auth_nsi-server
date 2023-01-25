import { ORDER_PATTERN_ELEMENT_REFS_FIELDS, ORDER_PATTERN_FIELDS, ORDER_PATTERN_ELEMENT_FIELDS } from '../constants';
import getAppPossibleElRefsObjFromDBPossibleElRefObj from './getAppPossibleElRefsObjFromDBPossibleElRefObj';

/**
 * Преобразует объект возможного смыслового значения элемента шаблона распоряжения, полученный из БД,
 * в объект возможного смыслового значения элемента шаблона распоряжения,
 * с которым работает текущее приложение.
 *
 * @param {object} dbOrderPatternElementRefObj
 */
const getAppOrderPatternElRefObjFromDBOrderPatternElRefObj = (dbOrderPatternElementRefObj, stations, dncSectors, ecdSectors) => {
  if (dbOrderPatternElementRefObj) {
    return {
      [ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY]: dbOrderPatternElementRefObj._id,
      [ORDER_PATTERN_ELEMENT_REFS_FIELDS.ELEMENT_TYPE]: dbOrderPatternElementRefObj.elementType,
      [ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]: !dbOrderPatternElementRefObj.possibleRefs ? [] :
        dbOrderPatternElementRefObj.possibleRefs.map((ref) => getAppPossibleElRefsObjFromDBPossibleElRefObj(ref)),
    };
  }
  return null;
};

export default getAppOrderPatternElRefObjFromDBOrderPatternElRefObj;
