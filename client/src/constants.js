export const LOCALSTORAGE_NAME = 'gid-neman-user';

// ----------------------------------------

export const MAIN_ADMIN_ROLE_NAME = 'GID_NEMAN_ADMIN';
export const SUB_ADMIN_ROLE_NAME = 'SUB_ADMIN';

// ----------------------------------------

export const ServerAddress = 'http://localhost:5000';

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

  GET_STATIONS_DATA: ServerAddress + '/api/nsi/stations/data',
  ADD_STATION_DATA: ServerAddress + '/api/nsi/stations/add',
  DEL_STATION_DATA: ServerAddress + '/api/nsi/stations/del',
  MOD_STATION_DATA: ServerAddress + '/api/nsi/stations/mod',

  GET_BLOCKS_DATA: ServerAddress + '/api/nsi/blocks/data',
  ADD_BLOCK_DATA: ServerAddress + '/api/nsi/blocks/add',
  DEL_BLOCK_DATA: ServerAddress + '/api/nsi/blocks/del',
  MOD_BLOCK_DATA: ServerAddress + '/api/nsi/blocks/mod',

  GET_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/data',
  ADD_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/add',
  DEL_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/del',
  MOD_DNCSECTORS_DATA: ServerAddress + '/api/nsi/dncSectors/mod',

  GET_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/data',
  ADD_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/add',
  DEL_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/del',
  MOD_ECDSECTORS_DATA: ServerAddress + '/api/nsi/ecdSectors/mod',

  GET_ADJACENTDNCSECTORS_DATA: ServerAddress + '/api/nsi/adjacentDNCSectors/data',
  ADD_ADJACENTDNCSECTORS_DATA: ServerAddress + '/api/nsi/adjacentDNCSectors/add',
  DEL_ADJACENTDNCSECTORS_DATA: ServerAddress + '/api/nsi/adjacentDNCSectors/del',

  GET_ADJACENTECDSECTORS_DATA: ServerAddress + '/api/nsi/adjacentECDSectors/data',
  ADD_ADJACENTECDSECTORS_DATA: ServerAddress + '/api/nsi/adjacentECDSectors/add',
  DEL_ADJACENTECDSECTORS_DATA: ServerAddress + '/api/nsi/adjacentECDSectors/del',

  GET_NEARESTDNCECDSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/data',
  ADD_NEARESTECDFORDNCSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/addECDToDNC',
  ADD_NEARESTDNCFORECDSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/addDNCToECD',
  DEL_NEARESTDNCECDSECTORS_DATA: ServerAddress + '/api/nsi/nearestDNCandECDSectors/del',

  GET_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/data',
  ADD_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/add',
  MOD_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/mod',
  DEL_DNCTRAINSECTORS_DATA: ServerAddress + '/api/nsi/dncTrainSectors/del',

  GET_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/data',
  ADD_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/add',
  MOD_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/mod',
  DEL_ECDTRAINSECTORS_DATA: ServerAddress + '/api/nsi/ecdTrainSectors/del',
});

// ----------------------------------------

export const STATION_FIELDS = Object.freeze({
  KEY: 'key',
  ESR_CODE: 'ESRCode',
  NAME: 'name',
  NAME_AND_CODE: 'NameCode',
  DNC_SECTOR_ID: 'dncSectorId',
  ECD_SECTOR_ID: 'ecdSectorId',
  DNC_SECTOR_NAME: 'dncSectorName',
  ECD_SECTOR_NAME: 'ecdSectorName',
  DNC_TRAINSECTOR_ID: 'dncTrainSectorId',
  ECD_TRAINSECTOR_ID: 'ecdTrainSectorId',
  DNC_TRAINSECTOR_NAME: 'dncTrainSectorName',
  ECD_TRAINSECTOR_NAME: 'ecdTrainSectorName',
});

// ----------------------------------------

export const BLOCK_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  STATION1: 'station1',
  STATION2: 'station2',
  STATION1_NAME: 'station1Name',
  STATION2_NAME: 'station2Name',
  DNC_SECTOR_ID: 'dncSectorId',
  ECD_SECTOR_ID: 'ecdSectorId',
  DNC_SECTOR_NAME: 'dncSectorName',
  ECD_SECTOR_NAME: 'ecdSectorName',
  DNC_TRAINSECTOR_ID: 'dncTrainSectorId',
  ECD_TRAINSECTOR_ID: 'ecdTrainSectorId',
  DNC_TRAINSECTOR_NAME: 'dncTrainSectorName',
  ECD_TRAINSECTOR_NAME: 'ecdTrainSectorName',
});

// ----------------------------------------

export const DNCSECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
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
});

export const ADJACENT_ECDSECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

// ----------------------------------------

export const NEAREST_SECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

export const TRAIN_SECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
});
