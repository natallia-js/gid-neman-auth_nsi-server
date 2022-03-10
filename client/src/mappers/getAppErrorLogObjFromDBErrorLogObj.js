import { ERROR_LOGS_FIELDS } from '../constants';
import { getLocaleDateTimeString } from '../additional/dateTimeConvertions';

/**
 * Преобразует объект записи логов серверных ошибок, полученный из БД, в объект логов серверных ошибок,
 * с которым работает текущее приложение.
 *
 * @param {object} dbErrorLogObj
 */
const getAppErrorLogObjFromDBErrorLogObj = (dbErrorLogObj) => {
  if (dbErrorLogObj) {
    return {
      [ERROR_LOGS_FIELDS.KEY]: dbErrorLogObj._id,
      [ERROR_LOGS_FIELDS.ERROR_TIME]: getLocaleDateTimeString(new Date(dbErrorLogObj.errorTime), false),
      [ERROR_LOGS_FIELDS.ACTION]: dbErrorLogObj.action,
      [ERROR_LOGS_FIELDS.ERROR]: dbErrorLogObj.error,
      [ERROR_LOGS_FIELDS.ACTION_PARAMS]: JSON.stringify(dbErrorLogObj.actionParams),
    };
  }
  return null;
};

export default getAppErrorLogObjFromDBErrorLogObj;
