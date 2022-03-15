const App = require('../../models/App');
const Role = require('../../models/Role');

/**
 * Входной параметр:
 * apps - массив объектов с полями app (строка-условное наименование приложения ГИД Неман из коллекции apps) и
 *        creds - массив строк - наименований полномочий в соответствующем приложении;
 * Для указанного массива apps функция ищет информацию о ролях, которые связаны с данными приложениями
 * и для которых определены указанные в запросе полномочия в данных приложениях.
 * Возвращает массив объектов вида:
 * [
 *   {
 *     "_id":"60d9bf52e2f14904f0a315b7",
 *     "apps": [
 *       {"appAbbrev":"DY-58","creds":["DSP_FULL"]}
 *     ]
 *   },
 *   {
 *     "_id":"61c19cd232a24437d006c63b",
 *     "apps": [
 *       {"appAbbrev":"DY-58","creds":["DSP_Operator"]}
 *     ]
 *   }
 * ]
 */
async function matchUserRolesToAppsAndCreds(apps) {
  if (!apps || !apps.length) {
    return null;
  }
  // Ищу в БД информацию по каждому указанному в запросе приложению и полномочиях в данном приложении
  const applications = await App.find(
    { shortTitle: apps.map((el) => el.app) },
    { _id: 1, shortTitle: 1, credentials: 1 }
  );
  if (!applications || !applications.length) {
    return null;
  }
  // Позволяет определить, нужно ли учитывать конкретное полномое конкретного приложения
  // (учитывается, если указано в запросе)
  const credNecessary = (appTitle, credTitle) => {
    const a = apps.find((el) => el.app === appTitle);
    if (!a || !a.creds) return false;
    return a.creds.find((el) => el === credTitle) ? true : false;
  }
  // Для каждого приложения оставляю только указанные в запросе полномочия
  applications.forEach((item) => {
    if (!item.credentials || !item.credentials.length) {
      return;
    }
    item.credentials = item.credentials.filter((el) => credNecessary(item.shortTitle, el.englAbbreviation));
  });
  // Ищем определенные для пользователей ГИД Неман роли, связанные с найденными приложениями
  let roles = await Role.find({ "apps.appId": applications.map((a) => a._id) }, { _id: 1, apps: 1 });
  if (!roles || !roles.length) {
    return null;
  }
  const getAppAbbrById = (appId) => {
    const app = applications.find((a) => String(a._id) === String(appId));
    return app ? app.shortTitle : null;
  };
  const getCredAbbrById = (appId, credId) => {
    const app = applications.find((a) => String(a._id) === String(appId));
    const cred = app && app.credentials ? app.credentials.find((c) => String(c._id) === String(credId)) : null;
    return cred ? cred.englAbbreviation : null;
  };
  // Оставляю у ролей лишь искомые приложения с искомыми в них полномочиями (приложения с пустыми
  // списками полномочий удаляю, роли с пустыми списками приложений тоже удаляю)
  roles = roles.map((r) => ({
    _id: r._id,
    apps: r.apps
      .filter((el) => applications.map((a) => String(a._id)).includes(String(el.appId)))
      .map((el) => {
        const app = applications.find((a) => String(a._id) === String(el.appId));
        return {
          appId: el.appId,
          creds: (!app.credentials || !app.credentials.length) ? [] :
            el.creds.filter((c) => app.credentials.map((c) => String(c._id)).includes(String(c)))
            .map((c) => getCredAbbrById(el.appId, c._id)),
        };
      })
      .filter((el) => el.creds.length > 0)
      .map((el) => ({ appAbbrev: getAppAbbrById(el.appId), creds: el.creds })),
  })).filter((r) => r.apps.length > 0);

  return roles;
}

module.exports = matchUserRolesToAppsAndCreds;
