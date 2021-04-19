export const LOCALSTORAGE_NAME = 'gid-neman-user';

// ----------------------------------------

export const MAIN_ADMIN_ROLE_NAME = 'GID_NEMAN_ADMIN';
export const SUB_ADMIN_ROLE_NAME = 'SUB_ADMIN';

// ----------------------------------------

export const ServerAPI = Object.freeze({
  GET_STATIONS_DATA: '/api/nsi/stations/data',
  ADD_STATION_DATA: '/api/nsi/stations/add',
  DEL_STATION_DATA: '/api/nsi/stations/del',
  MOD_STATION_DATA: '/api/nsi/stations/mod',

  GET_BLOCKS_DATA: '/api/nsi/blocks/data',
  ADD_BLOCK_DATA: '/api/nsi/blocks/add',
  DEL_BLOCK_DATA: '/api/nsi/blocks/del',
  MOD_BLOCK_DATA: '/api/nsi/blocks/mod',

  GET_DNCSECTORS_DATA: '/api/nsi/dncSectors/data',
  ADD_DNCSECTORS_DATA: '/api/nsi/dncSectors/add',
  DEL_DNCSECTORS_DATA: '/api/nsi/dncSectors/del',
  MOD_DNCSECTORS_DATA: '/api/nsi/dncSectors/mod',

  GET_ECDSECTORS_DATA: '/api/nsi/ecdSectors/data',
  ADD_ECDSECTORS_DATA: '/api/nsi/ecdSectors/add',
  DEL_ECDSECTORS_DATA: '/api/nsi/ecdSectors/del',
  MOD_ECDSECTORS_DATA: '/api/nsi/ecdSectors/mod',

  GET_ADJACENTDNCSECTORS_DATA: '/api/nsi/adjacentDNCSectors/data',
  ADD_ADJACENTDNCSECTORS_DATA: '/api/nsi/adjacentDNCSectors/add',
  DEL_ADJACENTDNCSECTORS_DATA: '/api/nsi/adjacentDNCSectors/del',

  GET_ADJACENTECDSECTORS_DATA: '/api/nsi/adjacentECDSectors/data',
  ADD_ADJACENTECDSECTORS_DATA: '/api/nsi/adjacentECDSectors/add',
  DEL_ADJACENTECDSECTORS_DATA: '/api/nsi/adjacentECDSectors/del',

  GET_NEARESTDNCECDSECTORS_DATA: '/api/nsi/nearestDNCandECDSectors/data',
  ADD_NEARESTECDFORDNCSECTORS_DATA: '/api/nsi/nearestDNCandECDSectors/addECDToDNC',
  ADD_NEARESTDNCFORECDSECTORS_DATA: '/api/nsi/nearestDNCandECDSectors/addDNCToECD',
  DEL_NEARESTDNCECDSECTORS_DATA: '/api/nsi/nearestDNCandECDSectors/del',
});

// ----------------------------------------

export const STATION_FIELDS = Object.freeze({
  KEY: 'key',
  ESR_CODE: 'ESRCode',
  NAME: 'name',
  NAME_AND_CODE: 'NameCode',
});

// ----------------------------------------

export const BLOCK_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  STATION1: 'station1',
  STATION2: 'station2',
  STATION1_NAME: 'station1Name',
  STATION2_NAME: 'station2Name',
});

// ----------------------------------------

export const DNCSECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  ADJACENT_DNCSECTORS: 'adjacentSectors',
  NEAREST_ECDSECTORS: 'nearestECDSectors',
});

export const ADJACENT_DNCSECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

export const NEAREST_SECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});

// ----------------------------------------

export const ECDSECTOR_FIELDS = Object.freeze({
  KEY: 'key',
  NAME: 'name',
  ADJACENT_ECDSECTORS: 'adjacentSectors',
  NEAREST_DNCSECTORS: 'nearestDNCSectors',
});

export const ADJACENT_ECDSECTOR_FIELDS = Object.freeze({
  SECTOR_ID: 'sectorId',
});
