/**
 * Для данного списка roles (см. matchUserRolesToAppsAndCreds) и списка userRoles (массив id ролей пользователя)
 * позволяет сформировать массив вида:
 * [{"appAbbrev":"DY-58","creds":["DSP_FULL","DSP_Operator"]}]
 * путем сопоставления id ролей в каждом и массивов roles и userRoles. Основа - массив roles.
 */
function getUserCredsInApps(roles, userRoles) {
  if (!roles || !roles.length || !userRoles) {
    return [];
  }
  const userAppCreds = roles.filter((r) => userRoles.includes(String(r._id)) && r.apps && r.apps.length > 0);
  finalAppCreds = [];
  userAppCreds.forEach((item) => {
    item.apps.forEach((a) => {
      const existingItem = finalAppCreds.find((el) => el.appAbbrev === a.appAbbrev);
      if (!existingItem) {
        finalAppCreds.push({ appAbbrev: a.appAbbrev, creds: a.creds });
      } else {
        a.creds.forEach((c) => {
          if (!existingItem.creds.includes(c)) {
            existingItem.creds.push(c);
          }
        });
      }
    });
  });
  return finalAppCreds;
}

module.exports = getUserCredsInApps;
