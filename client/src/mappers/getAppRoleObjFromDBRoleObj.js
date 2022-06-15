import { ROLE_FIELDS } from '../constants';
import getAppRoleAppObjFromDBRoleAppObj from './getAppRoleAppObjFromDBRoleAppObj';

/**
 * Преобразует объект роли, полученный из БД, в объект роли приложения.
 *
 * @param {object} dbRoleObj
 */
const getAppRoleObjFromDBRoleObj = (dbRoleObj) => {
  if (dbRoleObj) {
    return {
      [ROLE_FIELDS.KEY]: dbRoleObj._id,
      [ROLE_FIELDS.ENGL_ABBREVIATION]: dbRoleObj.englAbbreviation,
      [ROLE_FIELDS.DESCRIPTION]: dbRoleObj.description,
      [ROLE_FIELDS.SUB_ADMIN_CAN_USE]: dbRoleObj.subAdminCanUse,
      [ROLE_FIELDS.APPS_CREDENTIALS]: !dbRoleObj.appsCreds ? [] :
        dbRoleObj.appsCreds.map((app) => getAppRoleAppObjFromDBRoleAppObj(app)),
    }
  }
  return null;
};

export default getAppRoleObjFromDBRoleObj;
