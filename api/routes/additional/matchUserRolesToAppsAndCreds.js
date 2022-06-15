const AppCred = require('../../models/AppCred');
const Role = require('../../models/Role');

/**
 * Входной параметр:
 * credsGroups - массив объектов с полями credsGroup (строка-условное наименование группы полномочий в приложениях
 *   ГИД Неман из коллекции appcreds в БД) и creds - массив строк-наименований полномочий группы;
 * Для указанного массива credsGroups функция ищет информацию о ролях, которые связаны с данными группами полномочий
 * и для которых определены указанные в запросе полномочия в данных группах.
 * Возвращает массив объектов вида:
 * [
 *   {
 *     "_id":"60d9bf52e2f14904f0a315b7",
 *     "credsGroups": [
 *       {"groupAbbrev":"DY-58","creds":["DSP_FULL"]}
 *     ]
 *   },
 *   {
 *     "_id":"61c19cd232a24437d006c63b",
 *     "credsGroups": [
 *       {"groupAbbrev":"DY-58","creds":["DSP_Operator"]}
 *     ]
 *   }
 * ]
 */
async function matchUserRolesToAppsAndCreds(credsGroups) {
  if (!credsGroups || !credsGroups.length) {
    return null;
  }
  // Ищу в БД информацию по каждому указанной в запросе группе полномочий и полномочиях в данной группе
  const credentialsGroups = await AppCred.find(
    { shortTitle: credsGroups.map((el) => el.credsGroup) },
    { _id: 1, shortTitle: 1, credentials: 1 }
  );
  if (!credentialsGroups || !credentialsGroups.length) {
    return null;
  }
  // Позволяет определить, нужно ли учитывать конкретное полномочие конкретной группы полномочий
  // (учитывается, если указано в запросе)
  const credNecessary = (credsGroupTitle, credTitle) => {
    const a = credsGroups.find((el) => el.credsGroup === credsGroupTitle);
    if (!a || !a.creds) return false;
    return a.creds.find((el) => el === credTitle) ? true : false;
  }
  // Для каждой группы полномочий оставляю только указанные в запросе полномочия
  credentialsGroups.forEach((item) => {
    if (!item.credentials || !item.credentials.length) {
      return;
    }
    item.credentials = item.credentials.filter((el) => credNecessary(item.shortTitle, el.englAbbreviation));
  });
  // Ищем определенные для пользователей ГИД Неман роли, связанные с найденными группами полномочий
  let roles = await Role.find({ "appsCreds.credsGroupId": credentialsGroups.map((a) => a._id) }, { _id: 1, appsCreds: 1 });
  if (!roles || !roles.length) {
    return null;
  }
  const getCredsGroupAbbrById = (groupId) => {
    const group = credentialsGroups.find((a) => String(a._id) === String(groupId));
    return group ? group.shortTitle : null;
  };
  const getCredAbbrById = (groupId, credId) => {
    const group = credentialsGroups.find((a) => String(a._id) === String(groupId));
    const cred = group && group.credentials ? group.credentials.find((c) => String(c._id) === String(credId)) : null;
    return cred ? cred.englAbbreviation : null;
  };
  // Оставляю у ролей лишь искомые группы полномочий с искомыми в них полномочиями (группы с пустыми
  // списками полномочий удаляю, роли с пустыми списками групп тоже удаляю)
  roles = roles.map((r) => ({
    _id: r._id,
    appsCreds: r.appsCreds
      .filter((el) => credentialsGroups.map((a) => String(a._id)).includes(String(el.credsGroupId)))
      .map((el) => {
        const group = credentialsGroups.find((a) => String(a._id) === String(el.credsGroupId));
        return {
          credsGroupId: el.credsGroupId,
          creds: (!group.credentials || !group.credentials.length) ? [] :
            el.creds.filter((c) => group.credentials.map((c) => String(c._id)).includes(String(c)))
            .map((c) => getCredAbbrById(el.credsGroupId, c._id)),
        };
      })
      .filter((el) => el.creds.length > 0)
      .map((el) => ({ groupAbbrev: getCredsGroupAbbrById(el.credsGroupId), creds: el.creds })),
  })).filter((r) => r.appsCreds.length > 0);
  return roles;
}

module.exports = matchUserRolesToAppsAndCreds;
