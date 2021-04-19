const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
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

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  ALL_PERMISSIONS,

  GET_ALL_APPS_ACTION,
  GET_APPS_CREDENTIALS_ACTION,
  MOD_APP_ACTION,
  MOD_APP_CREDENTIAL_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех приложений.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 */
router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_APPS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      // Проверяем принадлежность лица, производящего запрос
      const serviceName = req.user.service;
      if (serviceName !== ALL_PERMISSIONS) {
        return res.status(ERR).json({ message: 'Список приложений ГИД Неман доступен лишь главному администратору ГИД Неман' });
      }

      const data = await App.find();

      res.status(OK).json(data);

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка аббревиатур всех приложений, их идентификаторов
 * и, для каждого приложения, - соответствующего списка полномочий пользователей
 * (id + аббревиатуры полномочий).
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 */
router.get(
  '/abbrData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_APPS_CREDENTIALS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      // Проверяем принадлежность лица, производящего запрос
      const serviceName = req.user.service;
      if (serviceName !== ALL_PERMISSIONS) {
        return res.status(ERR).json({ message: 'Список приложений ГИД Неман доступен лишь главному администратору ГИД Неман' });
      }

      const data = await App.find({}, { _id: 1, shortTitle: 1, credentials: {_id: 1, englAbbreviation: 1} });

      res.status(OK).json(data);

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Пользовательская функция проверки списка полномочий приложения.
 *
 * @param {array} val - массив полномочий
 */
const checkCredentials = (val) => {
  let abbrs = [];

  val.forEach((el) => {
    if ((typeof el.englAbbreviation !== 'string') || !el.englAbbreviation.length) {
      throw new Error('Минимальная длина аббревиатуры полномочия приложения 1 символ');
    }
    if (typeof el.description !== 'string') {
      throw new Error('Неверный формат описания полномочия приложения');
    }
    if (!abbrs.includes(el.englAbbreviation)) {
      abbrs.push(el.englAbbreviation);
    } else {
      throw new Error('Полномочие с такой аббревиатурой уже существует');
    }
  });

  abbrs = null;
  return true;
}


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
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addAppValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Добавить новое приложение ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { _id, shortTitle, title, credentials } = req.body;

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

      res.status(OK).json({ message: 'Информация успешно сохранена', appId: app._id });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового полномочия приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * englAbbreviation - аббревиатура полномочия (обязательна),
 * description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/addCred',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_CREDENTIAL_ACTION],
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
      return res.status(ERR).json({ message: 'Добавить новое полномочие приложения ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { appId, _id, englAbbreviation, description } = req.body;

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

      res.status(OK).json({ message: 'Информация успешно сохранена', credId: newRecId });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен)
 */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delAppValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Удалить приложение ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { appId } = req.body;

      // Удаляем в БД запись
      const delRes = await App.deleteOne({ _id: appId });

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
          { $pull: { apps: { appId } } }
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
 * Обработка запроса на удаление полномочия приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * credId - идентификатор полномочия (обязателен)
 */
router.post(
  '/delCred',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_CREDENTIAL_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delCredValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Удалить полномочие приложения ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { appId, credId } = req.body;

      // Ищем в БД нужное приложение
      const candidate = await App.findOne({ _id: appId });

      // Если не находим, то процесс удаления полномочия продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанное приложение не существует в базе данных' });
      }

      // Ищем полномочие (по id) и удаляем его
      const prevCredLen = candidate.credentials.length;
      candidate.credentials = candidate.credentials.filter((cred) => String(cred._id) !== String(credId));

      if (prevCredLen === candidate.credentials.length) {
        return res.status(ERR).json({ message: 'Указанное полномочие не определено для данного приложения в базе данных' });
      }

      await candidate.save();

      // Удалив полномочие, необходимо удалить все ссылки на него в коллекции ролей
      await Role.updateMany(
        { "apps.appId": appId },
        { $pull: { "apps.$[].creds": credId } }
      );

      await session.commitTransaction();

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
 *               description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modAppValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Отредактировать информацию о приложении ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { appId, shortTitle, title, credentials } = req.body;

      // Ищем в БД приложение, id которого совпадает с переданным пользователем
      const candidate = await App.findById(appId);

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
      if (shortTitle || (shortTitle === '')) {
        candidate.shortTitle = shortTitle;
      }
      if (title || (title === '')) {
        candidate.title = title;
      }
      if (credentials) {
        candidate.credentials = credentials;
      }

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о полномочии приложения.
 *
 * Данный запрос доступен лишь главному администратору ГИД Неман, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * credId - идентификатор полномочия (обязателен),
 * _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * englAbbreviation - аббревиатура полномочия (не обязательна),
 * description - описание полномочия (не обязательно)
 */
router.post(
  '/modCred',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_APP_CREDENTIAL_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modCredValidationRules,
  validate,
  async (req, res) => {
    // Проверяем принадлежность лица, производящего запрос
    const serviceName = req.user.service;
    if (serviceName !== ALL_PERMISSIONS) {
      return res.status(ERR).json({ message: 'Отредактировать информацию о полномочии приложения ГИД Неман может лишь главный администратор ГИД Неман' });
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { appId, credId, englAbbreviation, description } = req.body;

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

          if (englAbbreviation) {
            cred.englAbbreviation = englAbbreviation;
          }
          if (description || (description === '')) {
            cred.description = description;
          }

          break;
        }
      }

      if (!found) {
        return res.status(ERR).json({ message: 'Указанное полномочие не существует для данного приожения в базе данных' });
      }

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


module.exports = router;
