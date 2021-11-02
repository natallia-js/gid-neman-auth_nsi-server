import { TRAIN_SECTOR_FIELDS } from '../constants';
import getAppStationObjFromDBStationObj from './getAppStationObjFromDBStationObj';
import getAppBlockObjFromDBBlockObj from './getAppBlockObjFromDBBlockObj';

/**
 * Преобразует объект поездного участка ДНЦ, полученный из БД, в объект поездного участка ДНЦ,
 * с которым работает приложение.
 */
const getAppDNCTrainSectorFromDBDNCTrainSectorObj = (dbDNCTrainSectorObj) => {
  if (dbDNCTrainSectorObj) {
    return {
      [TRAIN_SECTOR_FIELDS.KEY]: dbDNCTrainSectorObj.DNCTS_ID,
      [TRAIN_SECTOR_FIELDS.NAME]: dbDNCTrainSectorObj.DNCTS_Title,
      [TRAIN_SECTOR_FIELDS.STATIONS]: !dbDNCTrainSectorObj.TStations ? [] :
        dbDNCTrainSectorObj.TStations.map((station) => getAppStationObjFromDBStationObj(station, true)),
      [TRAIN_SECTOR_FIELDS.BLOCKS]: !dbDNCTrainSectorObj.TBlocks ? [] :
        dbDNCTrainSectorObj.TBlocks.map((block) => getAppBlockObjFromDBBlockObj(block, true)),
    };
  }
  return null;
};

export default getAppDNCTrainSectorFromDBDNCTrainSectorObj;
