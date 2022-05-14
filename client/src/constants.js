// ----------------------------------------

const ServerAddress = process.env.REACT_APP_SERVER_URL;

// ----------------------------------------

export const LOCALSTORAGE_NAME = 'gid-neman-nsi-auth-user';

// ----------------------------------------

export const CURR_APP_ABBREV_NAME = 'GidNemanAuthNSIUtil';

// ----------------------------------------

export const GetDataCredentials = Object.freeze({
  GET_ALL_APPS_ACTION: 'GET_ALL_APPS_ACTION',
  GET_ALL_ROLES_ACTION: 'GET_ALL_ROLES_ACTION',
  GET_ALL_USERS_ACTION: 'GET_ALL_USERS_ACTION',
  GET_ALL_STATIONS_ACTION: 'GET_ALL_STATIONS_ACTION',
  GET_ALL_BLOCKS_ACTION: 'GET_ALL_BLOCKS_ACTION',
  GET_ALL_DNCSECTORS_ACTION	: 'GET_ALL_DNCSECTORS_ACTION',
  GET_ALL_ECDSECTORS_ACTION: 'GET_ALL_ECDSECTORS_ACTION',
  GET_ADMINS_LOGS_ACTION: 'GET_ADMINS_LOGS_ACTION',
  GET_DY58_USERS_LOGS_ACTION: 'GET_DY58_USERS_LOGS_ACTION',
  GET_SERVER_ERRORS_LOGS_ACTION: 'GET_SERVER_ERRORS_LOGS_ACTION',
  GET_SERVER_LOGS_ACTION: 'GET_SERVER_LOGS_ACTION',
});

// ----------------------------------------

export const ServerAPI = Object.freeze({
  GET_APPS_DATA: ServerAddress + '/api/apps/data',
  GET_APPS_ABBR_DATA: ServerAddress + '/api/apps/abbrData',
  ADD_APP_DATA: ServerAddress + '/api/apps/add',
  ADD_APP_CRED_DATA: ServerAddress + '/api/apps/addCred',
  DEL_APP_DATA: ServerAddress + '/api/apps/del',
  DEL_APP_CRED_DATA: ServerAddress + '/api/apps/delCred',
  MOD_APP_DATA: ServerAddress + '/api/apps/mod',
  MOD_APP_CRED_DATA: ServerAddress + '/api/apps/modCred',

  LOGIN: ServerAddress + '/api/auth/login',

  GET_ROLES_DATA: ServerAddress + '/api/roles/data',
  GET_ROLES_ABBR_DATA: ServerAddress + '/api/roles/abbrs',
  ADD_ROLE_DATA: ServerAddress + '/api/roles/add',
  DEL_ROLE_DATA: ServerAddress + '/api/roles/del',
  MOD_ROLE_DATA: ServerAddress + '/api/roles/mod',
  MOD_ROLE_CREDS: ServerAddress + '/api/roles/changeCreds',

  GET_ALL_USERS: ServerAddress + '/api/auth/data',
  ADD_NEW_USER: ServerAddress + '/api/auth/register',
  DEL_USER: ServerAddress + '/api/auth/del',
  MOD_USER: ServerAddress + '/api/auth/mod',
  ADD_USER_ROLE: ServerAddress + '/api/auth/addRole',
  DEL_USER_ROLE: ServerAddress + '/api/auth/delRole',
  CONFIRM_USER: ServerAddress + '/api/auth/confirm',

  GET_FULL_STATIONS_DATA: ServerAddress + '/api/nsi/stations/fullData',
  GET_STATIONS_DATA: ServerAddress + '/api/nsi/stations/data',
  ADD_STATION_DATA: ServerAddress + '/api/nsi/stations/add',
  ADD_STATION_TRACK_DATA: ServerAddress + '/api/nsi/stationTracks/add',
  ADD_STATION_WORK_PLACE_DATA: ServerAddress + '/api/nsi/stationWorkPlaces/add',
  DEL_STATION_DATA: ServerAddress + '/api/nsi/stations/del',
  DEL_STATION_TRACK_DATA: ServerAddress + '/api/nsi/stationTracks/del',
  DEL_STATION_WORK_PLACE_DATA: ServerAddress + '/api/nsi/stationWorkPlaces/del',
  MOD_STATION_DATA: ServerAddress + '/api/nsi/stations/mod',
  MOD_STATION_TRACK_DATA: ServerAddress + '/api/nsi/stationTracks/mod',
  MOD_STATION_WORK_PLACE_DATA: ServerAddress + '/api/nsi/stationWorkPlaces/mod',
  SYNC_STATIONS_WITH_PENSI: ServerAddress + '/api/nsi/stations/syncWithPENSI',

  GET_SERVICES_DATA: ServerAddress + '/api/nsi/services/data',
  ADD_SERVICE_DATA: ServerAddress + '/api/nsi/services/add',
  DEL_SERVICE_DATA: ServerAddress + '/api/nsi/services/del',
  MOD_SERVICE_DATA: ServerAddress + '/api/nsi/services/mod',

  GET_POSTS_DATA: ServerAddress + '/api/nsi/posts/data',
  ADD_POST_DATA: ServerAddress + '/api/nsi/posts/add',
  DEL_POST_DATA: ServerAddress + '/api/nsi/posts/del',
  MOD_POST_DATA: ServerAddress + '/api/nsi/posts/mod',

  GET_BLOCKS_DATA: ServerAddress + '/api/nsi/blocks/shortData',
  GET_BLOCKS_FULL_DATA: ServerAddress + '/api/nsi/blocks/data',
  ADD_BLOCK_DATA: ServerAddress + '/api/nsi/blocks/add',
  ADD_BLOCK_TRACK_DATA: ServerAddress + '/api/nsi/blockTracks/add',
  DEL_BLOCK_DATA: ServerAddress + '/api/nsi/blocks/del',
  DEL_BLOCK_TRACK_DATA: ServerAddress + '/api/nsi/blockTracks/del',
  MOD_BLOCK_DATA: ServerAddress + '/api/nsi/blocks/mod',
  MOD_BLOCK_TRACK_DATA: ServerAddress + '/api/nsi/blockTracks/mod',
  SYNC_BLOCKS_WITH_PENSI: ServerAddress + '/api/nsi/blocks/syncWithPENSI',

  GET_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/data',
  GET_DNCSECTORS_SHORT_DATA: ServerAddress + '/api/nsi/dncSectors/shortData',
  ADD_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/add',
  DEL_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/del',
  MOD_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/mod',
  SYNC_DNCSECTORS_WITH_PENSI: ServerAddress + '/api/nsi/dncSectors/syncWithPENSI',

  GET_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/data',
  GET_ECDSECTORS_SHORT_DATA: ServerAddress + '/api/nsi/ecdSectors/shortData',
  ADD_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/add',
  DEL_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/del',
  MOD_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/mod',

  GET_ADJACENTDNCSECTORS_DATA: ServerAddress + '/api/nsi/adjacentDNCSectors/data',
  MOD_ADJACENTDNCSECTORS_DATA: ServerAddress + '/api/nsi/adjacentDNCSectors/changeAdjacentSectors',

  GET_ADJACENTECDSECTORS_DATA: ServerAddress + '/api/nsi/adjacentECDSectors/data',
  MOD_ADJACENTECDSECTORS_DATA: ServerAddress + '/api/nsi/adjacentECDSectors/changeAdjacentSectors',

  GET_NEARESTDNCECDSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/data',
  MOD_NEARESTECDFORDNCSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/changeNearestECDSectors',
  MOD_NEARESTDNCFORECDSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/changeNearestDNCSectors',

  ADD_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/add',
  MOD_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/mod',
  DEL_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/del',

  ADD_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/add',
  MOD_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/mod',
  DEL_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/del',

  MOD_DNCTRAINSECTORSTATIONLIST: ServerAddress + '/api/nsi/dncTrainSectorStations/modStationsList',
  DEL_DNCTRAINSECTORSTATION_DATA: ServerAddress + '/api/nsi/dncTrainSectorStations/del',
  MOD_DNCTRAINSECTORSTATION_DATA: ServerAddress + '/api/nsi/dncTrainSectorStations/mod',

  MOD_ECDTRAINSECTORSTATIONLIST: ServerAddress + '/api/nsi/ecdTrainSectorStations/modStationsList',
  DEL_ECDTRAINSECTORSTATION_DATA: ServerAddress + '/api/nsi/ecdTrainSectorStations/del',
  MOD_ECDTRAINSECTORSTATION_DATA: ServerAddress + '/api/nsi/ecdTrainSectorStations/mod',

  MOD_DNCTRAINSECTORBLOCKLIST: ServerAddress + '/api/nsi/dncTrainSectorBlocks/modBlocksList',
  DEL_DNCTRAINSECTORBLOCK_DATA: ServerAddress + '/api/nsi/dncTrainSectorBlocks/del',
  MOD_DNCTRAINSECTORBLOCK_DATA: ServerAddress + '/api/nsi/dncTrainSectorBlocks/mod',

  MOD_ECDTRAINSECTORBLOCKLIST: ServerAddress + '/api/nsi/ecdTrainSectorBlocks/modBlocksList',
  DEL_ECDTRAINSECTORBLOCK_DATA: ServerAddress + '/api/nsi/ecdTrainSectorBlocks/del',
  MOD_ECDTRAINSECTORBLOCK_DATA: ServerAddress + '/api/nsi/ecdTrainSectorBlocks/mod',

  ADD_ECDSTRUCTURALDIVISIONS_DATA: ServerAddress + '/api/nsi/ecdStructuralDivisions/add',
  MOD_ECDSTRUCTURALDIVISIONS_DATA: ServerAddress + '/api/nsi/ecdStructuralDivisions/mod',
  DEL_ECDSTRUCTURALDIVISIONS_DATA: ServerAddress + '/api/nsi/ecdStructuralDivisions/del',

  MOD_STATIONS_WORK_POLIGON_LIST: ServerAddress + '/api/workPoligons/stations/change',
  MOD_DNC_SECTORS_WORK_POLIGON_LIST: ServerAddress + '/api/workPoligons/dncSectors/change',
  MOD_ECD_SECTORS_WORK_POLIGON_LIST: ServerAddress + '/api/workPoligons/ecdSectors/change',

  GET_ORDER_PATTERNS_LIST: ServerAddress + '/api/orderPatterns/data',
  GET_ORDER_PATTERNS_ELEMENTS_REFS: ServerAddress + '/api/orderPatternElementRefs/data',
  ADD_ORDER_PATTERN_DATA: ServerAddress + '/api/orderPatterns/add',
  DEL_ORDER_PATTERN_DATA: ServerAddress + '/api/orderPatterns/del',
  MOD_ORDER_PATTERN_DATA: ServerAddress + '/api/orderPatterns/mod',
  MOD_ORDER_CATEGORY_TITLE: ServerAddress + '/api/orderPatterns/modCategoryTitle',
  SET_CHILD_ORDER_PATTERN: ServerAddress + '/api/orderPatternConnections/setChildPattern',
  DEL_CHILD_ORDER_PATTERN: ServerAddress + '/api/orderPatternConnections/delChildPattern',

  GET_ADMINS_LOGS_LIST: ServerAddress + '/api/adminsLogs/data',
  GET_DY58USERS_LOGS_LIST: ServerAddress + '/api/dy58UsersLogs/data',
  GET_SERVER_ERRORS_LOGS_LIST: ServerAddress + '/api/errorsLogs/data',
  GET_SERVER_LOGS_LIST: ServerAddress + '/api/serverLogs/data',
});

// ----------------------------------------

export const APP_FIELDS = Object.freeze({
  KEY: 'key',
  SHORT_TITLE: 'shortTitle',
  TITLE: 'title',
  CREDENTIALS: 'creds',
});

export const APP_CRED_FIELDS = Object.freeze({
  KEY: 'key',
  ENGL_ABBREVIATION: 'englAbbreviation',
  DESCRIPTION: 'description',
});

// ----------------------------------------

export const ROLE_FIELDS = Object.freeze({
  KEY: 'key',
  ENGL_ABBREVIATION: 'englAbbreviation',
  DESCRIPTION: 'description',
  SUB_ADMIN_CAN_USE: 'subAdminCanUse',
  APPLICATIONS: 'apps',
});

// ----------------------------------------

export const USER_FIELDS = Object.freeze({
  KEY: 'key',
  LOGIN: 'login',
  PASSWORD: 'password',
  NAME: 'name',
  SURNAME: 'surname',
  FATHERNAME: 'fatherName',
  POST: 'post',
  SERVICE: 'service',
  ROLES: 'roles',
  STATION_WORK_POLIGONS: 'stations',
  DNC_SECTOR_WORK_POLIGONS: 'dncSectors',
  ECD_SECTOR_WORK_POLIGONS: 'ecdSectors',
  // Данное поле нужно только программе для формы ввода информации о рабочем месте на станции
  // регистрируемого пользователя
  STATION_WORK_PLACES_WORK_POLIGONS: 'stationWorkPlacesWorkPoligons',
  CONTACT_DATA: 'contactData',
  CONFIRMED: 'confirmed',
});

// ----------------------------------------

export const STATION_FIELDS = Object.freeze({
  KEY: 'key',
  ESR_CODE: 'ESRCode',
  NAME: 'name',
  NAME_AND_CODE: 'nameCode',
  PENSI_ID: 'pensiId',
  PENSI_UNMC: 'pensiUNMC',
  POS_IN_TRAIN_SECTOR: 'posInTrainSector',
  BELONGS_TO_SECTOR: 'belongsToSector',
  TRACKS: 'TStationTracks',
  WORK_PLACES: 'TStationWorkPlaces',
});

export const STATION_TRACK_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
});

export const STATION_WORK_PLACE_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
});

// ----------------------------------------

export const SERVICE_FIELDS = Object.freeze({
  KEY: 'key',
  ABBREV: 'abbrev',
  TITLE: 'title',
});

// ----------------------------------------

export const POST_FIELDS = Object.freeze({
  KEY: 'key',
  ABBREV: 'abbrev',
  TITLE: 'title',
});

// ----------------------------------------

export const BLOCK_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  STATION1: 'station1',
  STATION2: 'station2',
  PENSI_ID: 'pensiId',
  PENSI_DNCSectorCode: 'pensiDNCSectorCode',
  POS_IN_TRAIN_SECTOR: 'posInTrainSector',
  BELONGS_TO_SECTOR: 'belongsToSector',
  TRACKS: 'TBlockTracks',
});

export const BLOCK_TRACK_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
});

// ----------------------------------------

export const DNCSECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  NOTE: 'note',
  PENSI_ID: 'pensiId',
  PENSI_Code: 'pensiCode',
  ADJACENT_DNCSECTORS: 'adjacentSectors',
  NEAREST_ECDSECTORS: 'nearestECDSectors',
  TRAIN_SECTORS: 'trainSectors',
});

export const ADJACENT_DNCSECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

// ----------------------------------------

export const ECDSECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  ADJACENT_ECDSECTORS: 'adjacentSectors',
  NEAREST_DNCSECTORS: 'nearestDNCSectors',
  TRAIN_SECTORS: 'trainSectors',
  STRUCTURAL_DIVISIONS: 'structuralDivisions',
});

export const ADJACENT_ECDSECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

// ----------------------------------------

export const NEAREST_SECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

// ----------------------------------------

export const TRAIN_SECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  STATIONS: 'stations',
  BLOCKS: 'blocks',
});

// ----------------------------------------

export const ECD_STRUCTURAL_DIVISION_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'title',
  POST: 'post',
  FIO: 'fio',
});

// ----------------------------------------

export const ORDER_PATTERN_FIELDS = Object.freeze({
  KEY: '_id',
  SERVICE: 'service',
  TYPE: 'type',
  CATEGORY: 'category',
  TITLE: 'title',
  SPECIAL_TRAIN_CATEGORIES: 'specialTrainCategories',
  ELEMENTS: 'elements',
  CHILD_PATTERNS: 'childPatterns',
});

export const ORDER_PATTERN_ELEMENT_FIELDS = Object.freeze({
  KEY: '_id',
  TYPE: 'type',
  SIZE: 'size',
  REF: 'ref',
  VALUE: 'value',
});

export const ORDER_PATTERN_ELEMENT_REFS_FIELDS = Object.freeze({
  KEY: '_id',
  ELEMENT_TYPE: 'elementType',
  REFS: 'possibleRefs',
});

export const CHILD_ORDER_PATTERN_FIELDS = Object.freeze({
  CHILD_KEY: 'childPatternId',
  MATCH_PATTERN_PARAMS: 'patternsParamsMatchingTable',
});

export const ORDER_PATTERNS_MATCHING_FIELDS = Object.freeze({
  BASE_PARAM_KEY: 'baseParamId',
  CHILD_PARAM_KEY: 'childParamId',
});

// ----------------------------------------

export const ADMIN_LOGS_FIELDS = Object.freeze({
  KEY: 'key',
  USER: 'user',
  ACTION_TIME: 'actionTime',
  ACTION: 'action',
  ACTION_PARAMS: 'actionParams',
});

// ----------------------------------------

export const DY58USER_LOGS_FIELDS = Object.freeze({
  KEY: 'key',
  WORK_POLIGON: 'workPoligon',
  USER: 'user',
  ACTION_TIME: 'actionTime',
  ACTION: 'action',
  ACTION_PARAMS: 'actionParams',
});

// ----------------------------------------

export const SERVER_LOGS_FIELDS = Object.freeze({
  KEY: 'key',
  ACTION_TIME: 'actionTime',
  ACTION: 'action',
  DESCRIPTION: 'description',
});

// ----------------------------------------

export const ERROR_LOGS_FIELDS = Object.freeze({
  KEY: 'key',
  ERROR_TIME: 'errorTime',
  ACTION: 'action',
  ERROR: 'error',
  ACTION_PARAMS: 'actionParams',
});

// ----------------------------------------

export const InterfaceDesign = Object.freeze({
  EXPANDED_ICON_SIZE: '1.1rem',
});
