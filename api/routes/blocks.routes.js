const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addBlockValidationRules,
  delBlockValidationRules,
  modBlockValidationRules,
} = require('../validators/blocks.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TBlock } = require('../models/TBlock');
const { TStation } = require('../models/TStation');

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
  DATA_TO_MOD_NOT_FOUND,

  GET_ALL_BLOCKS_ACTION,
  MOD_BLOCK_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех перегонов, без вложенной информации о станциях.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
 router.get(
  '/shortData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_BLOCKS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TBlock.findAll({
        raw: true,
        attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех перегонов, включая вложенные объекты станций.
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
      creds: [GET_ALL_BLOCKS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TBlock.findAll({
        attributes: ['Bl_ID', 'Bl_Title'],
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
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
 * Обработка запроса на добавление нового перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование перегона (обязательно),
 * station1 - id станции 1 (обязателен),
 * station2 - id станции 2 (обязателен),
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_BLOCK_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addBlockValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { name, station1, station2 } = req.body;

      // Ищем в БД перегон, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TBlock.findOne({ where: { Bl_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Перегон с таким наименованием уже существует' });
      }

      // Ищем в БД перегон, ограниченный указанными в запросе станциями
      antiCandidate = await TBlock.findOne({
        where: {
          [Op.and]: [
            { Bl_StationID1: station1 },
            { Bl_StationID2: station2 },
          ],
        },
      });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Перегон, ограниченный указанными станциями, уже существует' });
      }

      // Ищем станции с указанными в запросе id
      const stationsToBind = await TStation.findAll({
        where: {
          [Op.or]: [
            { St_ID: station1 },
            { St_ID: station2 },
          ],
        },
      });
      if (
        !stationsToBind ||
        (station1 === station2 && stationsToBind.length < 1) ||
        (station1 !== station2 && stationsToBind.length < 2)) {
        return res.status(ERR).json({ message: 'Указанная(-ые) станция(-ии) не существует(-ют) в базе' });
      }

      // Создаем в БД запись с данными о новом перегоне
      const block = await TBlock.create({ Bl_Title: name, Bl_StationID1: station1, Bl_StationID2: station2 });

      // Возвращаю полную информацию о созданном перегоне, включая информацию о его граничных станциях
      const dataToReturn = await TBlock.findOne({
        where: { Bl_ID: block.Bl_ID },
        attributes: ['Bl_ID', 'Bl_Title'],
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }],
      });

      res.status(OK).json({ message: SUCCESS_ADD_MESS, block: dataToReturn });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id перегона (обязателен)
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_BLOCK_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delBlockValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id } = req.body;

      // Удаляем в БД запись
      const deletedCount = await TBlock.destroy({ where: { Bl_ID: id } });

      if (!deletedCount) {
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о перегоне.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор перегона (обязателен),
 * name - наименование перегона (не обязательно),
 * station1 - id станции 1 (не обязателен),
 * station2 - id станции 2 (не обязателен),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_BLOCK_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modBlockValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, name, station1, station2 } = req.body;

      // Ищем в БД перегон, id которого совпадает с переданным пользователем
      const candidate = await TBlock.findOne({ where: { Bl_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный перегон не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование перегона, то ищем в БД перегон, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TBlock.findOne({ where: { Bl_Title: name } });

        // Если находим, то смотрим, тот ли это самый перегон. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.Bl_ID !== candidate.Bl_ID)) {
          return res.status(ERR).json({ message: 'Перегон с таким наименованием уже существует' });
        }
      }

      // Ищем станции с указанными в запросе id
      const conditionArr = [];
      if (station1) {
        conditionArr.push({ St_ID: station1 });
      }
      if (station2) {
        conditionArr.push({ St_ID: station2 });
      }

      if (conditionArr.length) {
        const stationsToBind = await TStation.findAll({
          where: {
            [Op.or]: conditionArr,
          },
        });
        if (
          !stationsToBind ||
          (station1 === station2 && stationsToBind.length < 1) ||
          (station1 !== station2 && stationsToBind.length < conditionArr.length)) {
          return res.status(ERR).json({ message: 'Указанная(-ые) станция(-ии) не существует(-ют) в базе' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('name')) {
        updateFields.Bl_Title = name;
      }
      if (req.body.hasOwnProperty('station1')) {
        updateFields.Bl_StationID1 = station1;
      }
      if (req.body.hasOwnProperty('station2')) {
        updateFields.Bl_StationID2 = station2;
      }

      const updateRes = await TBlock.update(updateFields, {
        where: {
          Bl_ID: id,
        },
      });

      if (!updateRes[0]) {
        return res.status(ERR).json({ message: DATA_TO_MOD_NOT_FOUND });
      }

      // Возвращаю полную информацию о созданном перегоне, включая информацию о его граничных станциях
      const dataToReturn = await TBlock.findOne({
        where: { Bl_ID: id },
        attributes: ['Bl_ID', 'Bl_Title'],
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }],
      });

      res.status(OK).json({ message: SUCCESS_MOD_RES, block: dataToReturn });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
