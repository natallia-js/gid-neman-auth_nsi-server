const { Router } = require('express');
const crypto = require('crypto');
const {
  getDefiniteDNCSectorValidationRules,
  getDefiniteDNCSectorsValidationRules,
  addDNCSectorValidationRules,
  delDNCSectorValidationRules,
  modDNCSectorValidationRules,
} = require('../validators/dncSectors.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TDNCSector } = require('../models/TDNCSector');
const { TDNCTrainSector } = require('../models/TDNCTrainSector');
const { TDNCTrainSectorStation } = require('../models/TDNCTrainSectorStation');
const { TDNCTrainSectorBlock } = require('../models/TDNCTrainSectorBlock');
const { TStationTrack } = require('../models/TStationTrack');
const { TBlockTrack } = require('../models/TBlockTrack');
const deleteDNCSector = require('../routes/deleteComplexDependencies/deleteDNCSector');
const { addAdminActionInfo, addError } = require('../serverSideProcessing/processLogsActions');
const { userPostFIOString } = require('../routes/additional/getUserTransformedData');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  DATA_TO_DEL_NOT_FOUND,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех участков ДНЦ со вложенными списками поездных участков,
 * которые, в свою очередь, содержат вложенные списки станций и перегонов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_DNC_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    let data;
    try {
      const dncSectors = await TDNCSector.findAll({
        attributes: ['DNCS_ID', 'DNCS_Title', 'DNCS_DESCRIPTION', 'DNCS_PENSI_ID', 'DNCS_PENSI_Code'],
      });
      if (dncSectors) {
        data = dncSectors.map((sector) => ({
          DNCS_ID: sector.dataValues.DNCS_ID,
          DNCS_Title: sector.dataValues.DNCS_Title,
          DNCS_DESCRIPTION: sector.dataValues.DNCS_DESCRIPTION,
          DNCS_PENSI_ID: sector.dataValues.DNCS_PENSI_ID,
          DNCS_PENSI_Code: sector.dataValues.DNCS_PENSI_Code,
          TDNCTrainSectors: [],
        }));
        const trainSectors = await TDNCTrainSector.findAll({
          attributes: ['DNCTS_ID', 'DNCTS_Title', 'DNCTS_DNCSectorID'],
        });
        if (trainSectors) {
          trainSectors.forEach((trainSector) => {
            const dncSector = data.find((sector) => sector.DNCS_ID === trainSector.dataValues.DNCTS_DNCSectorID);
            if (dncSector) {
              dncSector.TDNCTrainSectors.push({
                DNCTS_ID: trainSector.dataValues.DNCTS_ID,
                DNCTS_Title: trainSector.dataValues.DNCTS_Title,
              });
            }
          });
          const trainSectorsIds = trainSectors.map((trainSector) => trainSector.dataValues.DNCTS_ID);
          // ------------- Станции поездных участков ДНЦ -----------------
          const trainSectorsStations = await TDNCTrainSectorStation.findAll({
            attributes: ['DNCTSS_TrainSectorID', 'DNCTSS_StationID', 'DNCTSS_StationPositionInTrainSector', 'DNCTSS_StationBelongsToDNCSector'],
            where: { DNCTSS_TrainSectorID: trainSectorsIds },
          });
          const stationsIds = [...new Set(trainSectorsStations.map((station) => station.dataValues.DNCTSS_StationID))];
          const stations = await TStation.findAll({
            attributes: ['St_ID', 'St_UNMC', 'St_Title'],
            where: { St_ID: stationsIds },
          });
          // ------------- Перегоны поездных участков ДНЦ -----------------
          const trainSectorsBlocks = await TDNCTrainSectorBlock.findAll({
            attributes: ['DNCTSB_TrainSectorID', 'DNCTSB_BlockID', 'DNCTSB_BlockPositionInTrainSector', 'DNCTSB_BlockBelongsToDNCSector'],
            where: { DNCTSB_TrainSectorID: trainSectorsIds },
          });
          const blocksIds = [...new Set(trainSectorsBlocks.map((block) => block.dataValues.DNCTSB_BlockID))];
          const blocks = await TBlock.findAll({
            attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
            where: { Bl_ID: blocksIds },
          });
          // -------------- Сопоставляем станции и перегоны с поездными участками --------------
          data.forEach((dncSector) => {
            dncSector.TDNCTrainSectors.forEach((trainSector) => {
              const trainSectorStationsIds = trainSectorsStations
                .filter((stationInfo) => stationInfo.dataValues.DNCTSS_TrainSectorID === trainSector.DNCTS_ID)
                .map((stationInfo) => stationInfo.dataValues.DNCTSS_StationID);

              trainSector.TStations = stations
                .filter((station) => trainSectorStationsIds.includes(station.dataValues.St_ID))
                .map((station) => {
                  const trainSectorStationInfo = trainSectorsStations
                    .find((el) => el.dataValues.DNCTSS_TrainSectorID === trainSector.DNCTS_ID && el.dataValues.DNCTSS_StationID === station.dataValues.St_ID);
                  return {
                    St_ID: station.dataValues.St_ID,
                    St_UNMC: station.dataValues.St_UNMC,
                    St_Title: station.dataValues.St_Title,
                    TDNCTrainSectorStation: {
                      DNCTSS_StationPositionInTrainSector: trainSectorStationInfo.dataValues.DNCTSS_StationPositionInTrainSector,
                      DNCTSS_StationBelongsToDNCSector: trainSectorStationInfo.dataValues.DNCTSS_StationBelongsToDNCSector,
                    },
                  };
                });

              const trainSectorBlocksIds = trainSectorsBlocks
                .filter((blockInfo) => blockInfo.dataValues.DNCTSB_TrainSectorID === trainSector.DNCTS_ID)
                .map((blockInfo) => blockInfo.dataValues.DNCTSB_BlockID);

              trainSector.TBlocks = blocks
                .filter((block) => trainSectorBlocksIds.includes(block.dataValues.Bl_ID))
                .map((block) => {
                  const trainSectorBlockInfo = trainSectorsBlocks
                    .find((el) => el.dataValues.DNCTSB_TrainSectorID === trainSector.DNCTS_ID && el.dataValues.DNCTSB_BlockID === block.dataValues.Bl_ID);
                  return {
                    Bl_ID: block.dataValues.Bl_ID,
                    Bl_Title: block.dataValues.Bl_Title,
                    Bl_StationID1: block.dataValues.Bl_StationID1,
                    Bl_StationID2: block.dataValues.Bl_StationID2,
                    TDNCTrainSectorBlock: {
                      DNCTSB_BlockPositionInTrainSector: trainSectorBlockInfo.dataValues.DNCTSB_BlockPositionInTrainSector,
                      DNCTSB_BlockBelongsToECDSector: trainSectorBlockInfo.dataValues.DNCTSB_BlockBelongsToDNCSector,
                    },
                  };
                });
            });
          });
        }
      }


      /*const data = await TDNCSector.findAll({
        attributes: ['DNCS_ID', 'DNCS_Title', 'DNCS_DESCRIPTION', 'DNCS_PENSI_ID', 'DNCS_PENSI_Code'],
        include: [
          {
            model: TDNCTrainSector,
            as: 'TDNCTrainSectors',
            attributes: ['DNCTS_ID', 'DNCTS_Title', 'DNCTS_DNCSectorID'],
            include: [
              {
                model: TStation,
                as: 'TStations',
              },
              {
                model: TBlock,
                as: 'TBlocks',
              },
            ],
          },
        ],
      });*/
      //res.status(OK).json(data ? data.map(d => d.dataValues) : []);

      res.status(OK).json(data || []);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех участков ДНЦ',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ДНЦ и только, без вложенных списков поездных участков.
 *
 * Данный запрос доступен любому лицу.
 */
 router.post(
  '/shortData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_DNC_SECTORS_SHORT_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение простого списка всех участков ДНЦ',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ДНЦ (со вложенными списками поездных участков)
 * для заданной станции. Т.е. извлекаются только те участки ДНЦ, в составе поездных участков которых
 * присутствует указанная станция.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationId - id станции (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/shortStationData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATION_DNC_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId } = req.body;

    try {
      const dncTrainSectorsConnections = await TDNCTrainSectorStation.findAll({
        raw: true,
        attributes: ['DNCTSS_TrainSectorID', 'DNCTSS_StationID', 'DNCTSS_StationBelongsToDNCSector'],
        where: { DNCTSS_StationID: stationId },
      }) || [];
      const dncTrainSectors = await TDNCTrainSector.findAll({
        raw: true,
        attributes: ['DNCTS_ID', 'DNCTS_Title', 'DNCTS_DNCSectorID'],
        where: { DNCTS_ID: dncTrainSectorsConnections.map((item) => item.DNCTSS_TrainSectorID) },
      }) || [];
      const dncSectors = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: dncTrainSectors.map((item) => item.DNCTS_DNCSectorID) },
      });

      const data = dncSectors.map((dncSector) => {
        return {
          ...dncSector,
          TTrainSectors: dncTrainSectors
            .filter((item) => item.DNCTS_DNCSectorID === dncSector.DNCS_ID)
            .map((item) => {
              return {
                DNCTS_ID: item.DNCTS_ID,
                DNCTS_Title: item.DNCTS_Title,
                stationBelongsToDNCSector: dncTrainSectorsConnections.find(
                  (el) => el.DNCTSS_TrainSectorID === item.DNCTS_ID).DNCTSS_StationBelongsToDNCSector,
              };
            }),
        };
      });

      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка участков ДНЦ заданной станции',
        error: error.message,
        actionParams: { stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение конкретного участка ДНЦ со вложенными списками поездных участков,
 * которые, в свою очередь, содержат вложенные списки станций и перегонов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - id участка ДНЦ (обязателен),
 * onlyHash - если true, то ожидается, что запрос вернет только хэш-значение информации об участке ДНЦ,
 *   если false, то запрос возвращает всю запрошенную информацию об участке ДНЦ
 *   (параметр не обязателен; если не указан, то запрос возвращает информацию о запрашиваемом участке)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_DNC_SECTOR_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefiniteDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    const { sectorId, onlyHash } = req.body;

    let data;

    try {
      // Ищем участок ДНЦ
      const dncSector = await TDNCSector.findOne({
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: sectorId },
      });

      if (dncSector) {
        data = {
          DNCS_ID: dncSector.dataValues.DNCS_ID,
          DNCS_Title: dncSector.dataValues.DNCS_Title,
        };

        // ------------- Поездные участки участка ДНЦ -----------------

        // Ищем поездные участки участка ДНЦ
        const trainSectors = await TDNCTrainSector.findAll({
          attributes: ['DNCTS_ID', 'DNCTS_Title'],
          where: { DNCTS_DNCSectorID: sectorId },
        });

        if (trainSectors) {
          data.TDNCTrainSectors = trainSectors.map((trainSector) => ({
            DNCTS_ID: trainSector.dataValues.DNCTS_ID,
            DNCTS_Title: trainSector.dataValues.DNCTS_Title,
            TStations: [],
            TBlocks: [],
          }));
          const trainSectorsIds = trainSectors.map((trainSector) => trainSector.dataValues.DNCTS_ID);

          // ------------- Станции поездных участков ДНЦ -----------------

          // Ищем, какие станции входят в поездные участки участка ДНЦ
          const trainSectorsStations = await TDNCTrainSectorStation.findAll({
            attributes: ['DNCTSS_TrainSectorID', 'DNCTSS_StationID', 'DNCTSS_StationPositionInTrainSector', 'DNCTSS_StationBelongsToDNCSector'],
            where: { DNCTSS_TrainSectorID: trainSectorsIds },
          });
          const stationsIds = [...new Set(trainSectorsStations.map((station) => station.dataValues.DNCTSS_StationID))];
          // Ищем станции всех поездных участков ДНЦ
          const stations = await TStation.findAll({
            attributes: ['St_ID', 'St_UNMC', 'St_Title'],
            where: { St_ID: stationsIds },
          });

          // ------------- Пути станций поездных участков ДНЦ -----------------

          const trainSectorsStationsTracks = await TStationTrack.findAll({
            attributes: ['ST_ID', 'ST_Name', 'ST_StationId'],
            where: { ST_StationId: stationsIds },
          });

          stations.forEach((station) => {
            station.dataValues.TStationTracks = trainSectorsStationsTracks
              .filter((track) => track.dataValues.ST_StationId === station.dataValues.St_ID)
              .map((track) => ({
                ST_ID: track.dataValues.ST_ID,
                ST_Name: track.dataValues.ST_Name,
              }));
          });

          // ------------- Перегоны поездных участков ДНЦ -----------------

          // Ищем, какие перегоны входят в поездные участки участка ДНЦ
          const trainSectorsBlocks = await TDNCTrainSectorBlock.findAll({
            attributes: ['DNCTSB_TrainSectorID', 'DNCTSB_BlockID', 'DNCTSB_BlockPositionInTrainSector', 'DNCTSB_BlockBelongsToDNCSector'],
            where: { DNCTSB_TrainSectorID: trainSectorsIds },
          });
          const blocksIds = [...new Set(trainSectorsBlocks.map((block) => block.dataValues.DNCTSB_BlockID))];
          // Ищем перегоны всех поездных участков ДНЦ
          const blocks = await TBlock.findAll({
            attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
            where: { Bl_ID: blocksIds },
          });

          // ------------- Пути перегонов поездных участков ДНЦ -----------------

          const trainSectorsBlocksTracks = await TBlockTrack.findAll({
            attributes: ['BT_ID', 'BT_Name', 'BT_BlockId'],
            where: { BT_BlockId: blocksIds },
          });

          blocks.forEach((block) => {
            block.dataValues.TBlockTracks = trainSectorsBlocksTracks
              .filter((track) => track.dataValues.BT_BlockId === block.dataValues.Bl_ID)
              .map((track) => ({
                BT_ID: track.dataValues.BT_ID,
                BT_Name: track.dataValues.BT_Name,
              }));
          });

          // --- Включаем станции и перегоны в поездные участки ДНЦ выходного массива данных ---

          data.TDNCTrainSectors.forEach((trainSector) => {
            const trainSectorStationsIds = trainSectorsStations
              .filter((stationInfo) => stationInfo.dataValues.DNCTSS_TrainSectorID === trainSector.DNCTS_ID)
              .map((stationInfo) => stationInfo.dataValues.DNCTSS_StationID);

            trainSector.TStations = stations
              .filter((station) => trainSectorStationsIds.includes(station.dataValues.St_ID))
              .map((station) => {
                const trainSectorStationInfo = trainSectorsStations
                  .find((el) => el.dataValues.DNCTSS_TrainSectorID === trainSector.DNCTS_ID && el.dataValues.DNCTSS_StationID === station.dataValues.St_ID);
                return {
                  St_ID: station.dataValues.St_ID,
                  St_UNMC: station.dataValues.St_UNMC,
                  St_Title: station.dataValues.St_Title,
                  TStationTracks: station.dataValues.TStationTracks,
                  TDNCTrainSectorStation: {
                    DNCTSS_StationPositionInTrainSector: trainSectorStationInfo.dataValues.DNCTSS_StationPositionInTrainSector,
                    DNCTSS_StationBelongsToDNCSector: trainSectorStationInfo.dataValues.DNCTSS_StationBelongsToDNCSector,
                  },
                };
              });

            const trainSectorBlocksIds = trainSectorsBlocks
              .filter((blockInfo) => blockInfo.dataValues.DNCTSB_TrainSectorID === trainSector.DNCTS_ID)
              .map((blockInfo) => blockInfo.dataValues.DNCTSB_BlockID);

            trainSector.TBlocks = blocks
              .filter((block) => trainSectorBlocksIds.includes(block.dataValues.Bl_ID))
              .map((block) => {
                const trainSectorBlockInfo = trainSectorsBlocks
                  .find((el) => el.dataValues.DNCTSB_TrainSectorID === trainSector.DNCTS_ID && el.dataValues.DNCTSB_BlockID === block.dataValues.Bl_ID);
                return {
                  Bl_ID: block.dataValues.Bl_ID,
                  Bl_Title: block.dataValues.Bl_Title,
                  Bl_StationID1: block.dataValues.Bl_StationID1,
                  Bl_StationID2: block.dataValues.Bl_StationID2,
                  TBlockTracks: block.dataValues.TBlockTracks,
                  TDNCTrainSectorBlock: {
                    DNCTSB_BlockPositionInTrainSector: trainSectorBlockInfo.dataValues.DNCTSB_BlockPositionInTrainSector,
                    DNCTSB_BlockBelongsToDNCSector: trainSectorBlockInfo.dataValues.DNCTSB_BlockBelongsToDNCSector,
                  },
                };
              });
          });
        }
      }

      /*
      const data = await TDNCSector.findOne({
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: sectorId },
        include: [
          {
            model: TDNCTrainSector,
            as: 'TDNCTrainSectors',
            attributes: ['DNCTS_ID', 'DNCTS_Title'],
            include: [
              {
                model: TStation,
                as: 'TStations',
                attributes: ['St_ID', 'St_UNMC', 'St_Title'],
                include: [
                  // TDNCTrainSectorStation включается в выборку здесь автоматически, ничего писать не
                  // нужно. Если написать, будут ошибки. Это промежуточная таблица в отношении many-to-many
                  {
                    model: TStationTrack,
                    as: 'TStationTracks',
                    attributes: ['ST_ID', 'ST_Name'],
                  },
                ],
              },
              {
                model: TBlock,
                as: 'TBlocks',
                attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
                include: [
                  // TDNCTrainSectorBlock включается в выборку здесь автоматически, ничего писать не
                  // нужно. Если написать, будут ошибки. Это промежуточная таблица в отношении many-to-many
                  {
                    model: TBlockTrack,
                    as: 'TBlockTracks',
                    attributes: ['BT_ID', 'BT_Name'],
                  },
                ],
              },
            ],
          },
        ],
      });*/

      if (onlyHash) {
        const serializedData = JSON.stringify(data);
        data = crypto.createHash('md5').update(serializedData).digest('hex');
      }
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение конкретного участка ДНЦ',
        error: error.message,
        actionParams: { sectorId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка участков ДНЦ и только, без вложенных списков поездных участков,
 * по id этих участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * dncSectorIds - массив id участков ДНЦ (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/shortDefinitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_GIVEN_DNC_SECTORS_SHORT_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefiniteDNCSectorsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { dncSectorIds } = req.body;

    try {
      const data = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: dncSectorIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка конкретных участков ДНЦ',
        error: error.message,
        actionParams: { dncSectorIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование участка ДНЦ (обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_DNC_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { name } = req.body;

    try {
      // Ищем в БД участок ДНЦ, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TDNCSector.findOne({ where: { DNCS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Участок ДНЦ с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом участке ДНЦ
      const sector = await TDNCSector.create({ DNCS_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового участка ДНЦ',
        error: error.message,
        actionParams: { name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id участка (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
  */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_DNC_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции удаления не определен объект транзакции' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    const t = await sequelize.transaction();

    try {
      const deletedCount = await deleteDNCSector(id, t);

      if (!deletedCount) {
        await t.rollback();
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Удаление участка ДНЦ',
        error: error.message,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации об участке ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор участка (обязателен),
 * name - наименование участка (не обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_DNC_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, name } = req.body;

    try {
      // Ищем в БД участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCSector.findOne({ where: { DNCS_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ДНЦ не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование участка, то ищем в БД участок, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TDNCSector.findOne({ where: { DNCS_Title: name } });

        // Если находим, то смотрим, тот ли это самый участок. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.DNCS_ID !== candidate.DNCS_ID)) {
          return res.status(ERR).json({ message: 'Участок ДНЦ с таким наименованием уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('name')) {
        updateFields.DNCS_Title = name;
      }

      await TDNCSector.update(updateFields, {
        where: {
          DNCS_ID: id,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации об участке ДНЦ',
        error: error.message,
        actionParams: { id, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на синхронизацию списка всех участков ДНЦ со списком участков ДНЦ ПЭНСИ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/syncWithPENSI',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.SYNC_DNC_SECTORS_WITH_PENSI; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции синхронизации не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    let dncSectorsDataHTTPRequest = '';

    try {
      const fetch = require('node-fetch');
      const config = require('config');
      const csvToArray = require('../additional/csvToArray');

      const checkStatus = require('../http/checkStatus');
      const { getResponseEncoding } = require('../http/getResponseEncoding');
      const PENSIServerAddress = config.get('PENSI.serverAddress');

      // Из ПЭНСИ получаем следующую информацию по участкам ДНЦ: id (будет передан вне зависимости от его
      // присутствия в запросе), наименование участка, комментарий к записи, код участка ДНЦ.
      // Данные запрашиваем без учета истории их изменения. Т.е. придут только актуальные данные (history=0).
      dncSectorsDataHTTPRequest =
        `http://${PENSIServerAddress}/WEBNSI/download.jsp?tab=NSIVIEW.DISPATCH_REGION&cols=DISP_REG_NAME,DISP_REG_NOTE,DISP_REG_NO&history=0`;

      // Вначале пытаюсь получить данные от ПЭНСИ
      let response = await fetch(dncSectorsDataHTTPRequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);
      const responseEncoding = getResponseEncoding(response);

      // Затем декодирую полученные данные
      let buffer = await response.arrayBuffer();
      const decoder = new TextDecoder(responseEncoding);
      const dncSectorsPENSIString = decoder.decode(buffer); // строка со всеми данными по участкам ДНЦ от ПЭНСИ

      // После этого извлекаю данные по участкам ДНЦ из своей БД
      const localDNCSectorsData = await TDNCSector.findAll({
        attributes: ['DNCS_ID', 'DNCS_Title', 'DNCS_DESCRIPTION', 'DNCS_PENSI_ID', 'DNCS_PENSI_Code'],
        transaction: t,
      });

      // Имея все данные, сравниваю их и вношу необходимые изменения в свою БД

      // Формирую массив подстрок исходной строки данных от ПЭНСИ
      const allRows = dncSectorsPENSIString.split(/\r?\n|\r/);
      // Теперь данные от ПЭНСИ положу в массив для удобства работы с ними
      const pensiDNCSectorsArray = [];
      for (let singleRow = 1; singleRow < allRows.length; singleRow += 1) {
        // Поскольку строка в csv-формате в качестве разделителя имеет ';', а в описании диспетчерских участков
        // встречается этот символ, то код: const rowCells = allRows[singleRow].split(';'); - нельзя использовать
        // для разбиения строки на подстроки, используем специальный код:
        const rowCells = csvToArray(allRows[singleRow]);
        if (rowCells.length < 4) {
          continue;
        }
        pensiDNCSectorsArray.push({
          sectorId: +rowCells[0], // строку с id участка - в числовое значение
          sectorName: rowCells[1].replace(/"/g,''), // из строки '"Наименование"' делаем 'Наименование'
          sectorNote: rowCells[2].replace(/"/g,''), // из строки '"Комментарий"' делаем 'Комментарий'
          sectorCode: +rowCells[3], // строку с кодом участка - в числовое значение
        });
      }

      let syncResults = []; // для возврата запросившему операцию синхронизации (массив строк с результатами)

      // Для каждой записи из ПЭНСИ нахожу соответствующую свою и сравниваю значения их полей.
      // Если не совпадают - меняю. Если совпадения нет - создаю у себя новую запись.
      let correspLocalRecord;
      const modifiedRecs = [];
      const addedRecs = [];
      for (let pensiRecord of pensiDNCSectorsArray) {
        correspLocalRecord = localDNCSectorsData.find((el) => el.DNCS_PENSI_ID === pensiRecord.sectorId);
        if (correspLocalRecord) {
          let needsToBeSaved = false;
          let changedData = `${correspLocalRecord.DNCS_Title}: `;
          if (correspLocalRecord.DNCS_Title !== pensiRecord.sectorName) {
            changedData += `${pensiRecord.sectorName} (ранее ${correspLocalRecord.DNCS_Title});`;
            correspLocalRecord.DNCS_Title = pensiRecord.sectorName;
            needsToBeSaved = true;
          }
          if (correspLocalRecord.DNCS_DESCRIPTION !== pensiRecord.sectorNote) {
            changedData += `${pensiRecord.sectorNote} (ранее ${correspLocalRecord.DNCS_DESCRIPTION});`;
            correspLocalRecord.DNCS_DESCRIPTION = pensiRecord.sectorNote;
            needsToBeSaved = true;
          }
          if (correspLocalRecord.DNCS_PENSI_Code !== pensiRecord.sectorCode) {
            changedData += `${pensiRecord.sectorCode} (ранее ${correspLocalRecord.DNCS_PENSI_Code});`;
            correspLocalRecord.DNCS_PENSI_Code = pensiRecord.sectorCode;
            needsToBeSaved = true;
          }
          if (needsToBeSaved) {
            modifiedRecs.push(changedData);
            correspLocalRecord.save();
          }
        } else {
          await TDNCSector.create({
            DNCS_Title: pensiRecord.sectorName,
            DNCS_DESCRIPTION: pensiRecord.sectorNote,
            DNCS_PENSI_ID: pensiRecord.sectorId,
            DNCS_PENSI_Code: pensiRecord.sectorCode,
          }, { transaction: t });
          addedRecs.push(pensiRecord.sectorName);
        }
      }
      if (modifiedRecs.length > 0) {
        syncResults.push('Отредактирована информация по участкам ДНЦ:', ...modifiedRecs);
      }
      if (addedRecs.length > 0) {
        syncResults.push('Добавлены участки ДНЦ:', ...addedRecs);
      }
      // Осталось отметить те участки ДНЦ в локальной БД, которых не было обнаружено в ПЭНСИ
      const onlyLocalSectors = localDNCSectorsData.filter((el) =>
        !pensiDNCSectorsArray.find((item) => el.DNCS_PENSI_ID === item.sectorId));
      if (onlyLocalSectors.length) {
        syncResults.push('Участки ДНЦ, информация по которым не получена от ПЭНСИ:');
        syncResults.push(onlyLocalSectors.map((sector) => sector.DNCS_Title).join('; '));
      }

      await t.commit();

      syncResults = syncResults.length ? ['Информация успешно синхронизирована', ...syncResults] :
          ['Информация синхронизирована'];
      res.status(OK).json({
        message: syncResults.length > 1 ? 'Информация успешно синхронизирована' : 'Информация синхронизирована',
        syncResults,
      });

      // Логируем действие пользователя
      addAdminActionInfo({
        user: userPostFIOString(req.user),
        actionTime: new Date(),
        action: 'Синхронизация таблицы участков ДНЦ с ПЭНСИ',
        actionParams: { syncResults },
      });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Синхронизация таблицы участков ДНЦ с ПЭНСИ',
        error: error.message,
        actionParams: { dncSectorsDataHTTPRequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
