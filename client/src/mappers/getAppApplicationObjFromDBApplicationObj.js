import { APP_FIELDS } from '../constants';
import getAppApplicationCredObjFromDBApplicationCredObj from './getAppApplicationCredObjFromDBApplicationCredObj';

/**
 * Преобразует объект приложения, полученный из БД, в объект приложения, с которым
 * работает данное приложение.
 *
 * @param {object} dbAppObj
 */
const getAppApplicationObjFromDBApplicationObj = (dbAppObj) => {
  if (dbAppObj) {
    return {
      [APP_FIELDS.KEY]: dbAppObj._id,
      [APP_FIELDS.SHORT_TITLE]: dbAppObj.shortTitle,
      [APP_FIELDS.TITLE]: dbAppObj.title,
      [APP_FIELDS.CREDENTIALS]: !dbAppObj.credentials ? [] :
        dbAppObj.credentials.map((cred) => getAppApplicationCredObjFromDBApplicationCredObj(cred)),
    };
  }
  return null;
};

export default getAppApplicationObjFromDBApplicationObj;
