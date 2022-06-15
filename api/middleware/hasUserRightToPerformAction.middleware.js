const {
  UNAUTHORIZED,
  ERR,

  UNAUTHORIZED_ERR_MESS,
  UNDEFINED_ACTION_ERR_MESS,
  CREDENTIALS_ERR_MESS,

  GET_ALL_APPS_CREDS_ACTION, GET_APPS_CREDS_ABBRS_ACTION, MOD_APP_CREDS_GROUP_ACTION, MOD_APP_CREDENTIAL_ACTION,
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
const AUTH_NSI_ACTIONS = require('./AUTH_NSI_ACTIONS');
const DY58_ACTIONS = require('./DY58_ACTIONS');
const { checkUserAuthenticated } = require('./checkUserAuthenticated');
const checkOnDuty = require('./checkOnDuty');
const checkSpecialCredentials = require('./checkSpecialCredentials');
const checkCanWorkOnWorkPoligon = require('./checkCanWorkOnWorkPoligon');
const { checkMainAdmin } = require('./checkMainAdmin');
const { addError } = require('../serverSideProcessing/processLogsActions');

// Определяет необходимый способ проверки полномочий:
// and - все указанные полномочия должны присутствовать у пользователя;
// or - у пользователя должно присутствовать хотя бы одно из указанных полномочий
const HOW_CHECK_CREDS = {
  AND: 'and',
  OR: 'or',
};


/**
 * Проверка текущих полномочий пользователя с целью определения возможности выполнения определенного действия.
 * Полномочия проверяются без привязки к группам полномочий ГИД Неман, в общем списке "группа-полномочия",
 * закрепленном за пользователем.
 */
function checkGeneralCredentials(req) {
  // Ожидаем, что если req.action не указан, то нет необходимости проверять полномочия пользователя.
  // Если же req.action указан, то это должен быть объект с описанием тех полномочий, наличие которых необходимо
  // проверить у пользователя. Поле which данного объекта - одно из значений HOW_CHECK_CREDS.
  // В процессе проверки не учитываем наименования групп полномочий. Полагаем, что в рамках всех групп полномочий нет
  // групп с одинаковыми наименованиями.
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
}


/**
 * Промежуточный обработчик проверки того, имеет ли пользователь полномочия на выполнение указанного действия.
 * В req.requestedAction должна содержаться строка с наименованием действия, которое пользователь хочет выполнить.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
const hasUserRightToPerformAction = async (req, res, next) => {
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

  // Для выполнения ряда действий необходимо, чтобы лицо, запрашивающее действие, было аутентифицировано в системе
  // (эту проверку делаем перед всеми остальными, т.к. остальные проверки могут требовать данные, которые можно получить
  // только в результате выполнения этой проверки)
  const authRes = checkUserAuthenticated(req);
  if (authRes.err) {
    return res.status(authRes.status).json({ message: authRes.message });
  }

  // Для выполнения ряда действий необходимо, чтобы лицо, запрашивающее действие, находилось на дежурстве
  const onDutyRes = await checkOnDuty(req);
  if (onDutyRes.err) {
    return res.status(onDutyRes.status).json({ message: onDutyRes.message });
  }

  // Для выполнения ряда действий необходимо, чтобы лицо, запрашивающее действие, было главным администратором системы
  const mainAdminRes = checkMainAdmin(req);
  if (mainAdminRes.err) {
    return res.status(mainAdminRes.status).json({ message: mainAdminRes.message });
  }

  // Для выполнения ряда действий необходимо, чтобы у лица, запрашивающего действие, были специальные полномочия
  const checkCredRes = checkSpecialCredentials(req);
  if (checkCredRes.err) {
    return res.status(checkCredRes.status).json({ message: checkCredRes.message });
  }

  // Для ряда действий необходимо убедиться, что пользователь, запрашивающий действие, может работать на рабочем полигоне,
  // указанном в запросе
  const checkWorkPoligonRes = checkCanWorkOnWorkPoligon(req);
  if (checkWorkPoligonRes.err) {
    return res.status(checkWorkPoligonRes.status).json({ message: checkWorkPoligonRes.message });
  }

  // Определяем требуемые полномочия на запрашиваемое действие
  switch (req.requestedAction) {

    // Для системы НСИ и аутентификации
    // --------------------------------
    // Группы полномочий в приложениях ГИД Неман
    case AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS:
      creds = [GET_ALL_APPS_CREDS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS_ABBR_DATA:
      creds = [GET_APPS_CREDS_ABBRS_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_APP_CREDS_GROUP:
    case AUTH_NSI_ACTIONS.DEL_APP_CREDS_GROUP:
    case AUTH_NSI_ACTIONS.MOD_APP_CREDS_GROUP:
      creds = [MOD_APP_CREDS_GROUP_ACTION];
      break;
    case AUTH_NSI_ACTIONS.ADD_APP_CREDENTIAL:
    case AUTH_NSI_ACTIONS.DEL_APP_CREDENTIAL:
    case AUTH_NSI_ACTIONS.MOD_APP_CREDENTIAL:
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
      creds = [MOD_ROLE_ACTION];
      break;
    case AUTH_NSI_ACTIONS.MOD_ROLE_APP_CREDENTIALS:
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
    try {
      const checkRes = checkGeneralCredentials(req);
      if (checkRes.err) {
        return res.status(checkRes.status).json({ message: checkRes.message });
      }
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Промежуточный обработчик проверки наличия у пользователя полномочий на выполнение указанного действия',
        error: error.message,
        actionParams: {},
      });
      return res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
    }
  }
  next();
}

module.exports = hasUserRightToPerformAction;
