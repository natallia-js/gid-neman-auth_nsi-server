import { ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS } from '../constants';

/**
 * Преобразует объект описания смыслового значения элемента шаблона распоряжения, полученный из БД,
 * в объект описания смыслового значения элемента шаблона распоряжения приложения.
 *
 * @param {object} dbPossibleElRefObj
 */
const getAppPossibleElRefsObjFromDBPossibleElRefObj = (dbPossibleElRefObj) => {
  if (!dbPossibleElRefObj) {
    return null;
  }
  const appPossibleElRefObj = {
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]: dbPossibleElRefObj._id,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]: dbPossibleElRefObj.refName,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON]: dbPossibleElRefObj.workPoligon,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID]: dbPossibleElRefObj.additionalOrderPlaceInfoForGID,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.MEANINGS]: dbPossibleElRefObj.possibleMeanings,
  }
  return appPossibleElRefObj;
};

export default getAppPossibleElRefsObjFromDBPossibleElRefObj;
