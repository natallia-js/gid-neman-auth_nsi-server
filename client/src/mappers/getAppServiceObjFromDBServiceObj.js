import { SERVICE_FIELDS } from '../constants';

/**
 * Преобразует объект службы, полученный из БД, в объект службы приложения.
 *
 * @param {object} dbServiceObj
 */
const getAppServiceObjFromDBServiceObj = (dbServiceObj) => {
  if (!dbServiceObj) {
    return null;
  }
  const appServiceObj = {
    [SERVICE_FIELDS.KEY]: dbServiceObj.S_ID,
    [SERVICE_FIELDS.ABBREV]: dbServiceObj.S_Abbrev,
    [SERVICE_FIELDS.TITLE]: dbServiceObj.S_Title,
  }
  return appServiceObj;
};

export default getAppServiceObjFromDBServiceObj;
