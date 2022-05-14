import { SERVER_LOGS_FIELDS } from '../constants';
import { getLocaleDateTimeString } from '../additional/dateTimeConvertions';

/**
 * Преобразует объект записи логов серверных действий, полученный из БД, в объект логов серверных действий,
 * с которым работает текущее приложение.
 *
 * @param {object} dbServerLogObj
 */
const getAppServerLogObjFromDBServerLogObj = (dbServerLogObj) => {
  if (dbServerLogObj) {
    return {
      [SERVER_LOGS_FIELDS.KEY]: dbServerLogObj._id,
      [SERVER_LOGS_FIELDS.ACTION_TIME]: getLocaleDateTimeString(new Date(dbServerLogObj.actionTime), false),
      [SERVER_LOGS_FIELDS.ACTION]: dbServerLogObj.action,
      [SERVER_LOGS_FIELDS.DESCRIPTION]: JSON.stringify(dbServerLogObj.description),
    };
  }
  return null;
};

export default getAppServerLogObjFromDBServerLogObj;
