const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const {
  addBlockTrackValidationRules,
  delBlockTrackValidationRules,
  modBlockTrackValidationRules,
} = require('../validators/blockTracks.validator');
const validate = require('../validators/validate');
const { TBlockTrack } = require('../models/TBlockTrack');
const { addError } = require('../serverSideProcessing/processLogsActions');
const { AUTH_NSI_ACTIONS, hasUserRightToPerformAction } = require('../middleware/hasUserRightToPerformAction.middleware');

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
} = require('../constants');


/**
 * Обработка запроса на добавление нового пути перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * blockId - id перегона,
 * name - наименование пути перегона (обязательно),
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_BLOCK_TRACK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addBlockTrackValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { blockId, name } = req.body;

    try {
      // Ищем в БД путь заданного перегона, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TBlockTrack.findOne({
        where: {
          BT_BlockId: blockId,
          BT_Name: name,
        },
      });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'У указанного перегона уже существует путь с таким наименованием' });
      }

      // Создаем в БД запись с данными о новом пути перегона
      const blockTrack = await TBlockTrack.create({ BT_Name: name, BT_BlockId: blockId });

      // Возвращаю полную информацию о созданном пути перегона
      res.status(OK).json({ message: SUCCESS_ADD_MESS, blockTrack });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового пути перегона',
        error,
        actionParams: { blockId, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление пути перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id пути перегона (обязателен)
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_BLOCK_TRACK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delBlockTrackValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    try {
      // Удаляем в БД запись
      const deletedCount = await TBlockTrack.destroy({ where: { BT_ID: id } });

      if (!deletedCount) {
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление пути перегона',
        error,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о пути перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор пути перегона (обязателен),
 * name - наименование пути перегона (не обязательно),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_BLOCK_TRACK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modBlockTrackValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, name } = req.body;

    try {
      // Ищем в БД путь перегона, id которого совпадает с переданным пользователем
      const candidate = await TBlockTrack.findOne({ where: { BT_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный путь перегона не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование пути перегона, то ищем в БД путь перегона, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TBlockTrack.findOne({
          where: {
            BT_BlockId: candidate.BT_BlockId,
            BT_Name: name,
          },
        });

        // Если находим, то смотрим, тот ли это самый путь перегона. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.BT_ID !== candidate.BT_ID)) {
          return res.status(ERR).json({ message: 'Путь перегона с таким наименованием уже существует' });
        }
      }

      if (req.body.hasOwnProperty('name')) {
        candidate.BT_Name = name;
      }

      await candidate.save();

      // Возвращаю полную информацию о созданном пути перегона
      res.status(OK).json({ message: SUCCESS_MOD_RES, blockTrack: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о пути перегона',
        error,
        actionParams: { id, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
