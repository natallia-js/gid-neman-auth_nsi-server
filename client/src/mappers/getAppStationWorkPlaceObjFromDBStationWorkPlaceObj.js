import { STATION_WORK_PLACE_FIELDS } from '../constants';

/**
 * Преобразует объект рабочего места на станции, полученный из БД, в объект рабочего места на станции,
 * с которым работает текущее приложение.
 *
 * @param {object} dbStationWorkPlaceObj
 */
const getAppStationWorkPlaceObjFromDBStationWorkPlaceObj = (dbStationWorkPlaceObj) => {
  if (dbStationWorkPlaceObj) {
    return {
      [STATION_WORK_PLACE_FIELDS.KEY]: dbStationWorkPlaceObj.SWP_ID,
      [STATION_WORK_PLACE_FIELDS.NAME]: dbStationWorkPlaceObj.SWP_Name,
      [STATION_WORK_PLACE_FIELDS.TYPE]: dbStationWorkPlaceObj.SWP_Type,
    }
  }
  return null;
};

export default getAppStationWorkPlaceObjFromDBStationWorkPlaceObj;
