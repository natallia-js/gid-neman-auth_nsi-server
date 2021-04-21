import { STATION_FIELDS } from '../constants';

/**
 * Преобразует объект станции, полученный из БД, в объект станции приложения.
 *
 * @param {object} dbStationObj
 */
const getAppStationObjFromDBStationObj = (dbStationObj) => {
  if (dbStationObj) {
    return {
      [STATION_FIELDS.KEY]: dbStationObj.St_ID,
      [STATION_FIELDS.ESR_CODE]: dbStationObj.St_UNMC,
      [STATION_FIELDS.NAME]: dbStationObj.St_Title,
      [STATION_FIELDS.NAME_AND_CODE]: `${dbStationObj.St_Title} (${dbStationObj.St_UNMC})`,
      [STATION_FIELDS.DNC_SECTOR_ID]: dbStationObj.St_DNCSectorID,
      [STATION_FIELDS.ECD_SECTOR_ID]: dbStationObj.St_ECDSectorID,
      [STATION_FIELDS.DNC_TRAINSECTOR_ID]: dbStationObj.St_DNCTrainSectorID,
      [STATION_FIELDS.ECD_TRAINSECTOR_ID]: dbStationObj.St_ECDTrainSectorID,
    }
  }
  return null;
};

export default getAppStationObjFromDBStationObj;
