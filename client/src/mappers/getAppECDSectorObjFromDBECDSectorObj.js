import { ECDSECTOR_FIELDS } from '../constants';
import getAppECDTrainSectorFromDBECDTrainSectorObj from './getAppECDTrainSectorFromDBECDTrainSectorObj';

/**
 * Преобразует объект участка ЭЦД, полученный из БД, в объект участка ЭЦД, с которым
 * работает приложение.
 *
 * @param {object} dbECDSectorObj
 */
const getAppECDSectorObjFromDBECDSectorObj = (dbECDSectorObj) => {
  if (dbECDSectorObj) {
    return {
      [ECDSECTOR_FIELDS.KEY]: dbECDSectorObj.ECDS_ID,
      [ECDSECTOR_FIELDS.NAME]: dbECDSectorObj.ECDS_Title,
      [ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]: [],
      [ECDSECTOR_FIELDS.NEAREST_DNCSECTORS]: [],
      [ECDSECTOR_FIELDS.TRAIN_SECTORS]: !dbECDSectorObj.TECDTrainSectors ? [] :
        dbECDSectorObj.TECDTrainSectors.map((trainSect) =>
          getAppECDTrainSectorFromDBECDTrainSectorObj(trainSect)),
    }
  }
  return null;
};

export default getAppECDSectorObjFromDBECDSectorObj;
