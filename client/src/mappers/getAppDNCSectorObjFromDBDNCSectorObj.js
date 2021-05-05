import { DNCSECTOR_FIELDS } from '../constants';
import getAppDNCTrainSectorFromDBDNCTrainSectorObj from './getAppDNCTrainSectorFromDBDNCTrainSectorObj';

/**
 * Преобразует объект участка ДНЦ, полученный из БД, в объект участка ДНЦ, с которым
 * работает приложение.
 *
 * @param {object} dbDNCSectorObj
 */
const getAppDNCSectorObjFromDBDNCSectorObj = (dbDNCSectorObj) => {
  if (dbDNCSectorObj) {
    return {
      [DNCSECTOR_FIELDS.KEY]: dbDNCSectorObj.DNCS_ID,
      [DNCSECTOR_FIELDS.NAME]: dbDNCSectorObj.DNCS_Title,
      [DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS]: [],
      [DNCSECTOR_FIELDS.NEAREST_ECDSECTORS]: [],
      [DNCSECTOR_FIELDS.TRAIN_SECTORS]: !dbDNCSectorObj.TDNCTrainSectors ? [] :
        dbDNCSectorObj.TDNCTrainSectors.map((trainSect) =>
          getAppDNCTrainSectorFromDBDNCTrainSectorObj(trainSect)),
    };
  }
  return null;
};

export default getAppDNCSectorObjFromDBDNCSectorObj;
