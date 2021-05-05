import { STATION_FIELDS } from '../constants';

/**
 * Преобразует объект станции, полученный из БД, в объект станции приложения.
 *
 * @param {object} dbStationObj
 * @param {boolean} getTrainSectorInfo
 */
const getAppStationObjFromDBStationObj = (dbStationObj, getTrainSectorInfo = false) => {
  if (!dbStationObj) {
    return null;
  }
  const appStationObj = {
    [STATION_FIELDS.KEY]: dbStationObj.St_ID,
    [STATION_FIELDS.ESR_CODE]: dbStationObj.St_UNMC,
    [STATION_FIELDS.NAME]: dbStationObj.St_Title,
    [STATION_FIELDS.NAME_AND_CODE]: `${dbStationObj.St_Title} (${dbStationObj.St_UNMC})`,
  }
  if (getTrainSectorInfo) {
    if (dbStationObj.TDNCTrainSectorStation) {
      appStationObj[STATION_FIELDS.POS_IN_TRAIN_SECTOR] = dbStationObj.TDNCTrainSectorStation.DNCTSS_StationPositionInTrainSector;
      appStationObj[STATION_FIELDS.BELONGS_TO_SECTOR] = dbStationObj.TDNCTrainSectorStation.DNCTSS_StationBelongsToDNCSector;
    } else if (dbStationObj.TECDTrainSectorStation) {
      appStationObj[STATION_FIELDS.POS_IN_TRAIN_SECTOR] = dbStationObj.TECDTrainSectorStation.ECDTSS_StationPositionInTrainSector;
      appStationObj[STATION_FIELDS.BELONGS_TO_SECTOR] = dbStationObj.TECDTrainSectorStation.ECDTSS_StationBelongsToECDSector;
    }
  }
  return appStationObj;
};

export default getAppStationObjFromDBStationObj;
