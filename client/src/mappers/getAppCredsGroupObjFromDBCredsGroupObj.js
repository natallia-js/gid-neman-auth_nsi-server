import { APP_CREDS_GROUP_FIELDS } from '../constants';
import getAppApplicationCredObjFromDBApplicationCredObj from './getAppApplicationCredObjFromDBApplicationCredObj';

/**
 * Преобразует объект группы полномочий, полученный из БД, в объект группы полномочий, с которым
 * работает данное приложение.
 *
 * @param {object} dbAppObj
 */
const getAppCredsGroupObjFromDBCredsGroupObj = (dbAppObj) => {
  if (dbAppObj) {
    return {
      [APP_CREDS_GROUP_FIELDS.KEY]: dbAppObj._id,
      [APP_CREDS_GROUP_FIELDS.SHORT_TITLE]: dbAppObj.shortTitle,
      [APP_CREDS_GROUP_FIELDS.TITLE]: dbAppObj.title,
      [APP_CREDS_GROUP_FIELDS.CREDENTIALS]: !dbAppObj.credentials ? [] :
        dbAppObj.credentials.map((cred) => getAppApplicationCredObjFromDBApplicationCredObj(cred)),
    };
  }
  return null;
};

export default getAppCredsGroupObjFromDBCredsGroupObj;
