import { TRAIN_SECTOR_FIELDS } from '../constants';
import getAppStationObjFromDBStationObj from './getAppStationObjFromDBStationObj';
import getAppBlockObjFromDBBlockObj from './getAppBlockObjFromDBBlockObj';

/**
 * Преобразует объект поездного участка ЭЦД, полученный из БД, в объект поездного участка ЭЦД,
 * с которым работает приложение.
 */
const getAppECDTrainSectorFromDBECDTrainSectorObj = (dbECDTrainSectorObj) => {
  if (dbECDTrainSectorObj) {
    return {
      [TRAIN_SECTOR_FIELDS.KEY]: dbECDTrainSectorObj.ECDTS_ID,
      [TRAIN_SECTOR_FIELDS.NAME]: dbECDTrainSectorObj.ECDTS_Title,
      [TRAIN_SECTOR_FIELDS.STATIONS]: !dbECDTrainSectorObj.TStations ? [] :
        dbECDTrainSectorObj.TStations.map((station) => getAppStationObjFromDBStationObj(station, true)),
      [TRAIN_SECTOR_FIELDS.BLOCKS]: !getAppBlockObjFromDBBlockObj.TBlocks ? [] :
        dbECDTrainSectorObj.TBlocks.map((block) => getAppBlockObjFromDBBlockObj(block, true)),
    };
  }
  return null;
};

export default getAppECDTrainSectorFromDBECDTrainSectorObj;
