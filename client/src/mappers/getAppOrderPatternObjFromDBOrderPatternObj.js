import { ORDER_PATTERN_FIELDS } from '../constants';
import getAppOrderPatternElementObjFromDBOrderPatternElementObj from './getAppOrderPatternElementObjFromDBOrderPatternElementObj';
import getAppChildPatternObjFromDBChildPatternObj from './getAppChildPatternObjFromDBChildPatternObj';

/**
 * Преобразует объект шаблона распоряжения, полученный из БД, в объект шаблона распоряжения, с которым
 * работает текущее приложение.
 *
 * @param {object} dbOrderPatternObj
 */
const getAppOrderPatternObjFromDBOrderPatternObj = (dbOrderPatternObj) => {
  if (dbOrderPatternObj) {
    return {
      [ORDER_PATTERN_FIELDS.KEY]: dbOrderPatternObj._id,
      [ORDER_PATTERN_FIELDS.SERVICE]: dbOrderPatternObj.service,
      [ORDER_PATTERN_FIELDS.TYPE]: dbOrderPatternObj.type,
      [ORDER_PATTERN_FIELDS.CATEGORY]: dbOrderPatternObj.category,
      [ORDER_PATTERN_FIELDS.TITLE]: dbOrderPatternObj.title,
      [ORDER_PATTERN_FIELDS.SPECIAL_TRAIN_CATEGORIES]: dbOrderPatternObj.specialTrainCategories,
      [ORDER_PATTERN_FIELDS.ELEMENTS]: !dbOrderPatternObj.elements ? [] :
        dbOrderPatternObj.elements.map((element) => getAppOrderPatternElementObjFromDBOrderPatternElementObj(element)),
      [ORDER_PATTERN_FIELDS.CHILD_PATTERNS]: !dbOrderPatternObj.childPatterns ? [] :
        dbOrderPatternObj.childPatterns.map((childPattern) => getAppChildPatternObjFromDBChildPatternObj(childPattern)),
      [ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY]: dbOrderPatternObj.positionInPatternsCategory,
    };
  }
  return null;
};

export default getAppOrderPatternObjFromDBOrderPatternObj;
