const { Router } = require('express');
const crypto = require('crypto');
const {
  getDefiniteECDSectorValidationRules,
  getDefiniteECDSectorsValidationRules,
  addECDSectorValidationRules,
  delECDSectorValidationRules,
  modECDSectorValidationRules,
} = require('../validators/ecdSectors.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TECDSector } = require('../models/TECDSector');
const { TECDTrainSector } = require('../models/TECDTrainSector');
const { TECDStructuralDivision } = require('../models/TECDStructuralDivision');
const { TECDTrainSectorStation } = require('../models/TECDTrainSectorStation');
const { TECDTrainSectorBlock } = require('../models/TECDTrainSectorBlock');
const { TStationTrack } = require('../models/TStationTrack');
const { TBlockTrack } = require('../models/TBlockTrack');
const deleteECDSector = require('../routes/deleteComplexDependencies/deleteECDSector');
const { addError } = require('../serverSideProcessing/processLogsActions');
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
 * Обрабатывает запрос на получение списка всех участков ЭЦД со вложенными списками:
 * - поездных участков, которые, в свою очередь, содержат вложенные списки станций и перегонов;
 * - структурных подразделений;
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ECD_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    let data;
    try {
      const ecdSectors = await TECDSector.findAll({
        attributes: ['ECDS_ID', 'ECDS_Title'],
      });
      if (ecdSectors) {
        // ------------- Структурные подразделения участков ЭЦД -----------------
        const ecdSectorsStructuralDivisions = await TECDStructuralDivision.findAll({
          attributes: ['ECDSD_ID', 'ECDSD_Title', 'ECDSD_Post', 'ECDSD_FIO', 'ECDSD_ECDSectorID', 'ECDSD_Position'],
        });
        // ------------- Поездные участки участков ЭЦД -----------------
        const trainSectors = await TECDTrainSector.findAll({
          attributes: ['ECDTS_ID', 'ECDTS_Title', 'ECDTS_ECDSectorID'],
        });
        // ------------- Итоговый массив участков ЭЦД --------------
        data = ecdSectors.map((sector) => ({
          ECDS_ID: sector.dataValues.ECDS_ID,
          ECDS_Title: sector.dataValues.ECDS_Title,
          TECDTrainSectors: !trainSectors ? [] :
            trainSectors
              .filter((trainSector) => trainSector.dataValues.ECDTS_ECDSectorID === sector.dataValues.ECDS_ID)
              .map((trainSector) => ({
                ECDTS_ID: trainSector.dataValues.ECDTS_ID,
                ECDTS_Title: trainSector.dataValues.ECDTS_Title,
              })),
          TECDStructuralDivisions: !ecdSectorsStructuralDivisions ? [] :
            ecdSectorsStructuralDivisions
              .filter((division) => division.dataValues.ECDSD_ECDSectorID === sector.dataValues.ECDS_ID)
              .map((division) => ({
                ECDSD_ID: division.dataValues.ECDSD_ID,
                ECDSD_Title: division.dataValues.ECDSD_Title,
                ECDSD_Post: division.dataValues.ECDSD_Post,
                ECDSD_FIO: division.dataValues.ECDSD_FIO,
                ECDSD_Position: division.dataValues.ECDSD_Position,
              })),
        }));
        if (trainSectors) {
          const trainSectorsIds = trainSectors.map((trainSector) => trainSector.dataValues.ECDTS_ID);
          // ------------- Станции поездных участков ЭЦД -----------------
          const trainSectorsStations = await TECDTrainSectorStation.findAll({
            attributes: ['ECDTSS_TrainSectorID', 'ECDTSS_StationID', 'ECDTSS_StationPositionInTrainSector', 'ECDTSS_StationBelongsToECDSector'],
            where: { ECDTSS_TrainSectorID: trainSectorsIds },
          });
          const stationsIds = [...new Set(trainSectorsStations.map((station) => station.dataValues.ECDTSS_StationID))];
          const stations = await TStation.findAll({
            attributes: ['St_ID', 'St_UNMC', 'St_Title'],
            where: { St_ID: stationsIds },
          });
          // ------------- Перегоны поездных участков ЭЦД -----------------
          const trainSectorsBlocks = await TECDTrainSectorBlock.findAll({
            attributes: ['ECDTSB_TrainSectorID', 'ECDTSB_BlockID', 'ECDTSB_BlockPositionInTrainSector', 'ECDTSB_BlockBelongsToECDSector'],
            where: { ECDTSB_TrainSectorID: trainSectorsIds },
          });
          const blocksIds = [...new Set(trainSectorsBlocks.map((block) => block.dataValues.ECDTSB_BlockID))];
          const blocks = await TBlock.findAll({
            attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
            where: { Bl_ID: blocksIds },
          });
          // -------------- Сопоставляем станции и перегоны с поездными участками --------------
          data.forEach((ecdSector) => {
            ecdSector.TECDTrainSectors.forEach((trainSector) => {
              const trainSectorStationsIds = trainSectorsStations
                .filter((stationInfo) => stationInfo.dataValues.ECDTSS_TrainSectorID === trainSector.ECDTS_ID)
                .map((stationInfo) => stationInfo.dataValues.ECDTSS_StationID);

              trainSector.TStations = stations
                .filter((station) => trainSectorStationsIds.includes(station.dataValues.St_ID))
                .map((station) => {
                  const trainSectorStationInfo = trainSectorsStations
                    .find((el) => el.dataValues.ECDTSS_TrainSectorID === trainSector.ECDTS_ID && el.dataValues.ECDTSS_StationID === station.dataValues.St_ID);
                  return {
                    St_ID: station.dataValues.St_ID,
                    St_UNMC: station.dataValues.St_UNMC,
                    St_Title: station.dataValues.St_Title,
                    TECDTrainSectorStation: {
                      ECDTSS_StationPositionInTrainSector: trainSectorStationInfo.dataValues.ECDTSS_StationPositionInTrainSector,
                      ECDTSS_StationBelongsToECDSector: trainSectorStationInfo.dataValues.ECDTSS_StationBelongsToECDSector,
                    },
                  };
                });

              const trainSectorBlocksIds = trainSectorsBlocks
                .filter((blockInfo) => blockInfo.dataValues.ECDTSB_TrainSectorID === trainSector.ECDTS_ID)
                .map((blockInfo) => blockInfo.dataValues.ECDTSB_BlockID);

              trainSector.TBlocks = blocks
                .filter((block) => trainSectorBlocksIds.includes(block.dataValues.Bl_ID))
                .map((block) => {
                  const trainSectorBlockInfo = trainSectorsBlocks
                    .find((el) => el.dataValues.ECDTSB_TrainSectorID === trainSector.ECDTS_ID && el.dataValues.ECDTSB_BlockID === block.dataValues.Bl_ID);
                  return {
                    Bl_ID: block.dataValues.Bl_ID,
                    Bl_Title: block.dataValues.Bl_Title,
                    Bl_StationID1: block.dataValues.Bl_StationID1,
                    Bl_StationID2: block.dataValues.Bl_StationID2,
                    TECDTrainSectorBlock: {
                      ECDTSB_BlockPositionInTrainSector: trainSectorBlockInfo.dataValues.ECDTSB_BlockPositionInTrainSector,
                      ECDTSB_BlockBelongsToECDSector: trainSectorBlockInfo.dataValues.ECDTSB_BlockBelongsToECDSector,
                    },
                  };
                });
            });
          });
        }
      }

      /*const data = await TECDSector.findAll({
        attributes: ['ECDS_ID', 'ECDS_Title'],
        include: [
          {
            model: TECDTrainSector,
            as: 'TECDTrainSectors',
            attributes: ['ECDTS_ID', 'ECDTS_Title', 'ECDTS_ECDSectorID'],
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
          {
            model: TECDStructuralDivision,
            as: 'TECDStructuralDivisions',
            attributes: ['ECDSD_ID', 'ECDSD_Title', 'ECDSD_Post', 'ECDSD_FIO', 'ECDSD_ECDSectorID'],
          },
        ],
      });
      res.status(OK).json(data.map(d => d.dataValues));*/

      res.status(OK).json(data || []);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение полного списка всех участков ЭЦД',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ЭЦД и только, без вложенных списков поездных участков.
 *
 * Данный запрос доступен любому лицу.
 */
 router.post(
  '/shortData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ECD_SECTORS_SHORT_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TECDSector.findAll({
        raw: true,
        attributes: ['ECDS_ID', 'ECDS_Title'],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение краткого списка всех участков ЭЦД',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ЭЦД (со вложенными списками поездных участков)
 * для заданной станции. Т.е. извлекаются только те участки ЭЦД, в составе поездных участков которых
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
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATION_ECD_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId } = req.body;

    try {
      const ecdTrainSectorsConnections = await TECDTrainSectorStation.findAll({
        raw: true,
        attributes: ['ECDTSS_TrainSectorID', 'ECDTSS_StationID', 'ECDTSS_StationBelongsToECDSector'],
        where: { ECDTSS_StationID: stationId },
      }) || [];
      const ecdTrainSectors = await TECDTrainSector.findAll({
        raw: true,
        attributes: ['ECDTS_ID', 'ECDTS_Title', 'ECDTS_ECDSectorID'],
        where: { ECDTS_ID: ecdTrainSectorsConnections.map((item) => item.ECDTSS_TrainSectorID) },
      }) || [];
      const ecdSectors = await TECDSector.findAll({
        raw: true,
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: ecdTrainSectors.map((item) => item.ECDTS_ECDSectorID) },
      });

      const data = ecdSectors.map((ecdSector) => {
        return {
          ...ecdSector,
          TTrainSectors: ecdTrainSectors
            .filter((item) => item.ECDTS_ECDSectorID === ecdSector.ECDS_ID)
            .map((item) => {
              return {
                ECDTS_ID: item.ECDTS_ID,
                ECDTS_Title: item.ECDTS_Title,
                stationBelongsToECDSector: ecdTrainSectorsConnections.find(
                  (el) => el.ECDTSS_TrainSectorID === item.ECDTS_ID).ECDTSS_StationBelongsToECDSector,
              };
            }),
        };
      });

      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех участков ЭЦД для заданной станции',
        error: error.message,
        actionParams: { stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение конкретного участка ЭЦД со вложенными списками:
 * - поездных участков, которые, в свою очередь, содержат вложенные списки станций и перегонов;
 * - структурных подразделений;
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - id участка ЭЦД (обязателен),
 * onlyHash - если true, то ожидается, что запрос вернет только хэш-значение информации об участке ЭЦД,
 *   если false, то запрос возвращает всю запрошенную информацию об участке ЭЦД
 *   (параметр не обязателен; если не указан, то запрос возвращает информацию о запрашиваемом участке)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ECD_SECTOR_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefiniteECDSectorValidationRules(),
  validate,
  async (req, res) => {
    const { sectorId, onlyHash } = req.body;

    let data;

    try {
      // Ищем участок ЭЦД
      const ecdSector = await TECDSector.findOne({
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: sectorId },
      });

      if (ecdSector) {
        data = {
          ECDS_ID: ecdSector.dataValues.ECDS_ID,
          ECDS_Title: ecdSector.dataValues.ECDS_Title,
          TECDStructuralDivisions: [],
        };

        // ------------- Структурные подразделения участка ЭЦД -----------------

        const ecdSectorStructuralDivisions = await TECDStructuralDivision.findAll({
          attributes: ['ECDSD_ID', 'ECDSD_Title', 'ECDSD_Post', 'ECDSD_FIO', 'ECDSD_Position'],
          where: { ECDSD_ECDSectorID: sectorId },
        });

        if (ecdSectorStructuralDivisions) {
          data.TECDStructuralDivisions = ecdSectorStructuralDivisions.map((division) => ({
            ECDSD_ID: division.dataValues.ECDSD_ID,
            ECDSD_Title: division.dataValues.ECDSD_Title,
            ECDSD_Post: division.dataValues.ECDSD_Post,
            ECDSD_FIO: division.dataValues.ECDSD_FIO,
            ECDSD_Position: division.dataValues.ECDSD_Position,
          }));
        }

        // ------------- Поездные участки участка ЭЦД -----------------

        // Ищем поездные участки участка ЭЦД
        const trainSectors = await TECDTrainSector.findAll({
          attributes: ['ECDTS_ID', 'ECDTS_Title'],
          where: { ECDTS_ECDSectorID: sectorId },
        });

        if (trainSectors) {
          data.TECDTrainSectors = trainSectors.map((trainSector) => ({
            ECDTS_ID: trainSector.dataValues.ECDTS_ID,
            ECDTS_Title: trainSector.dataValues.ECDTS_Title,
            TStations: [],
            TBlocks: [],
          }));
          const trainSectorsIds = trainSectors.map((trainSector) => trainSector.dataValues.ECDTS_ID);

          // ------------- Станции поездных участков ЭЦД -----------------

          // Ищем, какие станции входят в поездные участки участка ЭЦД
          const trainSectorsStations = await TECDTrainSectorStation.findAll({
            attributes: ['ECDTSS_TrainSectorID', 'ECDTSS_StationID', 'ECDTSS_StationPositionInTrainSector', 'ECDTSS_StationBelongsToECDSector'],
            where: { ECDTSS_TrainSectorID: trainSectorsIds },
          });
          const stationsIds = [...new Set(trainSectorsStations.map((station) => station.dataValues.ECDTSS_StationID))];
          // Ищем станции всех поездных участков ЭЦД
          const stations = await TStation.findAll({
            attributes: ['St_ID', 'St_UNMC', 'St_Title'],
            where: { St_ID: stationsIds },
          });

          // ------------- Пути станций поездных участков ЭЦД -----------------

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

          // ------------- Перегоны поездных участков ЭЦД -----------------

          // Ищем, какие перегоны входят в поездные участки участка ЭЦД
          const trainSectorsBlocks = await TECDTrainSectorBlock.findAll({
            attributes: ['ECDTSB_TrainSectorID', 'ECDTSB_BlockID', 'ECDTSB_BlockPositionInTrainSector', 'ECDTSB_BlockBelongsToECDSector'],
            where: { ECDTSB_TrainSectorID: trainSectorsIds },
          });
          const blocksIds = [...new Set(trainSectorsBlocks.map((block) => block.dataValues.ECDTSB_BlockID))];
          // Ищем перегоны всех поездных участков ЭЦД
          const blocks = await TBlock.findAll({
            attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
            where: { Bl_ID: blocksIds },
          });

          // ------------- Пути перегонов поездных участков ЭЦД -----------------

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

          // --- Включаем станции и перегоны в поездные участки ЭЦД выходного массива данных ---

          data.TECDTrainSectors.forEach((trainSector) => {
            const trainSectorStationsIds = trainSectorsStations
              .filter((stationInfo) => stationInfo.dataValues.ECDTSS_TrainSectorID === trainSector.ECDTS_ID)
              .map((stationInfo) => stationInfo.dataValues.ECDTSS_StationID);

            trainSector.TStations = stations
              .filter((station) => trainSectorStationsIds.includes(station.dataValues.St_ID))
              .map((station) => {
                const trainSectorStationInfo = trainSectorsStations
                  .find((el) => el.dataValues.ECDTSS_TrainSectorID === trainSector.ECDTS_ID && el.dataValues.ECDTSS_StationID === station.dataValues.St_ID);
                return {
                  St_ID: station.dataValues.St_ID,
                  St_UNMC: station.dataValues.St_UNMC,
                  St_Title: station.dataValues.St_Title,
                  TStationTracks: station.dataValues.TStationTracks,
                  TECDTrainSectorStation: {
                    ECDTSS_StationPositionInTrainSector: trainSectorStationInfo.dataValues.ECDTSS_StationPositionInTrainSector,
                    ECDTSS_StationBelongsToECDSector: trainSectorStationInfo.dataValues.ECDTSS_StationBelongsToECDSector,
                  },
                };
              });

            const trainSectorBlocksIds = trainSectorsBlocks
              .filter((blockInfo) => blockInfo.dataValues.ECDTSB_TrainSectorID === trainSector.ECDTS_ID)
              .map((blockInfo) => blockInfo.dataValues.ECDTSB_BlockID);

            trainSector.TBlocks = blocks
              .filter((block) => trainSectorBlocksIds.includes(block.dataValues.Bl_ID))
              .map((block) => {
                const trainSectorBlockInfo = trainSectorsBlocks
                  .find((el) => el.dataValues.ECDTSB_TrainSectorID === trainSector.ECDTS_ID && el.dataValues.ECDTSB_BlockID === block.dataValues.Bl_ID);
                return {
                  Bl_ID: block.dataValues.Bl_ID,
                  Bl_Title: block.dataValues.Bl_Title,
                  Bl_StationID1: block.dataValues.Bl_StationID1,
                  Bl_StationID2: block.dataValues.Bl_StationID2,
                  TBlockTracks: block.dataValues.TBlockTracks,
                  TECDTrainSectorBlock: {
                    ECDTSB_BlockPositionInTrainSector: trainSectorBlockInfo.dataValues.ECDTSB_BlockPositionInTrainSector,
                    ECDTSB_BlockBelongsToECDSector: trainSectorBlockInfo.dataValues.ECDTSB_BlockBelongsToECDSector,
                  },
                };
              });
          });
        }
      }

      /*
      // Этот код ну очень медленно работает, вылелает даже иногда ошибка о нехватке памяти

      const data = await TECDSector.findOne({
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: sectorId },
        include: [
          {
            model: TECDTrainSector,
            as: 'TECDTrainSectors',
            attributes: ['ECDTS_ID', 'ECDTS_Title'],
            include: [
              {
                model: TStation,
                as: 'TStations',
                attributes: ['St_ID', 'St_UNMC', 'St_Title'],
                include: [
                  // TECDTrainSectorStation включается в выборку здесь автоматически, ничего писать не
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
                  // TECDTrainSectorBlock включается в выборку здесь автоматически, ничего писать не
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
          {
            model: TECDStructuralDivision,
            as: 'TECDStructuralDivisions',
            attributes: ['ECDSD_ID', 'ECDSD_Title', 'ECDSD_Post', 'ECDSD_FIO'],
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
        action: 'Получение полной информации по конкретному участку ЭЦД',
        error: error.message,
        actionParams: { sectorId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка участков ЭЦД (по id этих участков) и только,
 * без вложенных списков поездных участков и структурных подразделений.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * ecdSectorIds - массив id участков ЭЦД (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/shortDefinitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_GIVEN_ECD_SECTORS_SHORT_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefiniteECDSectorsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { ecdSectorIds } = req.body;

    try {
      const data = await TECDSector.findAll({
        raw: true,
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: ecdSectorIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение краткой информации по конкретным участкам ЭЦД',
        error: error.message,
        actionParams: { ecdSectorIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование участка ЭЦД (обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ECD_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addECDSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { name } = req.body;

    try {
      // Ищем в БД участок ЭЦД, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TECDSector.findOne({ where: { ECDS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Участок ЭЦД с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом участке ЭЦД
      const sector = await TECDSector.create({ ECDS_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового участка ЭЦД',
        error: error.message,
        actionParams: { name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление участка ЭЦД.
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
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ECD_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delECDSectorValidationRules(),
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
      const deletedCount = await deleteECDSector(id, t);

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
        action: 'Удаление участка ЭЦД',
        error: error.message,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации об участке ЭЦД.
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
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ECD_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modECDSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, name } = req.body;

    try {
      // Ищем в БД участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDSector.findOne({ where: { ECDS_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ЭЦД не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование участка, то ищем в БД участок, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TECDSector.findOne({ where: { ECDS_Title: name } });

        // Если находим, то смотрим, тот ли это самый участок. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.ECDS_ID !== candidate.ECDS_ID)) {
          return res.status(ERR).json({ message: 'Участок ЭЦД с таким наименованием уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('name')) {
        updateFields.ECDS_Title = name;
      }

      await TECDSector.update(updateFields, {
        where: {
          ECDS_ID: id
        }
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации по участку ЭЦД',
        error: error.message,
        actionParams: { id, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
