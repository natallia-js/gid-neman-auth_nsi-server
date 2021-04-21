import { TRAIN_SECTOR_FIELDS } from '../constants';

/**
 * Преобразует объект поездного участка ЭЦД, полученный из БД, в объект поездного участка ЭЦД,
 * с которым работает приложение.
 */
const getAppECDTrainSectorFromDBECDTrainSectorObj = (dbECDTrainSectorObj) => {
  if (dbECDTrainSectorObj) {
    return {
      [TRAIN_SECTOR_FIELDS.KEY]: dbECDTrainSectorObj.ECDTS_ID,
      [TRAIN_SECTOR_FIELDS.NAME]: dbECDTrainSectorObj.ECDTS_Title,
    };
  }
  return null;
};

export default getAppECDTrainSectorFromDBECDTrainSectorObj;
