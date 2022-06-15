import { APP_CREDS_GROUP_FIELDS } from '../constants';

/**
 * Преобразует объект приложения, полученный из БД, в объект приложения, с которым
 * работает данное приложение.
 *
 * @param {object} dbRoleAppObj
 */
const getAppRoleAppObjFromDBRoleAppObj = (dbRoleAppObj) => {
  if (dbRoleAppObj) {
    return {
      [APP_CREDS_GROUP_FIELDS.KEY]: dbRoleAppObj.credsGroupId,
      [APP_CREDS_GROUP_FIELDS.CREDENTIALS]: dbRoleAppObj.creds || [],
    };
  }
  return null;
};

export default getAppRoleAppObjFromDBRoleAppObj;
