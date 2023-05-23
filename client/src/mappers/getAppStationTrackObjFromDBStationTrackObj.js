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
      [STATION_TRACK_FIELDS.ST_SuburbanReception]: dbStationTrackObj.ST_SuburbanReception,
      [STATION_TRACK_FIELDS.ST_PassengerReception]: dbStationTrackObj.ST_PassengerReception,
      [STATION_TRACK_FIELDS.ST_CargoReception]: dbStationTrackObj.ST_CargoReception,
      [STATION_TRACK_FIELDS.ST_SuburbanDeparture]: dbStationTrackObj.ST_SuburbanDeparture,
      [STATION_TRACK_FIELDS.ST_PassengerDeparture]: dbStationTrackObj.ST_PassengerDeparture,
      [STATION_TRACK_FIELDS.ST_CargoDeparture]: dbStationTrackObj.ST_CargoDeparture,
      [STATION_TRACK_FIELDS.ST_SuburbanPass]: dbStationTrackObj.ST_SuburbanPass,
      [STATION_TRACK_FIELDS.ST_PassengerPass]: dbStationTrackObj.ST_PassengerPass,
      [STATION_TRACK_FIELDS.ST_CargoPass]: dbStationTrackObj.ST_CargoPass,
      [STATION_TRACK_FIELDS.ST_SpecialTrainReception]: dbStationTrackObj.ST_SpecialTrainReception,
      [STATION_TRACK_FIELDS.ST_SpecialTrainDeparture]: dbStationTrackObj.ST_SpecialTrainDeparture,
      [STATION_TRACK_FIELDS.ST_SpecialTrainPass]: dbStationTrackObj.ST_SpecialTrainPass,
    }
  }
  return null;
};

export default getAppStationTrackObjFromDBStationTrackObj;
