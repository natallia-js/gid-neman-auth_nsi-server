import { USER_FIELDS } from '../constants';

/**
 * Преобразует объект данных о пользователе, полученный из БД, в объект данныъ о пользователе приложения.
 *
 * @param {object} dbUserObj
 */
const getAppUserObjFromDBUserObj = (dbUserObj) => {
  if (dbUserObj) {
    return {
      [USER_FIELDS.KEY]: dbUserObj._id,
      [USER_FIELDS.LOGIN]: dbUserObj.login,
      [USER_FIELDS.PASSWORD]: dbUserObj.password,
      [USER_FIELDS.NAME]: dbUserObj.name,
      [USER_FIELDS.SURNAME]: dbUserObj.surname,
      [USER_FIELDS.FATHERNAME]: dbUserObj.fatherName,
      [USER_FIELDS.POST]: dbUserObj.post,
      [USER_FIELDS.SERVICE]: dbUserObj.service,
      [USER_FIELDS.SECTOR]: dbUserObj.sector,
      [USER_FIELDS.ROLES]: dbUserObj.roles ? [...dbUserObj.roles] : [], // массив id ролей
    }
  }
  return null;
};

export default getAppUserObjFromDBUserObj;
