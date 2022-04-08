import { BLOCK_FIELDS } from '../constants';
import getAppStationObjFromDBStationObj from './getAppStationObjFromDBStationObj';
import getAppBlockTrackObjFromDBBlockTrackObj from './getAppBlockTrackObjFromDBBlockTrackObj';

/**
 * Преобразует объект перегона, полученный из БД, в объект перегона приложения.
 *
 * @param {object} dbBlockObj
 */
const getAppBlockObjFromDBBlockObj = (dbBlockObj, getTrainSectorInfo = false) => {
  if (!dbBlockObj) {
    return null;
  }
  const appBlockObj = {
    [BLOCK_FIELDS.KEY]: dbBlockObj.Bl_ID,
    [BLOCK_FIELDS.NAME]: dbBlockObj.Bl_Title,
    [BLOCK_FIELDS.PENSI_ID]: dbBlockObj.Bl_PENSI_ID,
    [BLOCK_FIELDS.PENSI_DNCSectorCode]: dbBlockObj.Bl_PENSI_DNCSectorCode,
    [BLOCK_FIELDS.TRACKS]: !dbBlockObj.TBlockTracks ? [] : dbBlockObj.TBlockTracks.map((track) => getAppBlockTrackObjFromDBBlockTrackObj(track)),
  };
  if (dbBlockObj.Bl_StationID1) {
    appBlockObj[BLOCK_FIELDS.STATION1] = getAppStationObjFromDBStationObj({ St_ID: dbBlockObj.Bl_StationID1 });
  }
  if (dbBlockObj.Bl_StationID2) {
    appBlockObj[BLOCK_FIELDS.STATION2] = getAppStationObjFromDBStationObj({ St_ID: dbBlockObj.Bl_StationID2 });
  }
  if (dbBlockObj.station1) {
    appBlockObj[BLOCK_FIELDS.STATION1] = getAppStationObjFromDBStationObj(dbBlockObj.station1);
  }
  if (dbBlockObj.station2) {
    appBlockObj[BLOCK_FIELDS.STATION2] = getAppStationObjFromDBStationObj(dbBlockObj.station2);
  }
  if (getTrainSectorInfo) {
    if (dbBlockObj.TDNCTrainSectorBlock) {
      appBlockObj[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR] = dbBlockObj.TDNCTrainSectorBlock.DNCTSB_BlockPositionInTrainSector;
      appBlockObj[BLOCK_FIELDS.BELONGS_TO_SECTOR] = dbBlockObj.TDNCTrainSectorBlock.DNCTSB_BlockBelongsToDNCSector;
    } else if (dbBlockObj.TECDTrainSectorBlock) {
      appBlockObj[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR] = dbBlockObj.TECDTrainSectorBlock.ECDTSB_BlockPositionInTrainSector;
      appBlockObj[BLOCK_FIELDS.BELONGS_TO_SECTOR] = dbBlockObj.TECDTrainSectorBlock.ECDTSB_BlockBelongsToECDSector;
    }
  }
  return appBlockObj;
};

export default getAppBlockObjFromDBBlockObj;
