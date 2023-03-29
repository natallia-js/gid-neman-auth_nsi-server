const { Router } = require('express');
const mongoose = require('mongoose');
const AppCred = require('../models/AppCred');
const Role = require('../models/Role');
const {
  addCredsGroupValidationRules,
  addCredValidationRules,
  delCredsGroupValidationRules,
  delCredValidationRules,
  modCredsGroupValidationRules,
  modCredValidationRules,
} = require('../validators/appsCreds.validator');
const validate = require('../validators/validate');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS, SUCCESS_MOD_RES, SUCCESS_DEL_MESS, SUCCESS_ADD_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех групп полномочий в приложениях ГИД Неман.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await AppCred.find();
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех групп полномочий в приложениях ГИД Неман',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка аббревиатур всех групп полномочий, их идентификаторов
 * и, для каждой группы, - соответствующего списка полномочий пользователей (id + аббревиатуры полномочий).
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/abbrData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_APPS_CREDS_ABBR_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await AppCred.find({}, { _id: 1, shortTitle: 1, credentials: { _id: 1, englAbbreviation: 1 } });
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех групп полномочий и соответствующих им полномочий пользователей',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление новой группы полномочий пользователей в приложениях ГИД Неман.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 *  _id - идентификатор группы полномочий (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * shortTitle - аббревиатура группы полномочий (обязательна),
 * title - наименование группы полномочий (обязательно),
 * credentials - массив полномочий (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *               каждое полномочие - объект с параметрами:
 *               _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *               englAbbreviation - аббревиатура полномочия (обязательна),
 *               description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_APP_CREDS_GROUP; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addCredsGroupValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { _id, shortTitle, title, credentials } = req.body;

    try {
      // Ищем в БД группу полномочий, shortTitle которой совпадает с переданной пользователем
      const candidate = await AppCred.findOne({ shortTitle });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Группа полномочий с такой аббревиатурой уже существует' });
      }

      // Создаем в БД запись с данными о новой группе полномочий
      let credsGroup;
      if (_id) {
        credsGroup = new AppCred({ _id, shortTitle, title, credentials });
      } else {
        credsGroup = new AppCred({ shortTitle, title, credentials });
      }
      await credsGroup.save();

      res.status(OK).json({ message: SUCCESS_ADD_MESS, credsGroup });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление новой группы полномочий',
        error: error.message,
        actionParams: { _id, shortTitle, title, credentials },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового полномочия в группу полномочий.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 *   credsGroupId - идентификатор группы полномочий (обязателен),
 *   _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *   englAbbreviation - аббревиатура полномочия (обязательна),
 *   description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/addCred',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_APP_CREDENTIAL; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addCredValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { credsGroupId, _id, englAbbreviation, description } = req.body;

    try {
      // Ищем в БД группу полномочий, id которой совпадает с переданной пользователем
      const candidate = await AppCred.findOne({ _id: credsGroupId });

      // Если не находим, то процесс создания полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Не найдена группа для добавляемого полномочия' });
      }

      // Среди полномочий группы ищем такое, englAbbreviation которого совпадает с переданным пользователем
      for (let cred of candidate.credentials) {
        if (cred.englAbbreviation === englAbbreviation) {
          return res.status(ERR).json({ message: 'Полномочие с такой аббревиатурой уже существует в указанной группе' });
        }
      }

      // Создаем в БД запись с данными о новом полномочии
      if (_id) {
        candidate.credentials.push({ _id, englAbbreviation, description });
      } else {
        candidate.credentials.push({ englAbbreviation, description });
      }

      await candidate.save();

      let newRecId;
      if (_id) {
        newRecId = _id;
      } else {
        for (let cred of candidate.credentials) {
          if (cred.englAbbreviation === englAbbreviation) {
            newRecId = cred._id;
            break;
          }
        }
      }

      res.status(OK).json({ message: SUCCESS_ADD_MESS, cred: {
        _id: newRecId,
        englAbbreviation,
        description,
      }});

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового полномочия',
        error: error.message,
        actionParams: { credsGroupId, _id, englAbbreviation, description },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление группы полномочий.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * credsGroupId - идентификатор группы полномочий (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_APP_CREDS_GROUP; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delCredsGroupValidationRules(),
  validate,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { credsGroupId } = req.body;

    try {
      // Удаляем в БД запись
      const delRes = await AppCred.deleteOne({ _id: credsGroupId }, { session });

      let canContinue = true;
      let errMess;
      if (!delRes.deletedCount) {
        canContinue = false;
        errMess = 'Группа полномочий не найдена';
      }

      if (canContinue) {
        // Удалив группу, необходимо удалить все ссылки на нее в коллекции ролей
        await Role.updateMany(
          {},
          { $pull: { appsCreds: { credsGroupId } } },
          { session },
        );

        await session.commitTransaction();

      } else {
        await session.abortTransaction();

        return res.status(ERR).json({ message: errMess });
      }

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление группы полномочий',
        error: error.message,
        actionParams: { credsGroupId },
      });

      try { await session.abortTransaction(); } catch {}

      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на удаление полномочия из группы полномочий.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * credsGroupId - идентификатор группы полномочий (обязателен),
 * credId - идентификатор полномочия (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/delCred',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_APP_CREDENTIAL; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delCredValidationRules(),
  validate,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { credsGroupId, credId } = req.body;

    try {
      // Ищем в БД нужную группу полномочий
      const candidate = await AppCred.findOne({ _id: credsGroupId }).session(session);

      // Если не находим, то процесс удаления полномочия продолжать не можем
      if (!candidate) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанная группа полномочий не существует в базе данных' });
      }

      // Ищем полномочие (по id) и удаляем его
      const prevCredLen = candidate.credentials.length;
      candidate.credentials = candidate.credentials.filter((cred) => String(cred._id) !== String(credId));

      if (prevCredLen === candidate.credentials.length) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное полномочие не существует в указанной группе в базе данных' });
      }

      // By default, `save()` uses the associated session
      await candidate.save();

      // Удалив полномочие, необходимо удалить все ссылки на него в коллекции ролей
      await Role.updateMany(
        { "appsCreds.credsGroupId": credsGroupId },
        { $pull: { "appsCreds.$[].creds": credId } },
        { session },
      );

      await session.commitTransaction();

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление полномочия',
        error: error.message,
        actionParams: { credsGroupId, credId },
      });

      try { await session.abortTransaction(); } catch {}

      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на редактирование информации о группе полномочий.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * credsGroupId - идентификатор группы полномочий (обязателен),
 * shortTitle - аббревиатура группы полномочий (не обязательна),
 * title - наименование группы полномочий (не обязательно),
 * credentials - массив полномочий (не обязателен; если задан и не пуст, то каждое полномочие - объект с параметрами:
 *               _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *               englAbbreviation - аббревиатура полномочия (обязательна),
 *               description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_APP_CREDS_GROUP; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modCredsGroupValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные, которые понадобятся для дополнительных проверок
    // (остальными просто обновим запись в БД, когда все проверки будут пройдены)
    const { credsGroupId, shortTitle } = req.body;

    try {
      // Ищем в БД группу полномочий, id которой совпадает с переданным пользователем
      let candidate = await AppCred.findById(credsGroupId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная группа полномочий не существует в базе данных' });
      }

      // Ищем в БД группу полномочий, shortTitle которой совпадает с переданным пользователем
      if (shortTitle || (shortTitle === '')) {
        const antiCandidate = await AppCred.findOne({ shortTitle });

        // Если находим, то смотрим, та ли это самая группа. Если нет, продолжать не можем.
        if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
          return res.status(ERR).json({ message: 'Группа полнмочий с такой аббревиатурой уже существует' });
        }
      }

      // Редактируем в БД запись
      delete req.body.credsGroupId;
      candidate = Object.assign(candidate, req.body);
      await candidate.save();

      res.status(OK).json({ message: SUCCESS_MOD_RES, appCredsGroup: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о группе полномочий',
        error: error.message,
        actionParams: { credsGroupId, shortTitle },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о конкретном полномочии группы полномочий.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 *   credsGroupId - идентификатор группы полномочий (обязателен),
 *   credId - идентификатор полномочия (обязателен),
 *   englAbbreviation - аббревиатура полномочия (не обязательна),
 *   description - описание полномочия (не обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/modCred',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_APP_CREDENTIAL; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modCredValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { credsGroupId, credId, englAbbreviation, description } = req.body;

    try {
      // Ищем в БД нужную группу полномочий
      const candidate = await AppCred.findOne({ _id: credsGroupId });

      // Если не находим, то процесс редактирования полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная группа полномочий не существует в базе данных' });
      }

      // Среди полномочий группы ищем такое, englAbbreviation которого совпадает с переданным пользователем
      if (englAbbreviation) {
        for (let cred of candidate.credentials) {
          if ((cred.englAbbreviation === englAbbreviation) && (String(cred._id) !== String(credId))) {
            return res.status(ERR).json({ message: 'Полномочие с такой аббревиатурой уже существует в указанной группе' });
          }
        }
      }

      // Ищем полномочие (по id) и редактируем его
      let found = false;
      for (let cred of candidate.credentials) {
        if (String(cred._id) === String(credId)) {
          found = true;

          delete req.body.credsGroupId;
          delete req.body.credId;
          cred = Object.assign(cred, req.body);

          break;
        }
      }

      if (!found) {
        return res.status(ERR).json({ message: 'Указанное полномочие не существует в указанной группе в базе данных' });
      }

      await candidate.save();

      res.status(OK).json({ message: SUCCESS_ADD_MESS,
        cred: {
          _id: credId,
          englAbbreviation,
          description,
        }
      });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о полномочии',
        error: error.message,
        actionParams: { credsGroupId, credId, englAbbreviation, description },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
