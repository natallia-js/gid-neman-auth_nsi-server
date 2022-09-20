const jwt = require('jsonwebtoken');
const config = require('config');
const {
  UNAUTHORIZED,
  USER_GONE,
  UNAUTHORIZED_ERR_MESS,
  CONFIG_JWT_SECRET_PARAM_NAME,
} = require('../constants');
const AUTH_NSI_ACTIONS = require('./AUTH_NSI_ACTIONS');
const DY58_ACTIONS = require('./DY58_ACTIONS');
const { addError } = require('../serverSideProcessing/processLogsActions');

const jwtSecret = config.get(CONFIG_JWT_SECRET_PARAM_NAME);

/**
 * Проводит проверку аутентифицированности пользователя (вошел ли данный пользователь в систему?).
 * Если пользователь аутентифицирован, то его токен, хранящийся в сессии, расшифровывается для
 * получения необходимых данных о данном пользователе (+ полномочий) в запросе, который он сделал.
 */
const isUserAuthenticated = (req) => {
  // Поскольку в рамках браузера мы допускаем работу одновременно с несколькими приложениями
  // ГИД НЕМАН (и одновременно нескольких пользователей), то запрос на выполнение действия, требующего
  // аутентифицированности пользователя, должен в обязательном порядке содержать аббревиатуру
  // приложения ГИД НЕМАН, с которого данный запрос был отправлен.
  const { applicationAbbreviation } = req.body;
  if (!applicationAbbreviation) {
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }
  // В сессии пользователя ищем элемент массива, относящийся к приложению applicationAbbreviation
  let appSessionArrayElement = req.session.appsUsers
    ? req.session.appsUsers.find((el) => el.application === applicationAbbreviation)
    : null;
  if (!appSessionArrayElement) {
    // Если по приложению applicationAbbreviation нет данных в сессии, то смотрим, есть ли данные в этой же
    // сессии по другим приложениям ГИД НЕМАН. Если есть, то берем первое попавшееся и входим в приложение
    // applicationAbbreviation от имени пользователя, который вошел в это первое попавшееся приложение
    appSessionArrayElement = req.session?.appsUsers?.length ? req.session.appsUsers[0] : null;
    if (!appSessionArrayElement) {
      return { err: true, status: USER_GONE, message: UNAUTHORIZED_ERR_MESS };
    } else {
      // Записываем в сессию информацию о входе пользователя в приложение applicationAbbreviation
      if (!req.session.appsUsers) {
        req.session.appsUsers = [];
      }
      req.session.appsUsers.push({
        userId: appSessionArrayElement.userId,
        application: applicationAbbreviation,
        userToken: appSessionArrayElement.userToken,
      });
    }
  }
  try {
    const decoded = jwt.verify(appSessionArrayElement.userToken, jwtSecret);
    req.user = decoded;
  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Проверка аутентифицированности пользователя',
      error: error.message,
      actionParams: appSessionArrayElement,
    });
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }
  return { err: false };
};

/**
 * Для ряда запросов проверяет факт аутентифицированности пользователя.
 */
function checkUserAuthenticated(req) {
  if (req && [
    // Смежные участки ДНЦ
    AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_DNC_SECTORS,
    AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_DNC_SECTORS_OF_DEFINITE_DNC_SECTOR,
    AUTH_NSI_ACTIONS.ADD_ADJACENT_DNC_SECTORS,
    AUTH_NSI_ACTIONS.DEL_ADJACENT_DNC_SECTOR,
    AUTH_NSI_ACTIONS.CHANGE_ADJACENT_DNC_SECTORS,

    // Смежные участки ЭЦД
    AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_ECD_SECTORS,
    AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_ECD_SECTORS_OF_DEFINITE_ECD_SECTOR,
    AUTH_NSI_ACTIONS.ADD_ADJACENT_ECD_SECTORS,
    AUTH_NSI_ACTIONS.DEL_ADJACENT_ECD_SECTOR,
    AUTH_NSI_ACTIONS.CHANGE_ADJACENT_ECD_SECTORS,

    // Логи
    AUTH_NSI_ACTIONS.GET_ADMINS_ACTIONS_LOGS,
    AUTH_NSI_ACTIONS.GET_DY58_USERS_ACTIONS_LOGS,
    AUTH_NSI_ACTIONS.GET_ERRORS_LOGS,
    AUTH_NSI_ACTIONS.GET_SERVER_ACTIONS_LOGS,

    // Группы полномочий в приложениях ГИД Неман
    AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS,
    AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS_ABBR_DATA,
    AUTH_NSI_ACTIONS.ADD_APP_CREDS_GROUP,
    AUTH_NSI_ACTIONS.ADD_APP_CREDENTIAL,
    AUTH_NSI_ACTIONS.DEL_APP_CREDS_GROUP,
    AUTH_NSI_ACTIONS.DEL_APP_CREDENTIAL,
    AUTH_NSI_ACTIONS.MOD_APP_CREDS_GROUP,
    AUTH_NSI_ACTIONS.MOD_APP_CREDENTIAL,

    // Пользователи
    AUTH_NSI_ACTIONS.GET_ALL_USERS,
    AUTH_NSI_ACTIONS.REGISTER_USER,
    AUTH_NSI_ACTIONS.ADD_USER_ROLE,
    AUTH_NSI_ACTIONS.START_WORK_WITHOUT_TAKING_DUTY,
    AUTH_NSI_ACTIONS.START_WORK_WITH_TAKING_DUTY,
    AUTH_NSI_ACTIONS.LOGOUT,
    AUTH_NSI_ACTIONS.LOGOUT_WITH_DUTY_PASS,
    AUTH_NSI_ACTIONS.DEL_USER,
    AUTH_NSI_ACTIONS.DEL_USER_ROLE,
    AUTH_NSI_ACTIONS.MOD_USER,
    AUTH_NSI_ACTIONS.CONFIRM_USER_REGISTRATION_DATA,

    // Перегоны
    AUTH_NSI_ACTIONS.GET_BLOCKS_SHORT_DATA,
    AUTH_NSI_ACTIONS.GET_BLOCKS_DATA,
    AUTH_NSI_ACTIONS.GET_STATION_BLOCKS,
    AUTH_NSI_ACTIONS.ADD_BLOCK,
    AUTH_NSI_ACTIONS.DEL_BLOCK,
    AUTH_NSI_ACTIONS.MOD_BLOCK,
    AUTH_NSI_ACTIONS.SYNC_BLOCKS_WITH_PENSI,

    // Пути перегонов
    AUTH_NSI_ACTIONS.ADD_BLOCK_TRACK,
    AUTH_NSI_ACTIONS.DEL_BLOCK_TRACK,
    AUTH_NSI_ACTIONS.MOD_BLOCK_TRACK,

    // Участки ДНЦ
    AUTH_NSI_ACTIONS.GET_DNC_SECTORS,
    AUTH_NSI_ACTIONS.GET_STATION_DNC_SECTORS,
    AUTH_NSI_ACTIONS.GET_DNC_SECTOR_DATA,
    AUTH_NSI_ACTIONS.GET_GIVEN_DNC_SECTORS_SHORT_DATA,
    AUTH_NSI_ACTIONS.ADD_DNC_SECTOR,
    AUTH_NSI_ACTIONS.DEL_DNC_SECTOR,
    AUTH_NSI_ACTIONS.MOD_DNC_SECTOR,
    AUTH_NSI_ACTIONS.SYNC_DNC_SECTORS_WITH_PENSI,

    // Рабочие полигоны - участки ДНЦ
    AUTH_NSI_ACTIONS.GET_ALL_DNC_SECTOR_WORK_POLIGONS,
    AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_DNC_SECTOR_WORK_POLIGONS,
    AUTH_NSI_ACTIONS.MOD_USER_DNC_SECTOR_WORK_POLIGONS,

    // Перегоны поездных участков ДНЦ
    AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_BLOCKS,
    AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR_BLOCK,
    AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_BLOCK,

    // Поездные участки ДНЦ
    AUTH_NSI_ACTIONS.ADD_DNC_TRAIN_SECTOR,
    AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR,
    AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR,

    // Станции поездных участков ДНЦ
    AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_STATIONS,
    AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR_STATION,
    AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_STATION,

    // Черновики распоряжений
    DY58_ACTIONS.ADD_ORDER_DRAFT,
    DY58_ACTIONS.MOD_ORDER_DRAFT,
    DY58_ACTIONS.DEL_ORDER_DRAFT,
    DY58_ACTIONS.GET_ORDER_DRAFTS,

    // Участки ЭЦД
    AUTH_NSI_ACTIONS.GET_ECD_SECTORS,
    AUTH_NSI_ACTIONS.GET_STATION_ECD_SECTORS,
    AUTH_NSI_ACTIONS.GET_ECD_SECTOR_DATA,
    AUTH_NSI_ACTIONS.GET_GIVEN_ECD_SECTORS_SHORT_DATA,
    AUTH_NSI_ACTIONS.ADD_ECD_SECTOR,
    AUTH_NSI_ACTIONS.DEL_ECD_SECTOR,
    AUTH_NSI_ACTIONS.MOD_ECD_SECTOR,

    // Рабочие полигоны - участки ЭЦД
    AUTH_NSI_ACTIONS.GET_ALL_ECD_SECTOR_WORK_POLIGONS,
    AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_ECD_SECTOR_WORK_POLIGONS,
    AUTH_NSI_ACTIONS.MOD_USER_ECD_SECTOR_WORK_POLIGONS,

    // Структурные подразделения участков ЭЦД
    AUTH_NSI_ACTIONS.ADD_ECD_STRUCTURAL_DIVISION,
    AUTH_NSI_ACTIONS.DEL_ECD_STRUCTURAL_DIVISION,
    AUTH_NSI_ACTIONS.MOD_ECD_STRUCTURAL_DIVISION,

    // Перегоны поездных участков ЭЦД
    AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_BLOCKS,
    AUTH_NSI_ACTIONS.DEL_ECD_TRAIN_SECTOR_BLOCK,
    AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_BLOCK,

    // Поездные участки ЭЦД
    AUTH_NSI_ACTIONS.ADD_ECD_TRAIN_SECTOR,
    AUTH_NSI_ACTIONS.DEL_ECD_TRAIN_SECTOR,
    AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR,

    // Станции поездных участков ЭЦД
    AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_STATIONS,
    AUTH_NSI_ACTIONS.DEL_ECD_TRAIN_SECTOR_STATION,
    AUTH_NSI_ACTIONS.MOD_ECD_TRAIN_SECTOR_STATION,

    // Параметры последних изданных распоряжений
    DY58_ACTIONS.GET_LAST_ORDERS_PARAMS,

    // Ближайшие участки ДНЦ и ЭЦД
    AUTH_NSI_ACTIONS.GET_ALL_NEAREST_DNC_ECD_SECTORS,
    AUTH_NSI_ACTIONS.GET_ALL_NEAREST_ECD_SECTORS_OF_DEFINITE_DNC_SECTOR,
    AUTH_NSI_ACTIONS.GET_ALL_NEAREST_DNC_SECTORS_OF_DEFINITE_ECD_SECTOR,
    AUTH_NSI_ACTIONS.ADD_NEAREST_ECD_SECTOR_TO_DNC_SECTOR,
    AUTH_NSI_ACTIONS.ADD_NEAREST_DNC_SECTOR_TO_ECD_SECTOR,
    AUTH_NSI_ACTIONS.DEL_NEAREST_DNC_ECD_SECTOR,
    AUTH_NSI_ACTIONS.MOD_NEAREST_ECD_SECTORS_FOR_DEFINITE_DNC_SECTOR,
    AUTH_NSI_ACTIONS.MOD_NEAREST_DNC_SECTORS_FOR_DEFINITE_ECD_SECTOR,

    // Связи между шаблонами распоряжений
    AUTH_NSI_ACTIONS.ADD_CHILD_ORDER_PATTERN,
    AUTH_NSI_ACTIONS.DEL_CHILD_ORDER_PATTERN,

    // Смысловые значения элементов шаблонов распоряжений
    AUTH_NSI_ACTIONS.GET_ALL_ORDER_PATTERN_ELEMENT_REFS,
    AUTH_NSI_ACTIONS.GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS,
    AUTH_NSI_ACTIONS.ADD_ORDER_PATTERN_ELEMENT_REF,
    AUTH_NSI_ACTIONS.DEL_ORDER_PATTERN_ELEMENT_REF,
    AUTH_NSI_ACTIONS.MOD_ORDER_PATTERN_ELEMENT_REF,

    // Шаблоны распоряжений
    AUTH_NSI_ACTIONS.GET_ORDER_PATTERNS,
    AUTH_NSI_ACTIONS.ADD_ORDER_PATTERN,
    AUTH_NSI_ACTIONS.DEL_ORDER_PATTERN,
    AUTH_NSI_ACTIONS.MOD_ORDER_PATTERN,
    AUTH_NSI_ACTIONS.MOD_ORDER_PATTERNS_CATEGORY_TITLE,
    AUTH_NSI_ACTIONS.MOD_ORDER_PATTERNS_POSITIONS,

    // Распоряжения
    DY58_ACTIONS.ADD_ORDER,
    DY58_ACTIONS.MOD_ORDER,
    DY58_ACTIONS.GET_ORDERS_ADDRESSED_TO_GIVEN_WORK_POLIGON_FROM_GIVEN_DATE,
    DY58_ACTIONS.GET_ORDERS_JOURNAL_DATA,

    // Должности
    AUTH_NSI_ACTIONS.ADD_POST,
    AUTH_NSI_ACTIONS.DEL_POST,
    AUTH_NSI_ACTIONS.MOD_POST,

    // Роли
    AUTH_NSI_ACTIONS.GET_ALL_ALLOWED_ROLES,
    AUTH_NSI_ACTIONS.GET_ALL_ROLES_ABBRS,
    AUTH_NSI_ACTIONS.ADD_ROLE,
    AUTH_NSI_ACTIONS.ADD_APP_CRED_TO_ROLE,
    AUTH_NSI_ACTIONS.MOD_ROLE_APP_CREDENTIALS,
    AUTH_NSI_ACTIONS.DEL_ROLE,
    AUTH_NSI_ACTIONS.MOD_ROLE,

    // Службы
    AUTH_NSI_ACTIONS.ADD_SERVICE,
    AUTH_NSI_ACTIONS.DEL_SERVICE,
    AUTH_NSI_ACTIONS.MOD_SERVICE,

    // Станции
    AUTH_NSI_ACTIONS.GET_STATIONS_WITH_TRACKS_AND_WORK_PLACES,
    AUTH_NSI_ACTIONS.GET_STATIONS_WITH_TRACKS,
    AUTH_NSI_ACTIONS.GET_DEFINIT_STATION_DATA,
    AUTH_NSI_ACTIONS.GET_DEFINIT_STATIONS,
    AUTH_NSI_ACTIONS.ADD_STATION,
    AUTH_NSI_ACTIONS.DEL_STATION,
    AUTH_NSI_ACTIONS.MOD_STATION,
    AUTH_NSI_ACTIONS.SYNC_STATIONS_WITH_PENSI,

    // Пути станций
    AUTH_NSI_ACTIONS.ADD_STATION_TRACK,
    AUTH_NSI_ACTIONS.DEL_STATION_TRACK,
    AUTH_NSI_ACTIONS.MOD_STATION_TRACK,

    // Рабочие места на станциях
    AUTH_NSI_ACTIONS.ADD_STATION_WORK_PLACE,
    AUTH_NSI_ACTIONS.DEL_STATION_WORK_PLACE,
    AUTH_NSI_ACTIONS.MOD_STATION_WORK_PLACE,

    // Рабочие полигоны - станции
    AUTH_NSI_ACTIONS.GET_ALL_STATION_WORK_POLIGONS,
    AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_STATION_WORK_POLIGONS,
    AUTH_NSI_ACTIONS.MOD_USER_STATION_WORK_POLIGONS,

    // Рабочие распоряжения
    DY58_ACTIONS.GET_WORK_ORDERS,
    DY58_ACTIONS.REPORT_ON_ORDER_DELIVERY,
    DY58_ACTIONS.CONFIRM_ORDER,
    DY58_ACTIONS.CONFIRM_ORDER_FOR_OTHER_RECEIVERS,
    DY58_ACTIONS.CONFIRM_ORDER_FOR_OTHERS,
    DY58_ACTIONS.DEL_CONFIRMED_ORDERS_FROM_CHAIN,
    DY58_ACTIONS.DEL_STATION_WORK_PLACE_RECEIVER,
    ].includes(req.requestedAction)
  ) {
    return isUserAuthenticated(req);
  }
  return { err: false };
}

module.exports = {
  isUserAuthenticated,
  checkUserAuthenticated,
};
