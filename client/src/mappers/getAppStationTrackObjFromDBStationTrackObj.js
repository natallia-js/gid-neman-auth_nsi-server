import { STATION_TRACK_FIELDS } from '../constants';

/**
 * Преобразует объект пути станции, полученный из БД, в объект пути станции, с которым
 * работает текущее приложение.
 *
 * @param {object} dbStationTrackObj
 */
const getAppStationTrackObjFromDBStationTrackObj = (dbStationTrackObj) => {
  if (dbStationTrackObj) {
    return {
      [STATION_TRACK_FIELDS.KEY]: dbStationTrackObj.ST_ID,
      [STATION_TRACK_FIELDS.NAME]: dbStationTrackObj.ST_Name,
    }
  }
  return null;
};

export default getAppStationTrackObjFromDBStationTrackObj;
