const PROJECT_CONSTANTS = Object.freeze({
  CONFIG_JWT_SECRET_PARAM_NAME: 'jwtSecret',

  OK: 201,
  ERR: 400,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 402,
  USER_GONE: 410,
  UNKNOWN_ERR: 500,
  UNKNOWN_ERR_MESS: 'Что-то пошло не так, попробуйте снова',
  USER_NOT_FOUND_ERR_MESS: 'Пользователь не найден',
  UNAUTHORIZED_ERR_MESS: 'Пользователь не имеет права на выполнение данного действия',
  UNDEFINED_ACTION_ERR_MESS: 'Не определено запрошенное действие',
  NO_RIGHT_WORK_ON_WORK_POLIGON_ERR_MESS: 'Пользователь не имеет права работать на указанном рабочем полигоне',
  NOT_LOGGED_IN_ERR_MESS: 'Пользователь вышел из системы',
  NOT_MAIN_ADMIN_ERR_MESS: 'На выполнение данного действия требуются права главного администратора',
  NOT_ON_DUTY_ERR_MESS: 'Пользователь не на дежурстве',
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
  GET_ALL_APPS_CREDS_ACTION: 'GET_ALL_APPS_CREDS_ACTION',
  GET_APPS_CREDS_ABBRS_ACTION: 'GET_APPS_CREDS_ABBRS_ACTION',
  MOD_APP_CREDS_GROUP_ACTION: 'MOD_APP_CREDS_GROUP_ACTION',
  MOD_APP_CREDENTIAL_ACTION: 'MOD_APP_CREDENTIAL_ACTION',

  MOD_APP_CREDENTIALS_ACTION: 'MOD_APP_CREDENTIALS_ACTION',
  GET_ALL_ROLES_ACTION: 'GET_ALL_ROLES_ACTION',
  MOD_ROLE_ACTION: 'MOD_ROLE_ACTION',

  GET_ALL_USERS_ACTION: 'GET_ALL_USERS_ACTION',
  GET_DEFINIT_USERS_ACTION: 'GET_DEFINIT_USERS_ACTION',
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

  MOD_SERVICE_ACTION: 'MOD_SERVICE_ACTION',

  MOD_POST_ACTION: 'MOD_POST_ACTION',

  GET_ALL_ORDER_PATTERNS_ACTION: 'GET_ALL_ORDER_PATTERNS_ACTION',
  MOD_ORDER_PATTERN_ACTION: 'MOD_ORDER_PATTERN_ACTION',

  GET_ADMINS_LOGS_ACTION: 'GET_ADMINS_LOGS_ACTION',
  GET_DY58_USERS_LOGS_ACTION: 'GET_DY58_USERS_LOGS_ACTION',
  GET_SERVER_ERRORS_LOGS_ACTION: 'GET_SERVER_ERRORS_LOGS_ACTION',
  GET_SERVER_LOGS_ACTION: 'GET_SERVER_LOGS_ACTION',
});


const DY58_SERVER_CREDENTIALS = Object.freeze({
  DNC_FULL: 'DNC_FULL',
  DSP_FULL: 'DSP_FULL',
  DSP_Operator: 'DSP_Operator',
  ECD_FULL: 'ECD_FULL',
  REVISOR: 'REVISOR',
});


const WEBSOCKET_CONSTANTS = Object.freeze({
  PING_PONG_INTERVAL: 20000,
  CHECK_CLIENTS_ONLINE_STATE_INTERVAL: 20000,

  // Сообщения, посылаемые клиентам
  CONNECTION_OK_MESSAGE: 'connection OK',
  UPGRADE_ERROR_MESSAGE: 'HTTP/1.1 401 Unauthorized\r\n\r\n',
  PING_MESSAGE: 'ping',
  ONLINE_USERS: (usersIds) => `online ${JSON.stringify(usersIds)}`,

  // События
  UPGRADE_EVENT: 'upgrade',
  CONNECTION_EVENT: 'connection',
  MESSAGE_EVENT: 'message',
  CLOSE_EVENT: 'close',

  // Сообщения, принимаемые от клиентов
  PONG_MESSAGE_PATTERN: /^pong /,
  GET_ONLINE_USERS_MESSAGE_PATTERN: /^online /,
});


const WORK_POLIGON_TYPES = Object.freeze({
  STATION: 'станция',
  DNC_SECTOR: 'участок ДНЦ',
  ECD_SECTOR: 'участок ЭЦД',
});


const INCLUDE_DOCUMENTS_CRITERIA = Object.freeze({
  ONLY_OUTGOUING: 'ONLY_OUTGOUING', // учитывать только исходящие документы
  INCLUDE_ACTIVE: 'INCLUDE_ACTIVE', // учитывать действующие документы
});


const ORDER_PATTERN_TYPES = Object.freeze({
  ORDER: 'распоряжение',
  REQUEST: 'заявка',
  NOTIFICATION: 'уведомление',
  ECD_ORDER: 'приказ',
  ECD_PROHIBITION: 'запрещение',
  ECD_NOTIFICATION: 'уведомление/отмена запрещения',
});


module.exports = {
  ...PROJECT_CONSTANTS,

  ...AUTH_NSI_UTIL_CREDENTIALS,

  ...DY58_SERVER_CREDENTIALS,

  ...WEBSOCKET_CONSTANTS,

  WORK_POLIGON_TYPES,

  INCLUDE_DOCUMENTS_CRITERIA,

  ORDER_PATTERN_TYPES,

  DY58_APP_CODE_NAME: 'DY-58',

  Get_GidNemanAuthNSIUtil_AllCredentials: () => Object.values(AUTH_NSI_UTIL_CREDENTIALS),
};
