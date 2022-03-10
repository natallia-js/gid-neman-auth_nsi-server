import { DY58USER_LOGS_FIELDS } from '../constants';
import { getLocaleDateTimeString } from '../additional/dateTimeConvertions';

/**
 * Преобразует объект записи логов пользователей ДУ-58, полученный из БД, в объект логов пользователей ДУ-58,
 * с которым работает текущее приложение.
 *
 * @param {object} dbDY58UserLogObj
 */
const getAppDY58UserLogObjFromDBDY58UserLogObj = (dbDY58UserLogObj) => {
  if (dbDY58UserLogObj) {
    return {
      [DY58USER_LOGS_FIELDS.KEY]: dbDY58UserLogObj._id,
      [DY58USER_LOGS_FIELDS.WORK_POLIGON]: dbDY58UserLogObj.workPoligon,
      [DY58USER_LOGS_FIELDS.USER]: dbDY58UserLogObj.user,
      [DY58USER_LOGS_FIELDS.ACTION_TIME]: getLocaleDateTimeString(new Date(dbDY58UserLogObj.actionTime), false),
      [DY58USER_LOGS_FIELDS.ACTION]: dbDY58UserLogObj.action,
      [DY58USER_LOGS_FIELDS.ACTION_PARAMS]: JSON.stringify(dbDY58UserLogObj.actionParams),
    };
  }
  return null;
};

export default getAppDY58UserLogObjFromDBDY58UserLogObj;
