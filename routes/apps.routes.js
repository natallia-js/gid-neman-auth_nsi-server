const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const App = require('../models/App');
const Role = require('../models/Role');
const { validationResult, check, body } = require('express-validator');

const router = Router();


/**
 * Обрабатывает запрос на получение списка всех приложений.
 */
router.get('/data',
           auth,
           async (req, res) => {
  try {
    const data = await App.find();

    res.status(201).json(data);

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});


/**
 * Обрабатывает запрос на получение списка аббревиатур всех приложений, их идентификаторов
 * и, для каждого приложения, - соответствующего списка полномочий пользователей
 * (id + аббревиатуры полномочий).
 */
router.get('/abbrData',
           auth,
           async (req, res) => {
  try {
    const data = await App.find({}, { _id: 1, shortTitle: 1, credentials: {_id: 1, englAbbreviation: 1} });

    res.status(201).json(data);

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});


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
 * Обработка запроса на добавление нового приложения
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
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
  auth,
  [
    check('shortTitle')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры приложения 1 символ'),
    check('title')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования приложения 1 символ'),
    check('credentials')
      .isArray()
      .withMessage('Список допустимых полномочий пользователей должен быть массивом')
      .bail() // stops running validations if any of the previous ones have failed
      .custom(val => checkCredentials(val))
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных нового приложения
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при добавлении приложения'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { _id, shortTitle, title, credentials } = req.body;

      // Ищем в БД приложение, shortTitle которого совпадает с переданным пользователем
      const candidate = await App.findOne({ shortTitle });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(400).json({ message: 'Приложение с такой аббревиатурой уже существует' });
      }

      // Создаем в БД запись с данными о новом приложении
      let app;
      if (_id) {
        app = new App({ _id, shortTitle, title, credentials });
      } else {
        app = new App({ shortTitle, title, credentials });
      }
      await app.save();

      res.status(201).json({ message: 'Информация успешно сохранена', appId: app._id });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на добавление нового полномочия приложения
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * englAbbreviation - аббревиатура полномочия (обязательна),
 * description - описание полномочия (не обязательный параметр; если не задан, то должен быть пустой строкой)
 */
router.post(
  '/addCred',
  auth,
  [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('englAbbreviation')
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры полномочия приложения 1 символ'),
    check('description')
      .custom(val => {
        if (typeof val !== 'string') {
          throw new Error('Неверный формат описания полномочия приложения');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных нового полномочия
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при добавлении полномочия приложения'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { appId, _id, englAbbreviation, description } = req.body;

      // Ищем в БД приложение, id которого совпадает с переданным пользователем
      const candidate = await App.findOne({ _id: appId });

      // Если не находим, то процесс создания полномочия продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Не найдено приложение для добавляемого полномочия' });
      }

      // Среди полномочий приложения ищем такое, englAbbreviation которого совпадает с переданным пользователем
      for (let cred of candidate.credentials) {
        if (cred.englAbbreviation === englAbbreviation) {
          return res.status(400).json({ message: 'Полномочие с такой аббревиатурой уже определено для данного приложения' });
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

      res.status(201).json({ message: 'Информация успешно сохранена', credId: newRecId });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на удаление приложения
 * (тот, кто удаляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен)
 */
router.post(
  '/del',
  auth,
  [
    check('appId')
      .exists()
      .withMessage('Не указан id удаляемого приложения'),
  ],
  async (req, res) => {

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
 * Обработка запроса на удаление полномочия приложения
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * credId - идентификатор полномочия (обязателен)
 */
router.post(
  '/delCred',
  auth,
  [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('credId')
      .exists()
      .withMessage('Не указан id полномочия')
  ],
  async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Проводим проверку корректности переданных пользователем данных полномочия
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные полномочия приложения'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { appId, credId } = req.body;

      // Ищем в БД нужное приложение
      const candidate = await App.findOne({ _id: appId });

      // Если не находим, то процесс удаления полномочия продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Указанное приложение не существует' });
      }

      // Ищем полномочие (по id) и удаляем его
      const prevCredLen = candidate.credentials.length;
      candidate.credentials = candidate.credentials.filter((cred) => String(cred._id) !== String(credId));

      if (prevCredLen === candidate.credentials.length) {
        return res.status(400).json({ message: 'Указанное полномочие не существует' });
      }

      await candidate.save();

      // Удалив полномочие, необходимо удалить все ссылки на него в коллекции ролей
      await Role.updateMany(
        { "apps.appId": appId },
        { $pull: { "apps.$[].creds": credId } }
      );

      await session.commitTransaction();

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
 * Обработка запроса на редактирование приложения
 * (тот, кто редактирует, должен обладать правами на выполнение данного действия).
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
  auth,
  [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('shortTitle')
      .if(body('shortTitle').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры приложения 1 символ'),
    check('title')
      .if(body('title').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования приложения 1 символ'),
    check('credentials')
      .if(body('credentials').exists())
      .isArray()
      .withMessage('Список допустимых полномочий пользователей должен быть массивом')
      .bail()
      .custom(val => checkCredentials(val))
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем новых данных приложения
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные новые данные приложения'
        });

      }

      // Считываем находящиеся в пользовательском запросе данные
      const { appId, shortTitle, title, credentials } = req.body;

      // Ищем в БД приложение, id которого совпадает с переданным пользователем
      const candidate = await App.findById(appId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Указанное приложение не существует' });
      }

      // Ищем в БД приложение, shortTitle которого совпадает с переданным пользователем
      let antiCandidate;

      if (shortTitle) {
        antiCandidate = await App.findOne({ shortTitle });
      }

      // Если находим, то смотрим, то ли это самое приложение. Если нет, продолжать не можем.
      if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
        return res.status(400).json({ message: 'Приложение с такой аббревиатурой уже существует' });
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

      res.status(201).json({ message: 'Информация успешно изменена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на редактирование полномочия приложения
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * appId - идентификатор приложения (обязателен),
 * credId - идентификатор полномочия (обязателен),
 * _id - идентификатор полномочия (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * englAbbreviation - аббревиатура полномочия (не обязательна),
 * description - описание полномочия (не обязательно)
 */
router.post(
  '/modCred',
  auth,
  [
    check('appId')
      .exists()
      .withMessage('Не указан id приложения'),
    check('credId')
      .exists()
      .withMessage('Не указан id полномочия'),
    check('englAbbreviation')
      .if(body('englAbbreviation').exists())
      .isLength({ min: 1 })
      .withMessage('Минимальная длина аббревиатуры полномочия приложения 1 символ'),
    check('description')
      .if(body('description').exists())
      .custom(val => {
        if (typeof val !== 'string') {
          throw new Error('Неверный формат описания полномочия приложения');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных полномочия
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные новые данные полномочия приложения'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { appId, credId, englAbbreviation, description } = req.body;

      // Ищем в БД нужное приложение
      const candidate = await App.findOne({ _id: appId });

      // Если не находим, то процесс редактирования полномочия продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Указанное приложение не существует' });
      }

      // Среди полномочий приложения ищем такое, englAbbreviation которого совпадает с переданным пользователем
      if (englAbbreviation) {
        for (let cred of candidate.credentials) {
          if ((cred.englAbbreviation === englAbbreviation) && (String(cred._id) !== String(credId))) {
            return res.status(400).json({ message: 'Полномочие с такой аббревиатурой уже определено для данного приложения' });
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
        return res.status(400).json({ message: 'Указанное полномочие не существует' });
      }

      await candidate.save();

      res.status(201).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


module.exports = router;
