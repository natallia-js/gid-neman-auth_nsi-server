import { ADMIN_LOGS_FIELDS } from '../constants';
import { getLocaleDateTimeString } from '../additional/dateTimeConvertions';

/**
 * Преобразует объект записи логов администраторов, полученный из БД, в объект логов администраторов, с которым
 * работает текущее приложение.
 *
 * @param {object} dbAdminLogObj
 */
const getAppAdminLogObjFromDBAdminLogObj = (dbAdminLogObj) => {
  if (dbAdminLogObj) {
    return {
      [ADMIN_LOGS_FIELDS.KEY]: dbAdminLogObj._id,
      [ADMIN_LOGS_FIELDS.USER]: dbAdminLogObj.user,
      [ADMIN_LOGS_FIELDS.ACTION_TIME]: getLocaleDateTimeString(new Date(dbAdminLogObj.actionTime), false),
      [ADMIN_LOGS_FIELDS.ACTION]: dbAdminLogObj.action,
      [ADMIN_LOGS_FIELDS.ACTION_PARAMS]: JSON.stringify(dbAdminLogObj.actionParams),
    };
  }
  return null;
};

export default getAppAdminLogObjFromDBAdminLogObj;
