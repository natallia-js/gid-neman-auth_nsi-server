const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addStationValidationRules,
  delStationValidationRules,
  modStationValidationRules,
} = require('../validators/stations.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TDNCTrainSectorStation } = require('../models/TDNCTrainSectorStation');
const { TECDTrainSectorStation } = require('../models/TECDTrainSectorStation');
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
 * Обрабатывает запрос на получение списка всех станций.
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
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
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

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
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
      await TBlock.destroy(
        {
          where: {
            [Op.or]: [
              { Bl_StationID1: id },
              { Bl_StationID2: id },
            ],
          },
          transaction: t,
        },
      );
      await TDNCTrainSectorStation.destroy({ where: { DNCTSS_StationID: id }, transaction: t });
      await TECDTrainSectorStation.destroy({ where: { ECDTSS_StationID: id }, transaction: t });
      await TStation.destroy({ where: { St_ID: id }, transaction: t });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      await t.rollback();
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
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

      if (ESRCode || (ESRCode === '')) {
        updateFields.St_UNMC = ESRCode;
      }
      if (name || (name === '')) {
        updateFields.St_Title = name;
      }

      await TStation.update(updateFields, {
        where: {
          St_ID: id
        }
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


module.exports = router;
