const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  addStationTrackValidationRules,
  delStationTrackValidationRules,
  modStationTrackValidationRules,
} = require('../validators/stationTracks.validator');
const validate = require('../validators/validate');
const { TStationTrack } = require('../models/TStationTrack');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  SUCCESS_DEL_MESS,
  SUCCESS_MOD_RES,
  SUCCESS_ADD_MESS,
  DATA_TO_DEL_NOT_FOUND,

  MOD_STATION_ACTION,
} = require('../constants');


/**
 * Обработка запроса на добавление нового пути станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationId - id станции,
 * name - наименование пути станции (обязательно),
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
  checkGeneralCredentials,
  // проверка параметров запроса
  addStationTrackValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId, name } = req.body;

    try {
      // Ищем в БД путь заданной станции, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TStationTrack.findOne({
        where: {
          ST_StationId: stationId,
          ST_Name: name,
        },
      });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'У указанной станции уже существует путь с таким наименованием' });
      }

      // Создаем в БД запись с данными о новом пути станции
      const stationTrack = await TStationTrack.create({ ST_Name: name, ST_StationId: stationId });

      // Возвращаю полную информацию о созданном пути станции
      res.status(OK).json({ message: SUCCESS_ADD_MESS, stationTrack });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового пути станции',
        error,
        actionParams: { stationId, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление пути станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id пути станции (обязателен)
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
  checkGeneralCredentials,
  // проверка параметров запроса
  delStationTrackValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    try {
      // Удаляем в БД запись
      const deletedCount = await TStationTrack.destroy({ where: { ST_ID: id } });

      if (!deletedCount) {
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление пути станции',
        error,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о пути станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор пути станции (обязателен),
 * name - наименование пути станции (не обязательно),
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
  checkGeneralCredentials,
  // проверка параметров запроса
  modStationTrackValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, name } = req.body;

    try {
      // Ищем в БД путь станции, id которого совпадает с переданным пользователем
      const candidate = await TStationTrack.findOne({ where: { ST_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный путь станции не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование пути станции, то ищем в БД путь станции, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TStationTrack.findOne({
          where: {
            ST_StationId: candidate.ST_StationId,
            ST_Name: name,
          },
        });

        // Если находим, то смотрим, тот ли это самый путь станции. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.ST_ID !== candidate.ST_ID)) {
          return res.status(ERR).json({ message: 'Путь станции с таким наименованием уже существует' });
        }
      }

      if (req.body.hasOwnProperty('name')) {
        candidate.ST_Name = name;
      }

      await candidate.save();

      // Возвращаю полную информацию об отредактированном пути станции
      res.status(OK).json({ message: SUCCESS_MOD_RES, stationTrack: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о пути станции',
        error,
        actionParams: { id, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
