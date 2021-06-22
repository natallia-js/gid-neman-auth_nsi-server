const PROJECT_CONSTANTS = Object.freeze({
  CONFIG_JWT_SECRET_PARAM_NAME: 'jwtSecret',

  OK: 201,
  ERR: 400,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 402,
  UNKNOWN_ERR: 500,
  UNKNOWN_ERR_MESS: 'Что-то пошло не так, попробуйте снова',
  UNAUTHORIZED_ERR_MESS: 'Пользователь не имеет права на выполнение данного действия',
  NOT_MAIN_ADMIN_ERR_MESS: 'На выполнение данного действия требуются права главного администратора',
  CREDENTIALS_ERR_MESS: 'Не (верно) определены полномочия, которые необходимо проверить у пользователя',
  SUCCESS_ADD_MESS: 'Информация успешно сохранена',
  SUCCESS_MOD_RES: 'Информация успешно изменена',
  SUCCESS_DEL_MESS: 'Информация успешно удалена',
  DATA_TO_DEL_NOT_FOUND: 'Информация, которую требуется удалить, отсутствует в базе',
  DATA_TO_MOD_NOT_FOUND: 'Информация, которую требуется отредактировать, отсутствует в базе',

  MAIN_ADMIN_ROLE_NAME: 'GID_NEMAN_ADMIN',
  MAIN_ADMIN_ROLE_DESCRIPTION: 'Главный администратор ГИД Неман',
  MAIN_ADMIN_LOGIN: 'GIDA',
  MAIN_ADMIN_PASSWORD: '123456',
  MAIN_ADMIN_NAME: 'A',
  MAIN_ADMIN_SURNAME: 'A',
  MAIN_ADMIN_POST: 'ADMIN',

  GidNemanAuthNSIUtil_ShortTitle: 'GidNemanAuthNSIUtil',
  GidNemanAuthNSIUtil_Title: 'Утилита аутентификации и НСИ ГИД Неман',

  ALL_PERMISSIONS: 'ALL',
});

const AUTH_NSI_UTIL_CREDENTIALS = Object.freeze({
  GET_ALL_APPS_ACTION: 'GET_ALL_APPS_ACTION',
  GET_APPS_CREDENTIALS_ACTION: 'GET_APPS_CREDENTIALS_ACTION',
  MOD_APP_ACTION: 'MOD_APP_ACTION',
  MOD_APP_CREDENTIAL_ACTION: 'MOD_APP_CREDENTIAL_ACTION',

  MOD_APP_CREDENTIALS_ACTION: 'MOD_APP_CREDENTIALS_ACTION',
  GET_ALL_ROLES_ACTION: 'GET_ALL_ROLES_ACTION',
  MOD_ROLE_ACTION: 'MOD_ROLE_ACTION',

  GET_ALL_USERS_ACTION: 'GET_ALL_USERS_ACTION',
  REGISTER_USER_ACTION: 'REGISTER_USER_ACTION',
  MOD_USER_ACTION: 'MOD_USER_ACTION',

  GET_ALL_STATIONS_ACTION: 'GET_ALL_STATIONS_ACTION',
  MOD_STATION_ACTION: 'MOD_STATION_ACTION',

  GET_ALL_BLOCKS_ACTION: 'GET_ALL_BLOCKS_ACTION',
  MOD_BLOCK_ACTION: 'MOD_BLOCK_ACTION',

  GET_ALL_DNCSECTORS_ACTION: 'GET_ALL_DNCSECTORS_ACTION',
  MOD_DNCSECTOR_ACTION: 'MOD_DNCSECTOR_ACTION',

  GET_ALL_ECDSECTORS_ACTION: 'GET_ALL_ECDSECTORS_ACTION',
  MOD_ECDSECTOR_ACTION: 'MOD_ECDSECTOR_ACTION',

  GET_ALL_SERVICES_ACTION: 'GET_ALL_SERVICES_ACTION',
  MOD_SERVICE_ACTION: 'MOD_SERVICE_ACTION',

  GET_ALL_POSTS_ACTION: 'GET_ALL_POSTS_ACTION',
  MOD_POST_ACTION: 'MOD_POST_ACTION',

  GET_ALL_ORDER_PATTERNS_ACTION: 'GET_ALL_ORDER_PATTERNS_ACTION',
  MOD_ORDER_PATTERN_ACTION: 'MOD_ORDER_PATTERN_ACTION',
});

module.exports = {
  ...PROJECT_CONSTANTS,

  ...AUTH_NSI_UTIL_CREDENTIALS,

  Get_GidNemanAuthNSIUtil_AllCredentials: () => Object.values(AUTH_NSI_UTIL_CREDENTIALS),
};
