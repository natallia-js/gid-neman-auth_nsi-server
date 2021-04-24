import { APP_CRED_FIELDS } from '../constants';

/**
 * Преобразует объект полномочий приложения, полученный из БД, в объект полномочий приложения, с которым
 * работает текущее приложение.
 *
 * @param {object} dbAppCredObj
 */
const getAppApplicationCredObjFromDBApplicationCredObj = (dbAppCredObj) => {
  if (dbAppCredObj) {
    return {
      [APP_CRED_FIELDS.KEY]: dbAppCredObj._id,
      [APP_CRED_FIELDS.ENGL_ABBREVIATION]: dbAppCredObj.englAbbreviation,
      [APP_CRED_FIELDS.DESCRIPTION]: dbAppCredObj.description,
    }
  }
  return null;
};

export default getAppApplicationCredObjFromDBApplicationCredObj;
