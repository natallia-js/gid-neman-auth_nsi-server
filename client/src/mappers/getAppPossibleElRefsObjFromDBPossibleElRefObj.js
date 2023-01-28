import {
  ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS,
  WORK_POLIGON_FIELDS,
  WORK_POLIGON_TYPES,
} from '../constants';

/**
 * Для заданного объекта wp (с полями type, id) полигона управления ищет наименование этого полигона управления
 * в указанных массивах данных.
 * @param {object} wp - объект с полями type, id
 * @param {array} stations - массив объектов с полями value (id станции), label (наименование станции)
 * @param {array} dncSectors - массив объектов с полями value (id участка ДНЦ), label (наименование участка ДНЦ)
 * @param {array} ecdSectors - массив объектов с полями value (id участка ЭЦД), label (наименование участка ЭЦД)
 * @returns пустой объект, если не указан параметр wp либо одно из его полей type / id;
 * объект с полями type, id, name для указанного типа полигона управления (type и id - исходного объекта wp),
 * name - наименование соответствующего полигона управления (из одного из массивов stations, dncSectors, ecdSectors)
 * либо undefined, если нужное наименование отсутствует в соответствующем массиве
 */
const getWorkPoligonObject = (wp, stations, dncSectors, ecdSectors) => {
  if (!wp) return {};
  let workPoligonName;
  if (wp.type && wp.id) {
    switch (wp.type) {
      case (WORK_POLIGON_TYPES.STATION):
        workPoligonName = stations?.find((el) => el.value === wp.id);
        if (workPoligonName) {
          workPoligonName = wp.type + ' ' + workPoligonName.label;
        }
        break;
      case (WORK_POLIGON_TYPES.DNC_SECTOR):
        workPoligonName = dncSectors?.find((el) => el.value === wp.id);
        if (workPoligonName) {
          workPoligonName = wp.type + ' ' + workPoligonName.label;
        }
        break;
      case (WORK_POLIGON_TYPES.ECD_SECTOR):
        workPoligonName = ecdSectors?.find((el) => el.value === wp.id);
        if (workPoligonName) {
          workPoligonName = wp.type + ' ' + workPoligonName.label;
        }
        break;
    }
  }
  return {
    [WORK_POLIGON_FIELDS.TYPE]: wp.type,
    [WORK_POLIGON_FIELDS.ID]: wp.id,
    [WORK_POLIGON_FIELDS.NAME]: workPoligonName,
  };
};

/**
 * Преобразует объект описания смыслового значения элемента шаблона распоряжения, полученный из БД,
 * в объект описания смыслового значения элемента шаблона распоряжения приложения.
 *
 * @param {object} dbPossibleElRefObj
 */
const getAppPossibleElRefsObjFromDBPossibleElRefObj = (dbPossibleElRefObj, stations, dncSectors, ecdSectors) => {
  if (!dbPossibleElRefObj) {
    return null;
  }
  const appPossibleElRefObj = {
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]: dbPossibleElRefObj._id,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]: dbPossibleElRefObj.refName,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON]: getWorkPoligonObject(dbPossibleElRefObj.workPoligon, stations, dncSectors, ecdSectors),
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID]: dbPossibleElRefObj.additionalOrderPlaceInfoForGID,
    [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.MEANINGS]: dbPossibleElRefObj.possibleMeanings,
  };
  return appPossibleElRefObj;
};

export default getAppPossibleElRefsObjFromDBPossibleElRefObj;
