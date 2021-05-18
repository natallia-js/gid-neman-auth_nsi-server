import { APP_FIELDS } from '../constants';

/**
 * Преобразует объект приложения, полученный из БД, в объект приложения, с которым
 * работает данное приложение.
 *
 * @param {object} dbRoleAppObj
 */
const getAppRoleAppObjFromDBRoleAppObj = (dbRoleAppObj) => {
  if (dbRoleAppObj) {
    return {
      [APP_FIELDS.KEY]: dbRoleAppObj.appId,
      [APP_FIELDS.CREDENTIALS]: dbRoleAppObj.creds || [],
    };
  }
  return null;
};

export default getAppRoleAppObjFromDBRoleAppObj;
