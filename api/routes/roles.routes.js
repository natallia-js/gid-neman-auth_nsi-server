const { Router } = require('express');
const mongoose = require('mongoose');
const Role = require('../models/Role');
const AppCred = require('../models/AppCred');
const User = require('../models/User');
const {
  addRoleValidationRules,
  addCredValidationRules,
  changeCredsValidationRules,
  delRoleValidationRules,
  modRoleValidationRules,
} = require('../validators/roles.validator');
const validate = require('../validators/validate');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');
const { isMainAdmin } = require('../middleware/checkMainAdmin');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех ролей.
 *
 * Данный запрос доступен любому лицу.
 */
 router.post(
  '/allData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ROLES; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await Role.find({}, { _id: 1, englAbbreviation: 1, description: 1 });
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех ролей',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех ролей.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список всех ролей,
 * а иное лицо получит полный список тех ролей, которые ему разрешил
 * использовать главный администратор ГИД Неман.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ALLOWED_ROLES; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    try {
      let data;
      if (!isMainAdmin(req)) {
        // Ищем роли, которые разрешил использовать главный администратор ГИД Неман
        data = await Role.find({ subAdminCanUse: true });
      } else {
        // Извлекаем информацию обо всех ролях
        data = await Role.find();
      }
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех ролей',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка аббревиатур всех ролей с их идентификаторами.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список аббревиатур ролей,
 * а иное лицо получит полный список аббревиатур тех ролей, которые ему разрешил
 * использовать главный администратор ГИД Неман.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/abbrs',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ROLES_ABBRS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    try {
      let data;
      if (!isMainAdmin(req)) {
        // Ищем роли, которые разрешил использовать главный администратор ГИД Неман
        data = await Role.find({ subAdminCanUse: true }, { _id: 1, englAbbreviation: 1 });
      } else {
        // Извлекаем информацию обо всех ролях
        data = await Role.find({}, { _id: 1, englAbbreviation: 1 });
      }
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка аббревиатур всех ролей с их идентификаторами',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Проверяет наличие в БД объекта группы полномочий в приложениях ГИД Неман по его id и, если заданы,
 * соответствующих полномочий по их id.
 *
 * @param {Object} group - объект с полями groupId (id группы), creds (массив
 *                         идентификаторов полномочий в группе)
 */
const checkGroupWithCredsExists = async (group) => {
  if (!group || !group.groupId) {
    return false;
  }

  // Ищем группу полномочий в БД (по id)
  const candidate = await AppCred.findOne({ _id: group.groupId });

  if (!candidate) {
    return false;
  }

  // Если для переданной группы не определены полномочия, то на этом
  // все проверки заканчиваем
  if (!group.creds || !group.creds.length) {
    return true;
  }

  // Если у найденной в БД группы нет полномочий, то тоже все ясно
  if (!candidate.credentials || !candidate.credentials.length) {
    return false;
  }

  // Смотрим, каждый ли элемент из списка переданных id полномочий определен для группы в БД
  for (let c of group.creds) {
    if (!candidate.credentials.some(cred => String(cred._id) === String(c))) {
      return false;
    }
  }

  return true;
};


/**
 * Обработка запроса на добавление новой роли.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * _id - идентификатор роли (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * englAbbreviation - аббревиатура роли (обязательна),
 * description - описание роли (не обязательно),
 * subAdminCanUse - true / false (возможность использования роли администратором нижнего уровня) - не обязательно,
 *                  по умолчанию true,
 * appsCreds - массив групп полномочий (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *        каждый элемент массива - объект с параметрами:
 *        _id - идентификатор объекта (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *        credsGroupId - id группы (обязателен),
 *        creds - массив id полномочий (не обязательный параметр; если не задан, то должен быть пустой строкой),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ROLE; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addRoleValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { _id, englAbbreviation, description, subAdminCanUse, appsCreds } = req.body;

    try {
      // Ищем в БД роль, englAbbreviation которой совпадает с переданной пользователем
      const candidate = await Role.findOne({ englAbbreviation });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Роль с такой аббревиатурой уже существует' });
      }

      // Проверяю группы полномочий на присутствие в БД
      for (let app of appsCreds) {
        if (!await checkGroupWithCredsExists(app)) {
          return res.status(ERR).json({ message: 'Для роли определены несуществующие параметры групп полномочий' });
        }
      }

      // Создаем в БД запись с данными о новой роли
      let role;
      if (_id) {
        role = new Role({ _id, englAbbreviation, description, subAdminCanUse, appsCreds });
      } else {
        role = new Role({ englAbbreviation, description, subAdminCanUse, appsCreds });
      }
      await role.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', role });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление новой роли',
        error: error.message,
        actionParams: { _id, englAbbreviation, description, subAdminCanUse, appsCreds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление в роль нового полномочия в приложениях ГИД Неман.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * credsGroupId - идентификатор группы полномочий (обязателен),
 * credId - идентификатор полномочия (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/addCred',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_APP_CRED_TO_ROLE; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addCredValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { roleId, credsGroupId, credId } = req.body;

    try {
      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findOne({ _id: roleId });

      // Если не находим, то процесс добавления полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Роль не найдена' });
      }

      // Проверяю приложение с полномочием на присутствие в БД
      if (!await checkGroupWithCredsExists({ groupId: credsGroupId, creds: [credId] })) {
        return res.status(ERR).json({ message: 'Группа и/или полномочие не существует в базе данных' });
      }

      // Проверяем, связана ли указанная группа полномочий с указанной ролью
      const appEl = candidate.appsCreds.find(elem => String(elem.credsGroupId) === String(credsGroupId));
      if (appEl) {
        if (!appEl.creds) {
          appEl.creds = [];
        }
        // Проверяем, связано ли указанное полномочие с указанной ролью
        if (appEl.creds.includes(credId)) {
          return res.status(ERR).json({ message: 'Данное полномочие уже определено для данной роли' });
        } else {
          appEl.creds.push(credId);
        }
      } else {
        candidate.appsCreds.push({ credsGroupId, creds: [credId] });
      }

      // Сохраняем в БД
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление в роль нового полномочия в приложении',
        error: error.message,
        actionParams: { roleId, credsGroupId, credId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка полномочий для указанной роли.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * credsGroupId - идентификатор группы полномочий (обязателен),
 * newCredIds - массив идентификаторов полномочий (обязателен; если нет полномочий, то
 *              массив должен быть пустым),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/changeCreds',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ROLE_APP_CREDENTIALS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  changeCredsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { roleId, credsGroupId, newCredIds } = req.body;

    try {
      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findOne({ _id: roleId });

      // Если не находим, то процесс изменения списка полномочий продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Роль не найдена' });
      }

      // Проверяю группу с полномочиями на присутствие в БД
      if (!await checkGroupWithCredsExists({ groupId: credsGroupId, creds: newCredIds })) {
        return res.status(ERR).json({ message: 'Группа и/или полномочие не существует в базе данных' });
      }

      const appEl = candidate.appsCreds.find(app => String(app.credsGroupId) === String(credsGroupId));
      // Проверяем, связана ли указанная группа полномочий с указанной ролью
      if (appEl) {
        appEl.creds = newCredIds;
      } else {
        candidate.appsCreds.push({ credsGroupId, creds: newCredIds });
      }

      // Сохраняем в БД
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Изменение списка полномочий в приложении',
        error: error.message,
        actionParams: { roleId, credsGroupId, newCredIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление роли.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ROLE; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delRoleValidationRules(),
  validate,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { roleId } = req.body;

    try {
      // Удаляем в БД запись
      const delRes = await Role.deleteOne({ _id: roleId }, { session });

      let canContinue = true;
      let errMess;
      if (!delRes.deletedCount) {
        canContinue = false;
        errMess = 'Роль не найдена';
      }

      if (canContinue) {
        // Удалив роль, необходимо удалить все ссылки на нее в коллекции пользователей
        await User.updateMany(
          {},
          { $pull: { roles: roleId } },
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
        action: 'Удаление роли',
        error: error.message,
        actionParams: { roleId },
      });
      try { await session.abortTransaction(); } catch {}
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на редактирование роли.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * englAbbreviation - аббревиатура роли (не обязательна),
 * description - описание роли (не обязательно),
 * subAdminCanUse - true / false (возможность использования роли администратором нижнего уровня) - не обязательно,
 * appsCreds - массив групп полномочий (не обязателен; если задан и не пуст, то каждый элемент массива - объект с параметрами:
 *        _id - идентификатор объекта (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *        credsGroupId - id группы (обязателен),
 *        creds - массив id полномочий (не обязательный параметр; если не задан, то должен быть пустой строкой),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ROLE; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modRoleValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { roleId, englAbbreviation, appsCreds } = req.body;

    try {
      // Ищем в БД роль, id которой совпадает с переданным пользователем
      let candidate = await Role.findById(roleId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная роль не существует в базе данных' });
      }

      // Ищем в БД роль, englAbbreviation которой совпадает с переданной пользователем
      let antiCandidate;

      if (englAbbreviation) {
        antiCandidate = await Role.findOne({ englAbbreviation });
      }

      // Если находим, то смотрим, та ли это самая роль. Если нет, продолжать не можем.
      if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
        return res.status(ERR).json({ message: 'Роль с такой аббревиатурой уже существует' });
      }

      // Проверяю группы с полномочиями на присутствие в БД
      if (appsCreds) {
        for (let app of appsCreds) {
          if (!await checkGroupWithCredsExists(app)) {
            return res.status(ERR).json({ message: 'Для роли определены несуществующие параметры групп полномочий' });
          }
        }
      }

      // Редактируем в БД запись
      delete req.body.roleId;
      candidate = Object.assign(candidate, req.body);
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', role: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование роли',
        error: error.message,
        actionParams: { roleId, englAbbreviation, appsCreds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
