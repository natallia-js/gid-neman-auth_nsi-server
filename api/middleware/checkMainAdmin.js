const AUTH_NSI_ACTIONS = require('./AUTH_NSI_ACTIONS');
const { MAIN_ADMIN_ROLE_NAME } = require('../constants');

/**
 * Возвращает true, если пользователь, указанный в запросе - главный администратор ГИД "Неман",
 * false - в противном случае.
 */
function isMainAdmin(req) {
  return req?.user?.roles && req.user.roles instanceof Array && req.user.roles.includes(MAIN_ADMIN_ROLE_NAME);
};

/**
 * Для ряда запросов проверяет, является ли пользователь главным администратором системы.
 */
function checkMainAdmin(req) {
  if (req && [
    // Группы полномочий в приложениях ГИД Неман
    AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS,
    AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS_ABBR_DATA,
    AUTH_NSI_ACTIONS.MOD_APP,
    AUTH_NSI_ACTIONS.MOD_APP_CREDENTIAL,
    
    // Роли
    AUTH_NSI_ACTIONS.MOD_ROLE,
    AUTH_NSI_ACTIONS.MOD_ROLE_APP_CREDENTIALS,
    ].includes(req.requestedAction)
  ) {
    return isMainAdmin(req);
  }
  return { err: false };
}

module.exports = {
  isMainAdmin,
  checkMainAdmin,
};
