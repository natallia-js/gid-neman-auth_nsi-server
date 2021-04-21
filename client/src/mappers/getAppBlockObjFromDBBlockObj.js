import { BLOCK_FIELDS } from '../constants';

/**
 * Преобразует объект перегона, полученный из БД, в объект перегона приложения.
 *
 * @param {object} dbBlockObj
 */
const getAppBlockObjFromDBBlockObj = (dbBlockObj) => {
  if (dbBlockObj) {
    return {
      [BLOCK_FIELDS.KEY]: dbBlockObj.Bl_ID,
      [BLOCK_FIELDS.NAME]: dbBlockObj.Bl_Title,
      [BLOCK_FIELDS.STATION1]: dbBlockObj.Bl_StationID1,
      [BLOCK_FIELDS.STATION2]: dbBlockObj.Bl_StationID2,
      [BLOCK_FIELDS.DNC_SECTOR_ID]: dbBlockObj.Bl_DNCSectorID,
      [BLOCK_FIELDS.ECD_SECTOR_ID]: dbBlockObj.Bl_ECDSectorID,
      [BLOCK_FIELDS.DNC_TRAINSECTOR_ID]: dbBlockObj.Bl_DNCTrainSectorID,
      [BLOCK_FIELDS.ECD_TRAINSECTOR_ID]: dbBlockObj.Bl_ECDTrainSectorID,
    }
  }
  return null;
};

export default getAppBlockObjFromDBBlockObj;
