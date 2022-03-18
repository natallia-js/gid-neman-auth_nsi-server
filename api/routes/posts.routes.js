const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  addPostValidationRules,
  delPostValidationRules,
  modPostValidationRules,
} = require('../validators/posts.validator');
const validate = require('../validators/validate');
const { TPost } = require('../models/TPost');
const User = require('../models/User');
const mongoose = require('mongoose');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  MOD_POST_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех должностей.
 *
 * Данный запрос доступен любому лицу.
 */
router.get(
  '/data',
  async (_req, res) => {
    try {
      const data = await TPost.findAll({
        raw: true,
        attributes: ['P_ID', 'P_Abbrev', 'P_Title'],
      });
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех должностей',
        error,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление новой должности.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * abbrev - аббревиатура должности (обязательна),
 * title - наименование должности (обязательно)
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_POST_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  addPostValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { abbrev, title } = req.body;

    try {
      // Ищем в БД должность, аббревиатура которой совпадает с переданной пользователем
      const candidate = await TPost.findOne({ where: { P_Abbrev: abbrev } });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Должность с такой аббревиатурой уже существует' });
      }

      // Создаем в БД запись с данными о новой должности
      const post = await TPost.create({ P_Abbrev: abbrev, P_Title: title });

      res.status(OK).json({ message: 'Информация успешно сохранена', post });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление новой должности',
        error,
        actionParams: { abbrev, title },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление должности.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id должности (обязателен),
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_POST_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  delPostValidationRules(),
  validate,
  async (req, res) => {
    // транзакция MS SQL
    const sequelize = req.sequelize;
    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции удаления не определен объект транзакции' });
    }
    const t = await sequelize.transaction();

    // транзакция MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    try {
      // Ищем в БД должность, id которой совпадает с переданным пользователем
      const candidate = await TPost.findOne({
        where: { P_ID: id },
        transaction: t,
      });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанная должность не существует в базе данных' });
      }

      // Удаляем должность в конфигурационной БД
      await TPost.destroy({
        where: { P_ID: id },
        transaction: t,
      });

      // Обнуляем ссылки на удаленную должность у всех пользователей
      await User.updateMany(
        { post: candidate.P_Abbrev },
        { $set: { post: '' } },
        { session },
      );

      await t.commit();
      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление должности',
        error,
        actionParams: { id },
      });
      await t.rollback();
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на редактирование информации о должности.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор должности (обязателен),
 * abbrev - аббревиатура должности (не обязательна),
 * title - наименование должности (не обязательно),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_POST_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  modPostValidationRules(),
  validate,
  async (req, res) => {
    // транзакция MS SQL
    const sequelize = req.sequelize;
    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции редактирования не определен объект транзакции' });
    }
    const t = await sequelize.transaction();

    // транзакция MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { id, abbrev, title } = req.body;

    try {
      // Ищем в БД должность, id которой совпадает с переданным пользователем
      const candidate = await TPost.findOne({
        where: { P_ID: id },
        transaction: t,
      });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанная должность не существует в базе данных' });
      }

      // Если необходимо отредактировать аббревиатуру, то ищем в БД должность, аббревиатура которой совпадает
      // с переданной пользователем
      if (abbrev || (abbrev === '')) {
        const antiCandidate = await TPost.findOne({
          where: { P_Abbrev: abbrev },
          transaction: t,
        });

        // Если находим, то смотрим, та ли это самая должность. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.P_ID !== candidate.P_ID)) {
          await t.rollback();
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Должность с такой аббревиатурой уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('abbrev')) {
        updateFields.P_Abbrev = abbrev;
      }
      if (req.body.hasOwnProperty('title')) {
        updateFields.P_Title = title;
      }

      await TPost.update(updateFields, {
        where: { P_ID: id },
        transaction: t,
      });

      // В коллекции пользователей также редактируем изменившуюся аббревиатуру должности
      if (candidate.P_Abbrev !== abbrev) {
        await User.updateMany(
          { post: candidate.P_Abbrev },
          { $set: { post: abbrev } },
          { session },
        );
      }

      await t.commit();
      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о должности',
        error,
        actionParams: { id, abbrev, title },
      });
      await t.rollback();
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


module.exports = router;
