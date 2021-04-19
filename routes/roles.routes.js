const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const Role = require('../models/Role');
const App = require('../models/App');
const User = require('../models/User');
const {
  addRoleValidationRules,
  addCredValidationRules,
  changeCredsValidationRules,
  delRoleValidationRules,
  modRoleValidationRules,
} = require('../validators/roles.validator');
const validate = require('../validators/validate');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  ALL_PERMISSIONS,

  MOD_APP_CREDENTIALS_ACTION,
  GET_ALL_ROLES_ACTION,
  MOD_ROLE_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех ролей.
 *
 * Данный запрос доступен главному администратору ГИД Неман и администратору нижнего уровня,
 * которые наделены соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список всех ролей,
 * а администратор нижнего уровня получит полный список тех ролей, которые ему разрешил
 * использовать главный администратор ГИД Неман.
 */
router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ROLES_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      const serviceName = req.user.service;

      let data;
      if (serviceName !== ALL_PERMISSIONS) {
        // Ищем роли, доступные лишь для администратора нижнего уровня
        data = await Role.find({ subAdminCanUse: true });
      } else {
        // Извлекаем информацию обо всех ролях
        data = await Role.find();
      }

      res.status(OK).json(data);

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка аббревиатур всех ролей с их идентификаторами.
 *
 * Данный запрос доступен главному администратору ГИД Неман и администратору нижнего уровня,
 * которые наделены соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список аббревиатур ролей,
 * а администратор нижнего уровня получит полный список аббревиатур тех ролей, которые ему разрешил
 * использовать главный администратор ГИД Неман.
 */
router.get(
  '/abbrs',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ROLES_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      const serviceName = req.user.service;

      let data;
      if (serviceName !== ALL_PERMISSIONS) {
        // Ищем роли, доступные лишь для администратора нижнего уровня
        data = await Role.find({ subAdminCanUse: true }, { _id: 1, englAbbreviation: 1 });
      } else {
        // Извлекаем информацию обо всех ролях
        data = await Role.find({}, { _id: 1, englAbbreviation: 1 });
      }

      res.status(OK).json(data);

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Проверяет наличие в БД объекта приложения по его id и, если заданы,
 * соответствующих полномочий приложения по их id.
 *
 * @param {Object} app - объект с полями appId (id приложения), creds (массив
 *                       идентификаторов полномочий в приложении)
 */
const checkAppWithCredsExists = async (app) => {
  if (!app || !app.appId) {
    return false;
  }

  // Ищем приложение в БД (по id)
  const candidate = await App.findOne({ _id: app.appId });

  if (!candidate) {
    return false;
  }

  // Если для переданного приложения не определены полномочия, то на этом
  // все проверки заканчиваем
  if (!app.creds || !app.creds.length) {
    return true;
  }

  // Если у найденного в БД приложения нет полномочий, то тоже все ясно
  if (!candidate.credentials || !candidate.credentials.length) {
    return false;
  }

  // Смотрим, каждый ли элемент из списка переданных id полномочий определен для приложения в БД
  for (let c of app.creds) {
    if (!candidate.credentials.some(cred => String(cred._id) === String(c))) {
      return false;
    }
  }

  return true;
}


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
 * apps - массив приложений (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *        каждый элемент массива - объект с параметрами:
 *        _id - идентификатор объекта (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *        appId - id приложения (обязателен),
 *        creds - массив id полномочий (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ROLE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addRoleValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Добавить новую роль для приложений ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { _id, englAbbreviation, description, subAdminCanUse, apps } = req.body;

      // Ищем в БД роль, englAbbreviation которой совпадает с переданной пользователем
      const candidate = await Role.findOne({ englAbbreviation });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Роль с такой аббревиатурой уже существует' });
      }

      // Проверяю приложения с полномочиями на присутствие в БД
      for (let app of apps) {
        if (!await checkAppWithCredsExists(app)) {
          return res.status(ERR).json({ message: 'Для роли определены несуществующие параметры приложений' });
        }
      }

      // Создаем в БД запись с данными о новой роли
      let role;
      if (_id) {
        role = new Role({ _id, englAbbreviation, description, subAdminCanUse: !!subAdminCanUse, apps });
      } else {
        role = new Role({ englAbbreviation, description, subAdminCanUse: !!subAdminCanUse, apps });
      }
      await role.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', roleId: role._id });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление в роль нового полномочия в приложении.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * appId - идентификатор приложения (обязателен),
 * credId - идентификатор полномочия (обязателен)
 */
router.post(
  '/addCred',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ROLE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addCredValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Добавить к роли новое полномочие в приложении ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { roleId, appId, credId } = req.body;

      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findOne({ _id: roleId });

      // Если не находим, то процесс добавления полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Роль не найдена' });
      }

      // Проверяю приложение с полномочием на присутствие в БД
      if (!await checkAppWithCredsExists({ appId: appId, creds: [credId] })) {
        return res.status(ERR).json({ message: 'Приложение и/или полномочие не существует в базе данных' });
      }

      // Проверяем, связано ли указанное приложение с указанной ролью
      const appEl = candidate.apps.find(app => String(app.appId) === String(appId));
      if (appEl) {
        if (!appEl.creds) {
          appEl.creds = [];
        }
        // Проверяем, связано ли указанное полномочие приложения с указанной ролью
        if (appEl.creds.includes(credId)) {
          return res.status(ERR).json({ message: 'Данное полномочие приложения уже определено для данной роли' });
        } else {
          appEl.creds.push(credId);
        }
      } else {
        candidate.apps.push({ appId, creds: [credId] });
      }

      // Сохраняем в БД
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка полномочий в приложении.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * appId - идентификатор приложения (обязателен),
 * newCredIds - массив идентификаторов полномочий (обязателен; если нет полномочий, то
 *              массив должен быть пустым)
 */
router.post(
  '/changeCreds',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_CREDENTIALS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  changeCredsValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Изменить список полномочий в приложении ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { roleId, appId, newCredIds } = req.body;

      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findOne({ _id: roleId });

      // Если не находим, то процесс изменения списка полномочий продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Роль не найдена' });
      }

      // Проверяю приложение с полномочиями на присутствие в БД
      if (!await checkAppWithCredsExists({ appId: appId, creds: newCredIds })) {
        return res.status(ERR).json({ message: 'Приложение и/или полномочие не существует в базе данных' });
      }

      const appEl = candidate.apps.find(app => String(app.appId) === String(appId));
      // Проверяем, связано ли указанное приложение с указанной ролью
      if (appEl) {
        appEl.creds = newCredIds;
      } else {
        candidate.apps.push({ appId, creds: newCredIds });
      }

      // Сохраняем в БД
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление роли.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен)
 */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ROLE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delRoleValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Удалить роль в приложениях ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { roleId } = req.body;

      // Удаляем в БД запись
      const delRes = await Role.deleteOne({ _id: roleId });

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
          { $pull: { roles: roleId } }
        );

        await session.commitTransaction();

      } else {
        await session.abortTransaction();

        return res.status(ERR).json({ message: errMess });
      }

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      console.log(e);

      await session.abortTransaction();

      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });

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
 * apps - массив приложений (не обязателен; если задан и не пуст, то каждый элемент массива - объект с параметрами:
 *        _id - идентификатор объекта (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *        appId - id приложения (обязателен),
 *        creds - массив id полномочий (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ROLE_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modRoleValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Отредактировать роль в приложениях ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { roleId, englAbbreviation, description, subAdminCanUse, apps } = req.body;

      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findById(roleId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная роль не существует в базе данных' });
      }

      // Ищем в БД роль, englAbbreviation которой совпадает с переданным пользователем
      let antiCandidate;

      if (englAbbreviation) {
        antiCandidate = await Role.findOne({ englAbbreviation });
      }

      // Если находим, то смотрим, та ли это самая роль. Если нет, продолжать не можем.
      if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
        return res.status(ERR).json({ message: 'Роль с такой аббревиатурой уже существует' });
      }

      // Проверяю приложения с полномочиями на присутствие в БД
      if (apps) {
        for (let app of apps) {
          if (!await checkAppWithCredsExists(app)) {
            return res.status(ERR).json({ message: 'Для роли определены несуществующие параметры приложений' });
          }
        }
      }

      // Редактируем в БД запись
      if (englAbbreviation || (englAbbreviation === '')) {
        candidate.englAbbreviation = englAbbreviation;
      }
      if (description || (description === '')) {
        candidate.description = description;
      }
      candidate.subAdminCanUse = subAdminCanUse;
      if (apps) {
        candidate.apps = apps;
      }

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


module.exports = router;
