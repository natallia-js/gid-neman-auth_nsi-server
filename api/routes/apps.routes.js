const { Router } = require('express');
const mongoose = require('mongoose');
const App = require('../models/App');
const Role = require('../models/Role');
const {
  addAppValidationRules,
  addCredValidationRules,
  delAppValidationRules,
  delCredValidationRules,
  modAppValidationRules,
  modCredValidationRules,
} = require('../validators/apps.validator');
const validate = require('../validators/validate');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех приложений.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 * 
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_APPS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await App.find();
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех приложений',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка аббревиатур всех приложений, их идентификаторов
 * и, для каждого приложения, - соответствующего списка полномочий пользователей
 * (id + аббревиатуры полномочий).
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 * 
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/abbrData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_APPS_ABBR_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await App.find({}, { _id: 1, shortTitle: 1, credentials: { _id: 1, englAbbreviation: 1 } });
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех приложений и соответствующих им полномочий пользователей',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 *  _id - идентификатор приложения (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * shortTitle - аббревиатура приложения (обязательна),
 * title - наименование приложения (обязательно),
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
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_APP; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addAppValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { _id, shortTitle, title, credentials } = req.body;

    try {
      // Ищем в БД приложение, shortTitle которого совпадает с переданным пользователем
      const candidate = await App.findOne({ shortTitle });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Приложение с такой аббревиатурой уже существует' });
      }

      // Создаем в БД запись с данными о новом приложении
      let app;
      if (_id) {
        app = new App({ _id, shortTitle, title, credentials });
      } else {
        app = new App({ shortTitle, title, credentials });
      }
      await app.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', app });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового приложения',
        error: error.message,
        actionParams: { _id, shortTitle, title, credentials },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового полномочия приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 *   appId - идентификатор приложения (обязателен),
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
    const { appId, _id, englAbbreviation, description } = req.body;

    try {
      // Ищем в БД приложение, id которого совпадает с переданным пользователем
      const candidate = await App.findOne({ _id: appId });

      // Если не находим, то процесс создания полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Не найдено приложение для добавляемого полномочия' });
      }

      // Среди полномочий приложения ищем такое, englAbbreviation которого совпадает с переданным пользователем
      for (let cred of candidate.credentials) {
        if (cred.englAbbreviation === englAbbreviation) {
          return res.status(ERR).json({ message: 'Полномочие с такой аббревиатурой уже определено для данного приложения' });
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

      res.status(OK).json({ message: 'Информация успешно сохранена', cred: {
        _id: newRecId,
        englAbbreviation,
        description,
      }});

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового полномочия приложения',
        error: error.message,
        actionParams: { appId, _id, englAbbreviation, description },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_APP; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delAppValidationRules(),
  validate,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { appId } = req.body;

    try {
      // Удаляем в БД запись
      const delRes = await App.deleteOne({ _id: appId }).session(session);

      let canContinue = true;
      let errMess;
      if (!delRes.deletedCount) {
        canContinue = false;
        errMess = 'Приложение не найдено';
      }

      if (canContinue) {
        // Удалив приложение, необходимо удалить все ссылки на него в коллекции ролей
        await Role.updateMany(
          {},
          { $pull: { apps: { appId } } },
          { session },
        );

        await session.commitTransaction();

      } else {
        await session.abortTransaction();

        return res.status(ERR).json({ message: errMess });
      }

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление приложения',
        error: error.message,
        actionParams: { appId },
      });

      await session.abortTransaction();

      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на удаление полномочия приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
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
    const { appId, credId } = req.body;

    try {
      // Ищем в БД нужное приложение
      const candidate = await App.findOne({ _id: appId }).session(session);

      // Если не находим, то процесс удаления полномочия продолжать не можем
      if (!candidate) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное приложение не существует в базе данных' });
      }

      // Ищем полномочие (по id) и удаляем его
      const prevCredLen = candidate.credentials.length;
      candidate.credentials = candidate.credentials.filter((cred) => String(cred._id) !== String(credId));

      if (prevCredLen === candidate.credentials.length) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное полномочие не определено для данного приложения в базе данных' });
      }

      // By default, `save()` uses the associated session
      await candidate.save();

      // Удалив полномочие, необходимо удалить все ссылки на него в коллекции ролей
      await Role.updateMany(
        { "apps.appId": appId },
        { $pull: { "apps.$[].creds": credId } },
        { session },
      );

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление полномочия приложения',
        error: error.message,
        actionParams: { appId, credId },
      });

      await session.abortTransaction();

      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на редактирование информации о приложении.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * shortTitle - аббревиатура приложения (не обязательна),
 * title - наименование приложения (не обязательно),
 * credentials - массив полномочий (не обязателен; если задан и не пуст, то каждое полномочие - объект с параметрами:
 *               _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *               englAbbreviation - аббревиатура полномочия (обязательна),
 *               description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_APP; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modAppValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные, которые понадобятся для дополнительных проверок
    // (остальными просто обновим запись в БД, когда все проверки будут пройдены)
    const { appId, shortTitle } = req.body;

    try {
      // Ищем в БД приложение, id которого совпадает с переданным пользователем
      let candidate = await App.findById(appId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанное приложение не существует в базе данных' });
      }

      // Ищем в БД приложение, shortTitle которого совпадает с переданным пользователем
      if (shortTitle || (shortTitle === '')) {
        const antiCandidate = await App.findOne({ shortTitle });

        // Если находим, то смотрим, то ли это самое приложение. Если нет, продолжать не можем.
        if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
          return res.status(ERR).json({ message: 'Приложение с такой аббревиатурой уже существует' });
        }
      }

      // Редактируем в БД запись
      delete req.body.appId;
      candidate = Object.assign(candidate, req.body);
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', app: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о приложении',
        error: error.message,
        actionParams: { appId, shortTitle },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о полномочии приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 *   appId - идентификатор приложения (обязателен),
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
    const { appId, credId, englAbbreviation, description } = req.body;

    try {
      // Ищем в БД нужное приложение
      const candidate = await App.findOne({ _id: appId });

      // Если не находим, то процесс редактирования полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанное приложение не существует в базе данных' });
      }

      // Среди полномочий приложения ищем такое, englAbbreviation которого совпадает с переданным пользователем
      if (englAbbreviation) {
        for (let cred of candidate.credentials) {
          if ((cred.englAbbreviation === englAbbreviation) && (String(cred._id) !== String(credId))) {
            return res.status(ERR).json({ message: 'Полномочие с такой аббревиатурой уже определено для данного приложения' });
          }
        }
      }

      // Ищем полномочие (по id) и редактируем его
      let found = false;
      for (let cred of candidate.credentials) {
        if (String(cred._id) === String(credId)) {
          found = true;

          delete req.body.appId;
          delete req.body.credId;
          cred = Object.assign(cred, req.body);

          break;
        }
      }

      if (!found) {
        return res.status(ERR).json({ message: 'Указанное полномочие не существует для данного приожения в базе данных' });
      }

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена',
        cred: {
          _id: credId,
          englAbbreviation,
          description,
        }
      });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о полномочии приложения',
        error: error.message,
        actionParams: { appId, credId, englAbbreviation, description },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
