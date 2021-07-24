import { ORDER_PATTERNS_MATCHING_FIELDS } from '../constants';

/**
 * Преобразует объект связи параметров шаблонов распоряжений, полученный из БД, в объект связи
 * параметров шаблонов распоряжений, с которым работает текущее приложение.
 *
 * @param {object} dbConnPatternParamsObj
 */
const getAppMatchOrderPatternParamsObjFromDBMatchOrderPatternParamsObj = (dbConnPatternParamsObj) => {
  if (dbConnPatternParamsObj) {
    return {
      [ORDER_PATTERNS_MATCHING_FIELDS.BASE_PARAM_KEY]: dbConnPatternParamsObj.baseParamId,
      [ORDER_PATTERNS_MATCHING_FIELDS.CHILD_PARAM_KEY]: dbConnPatternParamsObj.childParamId,
    };
  }
  return null;
};

export default getAppMatchOrderPatternParamsObjFromDBMatchOrderPatternParamsObj;
