// Список действий, которые пользователь может выполнить с помощью сервера
// в НСИ и системе аутентификации
module.exports = {
  // Приложения
  GET_ALL_APPS_CREDS: 'GET_ALL_APPS_CREDS',
  GET_ALL_APPS_CREDS_ABBR_DATA: 'GET_ALL_APPS_CREDS_ABBR_DATA',
  ADD_APP_CREDS_GROUP: 'ADD_APP_CREDS_GROUP',
  ADD_APP_CREDENTIAL: 'ADD_APP_CREDENTIAL',
  DEL_APP_CREDS_GROUP: 'DEL_APP_CREDS_GROUP',
  DEL_APP_CREDENTIAL: 'DEL_APP_CREDENTIAL',
  MOD_APP_CREDS_GROUP: 'MOD_APP_CREDS_GROUP',
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
  MOD_ORDER_PATTERNS_POSITIONS: 'MOD_ORDER_PATTERNS_POSITIONS',
  // Связи между шаблонами распоряжений
  ADD_CHILD_ORDER_PATTERN: 'ADD_CHILD_ORDER_PATTERN',
  DEL_CHILD_ORDER_PATTERN: 'DEL_CHILD_ORDER_PATTERN',
  // Смысловые значения элементов шаблонов распоряжений
  GET_ALL_ORDER_PATTERN_ELEMENT_REFS: 'GET_ALL_ORDER_PATTERN_ELEMENT_REFS',
  GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS: 'GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS',
  ADD_ORDER_PATTERN_ELEMENT_REF: 'ADD_ORDER_PATTERN_ELEMENT_REF',
  DEL_ORDER_PATTERN_ELEMENT_REF: 'DEL_ORDER_PATTERN_ELEMENT_REF',
  // Логи действий администраторов
  GET_ADMINS_ACTIONS_LOGS: 'GET_ADMINS_ACTIONS_LOGS',
  // Логи действий сервера
  GET_SERVER_ACTIONS_LOGS: 'GET_SERVER_ACTIONS_LOGS',
  // Логи действий пользователей ДУ-58
  GET_DY58_USERS_ACTIONS_LOGS: 'GET_DY58_USERS_ACTIONS_LOGS',
  // Логи ошибок
  GET_ERRORS_LOGS: 'GET_ERRORS_LOGS',
};
