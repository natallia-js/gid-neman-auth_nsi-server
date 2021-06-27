import { BLOCK_TRACK_FIELDS } from '../constants';

/**
 * Преобразует объект путей перегона, полученный из БД, в объект путей перегона, с которым
 * работает текущее приложение.
 *
 * @param {object} dbBlockTrackObj
 */
const getAppBlockTrackObjFromDBBlockTrackObj = (dbBlockTrackObj) => {
  if (dbBlockTrackObj) {
    return {
      [BLOCK_TRACK_FIELDS.KEY]: dbBlockTrackObj.BT_ID,
      [BLOCK_TRACK_FIELDS.NAME]: dbBlockTrackObj.BT_Name,
    }
  }
  return null;
};

export default getAppBlockTrackObjFromDBBlockTrackObj;
