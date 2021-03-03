const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const Role = require('../models/Role');
const App = require('../models/App');
const User = require('../models/User');
const { validationResult, check, body } = require('express-validator');

const router = Router();


/**
 * Обрабатывает запрос на получение списка всех ролей.
 */
router.get('/data',
           auth,
           async (req, res) => {
  try {
    const data = await Role.find();

    res.status(201).json(data);

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});


/**
 * Обрабатывает запрос на получение списка аббревиатур всех ролей с их идентификаторами.
 */
router.get('/abbrs',
           auth,
           async (req, res) => {
  try {
    const data = await Role.find({}, { _id: 1, englAbbreviation: 1 });

    res.status(201).json(data);

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});


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
 * Обработка запроса на добавление новой роли
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 *  _id - идентификатор роли (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * englAbbreviation - аббревиатура роли (обязательна),
 * description - описание роли (не обязательно),
 * apps - массив приложений (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *        каждый элемент массива - объект с параметрами:
 *        _id - идентификатор объекта (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *        appId - id приложения (обязателен),
 *        creds - массив id полномочий (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/add',
  auth,
  [
    check('englAbbreviation')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры роли 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В аббревиатуре роли допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('description')
      .if(body('description').exists())
      .trim(),
    check('apps')
      .isArray()
      .withMessage('Список приложений роли должен быть массивом')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных новой роли
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при добавлении роли'
        })
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { _id, englAbbreviation, description, apps } = req.body;

      // Ищем в БД роль, englAbbreviation которой совпадает с переданной пользователем
      const candidate = await Role.findOne({ englAbbreviation });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(400).json({ message: 'Роль с такой аббревиатурой уже существует' });
      }

      // Проверяю приложения с полномочиями на присутствие в БД
      for (let app of apps) {
        if (!await checkAppWithCredsExists(app)) {
          return res.status(400).json({ message: 'Для роли определены несуществующие параметры приложений' });
        }
      }

      // Создаем в БД запись с данными о новой роли
      let role;
      if (_id) {
        role = new Role({ _id, englAbbreviation, description, apps });
      } else {
        role = new Role({ englAbbreviation, description, apps });
      }
      await role.save();

      res.status(201).json({ message: 'Информация успешно сохранена', roleId: role._id });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на добавление нового полномочия в приложении
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * appId - идентификатор приложения (обязателен),
 * credId - идентификатор полномочия (обязателен)
 */
router.post(
  '/addCred',
  auth,
  [
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('credId')
      .exists()
      .withMessage('Не указан id полномочия')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при добавлении полномочия приложения'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { roleId, appId, credId } = req.body;

      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findOne({ _id: roleId });

      // Если не находим, то процесс добавления полномочия продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Роль не найдена' });
      }

      // Проверяю приложение с полномочием на присутствие в БД
      if (!await checkAppWithCredsExists({ appId: appId, creds: [credId] })) {
        return res.status(400).json({ message: 'Приложение и/или полномочие не существует в БД' });
      }

      // Проверяем, связано ли указанное приложение с указанной ролью
      const appEl = candidate.apps.find(app => String(app.appId) === String(appId));
      if (appEl) {
        if (!appEl.creds) {
          appEl.creds = [];
        }
        // Проверяем, связано ли указанное полномочие приложения с указанной ролью
        if (appEl.creds.includes(credId)) {
          return res.status(400).json({ message: 'Данное полномочие приложения уже определено для данной роли' });
        } else {
          appEl.creds.push(credId);
        }
      } else {
        candidate.apps.push({ appId, creds: [credId] });
      }

      // Сохраняем в БД
      await candidate.save();

      res.status(201).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на изменение списка полномочий в приложении
 * (тот, кто изменяет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * appId - идентификатор приложения (обязателен),
 * newCredIds - массив идентификаторов полномочий (обязателен; если нет полномочий, то
 *              массив должен быть пустым)
 */
router.post(
  '/changeCreds',
  auth,
  [
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('newCredIds')
      .exists()
      .withMessage('Не указан массив id полномочий')
      .bail()
      .isArray()
      .withMessage('Список id полномочий должен быть массивом')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при изменении списка полномочий приложения'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { roleId, appId, newCredIds } = req.body;

      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findOne({ _id: roleId });

      // Если не находим, то процесс изменения списка полномочий продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Роль не найдена' });
      }

      // Проверяю приложение с полномочиями на присутствие в БД
      if (!await checkAppWithCredsExists({ appId: appId, creds: newCredIds })) {
        return res.status(400).json({ message: 'Приложение и/или полномочие не существует в БД' });
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

      res.status(201).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на удаление роли
 * (тот, кто удаляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен)
 */
router.post(
  '/del',
  auth,
  [
    check('roleId')
      .exists()
      .withMessage('Не указан id удаляемой роли'),
  ],
  async (req, res) => {

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

        return res.status(400).json({ message: errMess });
      }

      res.status(201).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      console.log(e);

      await session.abortTransaction();

      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на редактирование роли
 * (тот, кто редактирует, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * roleId - идентификатор роли (обязателен),
 * englAbbreviation - аббревиатура роли (не обязательна),
 * description - описание роли (не обязательно),
 * apps - массив приложений (не обязателен; если задан и не пуст, то каждый элемент массива - объект с параметрами:
 *        _id - идентификатор объекта (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *        appId - id приложения (обязателен),
 *        creds - массив id полномочий (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/mod',
  auth,
  [
    check('roleId')
      .exists()
      .withMessage('Не указан id роли'),
    check('englAbbreviation')
      .if(body('englAbbreviation').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры роли 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В аббревиатуре роли допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('description')
      .if(body('description').exists())
      .trim(),
    check('apps')
      .if(body('apps').exists())
      .isArray()
      .withMessage('Список приложений роли должен быть массивом')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем новых данных роли
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные новые данные роли'
        })
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { roleId, englAbbreviation, description, apps } = req.body;

      // Ищем в БД роль, id которой совпадает с переданным пользователем
      const candidate = await Role.findById(roleId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Указанная роль не существует' });
      }

      // Ищем в БД роль, englAbbreviation которой совпадает с переданным пользователем
      let antiCandidate;

      if (englAbbreviation) {
        antiCandidate = await Role.findOne({ englAbbreviation });
      }

      // Если находим, то смотрим, та ли это самая роль. Если нет, продолжать не можем.
      if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
        return res.status(400).json({ message: 'Роль с такой аббревиатурой уже существует' });
      }

      // Проверяю приложения с полномочиями на присутствие в БД
      if (apps) {
        for (let app of apps) {
          if (!await checkAppWithCredsExists(app)) {
            return res.status(400).json({ message: 'Для роли определены несуществующие параметры приложений' });
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
      if (apps) {
        candidate.apps = apps;
      }

      await candidate.save();

      res.status(201).json({ message: 'Информация успешно изменена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


module.exports = router;
