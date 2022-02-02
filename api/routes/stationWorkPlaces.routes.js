const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  addStationWorkPlaceValidationRules,
  delStationWorkPlaceValidationRules,
  modStationWorkPlaceValidationRules,
} = require('../validators/stationWorkPlaces.validator');
const validate = require('../validators/validate');
const { TStationWorkPlace } = require('../models/TStationWorkPlace');
const { TStationWorkPoligon } = require('../models/TStationWorkPoligon');

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
 * Обработка запроса на добавление нового рабочего места на станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationId - id станции,
 * name - наименование рабочего места на станции (обязательно),
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
  addStationWorkPlaceValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { stationId, name } = req.body;

      // Ищем в БД рабочее место заданной станции, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TStationWorkPlace.findOne({
        where: {
          SWP_StationId: stationId,
          SWP_Name: name,
        },
      });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'У указанной станции уже существует рабочее место с таким наименованием' });
      }

      // Создаем в БД запись с данными о новом рабочем месте на станции
      const stationWorkPlace = await TStationWorkPlace.create({ SWP_Name: name, SWP_StationId: stationId });

      // Возвращаю полную информацию о созданном рабочем месте на станции
      res.status(OK).json({ message: SUCCESS_ADD_MESS, stationWorkPlace });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление рабочего места на станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id рабочего места на станции (обязателен)
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
  delStationWorkPlaceValidationRules(),
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
      // Вначале удаляем связанные записи в таблице рабочих полигонов
      await TStationWorkPoligon.destroy({ where: { SWP_StWP_ID: id }, transaction: t });

      // Удаляем в БД запись о рабочем месте на станции
      const deletedCount = await TStationWorkPlace.destroy({ where: { SWP_ID: id }, transaction: t });

      if (!deletedCount) {
        await t.rollback();
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      await t.commit();

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      await t.rollback();
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о рабочем месте на станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор рабочего места на станции (обязателен),
 * name - наименование рабочего места на станции (не обязательно),
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
  modStationWorkPlaceValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, name } = req.body;

      // Ищем в БД рабочее место на станции, id которого совпадает с переданным пользователем
      const candidate = await TStationWorkPlace.findOne({ where: { SWP_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанное рабочее место на станции не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование рабочего места на станции, то ищем в БД
      // рабочее место станции, наименование которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TStationWorkPlace.findOne({
          where: {
            SWP_StationId: candidate.SWP_StationId,
            SWP_Name: name,
          },
        });

        // Если находим, то смотрим, то ли это самое рабочее место на станции. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.SWP_ID !== candidate.SWP_ID)) {
          return res.status(ERR).json({ message: 'Рабочее место на станции с таким наименованием уже существует' });
        }
      }

      if (req.body.hasOwnProperty('name')) {
        candidate.SWP_Name = name;
      }

      await candidate.save();

      // Возвращаю полную информацию об отредактированном рабочем месте на станции
      res.status(OK).json({ message: SUCCESS_MOD_RES, stationWorkPlace: candidate });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
