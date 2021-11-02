const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  getDefiniteStationValidationRules,
  getDefiniteStationsValidationRules,
  addStationValidationRules,
  delStationValidationRules,
  modStationValidationRules,
} = require('../validators/stations.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TBlockTrack } = require('../models/TBlockTrack');
const { TStationTrack } = require('../models/TStationTrack');
const { TDNCTrainSectorStation } = require('../models/TDNCTrainSectorStation');
const { TECDTrainSectorStation } = require('../models/TECDTrainSectorStation');
const { TDNCTrainSector } = require('../models/TDNCTrainSector');
const { TECDTrainSector } = require('../models/TECDTrainSector');
const { TDNCSector } = require('../models/TDNCSector');
const { TECDSector } = require('../models/TECDSector');
const { Op } = require('sequelize');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_STATIONS_ACTION,
  MOD_STATION_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех станций со вложенным списком путей.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        }],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение объекта конкретной станции со вложенным списком путей.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationId - id станции (обязателен)
 */
 router.post(
  '/definitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  getDefiniteStationValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { stationId } = req.body;

      const data = await TStation.findOne({
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        where: { St_ID: stationId },
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        }],
      });

/*

      } else {
        // Получаем список станций
        data = await TStation.findAll({
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
          where: { St_ID: stationIds },
          include: [{
            model: TStationTrack,
            attributes: ['ST_ID', 'ST_Name'],
          }],
        }) || [];
        // Получаем информацию по перегонам, в которые входят станции
        const blocks = await TBlock.findAll({
          attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
          where: {
            [Op.or]: [{ Bl_StationID1: stationIds }, { Bl_StationID2: stationIds }],
          },
          include: [{
            model: TStation,
            as: 'station1',
            attributes: ['St_ID', 'St_UNMC', 'St_Title'],
            include: [{
              model: TStationTrack,
              attributes: ['ST_ID', 'ST_Name'],
            }],
          }, {
            model: TStation,
            as: 'station2',
            attributes: ['St_ID', 'St_UNMC', 'St_Title'],
            include: [{
              model: TStationTrack,
              attributes: ['ST_ID', 'ST_Name'],
            }],
          }, {
            model: TBlockTrack,
            attributes: ['BT_ID', 'BT_Name'],
          }],
        });
        // Получаем информацию по поездным и диспетчерским участкам ДНЦ
        const dncTrainSectorsConnections = await TDNCTrainSectorStation.findAll({
          raw: true,
          attributes: ['DNCTSS_TrainSectorID', 'DNCTSS_StationID', 'DNCTSS_StationBelongsToDNCSector'],
          where: { DNCTSS_StationID: stationIds },
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
        // Получаем информацию по поездным и диспетчерским участкам ЭЦД
        const ecdTrainSectorsConnections = await TECDTrainSectorStation.findAll({
          raw: true,
          attributes: ['ECDTSS_TrainSectorID', 'ECDTSS_StationID', 'ECDTSS_StationBelongsToECDSector'],
          where: { ECDTSS_StationID: stationIds },
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
        // Формируем итоговые массивы данных
        data.forEach((station) => {
          station.dataValues.blocks = blocks
            .filter((item) => item.Bl_StationID1 === station.St_ID || item.Bl_StationID2 === station.St_ID);
          station.dataValues.dncTrainSectors = dncTrainSectorsConnections
            .filter((item) => item.DNCTSS_StationID === station.St_ID)
            .map((item) => {
              const dncTrainSector = dncTrainSectors.find((el) => el.DNCTS_ID === item.DNCTSS_TrainSectorID) || {};
              const dncSector = dncSectors.find((el) => el.DNCS_ID === dncTrainSector.DNCTS_DNCSectorID) || {};
              return {
                trainSectorId: dncTrainSector.DNCTS_ID,
                trainSectorTitle: dncTrainSector.DNCTS_Title,
                stationBelongsToTrainSector: item.DNCTSS_StationBelongsToDNCSector,
                dncSectorId: dncSector.DNCS_ID,
                dncSectorTitle: dncSector.DNCS_Title,
              };
            });
          station.dataValues.ecdTrainSectors = ecdTrainSectorsConnections
            .filter((item) => item.ECDTSS_StationID === station.St_ID)
            .map((item) => {
              const ecdTrainSector = ecdTrainSectors.find((el) => el.ECDTS_ID === item.ECDTSS_TrainSectorID) || {};
              const ecdSector = ecdSectors.find((el) => el.ECDS_ID === ecdTrainSector.ECDTS_ECDSectorID) || {};
              return {
                trainSectorId: ecdTrainSector.ECDTS_ID,
                trainSectorTitle: ecdTrainSector.ECDTS_Title,
                stationBelongsToTrainSector: item.ECDTSS_StationBelongsToECDSector,
                ecdSectorId: ecdSector.ECDS_ID,
                ecdSectorTitle: ecdSector.ECDS_Title,
              };
            });
        });
      }*/


      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка станций по заданным id этих станций.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationIds - массив id станций (обязателен)
 */
router.post(
  '/shortDefinitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  getDefiniteStationsValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { stationIds } = req.body;

      const data = await TStation.findAll({
        raw: true,
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        where: { St_ID: stationIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление новой станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * ESRCode - ЕСР-код станции (обязателен),
 * name - наименование станции (обязательно)
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addStationValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { ESRCode, name } = req.body;

      // Ищем в БД станцию, ESRCode которой совпадает с переданным пользователем
      const candidate = await TStation.findOne({ where: { St_UNMC: ESRCode } });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Станция с таким ЕСР-кодом уже существует' });
      }

      // Создаем в БД запись с данными о новой станции
      const station = await TStation.create({ St_UNMC: ESRCode, St_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', station });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id станции (обязателен),
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delStationValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции удаления не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id } = req.body;

      // Перед удалением самой станции необходимо удалить связанные с нею записи в других таблицах
      await TBlock.destroy({
        where: {
          [Op.or]: [
            { Bl_StationID1: id },
            { Bl_StationID2: id },
          ],
        },
        transaction: t,
      });
      await TDNCTrainSectorStation.destroy({ where: { DNCTSS_StationID: id }, transaction: t });
      await TECDTrainSectorStation.destroy({ where: { ECDTSS_StationID: id }, transaction: t });
      await TStationTrack.destroy({ where: { ST_StationId: id, }, transaction: t });
      await TStation.destroy({ where: { St_ID: id }, transaction: t });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      await t.rollback();
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор станции (обязателен),
 * ESRCode - ЕСР-код станции (не обязателен),
 * name - наименование станции (не обязательно),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modStationValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, ESRCode, name } = req.body;

      // Ищем в БД станцию, id которой совпадает с переданным пользователем
      const candidate = await TStation.findOne({ where: { St_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная станция не существует в базе данных' });
      }

      // Если необходимо отредактировать ЕСР-код, то ищем в БД станцию, ESRCode которой совпадает с переданным пользователем
      if (ESRCode || (ESRCode === '')) {
        const antiCandidate = await TStation.findOne({ where: { St_UNMC: ESRCode } });

        // Если находим, то смотрим, та ли это самая станция. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.St_ID !== candidate.St_ID)) {
          return res.status(ERR).json({ message: 'Станция с таким ЕСР-кодом уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('ESRCode')) {
        updateFields.St_UNMC = ESRCode;
      }
      if (req.body.hasOwnProperty('name')) {
        updateFields.St_Title = name;
      }

      await TStation.update(updateFields, {
        where: {
          St_ID: id,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
