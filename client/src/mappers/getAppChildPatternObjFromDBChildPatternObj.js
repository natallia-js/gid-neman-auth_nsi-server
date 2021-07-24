import { CHILD_ORDER_PATTERN_FIELDS } from '../constants';
import getAppMatchOrderPatternParamsObjFromDBMatchOrderPatternParamsObj from './getAppMatchOrderPatternParamsObjFromDBMatchOrderPatternParamsObj';

/**
 * Преобразует объект дочернего шаблона распоряжения, полученный из БД, в объект дочернего шаблона распоряжения,
 * с которым работает текущее приложение.
 *
 * @param {object} dbChildPatternObj
 */
const getAppChildPatternObjFromDBChildPatternObj = (dbChildPatternObj) => {
  if (dbChildPatternObj) {
    return {
      [CHILD_ORDER_PATTERN_FIELDS.CHILD_KEY]: dbChildPatternObj.childPatternId,
      [CHILD_ORDER_PATTERN_FIELDS.MATCH_PATTERN_PARAMS]: !dbChildPatternObj.patternsParamsMatchingTable ? [] :
        dbChildPatternObj.patternsParamsMatchingTable.map((tblElement) => getAppMatchOrderPatternParamsObjFromDBMatchOrderPatternParamsObj(tblElement)),
    };
  }
  return null;
};

export default getAppChildPatternObjFromDBChildPatternObj;
