import { POST_FIELDS } from '../constants';

/**
 * Преобразует объект должности, полученный из БД, в объект должности приложения.
 *
 * @param {object} dbPostObj
 */
const getAppPostObjFromDBPostObj = (dbPostObj) => {
  if (!dbPostObj) {
    return null;
  }
  const appPostObj = {
    [POST_FIELDS.KEY]: dbPostObj.P_ID,
    [POST_FIELDS.ABBREV]: dbPostObj.P_Abbrev,
    [POST_FIELDS.TITLE]: dbPostObj.P_Title,
  }
  return appPostObj;
};

export default getAppPostObjFromDBPostObj;
