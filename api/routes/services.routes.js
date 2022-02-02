const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  addServiceValidationRules,
  delServiceValidationRules,
  modServiceValidationRules,
} = require('../validators/services.validator');
const validate = require('../validators/validate');
const { TService } = require('../models/TService');
const User = require('../models/User');
const OrderPattern = require('../models/OrderPattern');
const mongoose = require('mongoose');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_SERVICES_ACTION,
  MOD_SERVICE_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех служб.
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
      creds: [GET_ALL_SERVICES_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (_req, res) => {
    try {
      const data = await TService.findAll({
        raw: true,
        attributes: ['S_ID', 'S_Abbrev', 'S_Title'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление новой службы.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * abbrev - аббревиатура службы (обязательна),
 * title - наименование службы (обязательно)
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_SERVICE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  addServiceValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { abbrev, title } = req.body;

      // Ищем в БД службу, аббревиатура которой совпадает с переданной пользователем
      const candidate = await TService.findOne({ where: { S_Abbrev: abbrev } });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Служба с такой аббревиатурой уже существует' });
      }

      // Создаем в БД запись с данными о новой службе
      const service = await TService.create({ S_Abbrev: abbrev, S_Title: title });

      res.status(OK).json({ message: 'Информация успешно сохранена', service });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление службы.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id службы (обязателен),
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_SERVICE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  delServiceValidationRules(),
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

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id } = req.body;

      // Ищем в БД службу, id которой совпадает с переданным пользователем
      const candidate = await TService.findOne({
        where: { S_ID: id },
        transaction: t,
      });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанная служба не существует в базе данных' });
      }

      // Удаляем службу в конфигурационной БД
      await TService.destroy({
        where: { S_ID: id },
        transaction: t,
      });

      // Обнуляем ссылки на удаленную службу у всех пользователей
      await User.updateMany(
        { service: candidate.S_Abbrev },
        { $set: { service: null } },
        { session },
      );
      // В коллекции шаблонов распоряжений ничего не трогаем: аббревиатура службы остается как есть.
      // Информация о ней исчезнет после удаления всех связанных с нею шаблонов распоряжений.

      await t.commit();
      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      console.log(error);
      await t.rollback();
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на редактирование информации о службе.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор службы (обязателен),
 * abbrev - аббревиатура службы (не обязательна),
 * title - наименование службы (не обязательно),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_SERVICE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  modServiceValidationRules(),
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

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, abbrev, title } = req.body;

      // Ищем в БД службу, id которой совпадает с переданным пользователем
      const candidate = await TService.findOne({
        where: { S_ID: id },
        transaction: t,
      });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанная служба не существует в базе данных' });
      }

      // Если необходимо отредактировать аббревиатуру, то ищем в БД службу, аббревиатура которой совпадает
      // с переданной пользователем
      if (abbrev || (abbrev === '')) {
        const antiCandidate = await TService.findOne({
          where: { S_Abbrev: abbrev },
          transaction: t,
        });

        // Если находим, то смотрим, та ли это самая служба. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.S_ID !== candidate.S_ID)) {
          await t.rollback();
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Служба с такой аббревиатурой уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('abbrev')) {
        updateFields.S_Abbrev = abbrev;
      }
      if (req.body.hasOwnProperty('title')) {
        updateFields.S_Title = title;
      }

      await TService.update(updateFields, {
        where: { S_ID: id },
        transaction: t,
      });

      // Редактируем наименование службы в коллекции шаблонов распоряжений.
      // В коллекции пользователей также редактируем изменившуюся аббревиатуру службы.
      if (candidate.S_Abbrev !== abbrev) {
        await OrderPattern.updateMany(
          { service: candidate.S_Abbrev },
          { $set: { service: abbrev } },
          { session },
        );
        await User.updateMany(
          { service: candidate.S_Abbrev },
          { $set: { service: abbrev } },
          { session },
        );
      }

      await t.commit();
      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      console.log(error);
      await t.rollback();
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


module.exports = router;
