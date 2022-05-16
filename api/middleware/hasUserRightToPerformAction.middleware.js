const {
  UNAUTHORIZED,
  UNDEFINED_ACTION_ERR_MESS,
  NOT_MAIN_ADMIN_ERR_MESS,

  MAIN_ADMIN_ROLE_NAME,

  GET_ALL_APPS_ACTION, GET_APPS_CREDENTIALS_ACTION, MOD_APP_ACTION, MOD_APP_CREDENTIAL_ACTION,
  GET_ALL_ROLES_ACTION, MOD_ROLE_ACTION, MOD_APP_CREDENTIALS_ACTION,
  MOD_POST_ACTION,
  MOD_SERVICE_ACTION,
  GET_ALL_USERS_ACTION, REGISTER_USER_ACTION, MOD_USER_ACTION,
  GET_ALL_STATIONS_ACTION, MOD_STATION_ACTION,
  GET_ALL_BLOCKS_ACTION, MOD_BLOCK_ACTION, 
  GET_ALL_DNCSECTORS_ACTION, MOD_DNCSECTOR_ACTION,
  GET_ALL_ECDSECTORS_ACTION, MOD_ECDSECTOR_ACTION,
  GET_ALL_ORDER_PATTERNS_ACTION, MOD_ORDER_PATTERN_ACTION,
  GET_ADMINS_LOGS_ACTION,
  GET_DY58_USERS_LOGS_ACTION,
  GET_SERVER_ERRORS_LOGS_ACTION,
  GET_SERVER_LOGS_ACTION,
  DSP_FULL, DSP_Operator, DNC_FULL, ECD_FULL, REVISOR,
} = require('../constants');


// Определяет необходимый способ проверки полномочий:
// and - все указанные полномочия должны присутствовать у пользователя;
// or - у пользователя должно присутствовать хотя бы одно из указанных полномочий
const HOW_CHECK_CREDS = {
  AND: 'and',
  OR: 'or',
};


// Список действий в НСИ и системе аутентификации
const AUTH_NSI_ACTIONS = {
  // Приложения
  GET_ALL_APPS: 'GET_ALL_APPS',
  GET_ALL_APPS_ABBR_DATA: 'GET_ALL_APPS_ABBR_DATA',
  ADD_APP: 'ADD_APP',
  ADD_APP_CREDENTIAL: 'ADD_APP_CREDENTIAL',
  DEL_APP: 'DEL_APP',
  DEL_APP_CREDENTIAL: 'DEL_APP_CREDENTIAL',
  MOD_APP: 'MOD_APP',
  MOD_APP_CREDENTIAL: 'MOD_APP_CREDENTIAL',
  // Роли
  GET_ALL_ROLES: 'GET_ALL_ROLES',
  GET_ALL_ALLOWED_ROLES: 'GET_ALL_ALLOWED_ROLES',
  GET_ALL_ROLES_ABBRS: 'GET_ALL_ROLES_ABBRS',
  ADD_ROLE: 'ADD_ROLE',
  ADD_APP_CRED_TO_ROLE: 'ADD_APP_CRED_TO_ROLE',
  MOD_ROLE_APP_CREDENTIALS: 'MOD_ROLE_APP_CREDENTIALS',
  DEL_ROLE: 'DEL_ROLE',
  MOD_ROLE: 'MOD_ROLE',
  // Должности
  GET_POSTS: 'GET_POSTS',
  ADD_POST: 'ADD_POST',
  DEL_POST: 'DEL_POST',
  MOD_POST: 'MOD_POST',
  // Службы
  GET_SERVICES: 'GET_SERVICES',
  ADD_SERVICE: 'ADD_SERVICE',
  DEL_SERVICE: 'DEL_SERVICE',
  MOD_SERVICE: 'MOD_SERVICE',
  // Пользователи
  REGISTER_SUPERADMIN: 'REGISTER_SUPERADMIN',
  GET_ALL_USERS: 'GET_ALL_USERS',
  REGISTER_USER: 'REGISTER_USER',
  APPLY_FOR_REGISTRATION: 'APPLY_FOR_REGISTRATION',
  ADD_USER_ROLE: 'ADD_USER_ROLE',
  LOGIN: 'LOGIN',
  START_WORK_WITHOUT_TAKING_DUTY: 'START_WORK_WITHOUT_TAKING_DUTY',
  START_WORK_WITH_TAKING_DUTY: 'START_WORK_WITH_TAKING_DUTY',
  LOGOUT: 'LOGOUT',
  LOGOUT_WITH_DUTY_PASS: 'LOGOUT_WITH_DUTY_PASS',
  DEL_USER: 'DEL_USER',
  DEL_USER_ROLE: 'DEL_USER_ROLE',
  MOD_USER: 'MOD_USER',
  CONFIRM_USER_REGISTRATION_DATA: 'CONFIRM_USER_REGISTRATION_DATA',
  // Станции
  GET_STATIONS_WITH_TRACKS_AND_WORK_PLACES: 'GET_STATIONS_WITH_TRACKS_AND_WORK_PLACES',
  GET_STATIONS_WITH_TRACKS: 'GET_STATIONS_WITH_TRACKS',
  GET_DEFINIT_STATION_DATA: 'GET_DEFINIT_STATION_DATA',
  GET_DEFINIT_STATIONS: 'GET_DEFINIT_STATIONS',
  GET_DEFINIT_STATIONS_WORK_PLACES: 'GET_DEFINIT_STATIONS_WORK_PLACES',
  ADD_STATION: 'ADD_STATION',
  DEL_STATION: 'DEL_STATION',
  MOD_STATION: 'MOD_STATION',
  SYNC_STATIONS_WITH_PENSI: 'SYNC_STATIONS_WITH_PENSI',
  // Пути станций
  ADD_STATION_TRACK: 'ADD_STATION_TRACK',
  DEL_STATION_TRACK: 'DEL_STATION_TRACK',
  MOD_STATION_TRACK: 'MOD_STATION_TRACK',
  // Рабочие места на станциях
  ADD_STATION_WORK_PLACE: 'ADD_STATION_WORK_PLACE',
  DEL_STATION_WORK_PLACE: 'DEL_STATION_WORK_PLACE',
  MOD_STATION_WORK_PLACE: 'MOD_STATION_WORK_PLACE',
  // Рабочие полигоны - станции
  GET_ALL_STATION_WORK_POLIGONS: 'GET_ALL_STATION_WORK_POLIGONS',
  GET_USERS_WITH_GIVEN_STATION_WORK_POLIGONS: 'GET_USERS_WITH_GIVEN_STATION_WORK_POLIGONS',
  MOD_USER_STATION_WORK_POLIGONS: 'MOD_USER_STATION_WORK_POLIGONS',
  // Перегоны
  GET_BLOCKS_SHORT_DATA: 'GET_BLOCKS_SHORT_DATA',
  GET_BLOCKS_DATA: 'GET_BLOCKS_DATA',
  GET_STATION_BLOCKS: 'GET_STATION_BLOCKS',
  ADD_BLOCK: 'ADD_BLOCK',
  DEL_BLOCK: 'DEL_BLOCK',
  MOD_BLOCK: 'MOD_BLOCK',
  SYNC_BLOCKS_WITH_PENSI: 'SYNC_BLOCKS_WITH_PENSI',
  // Пути перегонов
  ADD_BLOCK_TRACK: 'ADD_BLOCK_TRACK',
  DEL_BLOCK_TRACK: 'DEL_BLOCK_TRACK',
  MOD_BLOCK_TRACK: 'MOD_BLOCK_TRACK',
  // Участки ДНЦ
  GET_DNC_SECTORS: 'GET_DNC_SECTORS',
  GET_DNC_SECTORS_SHORT_DATA: 'GET_DNC_SECTORS_SHORT_DATA',
  GET_STATION_DNC_SECTORS: 'GET_STATION_DNC_SECTORS',
  GET_DNC_SECTOR_DATA: 'GET_DNC_SECTOR_DATA',
  GET_GIVEN_DNC_SECTORS_SHORT_DATA: 'GET_GIVEN_DNC_SECTORS_SHORT_DATA',
  ADD_DNC_SECTOR: 'ADD_DNC_SECTOR',
  DEL_DNC_SECTOR: 'DEL_DNC_SECTOR',
  MOD_DNC_SECTOR: 'MOD_DNC_SECTOR',
  SYNC_DNC_SECTORS_WITH_PENSI: 'SYNC_DNC_SECTORS_WITH_PENSI',
  // Поездные участки ДНЦ
  ADD_DNC_TRAIN_SECTOR: 'ADD_DNC_TRAIN_SECTOR',
  DEL_DNC_TRAIN_SECTOR: 'DEL_DNC_TRAIN_SECTOR',
  MOD_DNC_TRAIN_SECTOR: 'MOD_DNC_TRAIN_SECTOR',
  // Станции поездных участков ДНЦ
  MOD_DNC_TRAIN_SECTOR_STATIONS: 'MOD_DNC_TRAIN_SECTOR_STATIONS',
  DEL_DNC_TRAIN_SECTOR_STATION: 'DEL_DNC_TRAIN_SECTOR_STATION',
  MOD_DNC_TRAIN_SECTOR_STATION: 'MOD_DNC_TRAIN_SECTOR_STATION',
  // Перегоны поездных участков ДНЦ
  MOD_DNC_TRAIN_SECTOR_BLOCKS: 'MOD_DNC_TRAIN_SECTOR_BLOCKS',
  DEL_DNC_TRAIN_SECTOR_BLOCK: 'DEL_DNC_TRAIN_SECTOR_BLOCK',
  MOD_DNC_TRAIN_SECTOR_BLOCK: 'MOD_DNC_TRAIN_SECTOR_BLOCK',  
  // Рабочие полигоны - участки ДНЦ
  GET_ALL_DNC_SECTOR_WORK_POLIGONS: 'GET_ALL_DNC_SECTOR_WORK_POLIGONS',
  GET_USERS_WITH_GIVEN_DNC_SECTOR_WORK_POLIGONS: 'GET_USERS_WITH_GIVEN_DNC_SECTOR_WORK_POLIGONS',
  MOD_USER_DNC_SECTOR_WORK_POLIGONS: 'MOD_USER_DNC_SECTOR_WORK_POLIGONS',
  // Участки ЭЦД
  GET_ECD_SECTORS: 'GET_ECD_SECTORS',
  GET_ECD_SECTORS_SHORT_DATA: 'GET_ECD_SECTORS_SHORT_DATA',
  GET_STATION_ECD_SECTORS: 'GET_STATION_ECD_SECTORS',
  GET_ECD_SECTOR_DATA: 'GET_ECD_SECTOR_DATA',
  GET_GIVEN_ECD_SECTORS_SHORT_DATA: 'GET_GIVEN_ECD_SECTORS_SHORT_DATA',
  ADD_ECD_SECTOR: 'ADD_ECD_SECTOR',
  DEL_ECD_SECTOR: 'DEL_ECD_SECTOR',
  MOD_ECD_SECTOR: 'MOD_ECD_SECTOR',
  // Поездные участки ЭЦД
  ADD_ECD_TRAIN_SECTOR: 'ADD_ECD_TRAIN_SECTOR',
  DEL_ECD_TRAIN_SECTOR: 'DEL_ECD_TRAIN_SECTOR',
  MOD_ECD_TRAIN_SECTOR: 'MOD_ECD_TRAIN_SECTOR',
  // Станции поездных участков ЭЦД
  MOD_ECD_TRAIN_SECTOR_STATIONS: 'MOD_ECD_TRAIN_SECTOR_STATIONS',
  DEL_ECD_TRAIN_SECTOR_STATION: 'DEL_ECD_TRAIN_SECTOR_STATION',
  MOD_ECD_TRAIN_SECTOR_STATION: 'MOD_ECD_TRAIN_SECTOR_STATION',
  // Перегоны поездных участков ЭЦД
  MOD_ECD_TRAIN_SECTOR_BLOCKS: 'MOD_ECD_TRAIN_SECTOR_BLOCKS',
  DEL_ECD_TRAIN_SECTOR_BLOCK: 'DEL_ECD_TRAIN_SECTOR_BLOCK',
  MOD_ECD_TRAIN_SECTOR_BLOCK: 'MOD_ECD_TRAIN_SECTOR_BLOCK',  
  // Структурные подразделения участков ЭЦД
  ADD_ECD_STRUCTURAL_DIVISION: 'ADD_ECD_STRUCTURAL_DIVISION',
  MOD_ECD_STRUCTURAL_DIVISION: 'MOD_ECD_STRUCTURAL_DIVISION',
  DEL_ECD_STRUCTURAL_DIVISION: 'DEL_ECD_STRUCTURAL_DIVISION',
  // Рабочие полигоны - участки ЭЦД
  GET_ALL_ECD_SECTOR_WORK_POLIGONS: 'GET_ALL_ECD_SECTOR_WORK_POLIGONS',
  GET_USERS_WITH_GIVEN_ECD_SECTOR_WORK_POLIGONS: 'GET_USERS_WITH_GIVEN_ECD_SECTOR_WORK_POLIGONS',
  MOD_USER_ECD_SECTOR_WORK_POLIGONS: 'MOD_USER_ECD_SECTOR_WORK_POLIGONS',
  // Смежные участки ДНЦ
  GET_ALL_ADJACENT_DNC_SECTORS: 'GET_ALL_ADJACENT_DNC_SECTORS',
  GET_ALL_ADJACENT_DNC_SECTORS_OF_DEFINITE_DNC_SECTOR: 'GET_ALL_ADJACENT_DNC_SECTORS_OF_DEFINITE_DNC_SECTOR',
  ADD_ADJACENT_DNC_SECTORS: 'ADD_ADJACENT_DNC_SECTORS',
  DEL_ADJACENT_DNC_SECTOR: 'DEL_ADJACENT_DNC_SECTOR',
  CHANGE_ADJACENT_DNC_SECTORS: 'CHANGE_ADJACENT_DNC_SECTORS',
  // Смежные участки ЭЦД
  GET_ALL_ADJACENT_ECD_SECTORS: 'GET_ALL_ADJACENT_ECD_SECTORS',
  GET_ALL_ADJACENT_ECD_SECTORS_OF_DEFINITE_ECD_SECTOR: 'GET_ALL_ADJACENT_ECD_SECTORS_OF_DEFINITE_ECD_SECTOR',
  ADD_ADJACENT_ECD_SECTORS: 'ADD_ADJACENT_ECD_SECTORS',
  DEL_ADJACENT_ECD_SECTOR: 'DEL_ADJACENT_ECD_SECTOR',
  CHANGE_ADJACENT_ECD_SECTORS: 'CHANGE_ADJACENT_ECD_SECTORS',
  // Ближайшие участки ДНЦ и ЭЦД
  GET_ALL_NEAREST_DNC_ECD_SECTORS: 'GET_ALL_NEAREST_DNC_ECD_SECTORS',
  GET_ALL_NEAREST_ECD_SECTORS_OF_DEFINITE_DNC_SECTOR: 'GET_ALL_NEAREST_ECD_SECTORS_OF_DEFINITE_DNC_SECTOR',
  GET_ALL_NEAREST_DNC_SECTORS_OF_DEFINITE_ECD_SECTOR: 'GET_ALL_NEAREST_DNC_SECTORS_OF_DEFINITE_ECD_SECTOR',
  ADD_NEAREST_ECD_SECTOR_TO_DNC_SECTOR: 'ADD_NEAREST_ECD_SECTOR_TO_DNC_SECTOR',
  ADD_NEAREST_DNC_SECTOR_TO_ECD_SECTOR: 'ADD_NEAREST_DNC_SECTOR_TO_ECD_SECTOR',
  DEL_NEAREST_DNC_ECD_SECTOR: 'DEL_NEAREST_DNC_ECD_SECTOR',
  MOD_NEAREST_ECD_SECTORS_FOR_DEFINITE_DNC_SECTOR: 'MOD_NEAREST_ECD_SECTORS_FOR_DEFINITE_DNC_SECTOR',
  MOD_NEAREST_DNC_SECTORS_FOR_DEFINITE_ECD_SECTOR: 'MOD_NEAREST_DNC_SECTORS_FOR_DEFINITE_ECD_SECTOR',
  // Шаблоны распоряжений
  GET_ORDER_PATTERNS: 'GET_ORDER_PATTERNS',
  ADD_ORDER_PATTERN: 'ADD_ORDER_PATTERN',
  DEL_ORDER_PATTERN: 'DEL_ORDER_PATTERN',
  MOD_ORDER_PATTERN: 'MOD_ORDER_PATTERN',
  MOD_ORDER_PATTERNS_CATEGORY_TITLE: 'MOD_ORDER_PATTERNS_CATEGORY_TITLE',
  // Связи между шаблонами распоряжений
  ADD_CHILD_ORDER_PATTERN: 'ADD_CHILD_ORDER_PATTERN',
  DEL_CHILD_ORDER_PATTERN: 'DEL_CHILD_ORDER_PATTERN',
  // Смысловые значения элементов шаблонов распоряжений
  GET_ALL_ORDER_PATTERN_ELEMENT_REFS: 'GET_ALL_ORDER_PATTERN_ELEMENT_REFS',
  GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS: 'GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS',
  // Логи действий администраторов
  GET_ADMINS_ACTIONS_LOGS: 'GET_ADMINS_ACTIONS_LOGS',
  // Логи действий сервера
  GET_SERVER_ACTIONS_LOGS: 'GET_SERVER_ACTIONS_LOGS',
  // Логи действий пользователей ДУ-58
  GET_DY58_USERS_ACTIONS_LOGS: 'GET_DY58_USERS_ACTIONS_LOGS',
  // Логи ошибок
  GET_ERRORS_LOGS: 'GET_ERRORS_LOGS',
};


// Список действий в системе ДУ-58
const DY58_ACTIONS = {
  // Рабочие распоряжения
  GET_WORK_ORDERS: 'GET_WORK_ORDERS',
  REPORT_ON_ORDER_DELIVERY: 'REPORT_ON_ORDER_DELIVERY',
  CONFIRM_ORDER: 'CONFIRM_ORDER',
  CONFIRM_ORDER_FOR_OTHER_RECEIVERS: 'CONFIRM_ORDER_FOR_OTHER_RECEIVERS',
  CONFIRM_ORDER_FOR_OTHERS: 'CONFIRM_ORDER_FOR_OTHERS',
  DEL_CONFIRMED_ORDERS_FROM_CHAIN: 'DEL_CONFIRMED_ORDERS_FROM_CHAIN',
  DEL_STATION_WORK_PLACE_RECEIVER: 'DEL_STATION_WORK_PLACE_RECEIVER',
  // Все распоряжения
  ADD_ORDER: 'ADD_ORDER',
  MOD_ORDER: 'MOD_ORDER',
  GET_DATA_FOR_GID: 'GET_DATA_FOR_GID',
  GET_ORDERS_ADDRESSED_TO_GIVEN_WORK_POLIGON_FROM_GIVEN_DATE: 'GET_ORDERS_ADDRESSED_TO_GIVEN_WORK_POLIGON_FROM_GIVEN_DATE',
  GET_ORDERS_JOURNAL_DATA: 'GET_ORDERS_JOURNAL_DATA',
  // Параметры последних изданных распоряжений
  GET_LAST_ORDERS_PARAMS: 'GET_LAST_ORDERS_PARAMS',
  // Черновики распоряжений
  ADD_ORDER_DRAFT: 'ADD_ORDER_DRAFT',
  DEL_ORDER_DRAFT: 'DEL_ORDER_DRAFT',
  MOD_ORDER_DRAFT: 'MOD_ORDER_DRAFT',
  GET_ORDER_DRAFTS: 'GET_ORDER_DRAFTS',
  // "Окна"
  GET_OKNAS: 'GET_OKNAS',
};


/**
 * Возвращает true, если пользователь, указанный в запросе - главный администратор ГИД "Неман",
 * false - в противном случае.
 */
const isMainAdmin = (req) => {
  return req.user && req.user.roles && req.user.roles.includes(MAIN_ADMIN_ROLE_NAME);
};


/**
 * Проверка текущих полномочий пользователя с целью определения возможности выполнения определенного действия.
 * Полномочия проверяются без привязки к приложениям ГИД Неман, в общем списке "приложение-полномочия",
 * закрепленном за пользователем.
 */
const checkGeneralCredentials = (req) => {
  // Ожидаем, что если req.action не указан, то нет необходимости проверять полномочия пользователя.
  // Если же req.action указан, то это должен быть объект с описанием тех полномочий, наличие которых необходимо
  // проверить у пользователя. Поле which данного объекта - одно из значений HOW_CHECK_CREDS.
  // В процессе проверки не учитываем наименования приложений. Полагаем, что в рамках всех приложений нет
  // полномочий с одинаковыми наименованиями.
  if (!req.action) {
    return { err: false };
  }

  if (!req.action.which || !req.action.creds || !req.action.creds.length) {
    return { err: true, status: ERR, message: CREDENTIALS_ERR_MESS };
  }

  if (!req.user || !req.user.credentials || !req.user.credentials.length) {
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }

  let userCanPerformAction = false;

  if (req.action.which === HOW_CHECK_CREDS.OR) {
    for (let credToCheck of req.action.creds) {
      for (let cred of req.user.credentials) {
        if (cred.creds.indexOf(credToCheck) >= 0) {
          userCanPerformAction = true;
          break;
        }
      }
      if (userCanPerformAction) {
        break;
      }
    }
  } else if (req.action.which === HOW_CHECK_CREDS.AND) {
    let credsToFindNumber = req.action.creds.length;
    for (let credToCheck of req.action.creds) {
      for (let cred of req.user.credentials) {
        if (cred.creds.indexOf(credToCheck) >= 0) {
          credsToFindNumber -= 1;
          break;
        }
      }
    }
    if (credsToFindNumber === 0) {
      userCanPerformAction = true;
    }
  } else {
    return { err: true, status: ERR, message: CREDENTIALS_ERR_MESS };
  }

  if (!userCanPerformAction) {
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }

  return { err: false };
};
  

/**
 * Промежуточный обработчик проверки того, имеет ли пользователь полномочия на выполнение указанного действия.
 * В req.requestedAction должна содержаться строка с наименованием действия, которое пользователь хочет выполнить.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
const hasUserRightToPerformAction = (req, res, next) => {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }

  // В запросе указано действие?
  if (!req.requestedAction) {
    return res.status(UNAUTHORIZED).json({ message: UNDEFINED_ACTION_ERR_MESS });
  }

  req.action = null;
  let creds = null;
  let howCheckCreds = HOW_CHECK_CREDS.OR; // by default

  // Определяем требуемые полномочия на запрашиваемое действие
  switch (req.requestedAction) {
    // Для системы НСИ и аутентификации
    // --------------------------------
    // Приложения
    case AUTH_NSI_ACTIONS.GET_ALL_APPS:
      // Проверяем, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
      if (!isMainAdmin(req)) {
        return res.status(UNAUTHORIZED).json({ message: NOT_MAIN_ADMIN_ERR_MESS });
      }
      creds = [GET_ALL_APPS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.GET_ALL_APPS_ABBR_DATA:
      // Проверяем, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
      if (!isMainAdmin(req)) {
        return res.status(UNAUTHORIZED).json({ message: NOT_MAIN_ADMIN_ERR_MESS });
      }
      creds = [GET_APPS_CREDENTIALS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_APP:
    case AUTH_NSI_ACTIONS.DEL_APP:
    case AUTH_NSI_ACTIONS.MOD_APP:
      // Проверяем, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
      if (!isMainAdmin(req)) {
        return res.status(UNAUTHORIZED).json({ message: NOT_MAIN_ADMIN_ERR_MESS });
      }
      creds = [MOD_APP_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_APP_CREDENTIAL:
    case AUTH_NSI_ACTIONS.DEL_APP_CREDENTIAL:
    case AUTH_NSI_ACTIONS.MOD_APP_CREDENTIAL:
      // Проверяем, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
      if (!isMainAdmin(req)) {
        return res.status(UNAUTHORIZED).json({ message: NOT_MAIN_ADMIN_ERR_MESS });
      }
      creds = [MOD_APP_CREDENTIAL_ACTION];
      break;
    // Роли
    case AUTH_NSI_ACTIONS.GET_ALL_ALLOWED_ROLES:
    case AUTH_NSI_ACTIONS.GET_ALL_ROLES_ABBRS:
      creds = [GET_ALL_ROLES_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_ROLE:
    case AUTH_NSI_ACTIONS.ADD_APP_CRED_TO_ROLE:
    case AUTH_NSI_ACTIONS.DEL_ROLE:
    case AUTH_NSI_ACTIONS.MOD_ROLE:
      // Проверяем, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
      if (!isMainAdmin(req)) {
        return res.status(UNAUTHORIZED).json({ message: NOT_MAIN_ADMIN_ERR_MESS });
      }
      creds = [MOD_ROLE_ACTION];
      break;
    case AUTH_NSI_ACTIONS.MOD_ROLE_APP_CREDENTIALS:
      // Проверяем, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
      if (!isMainAdmin(req)) {
        return res.status(UNAUTHORIZED).json({ message: NOT_MAIN_ADMIN_ERR_MESS });
      }
      creds = [MOD_APP_CREDENTIALS_ACTION];
      break;
    // Должности
    case AUTH_NSI_ACTIONS.ADD_POST:
    case AUTH_NSI_ACTIONS.DEL_POST:
    case AUTH_NSI_ACTIONS.MOD_POST:
      creds = [MOD_POST_ACTION];
      break;
    // Службы
    case AUTH_NSI_ACTIONS.ADD_SERVICE:
    case AUTH_NSI_ACTIONS.DEL_SERVICE:
    case AUTH_NSI_ACTIONS.MOD_SERVICE:
      creds = [MOD_SERVICE_ACTION];
      break;
    // Пользователи
    case AUTH_NSI_ACTIONS.GET_ALL_USERS:
      creds = [GET_ALL_USERS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.REGISTER_USER:
      creds = [REGISTER_USER_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_USER_ROLE:
    case AUTH_NSI_ACTIONS.DEL_USER:
    case AUTH_NSI_ACTIONS.DEL_USER_ROLE:
    case AUTH_NSI_ACTIONS.MOD_USER:
    case AUTH_NSI_ACTIONS.CONFIRM_USER_REGISTRATION_DATA:
      creds = [MOD_USER_ACTION];
      break;
    // Станции
    case AUTH_NSI_ACTIONS.GET_STATIONS_WITH_TRACKS_AND_WORK_PLACES:
    case AUTH_NSI_ACTIONS.GET_STATIONS_WITH_TRACKS:
    case AUTH_NSI_ACTIONS.GET_DEFINIT_STATION_DATA:
    case AUTH_NSI_ACTIONS.GET_DEFINIT_STATIONS:
      creds = [GET_ALL_STATIONS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_STATION:
    case AUTH_NSI_ACTIONS.DEL_STATION:
    case AUTH_NSI_ACTIONS.MOD_STATION:
    case AUTH_NSI_ACTIONS.SYNC_STATIONS_WITH_PENSI:
      creds = [MOD_STATION_ACTION];
      break;
    // Пути станций
    case AUTH_NSI_ACTIONS.ADD_STATION_TRACK:
    case AUTH_NSI_ACTIONS.DEL_STATION_TRACK:
    case AUTH_NSI_ACTIONS.MOD_STATION_TRACK:
      creds = [MOD_STATION_ACTION];
      break;
    // Рабочие места на станциях
    case AUTH_NSI_ACTIONS.ADD_STATION_WORK_PLACE:
    case AUTH_NSI_ACTIONS.DEL_STATION_WORK_PLACE:
    case AUTH_NSI_ACTIONS.MOD_STATION_WORK_PLACE:
      creds = [MOD_STATION_ACTION];
      break;
    // Рабочие полигоны - станции
    case AUTH_NSI_ACTIONS.GET_ALL_STATION_WORK_POLIGONS:
    case AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_STATION_WORK_POLIGONS:
      creds = [GET_ALL_USERS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.MOD_USER_STATION_WORK_POLIGONS:
      creds = [MOD_USER_ACTION];
      break;
    // Перегоны
    case AUTH_NSI_ACTIONS.GET_BLOCKS_SHORT_DATA:
    case AUTH_NSI_ACTIONS.GET_BLOCKS_DATA:
    case AUTH_NSI_ACTIONS.GET_STATION_BLOCKS:
      creds = [GET_ALL_BLOCKS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_BLOCK:
    case AUTH_NSI_ACTIONS.DEL_BLOCK:
    case AUTH_NSI_ACTIONS.MOD_BLOCK:
    case AUTH_NSI_ACTIONS.SYNC_BLOCKS_WITH_PENSI:
      creds = [MOD_BLOCK_ACTION];
      break;
    // Пути перегонов
    case AUTH_NSI_ACTIONS.ADD_BLOCK_TRACK:
    case AUTH_NSI_ACTIONS.DEL_BLOCK_TRACK:
    case AUTH_NSI_ACTIONS.MOD_BLOCK_TRACK:
      creds = [MOD_BLOCK_ACTION];
      break;
    // Участки ДНЦ
    case AUTH_NSI_ACTIONS.GET_DNC_SECTORS:
    case AUTH_NSI_ACTIONS.GET_STATION_DNC_SECTORS:
    case AUTH_NSI_ACTIONS.GET_DNC_SECTOR_DATA:
    case AUTH_NSI_ACTIONS.GET_GIVEN_DNC_SECTORS_SHORT_DATA:
      creds = [GET_ALL_DNCSECTORS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.DEL_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.MOD_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.SYNC_DNC_SECTORS_WITH_PENSI:
      creds = [MOD_DNCSECTOR_ACTION];
      break;
    // Поездные участки ДНЦ
    case AUTH_NSI_ACTIONS.ADD_DNC_TRAIN_SECTOR:
    case AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR:
    case AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR:
      creds = [MOD_DNCSECTOR_ACTION];
      break;
    // Станции поездных участков ДНЦ
    case AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_STATIONS:
    case AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR_STATION:
    case AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_STATION:
      creds = [MOD_DNCSECTOR_ACTION];
      break;
    // Перегоны поездных участков ДНЦ
    case AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_BLOCKS:
    case AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR_BLOCK:
    case AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_BLOCK:
      creds = [MOD_DNCSECTOR_ACTION];
      break;    
    // Рабочие полигоны - участки ДНЦ
    case AUTH_NSI_ACTIONS.GET_ALL_DNC_SECTOR_WORK_POLIGONS:
    case AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_DNC_SECTOR_WORK_POLIGONS:
      creds = [GET_ALL_USERS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.MOD_USER_DNC_SECTOR_WORK_POLIGONS:
      creds = [MOD_USER_ACTION];
      break;
    // Участки ЭЦД
    case AUTH_NSI_ACTIONS.GET_ECD_SECTORS:
    case AUTH_NSI_ACTIONS.GET_STATION_ECD_SECTORS:
    case AUTH_NSI_ACTIONS.GET_ECD_SECTOR_DATA:
    case AUTH_NSI_ACTIONS.GET_GIVEN_ECD_SECTORS_SHORT_DATA:
      creds = [GET_ALL_ECDSECTORS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_ECD_SECTOR:
    case AUTH_NSI_ACTIONS.DEL_ECD_SECTOR:
    case AUTH_NSI_ACTIONS.MOD_ECD_SECTOR:
      creds = [MOD_ECDSECTOR_ACTION];
      break;
    // Поездные участки ЭЦД
    case AUTH_NSI_ACTIONS.ADD_ECD_TRAIN_SECTOR:
    case AUTH_NSI_ACTIONS.DEL_ECD_TRAIN_SECTOR:
    case AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR:
      creds = [MOD_ECDSECTOR_ACTION];
      break;
    // Станции поездных участков ЭЦД
    case AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_STATIONS:
    case AUTH_NSI_ACTIONS.DEL_ECD_TRAIN_SECTOR_STATION:
    case AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_STATION:
      creds = [MOD_ECDSECTOR_ACTION];
      break;
    // Перегоны поездных участков ЭЦД
    case AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_BLOCKS:
    case AUTH_NSI_ACTIONS.DEL_ECD_TRAIN_SECTOR_BLOCK:
    case AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_BLOCK:
      creds = [MOD_ECDSECTOR_ACTION];
      break;    
    // Структурные подразделения участков ЭЦД
    case AUTH_NSI_ACTIONS.ADD_ECD_STRUCTURAL_DIVISION:
    case AUTH_NSI_ACTIONS.MOD_ECD_STRUCTURAL_DIVISION:
    case AUTH_NSI_ACTIONS.DEL_ECD_STRUCTURAL_DIVISION:
      creds = [MOD_ECDSECTOR_ACTION];
      break;
    // Рабочие полигоны - участки ЭЦД
    case AUTH_NSI_ACTIONS.GET_ALL_ECD_SECTOR_WORK_POLIGONS:
    case AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_ECD_SECTOR_WORK_POLIGONS:
      creds = [GET_ALL_USERS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.MOD_USER_ECD_SECTOR_WORK_POLIGONS:
      creds = [MOD_USER_ACTION];
      break;
    // Смежные участки ДНЦ
    case AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_DNC_SECTORS:
    case AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_DNC_SECTORS_OF_DEFINITE_DNC_SECTOR:
      creds = [GET_ALL_DNCSECTORS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_ADJACENT_DNC_SECTORS:
    case AUTH_NSI_ACTIONS.DEL_ADJACENT_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.CHANGE_ADJACENT_DNC_SECTORS:
      creds = [MOD_DNCSECTOR_ACTION];
      break;
    // Смежные участки ЭЦД
    case AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_ECD_SECTORS:
    case AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_ECD_SECTORS_OF_DEFINITE_ECD_SECTOR:
      creds = [GET_ALL_ECDSECTORS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_ADJACENT_ECD_SECTORS:
    case AUTH_NSI_ACTIONS.DEL_ADJACENT_ECD_SECTOR:
    case AUTH_NSI_ACTIONS.CHANGE_ADJACENT_ECD_SECTORS:
      creds = [MOD_ECDSECTOR_ACTION];
      break;
    // Ближайшие участки ДНЦ и ЭЦД
    case AUTH_NSI_ACTIONS.GET_ALL_NEAREST_DNC_ECD_SECTORS:
    case AUTH_NSI_ACTIONS.GET_ALL_NEAREST_ECD_SECTORS_OF_DEFINITE_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.GET_ALL_NEAREST_DNC_SECTORS_OF_DEFINITE_ECD_SECTOR:
      creds = [GET_ALL_DNCSECTORS_ACTION, GET_ALL_ECDSECTORS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_NEAREST_ECD_SECTOR_TO_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.ADD_NEAREST_DNC_SECTOR_TO_ECD_SECTOR:
    case AUTH_NSI_ACTIONS.DEL_NEAREST_DNC_ECD_SECTOR:
    case AUTH_NSI_ACTIONS.MOD_NEAREST_ECD_SECTORS_FOR_DEFINITE_DNC_SECTOR:
    case AUTH_NSI_ACTIONS.MOD_NEAREST_DNC_SECTORS_FOR_DEFINITE_ECD_SECTOR:
      creds = [MOD_DNCSECTOR_ACTION, MOD_ECDSECTOR_ACTION];
      break;
    // Шаблоны распоряжений
    case AUTH_NSI_ACTIONS.GET_ORDER_PATTERNS:
      creds = [GET_ALL_ORDER_PATTERNS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_ORDER_PATTERN:
    case AUTH_NSI_ACTIONS.DEL_ORDER_PATTERN:
    case AUTH_NSI_ACTIONS.MOD_ORDER_PATTERN:
    case AUTH_NSI_ACTIONS.MOD_ORDER_PATTERNS_CATEGORY_TITLE:
      creds = [MOD_ORDER_PATTERN_ACTION];
      break;
    // Связи между шаблонами распоряжений
    case AUTH_NSI_ACTIONS.ADD_CHILD_ORDER_PATTERN:
    case AUTH_NSI_ACTIONS.DEL_CHILD_ORDER_PATTERN:
      creds = [MOD_ORDER_PATTERN_ACTION];
      break;
    // Смысловые значения элементов шаблонов распоряжений
    case AUTH_NSI_ACTIONS.GET_ALL_ORDER_PATTERN_ELEMENT_REFS:
    case AUTH_NSI_ACTIONS.GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS:
      creds = [GET_ALL_ORDER_PATTERNS_ACTION];
      break;
    // Логи действий администраторов
    case AUTH_NSI_ACTIONS.GET_ADMINS_ACTIONS_LOGS:
      creds = [GET_ADMINS_LOGS_ACTION];
      break;
    // Логи действий пользователей ДУ-58
    case AUTH_NSI_ACTIONS.GET_DY58_USERS_ACTIONS_LOGS:
      creds = [GET_DY58_USERS_LOGS_ACTION];
      break;
    // Логи действий сервера
    case AUTH_NSI_ACTIONS.GET_SERVER_ACTIONS_LOGS:
      creds = [GET_SERVER_LOGS_ACTION];
      break;
    // Логи ошибок
    case AUTH_NSI_ACTIONS.GET_ERRORS_LOGS:
      creds = [GET_SERVER_ERRORS_LOGS_ACTION];
      break;

    // Для системы ДУ-58
    // -----------------
    // Рабочие распоряжения
    case DY58_ACTIONS.GET_WORK_ORDERS:
      creds = [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL, REVISOR];
      break;
    case DY58_ACTIONS.REPORT_ON_ORDER_DELIVERY:
    case DY58_ACTIONS.CONFIRM_ORDER:
    case DY58_ACTIONS.CONFIRM_ORDER_FOR_OTHER_RECEIVERS:
    case DY58_ACTIONS.CONFIRM_ORDER_FOR_OTHERS:
    case DY58_ACTIONS.DEL_CONFIRMED_ORDERS_FROM_CHAIN:
      creds = [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL];
      break;
    case DY58_ACTIONS.DEL_STATION_WORK_PLACE_RECEIVER:
      creds = [DSP_FULL, DSP_Operator];
      break;
    // Все распоряжения
    case DY58_ACTIONS.ADD_ORDER:
    case DY58_ACTIONS.GET_ORDERS_JOURNAL_DATA:
      creds = [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL, REVISOR];
      break;
    case DY58_ACTIONS.MOD_ORDER:
    case DY58_ACTIONS.GET_ORDERS_ADDRESSED_TO_GIVEN_WORK_POLIGON_FROM_GIVEN_DATE:
      creds = [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL];
      break;
    // Параметры последних изданных распоряжений
    case DY58_ACTIONS.GET_LAST_ORDERS_PARAMS:
      creds = [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL];
      break;
    // Черновики распоряжений
    case DY58_ACTIONS.ADD_ORDER_DRAFT:
    case DY58_ACTIONS.MOD_ORDER_DRAFT:
    case DY58_ACTIONS.DEL_ORDER_DRAFT:
    case DY58_ACTIONS.GET_ORDER_DRAFTS:
      creds = [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL];
      break;
    // "Окна"
    default:
      // Если для выполнения действия не нужно иметь каких-либо особых полномочий, то идем дальше
      break;
  }

  // Проверяем наличие у пользователя полномочий на выполнение запрошенного действия
  if (creds) {
    req.action = {
      which: howCheckCreds,
      creds,
    };
    const checkRes = checkGeneralCredentials(req);
    if (checkRes.err) {
      return res.status(err.status).json({ message: err.message });
    }
  }
  next();
}

module.exports = {
  AUTH_NSI_ACTIONS,
  DY58_ACTIONS,
  isMainAdmin,
  hasUserRightToPerformAction,
};
