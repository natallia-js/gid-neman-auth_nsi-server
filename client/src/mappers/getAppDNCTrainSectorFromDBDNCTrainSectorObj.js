import { TRAIN_SECTOR_FIELDS } from '../constants';

/**
 * Преобразует объект поездного участка ДНЦ, полученный из БД, в объект поездного участка ДНЦ,
 * с которым работает приложение.
 */
const getAppDNCTrainSectorFromDBDNCTrainSectorObj = (dbDNCTrainSectorObj) => {
  if (dbDNCTrainSectorObj) {
    return {
      [TRAIN_SECTOR_FIELDS.KEY]: dbDNCTrainSectorObj.DNCTS_ID,
      [TRAIN_SECTOR_FIELDS.NAME]: dbDNCTrainSectorObj.DNCTS_Title,
    };
  }
  return null;
};

export default getAppDNCTrainSectorFromDBDNCTrainSectorObj;
