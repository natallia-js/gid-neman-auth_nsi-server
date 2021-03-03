const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth.middleware');
const { validationResult, check, body } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const App = require('../models/App');

const router = Router();

const CONFIG_JWT_SECRET_PARAM_NAME = 'jwtSecret';


/**
 * Обрабатывает запрос на получение списка всех пользователей.
 */
router.get('/data',
           auth,
           async (_req_, res) => {
  try {
    const data = await User.find();

    res.status(201).json(data);

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});


/**
 * Проверяет наличие в БД объекта роли по его id.
 *
 * @param {ObjectId} roleId - id роли
 */
const checkRoleExists = async (roleId) => {
  if (!roleId) {
    return false;
  }

  const candidate = await Role.findOne({ _id: roleId });

  if (!candidate) {
    return false;
  }

  return true;
}


/**
 * Обработка запроса на регистрацию нового пользователя
 * (тот, кто регистрирует, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 *  _id - идентификатор пользователя (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * login - логин пользователя (обязателен),
 * password - пароль пользователя (обязателен),
 * name - имя пользователя (обязательно),
 * fatherName - отчество пользователя (не обязательно),
 * surname - фамилия пользователя (обязательна),
 * sector - наименование участка (обязательно),
 * post - должность (обязательна),
 * roles - массив ролей (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *         каждый элемент массива - строка с id роли
 */
router.post(
  '/register',
  auth,
  [
    check('login')
      .isLength({ min: 1 })
      .withMessage('Минимальная длина логина 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В логине допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Минимальная длина пароля 6 символов')
      .bail()
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В пароле допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина имени 1 символ'),
    check('fatherName')
      .if(body('fatherName').exists())
      .trim(),
    check('surname')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина фамилии 1 символ'),
    check('sector')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования участка 1 символ'),
    check('post')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина должности 1 символ'),
    check('roles')
      .isArray()
      .withMessage('Список ролей пользователя должен быть массивом')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем регистрационных данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при регистрации'
        })
      }

      // Считываем находящиеся в пользовательском запросе регистрационные данные
      const { _id, login, password, name, fatherName, surname, sector, post, roles } = req.body;

      // Ищем в БД пользователя, login которого совпадает с переданным пользователем
      const candidate = await User.findOne({ login });

      // Если находим, то процесс регистрации продолжать не можем
      if (candidate) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }

      for (let role of roles) {
        if (!await checkRoleExists(role)) {
          return res.status(400).json({ message: 'Для пользователя определены несуществующие роли' });
        }
      }

      // Получаем хеш заданного пользователем пароля
      const hashedPassword = await bcrypt.hash(password, 12);

      // Создаем в БД нового пользователя
      let user;
      if (_id) {
        user = new User({ _id, login, password: hashedPassword, name, fatherName, surname, sector, post, roles });
      } else {
        user = new User({ login, password: hashedPassword, name, fatherName, surname, sector, post, roles });
      }
      await user.save();

      res.status(201).json({ message: 'Регистрация прошла успешно',
                             hashedPassword,
                             userId: user._id });

    } catch (e) {
      console.log(e.message);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на добавление новой роли пользователя
 * (тот, кто добавляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * roleId - идентификатор роли (обязателен)
 */
router.post(
  '/addRole',
  auth,
  [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
    check('roleId')
      .exists()
      .withMessage('Не указан id роли')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при добавлении роли пользователя'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { userId, roleId } = req.body;

      // Ищем в БД пользователя, id которого совпадает с переданным
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то процесс добавления роли продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Пользователь не найден' });
      }

      // Среди ролей пользователя ищем такую, id которой совпадает с переданным пользователем
      for (let role of candidate.roles) {
        if (String(role) === String(roleId)) {
          return res.status(400).json({ message: 'Данная роль уже определена для данного пользователя' });
        }
      }

      // Проверяю роль на присутствие в БД
      if (!await checkRoleExists(roleId)) {
        return res.status(400).json({ message: 'Роль не существует в БД' });
      }

      // Сохраняем информацию о новой роли в БД
      candidate.roles.push(roleId);

      await candidate.save();

      res.status(201).json({ message: 'Информация успешно сохранена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на вход в систему.
 * Параметры тела запроса:
 * login - логин пользователя (обязателен),
 * password - пароль пользователя (обязателен),
 *
 *  --- delete ---
 * role - роль пользователя (обязательна)
 *
 */
router.post(
  '/login',
  [
    check('login', 'Введите логин').exists(),
    check('password', 'Введите пароль').exists(),
    /*check('role', 'Введите роль').exists()*/
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем аутентификационных данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при входе в систему'
        })
      }

      // Считываем находящиеся в пользовательском запросе login, password                 , role
      const { login, password /*, role*/ } = req.body;

      // Ищем в БД пользователя, login которого совпадает с переданным пользователем
      const user = await User.findOne({ login });

      // Если не находим, то процесс входа в систему продолжать не можем
      if (!user) {
        return res.status(400).json({ message: 'Пользователь не найден' });
      }

/*
      // Проверяем, есть ли в списке ролей, хранящихся в БД для данного пользователя,
      // указанная им роль
      let foundRole;

      if (user.roles && user.roles.length) {
        foundRole = await Role.findOne({ englAbbreviation: role });

        if (!foundRole) {
          return res.status(400).json({ message: 'Указанная роль не найдена' });
        }

        if (!foundRole.apps || !foundRole.apps.length) {
          return res.status(400).json({ message: 'Для данной роли не определено ни одного приложения' });
        }

        if (!user.roles.includes(foundRole.id)) {
          return res.status(400).json({ message: 'За данным пользователем не закреплена указанная роль' });
        }
      } else {
        return res.status(400).json({ message: 'Для пользователя не определена ни одна роль в системе' });
      }
*/
      // Проверяем переданный пользователем пароль
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Неверный пароль, попробуйте снова' });
      }

      // Сформируем список кратких наименований приложений с соответствующими краткими
      // наименованиями полномочий пользователя в рамках данных приложений.
      // Данный список передадим пользователю
      const appsCredentials = [];

      // Вспомогательная функция, позволяющая определить, есть ли среди элементов
      // заданного массива полномочий такой, id которого совпадает с заданным id.
      // Если есть, функция возвращает аббревиатуру соответствующего полномочия
      function credExists(credId, appCreds) {
        if (!credId || !appCreds) {
          return null;
        }
        for (let c of appCreds) {
          if (String(c._id) === String(credId)) {
            return c.englAbbreviation;
          }
        }
        return null;
      }

      // Вспомогательная функция, позволяющая добавить в appsCredentials запись о новом приложении
      // и полномочии в нем, либо добавить в список заданного приложения указанное полномочие.
      // При добавлении информации функция избегает дублирования
      function addAppCred(appAbbrev, appCred) {
        let foundAppId = -1;
        let foundCredId = -1;

        for (let i = 0; i < appsCredentials.length; i += 1) {

          if (appsCredentials[i].appAbbrev === appAbbrev) {
            foundAppId = i;

            for (let j = 0; j < appsCredentials[i].creds.length; j += 1) {
              if (appsCredentials[i].creds[j] === appCred) {
                foundCredId = j;
                break;
              }
            }
            break;
          }
        }
        if (foundAppId === -1) {
          appsCredentials.push({ appAbbrev, creds: [appCred] });
        } else {
          if (foundCredId === -1) {
            appsCredentials[foundAppId].creds.push(appCred);
          }
        }
      }

      if (user.roles) {
        // Для каждой из ролей, закрепленных за данным пользователем,
        for (let roleId of user.roles) {

          // ... определяем наличие данной роли в коллекции ролей БД
          const foundRole = await Role.findOne({ _id: roleId });

          if (!foundRole) {
            continue;
          }

          // Для каждого приложения, соответствующего данной роли, ...
          for (let app of foundRole.apps) {

            // ... определяем наличие данного приложения в коллекции приложений БД
            const foundApp = await App.findById(app.appId);

            if (!foundApp) {
              continue;
            }

            // Если приложение есть в коллекции приложений, то среди полномочий, определенных
            // для пользователей у найденного приложения, ищем указанные в роли полномочия.
            // Найденные полномочия включаем в итоговый массив полномочий
            credentials = [];
            for (let credId of app.creds) {
              const credAbbr = credExists(credId, foundApp.credentials);
              if (credAbbr) {
                addAppCred(foundApp.shortTitle, credAbbr);
              }
            }
          }
        }
      }

      // Создаем JWT-токен (as string) для успешно вошедшего в систему пользователя.
      // JWT состоит из трех частей: заголовок (header - JSON-объект, содержит информацию о том,
      // как должна вычисляться JWT подпись), полезные данные (payload) и
      // подпись (signature - получается так: алгоритм base64url кодирует header и payload, соединяет
      // закодированные строки через точку, затем полученная строка хешируется алгоритмом, заданном в
      // header на основе секретного ключа).
      // Здесь производится synchronous sign with default (HMAC SHA256).

      const token = jwt.sign(
        {
          userId: user.id,
          credentials: appsCredentials,
        },
        config.get(CONFIG_JWT_SECRET_PARAM_NAME),
        { expiresIn: '1h' }
      );

      res.status(201).json({ token,
                             userId: user.id,
                             userInfo: {
                               name: user.name,
                               fatherName: user.fatherName,
                               surname: user.surname,
                               sector: user.sector,
                               post: user.post,
                             },
                             credentials: appsCredentials });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на удаление пользователя
 * (тот, кто удаляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен)
 */
router.post(
  '/del',
  auth,
  [
    check('userId')
      .exists()
      .withMessage('Не указан id удаляемого пользователя'),
  ],
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId } = req.body;

      // Удаляем в БД запись
      const delRes = await User.deleteOne({ _id: userId });
      if (!delRes.deletedCount) {
        return res.status(400).json({ message: 'Пользователь не найден' });
      }

      res.status(201).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на удаление роли пользователя
 * (тот, кто удаляет, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * roleId - идентификатор роли (обязателен)
 */
router.post(
  '/delRole',
  auth,
  [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
    check('roleId')
      .exists()
      .withMessage('Не указан id роли')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при удалении роли пользователя'
        });
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { userId, roleId } = req.body;

      // Ищем в БД пользователя, id которого совпадает с переданным
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то процесс удаления роли продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Пользователь не найден' });
      }

      // Среди ролей пользователя ищем такую, id которой совпадает с переданным пользователем
      let found = false;
      for (let role of candidate.roles) {
        if (String(role) === String(roleId)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return res.status(400).json({ message: 'Указанная роль не определена для данного пользователя' });
      }

      // Сохраняем информацию в БД
      candidate.roles = candidate.roles.filter((role) => String(role) !== String(roleId));

      await candidate.save();

      res.status(201).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о пользователе
 * (тот, кто редактирует, должен обладать правами на выполнение данного действия).
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * login - логин пользователя (не обязателен),
 * password - пароль пользователя (не обязателен),
 * name - имя пользователя (не обязательно),
 * fatherName - отчество пользователя (не обязательно),
 * surname - фамилия пользователя (не обязательна),
 * sector - наименование участка (не обязательно),
 * post - наименование должности (не обязательно),
 * roles - массив ролей (не обязателен; если задан и не пуст, то каждый элемент массива - строка с id роли)
 */
router.post(
  '/mod',
  auth,
  [
    check('userId')
      .exists()
      .withMessage('Не указан id пользователя'),
    check('login')
      .if(body('login').exists())
      .isLength({ min: 1 })
      .withMessage('Минимальная длина логина 1 символ')
      .bail() // stops running validations if any of the previous ones have failed
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В логине допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('password')
      .if(body('password').exists())
      .isLength({ min: 6 })
      .withMessage('Минимальная длина пароля 6 символов')
      .bail()
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('В пароле допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина имени 1 символ'),
    check('fatherName')
      .if(body('fatherName').exists())
      .trim(),
    check('surname')
      .if(body('surname').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина фамилии 1 символ'),
    check('sector')
      .if(body('sector').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования участка 1 символ'),
    check('post')
      .if(body('post').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина должности 1 символ'),
    check('roles')
      .if(body('roles').exists())
      .isArray()
      .withMessage('Список ролей пользователя должен быть массивом')
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем новых данных пользователя
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Указаны некорректные новые данные пользователя'
        })
      }

      // Считываем находящиеся в пользовательском запросе данные
      const { userId, login, password, name, fatherName, surname, sector, post, roles } = req.body;

      // Ищем в БД пользователя, id которого совпадает с переданным
      const candidate = await User.findById(userId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(400).json({ message: 'Указанный пользователь не существует' });
      }

      // Ищем в БД пользователя, login которого совпадает с переданным пользователем
      let antiCandidate;

      if (login) {
        antiCandidate = await User.findOne({ login });
      }

      // Если находим, то смотрим, тот ли это самый пользователь. Если нет, продолжать не можем.
      if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }

      if (roles) {
        for (let role of roles) {
          if (!await checkRoleExists(role)) {
            return res.status(400).json({ message: 'Для пользователя определены несуществующие роли' });
          }
        }
      }

      let hashedPassword;

      // Редактируем в БД запись
      if (login) {
        candidate.login = login;
      }
      if (password) {
        // Получаем хеш заданного пользователем пароля
        hashedPassword = await bcrypt.hash(password, 12);
        candidate.password = hashedPassword;
      }
      if (name) {
        candidate.name = name;
      }
      if (fatherName || fatherName === '') {
        candidate.fatherName = fatherName;
      }
      if (surname) {
        candidate.surname = surname;
      }
      if (sector) {
        candidate.sector = sector;
      }
      if (post) {
        candidate.post = post;
      }
      if (roles) {
        candidate.roles = roles;
      }

      await candidate.save();

      res.status(201).json({ message: 'Информация успешно изменена',
                             hashedPassword: candidate.password });

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);


/**
 * Обработка запроса на регистрацию нового пользователя
 */
/*router.post(
  '/register',
  [
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Минимальная длина пароля 6 символов').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем email и password
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при регистрации'
        })
      }

      // Считываем находящиеся в пользовательском запросе email и password
      const { email, password } = req.body;

      // Ищем в БД пользователя, email которого совпадает с переданным пользователем
      const candidate = await User.findOne({ email });

      // Если находим, то процесс регистрации продолжать не можем
      if (candidate) {
        return res.status(400).json({ message: 'Такой пользователь уже существует' });
      }

      // Получаем хеш заданного пользователем пароля
      const hashedPassword = await bcrypt.hash(password, 12);

      // Создаем в БД нового пользователя
      const user = new User({ email, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: 'Регистрация прошла успешно' });

    } catch (e) {
      console.log(e.message);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);
*/


/**
 * Обработка запроса на вход пользователя в систему
 */
/*router.post(
  '/login',
  [
    check('email', 'Введите корректный email').normalizeEmail().isEmail(),
    check('password', 'Введите пароль').exists()
  ],
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем email и password
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при входе в систему'
        })
      }

      // Считываем находящиеся в пользовательском запросе email и password
      const { email, password } = req.body;

      // Ищем в БД пользователя, email которого совпадает с переданным пользователем
      const user = await User.findOne({ email });

      // Если не находим, то процесс входа в систему продолжать не можем
      if (!user) {
        return res.status(400).json({ message: 'Пользователь не найден' });
      }

      // Проверяем переданный пользователем пароль
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Неверный пароль, попробуйте снова' });
      }

      // Создаем JWT-токен (as string) для успешно вошедшего в систему пользователя.
      // JWT состоит из трех частей: заголовок (header - JSON-объект, содержит информацию о том,
      // как должна вычисляться JWT подпись), полезные данные (payload) и
      // подпись (signature - получается так: алгоритм base64url кодирует header и payload, соединяет
      // закодированные строки через точку, затем полученная строка хешируется алгоритмом, заданном в
      // header на основе секретного ключа).
      // Здесь производится synchronous sign with default (HMAC SHA256).
      const token = jwt.sign(
        { userId: user.id },
        config.get(CONFIG_JWT_SECRET_PARAM_NAME),
        { expiresIn: '1h' }
      );

      res.json({ token, userId: user.id });

    } catch (e) {
      console.log(e.message);
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
    }
  }
);
*/

module.exports = router;
