const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const { isMainAdmin } = require('../middleware/isMainAdmin.middleware');
const {
  registerValidationRules,
  addRoleValidationRules,
  loginValidationRules,
  delUserValidationRules,
  delRoleValidationRules,
  modUserValidationRules,
} = require('../validators/auth.validator');
const validate = require('../validators/validate');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const App = require('../models/App');
const { TStation } = require('../models/TStation');
const { TDNCSector } = require('../models/TDNCSector');
const { TECDSector } = require('../models/TECDSector');
const { TStationWorkPoligon } = require('../models/TStationWorkPoligon');
const { TDNCSectorWorkPoligon } = require('../models/TDNCSectorWorkPoligon');
const { TECDSectorWorkPoligon } = require('../models/TECDSectorWorkPoligon');

const router = Router();

const {
  CONFIG_JWT_SECRET_PARAM_NAME,

  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  ALL_PERMISSIONS,

  GidNemanAuthNSIUtil_ShortTitle,
  GidNemanAuthNSIUtil_Title,

  MAIN_ADMIN_ROLE_NAME,
  MAIN_ADMIN_ROLE_DESCRIPTION,
  MAIN_ADMIN_LOGIN,
  MAIN_ADMIN_PASSWORD,
  MAIN_ADMIN_NAME,
  MAIN_ADMIN_SURNAME,
  MAIN_ADMIN_POST,

  GET_ALL_USERS_ACTION,
  GET_DEFINIT_USERS_ACTION,
  REGISTER_USER_ACTION,
  MOD_USER_ACTION,

  Get_GidNemanAuthNSIUtil_AllCredentials,
} = require('../constants');

const jwtSecret = config.get(CONFIG_JWT_SECRET_PARAM_NAME);


/**
 * Обработка запроса на регистрацию главного администратора ГИД Неман.
 *
 * Данный запрос доступен каждому.
 *
 * Если главный администратор ГИД Неман ранее был зарегистрирован, запрос вернет ошибку.
 */
router.put(
  '/registerSuperAdmin',
  async (_req, res) => {
    try {
      // Чтобы созданный администратор мог работать, необходимо определить для него
      // полномочия в утилите аутентификации и НСИ ГИД Неман.

      // Ищем в БД приложение, shortTitle которого совпадает с GidNemanAuthNSIUtil
      let authApp = await App.findOne({ shortTitle: GidNemanAuthNSIUtil_ShortTitle });

      // Если не находим, то создаем
      if (!authApp) {
        authApp = new App({
          shortTitle: GidNemanAuthNSIUtil_ShortTitle,
          title: GidNemanAuthNSIUtil_Title,
          credentials: Get_GidNemanAuthNSIUtil_AllCredentials().map(el => { return { englAbbreviation: el, description: '' } }),
        });
        await authApp.save();
      }

      // Проверяем наличие роли главного администратора ГИД Неман.
      // Если нет - создаем, наделяя ее созданными выше полномочиями в GidNemanAuthNSIUtil.
      let adminRole = await Role.findOne({ englAbbreviation: MAIN_ADMIN_ROLE_NAME });
      if (!adminRole) {
        adminRole = new Role({
          englAbbreviation: MAIN_ADMIN_ROLE_NAME,
          description: MAIN_ADMIN_ROLE_DESCRIPTION,
          subAdminCanUse: false,
          apps: [
            {
              appId: authApp._id,
              creds: authApp.credentials.map(cred => cred._id)
            }
          ],
        });
        await adminRole.save();
      }

      // Ищем пользователя, логин которого совпадает с default-логином главного администратора ГИД Неман.
      // Если найдем, то повторно такого же пользователя создавать не будем.
      const candidate = await User.findOne({ login: MAIN_ADMIN_LOGIN });

      if (candidate) {
        return res.status(ERR).json({ message: 'Пользователь "Главный администратор ГИД Неман по умолчанию" уже существует' });
      }

      // Получаем хеш default-пароля
      const hashedPassword = await bcrypt.hash(MAIN_ADMIN_PASSWORD, 12);

      // Создаем в БД нового пользователя - default-администратора ГИД Неман
      const user = new User({
        login: MAIN_ADMIN_LOGIN,
        password: hashedPassword,
        name: MAIN_ADMIN_NAME,
        fatherName: '',
        surname: MAIN_ADMIN_SURNAME,
        post: MAIN_ADMIN_POST,
        service: ALL_PERMISSIONS,
        roles: [adminRole._id],
      });
      await user.save();

      res.status(OK).json({ message: 'Регистрация прошла успешно', userId: user._id });

    } catch (error) {
      console.log(error.message);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех пользователей.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список всех пользователей,
 * иное же лицо получит полный список тех пользователей, которые закреплены за его службой
 * (включая его самого).
 */
router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_USERS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      const serviceName = req.user.service;

      let data;
      if (!isMainAdmin(req)) {
        // Ищем пользователей, принадлежащих заданной службе
        data = await User.find({ service: serviceName });
      } else {
        // Извлекаем информацию обо всех пользователях
        data = await User.find();
      }

      // Для всех пользователей, информацию по которым извлекли, извлекаю также информацию
      // по рабочим перегонам
      const userIds = data.map((user) => String(user._id));

      const stationWorkPoligons = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_UserID', 'SWP_StID'],
        where: { SWP_UserID: userIds },
      });

      const dncSectorsWorkPoligons = await TDNCSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['DNCSWP_UserID', 'DNCSWP_DNCSID'],
        where: { DNCSWP_UserID: userIds },
      });

      const ecdSectorsWorkPoligons = await TECDSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['ECDSWP_UserID', 'ECDSWP_ECDSID'],
        where: { ECDSWP_UserID: userIds },
      });

      data = data.map((user) => {
        return {
          ...user._doc,
          stationWorkPoligons: stationWorkPoligons
            .filter((poligon) => poligon.SWP_UserID === String(user._id))
            .map((poligon) => poligon.SWP_StID),
          dncSectorsWorkPoligons: dncSectorsWorkPoligons
            .filter((poligon) => poligon.DNCSWP_UserID === String(user._id))
            .map((poligon) => poligon.DNCSWP_DNCSID),
          ecdSectorsWorkPoligons: ecdSectorsWorkPoligons
            .filter((poligon) => poligon.ECDSWP_UserID === String(user._id))
            .map((poligon) => poligon.ECDSWP_ECDSID),
        };
      });

      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Проверяет наличие в БД объекта роли по его id.
 *
 * @param {ObjectId} roleId - id роли
 */
const checkRoleExists = async (roleId) => {
  if (!roleId) {
    return null;
  }
  return await Role.findOne({ _id: roleId });
}


/**
 * Обработка запроса на регистрацию нового пользователя.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может зарегистрировать любого пользователя,
 * а иное лицо сможет зарегистрировать пользователя лишь в рамках своей службы.
 *
 * Параметры тела запроса:
 *  _id - идентификатор пользователя (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * login - логин пользователя (обязателен),
 * password - пароль пользователя (обязателен),
 * name - имя пользователя (обязательно),
 * fatherName - отчество пользователя (не обязательно),
 * surname - фамилия пользователя (обязательна),
 * service - наименование службы (необязательно),
 * post - должность (обязательна),
 * roles - массив ролей (не обязателен),
 *         каждый элемент массива - строка с id роли,
 * stations - массив рабочих полигонов-станций (не обязателен),
 *            каждый элемент массива - строка с id станции,
 * dncSectors - массив рабочих полигонов-участков ДНЦ (не обязателен),
 *              каждый элемент массива - строка с id участка ДНЦ,
 * ecdSectors - массив рабочих полигонов-участков ЭЦД (не обязателен),
 *              каждый элемент массива - строка с id участка ЭЦД,
 */
router.post(
  '/register',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [REGISTER_USER_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  registerValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе регистрационные данные
    const {
      _id,
      login,
      password,
      name,
      fatherName,
      surname,
      post,
      service,
      roles,
      stations,
      dncSectors,
      ecdSectors,
    } = req.body;

    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    if (!isMainAdmin(req) && (serviceName !== service)) {
      return res.status(ERR).json({ message: `У Вас нет полномочий на регистрацию пользователя в службе ${service}` });
    }

    // транзакция MS SQL
    const sequelize = req.sequelize;
    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции регистрации пользователя не определен объект транзакции' });
    }
    const t = await sequelize.transaction();

    // транзакция MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Ищем в БД пользователя, login которого совпадает с переданным пользователем
      const candidate = await User.findOne({ login }).session(session);

      // Если находим, то процесс регистрации продолжать не можем
      if (candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Пользователь с таким логином уже существует' });
      }

      if (roles) {
        for (let role of roles) {
          if (!await checkRoleExists(role)) {
            await t.rollback();
            await session.abortTransaction();
            return res.status(ERR).json({ message: 'Для пользователя определены несуществующие роли' });
          }
        }
      }

      // Получаем хеш заданного пользователем пароля
      const hashedPassword = await bcrypt.hash(password, 12);

      // Создаем в БД нового пользователя
      const userObj = {
        login,
        password: hashedPassword,
        name,
        fatherName,
        surname,
        post,
        service: service || null,
        roles: roles || [],
      };
      let user;
      if (_id) {
        user = new User({ _id, ...userObj });
      } else {
        user = new User(userObj);
      }
      await user.save({ session });

      // Определяем, при необходимости, для созданного пользователя рабочие полигоны

      if (stations && stations.length) {
        // Проверяю начилие в БД всех станций, которые необходимо связать с заданным пользователем
        const stationObjects = await TStation.findAll({
          where: { St_ID: stations },
          transaction: t,
        });

        if (!stationObjects || stationObjects.length !== stations.length) {
          await t.rollback();
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Не все станции найдены в базе' });
        }

        // Создаем в БД рабочие полигоны-станции для заданного пользователя
        for (let id of stations) {
          await TStationWorkPoligon.create({
            SWP_UserID: String(user._id),
            SWP_StID: id,
          }, { transaction: t });
        }
      }

      if (dncSectors && dncSectors.length) {
        // Проверяю начилие в БД всех участков ДНЦ, которые необходимо связать с заданным пользователем
        const dncSectorObjects = await TDNCSector.findAll({
          where: { DNCS_ID: dncSectors },
          transaction: t,
        });

        if (!dncSectorObjects || dncSectorObjects.length !== dncSectors.length) {
          await t.rollback();
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Не все участки ДНЦ найдены в базе' });
        }

        // Создаем в БД рабочие полигоны-участки ДНЦ для заданного пользователя
        for (let id of dncSectors) {
          await TDNCSectorWorkPoligon.create({
            DNCSWP_UserID: String(user._id),
            DNCSWP_DNCSID: id,
          }, { transaction: t });
        }
      }

      if (ecdSectors && ecdSectors.length) {
        // Проверяю начилие в БД всех участков ЭЦД, которые необходимо связать с заданным пользователем
        const ecdSectorObjects = await TECDSector.findAll({
          where: { ECDS_ID: ecdSectors },
          transaction: t,
        });

        if (!ecdSectorObjects || ecdSectorObjects.length !== ecdSectors.length) {
          await t.rollback();
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Не все участки ЭЦД найдены в базе' });
        }

        // Создаем в БД рабочие полигоны-участки ЭЦД для заданного пользователя
        for (let id of ecdSectors) {
          await TECDSectorWorkPoligon.create({
            ECDSWP_UserID: String(user._id),
            ECDSWP_ECDSID: id,
          }, { transaction: t });
        }
      }

      await t.commit();
      await session.commitTransaction();

      const resObj = {
        ...user._doc,
        stationWorkPoligons: stations,
        dncSectorsWorkPoligons: dncSectors,
        ecdSectorsWorkPoligons: ecdSectors,
      };

      res.status(OK).json({ message: 'Регистрация прошла успешно', user: resObj });

    } catch (error) {
      console.log(error.message);
      await t.rollback();
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обработка запроса на добавление новой роли пользователю.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может добавить любую роль любому пользователю,
 * а иное лицо сможет добавить роль пользователю, принадлежащему его службе, кроме того,
 * роль должна быть доступна добавляющему для добавления ее пользователю.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * roleId - идентификатор роли (обязателен)
 */
router.post(
  '/addRole',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_USER_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addRoleValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId, roleId } = req.body;

      // Ищем в БД пользователя, id которого совпадает с переданным
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то процесс добавления роли продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      if (!isMainAdmin(req) && (serviceName !== candidate.service)) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на добавление роли пользователю в службе ${candidate.service}` });
      }

      // Среди ролей пользователя ищем такую, id которой совпадает с переданным пользователем
      for (let role of candidate.roles) {
        if (String(role) === String(roleId)) {
          return res.status(ERR).json({ message: 'Данная роль уже определена для данного пользователя' });
        }
      }

      // Проверяю роль на присутствие в БД
      const role = await checkRoleExists(roleId);
      if (!role) {
        return res.status(ERR).json({ message: 'Роль не существует в базе данных' });
      }

      if (!isMainAdmin(req) && !role.subAdminCanUse) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на добавление роли ${englAbbreviation} пользователю` });
      }

      // Сохраняем информацию о новой роли в БД
      candidate.roles.push(roleId);

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на вход в систему.
 *
 * Параметры тела запроса:
 * login - логин пользователя (обязателен),
 * password - пароль пользователя (обязателен),
 */
router.post(
  '/login',
  // проверка параметров запроса
  loginValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе login, password
      const { login, password } = req.body;

      // Ищем в БД пользователя, login которого совпадает с переданным пользователем
      const user = await User.findOne({ login });

      // Если не находим, то процесс входа в систему продолжать не можем
      if (!user) {
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      // Проверяем переданный пользователем пароль
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(ERR).json({ message: 'Неверный пароль, попробуйте снова' });
      }

      // Сформируем список аббревиатур ролей пользователя.
      // Данный список передадим пользователю.
      const rolesAbbreviations = [];

      // Сформируем список кратких наименований приложений с соответствующими краткими
      // наименованиями полномочий пользователя в рамках данных приложений.
      // Данный список передадим пользователю.
      const appsCredentials = [];

      // Вспомогательная функция, позволяющая добавить в rolesAbbreviations аббревиатуру роли.
      // При добавлении информации функция избегает дублирования.
      function addUserRole(userRole) {
        let foundRole = false;
        for (let i = 0; i < rolesAbbreviations.length; i += 1) {
          if (rolesAbbreviations[i] === userRole) {
            foundRole = true;
            break;
          }
        }
        if (!foundRole) {
          rolesAbbreviations.push(userRole);
        }
      }

      // Вспомогательная функция, позволяющая определить, есть ли среди элементов
      // заданного массива полномочий такой, id которого совпадает с заданным id.
      // Если есть, функция возвращает аббревиатуру соответствующего полномочия.
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

          // Формируем массив аббревиатур ролей пользователя
          addUserRole(foundRole.englAbbreviation);

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

      // Осталось извлечь перечень рабочих полигонов пользователя (точнее, их id)

      const stations = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_StID'],
        where: { SWP_UserID: String(user._id) },
      });

      const dncSectors = await TDNCSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['DNCSWP_DNCSID'],
        where: { DNCSWP_UserID: String(user._id) },
      });

      const ecdSectors = await TECDSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['ECDSWP_ECDSID'],
        where: { ECDSWP_UserID: String(user._id) },
      });

      // Создаем JWT-токен (as string) для успешно вошедшего в систему пользователя.
      // JWT состоит из трех частей: заголовок (header - JSON-объект, содержит информацию о том,
      // как должна вычисляться JWT подпись), полезные данные (payload) и
      // подпись (signature - получается так: алгоритм base64url кодирует header и payload, соединяет
      // закодированные строки через точку, затем полученная строка хешируется алгоритмом, заданном в
      // header на основе секретного ключа).
      // Здесь производится synchronous sign with default (HMAC SHA256).

      const token = jwt.sign(
        {
          userId: user._id,
          service: user.service,
          roles: rolesAbbreviations,
          credentials: appsCredentials,
          stationWorkPoligons: stations,
          dncSectorsWorkPoligons: dncSectors,
          ecdSectorsWorkPoligons: ecdSectors,
        },
        jwtSecret,
        //{ expiresIn: '1h' }
      );

      if (!user.online) {
        user.online = true;
        await user.save();
      }

      res.status(OK).json({
        token,
        userId: user._id,
        userInfo: {
          name: user.name,
          fatherName: user.fatherName,
          surname: user.surname,
          service: user.service,
          post: user.post,
        },
        roles: rolesAbbreviations,
        credentials: appsCredentials,
        stationWorkPoligons: stations,
        dncSectorsWorkPoligons: dncSectors,
        ecdSectorsWorkPoligons: ecdSectors,
      });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление пользователя.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может удалить любого пользователя,
 * иное же лицо может удалить лишь того пользователя, который закреплен за его службой.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен)
 */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_USER_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delUserValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    // транзакция MS SQL
    const sequelize = req.sequelize;
    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции регистрации пользователя не определен объект транзакции' });
    }
    const t = await sequelize.transaction();

    // транзакция MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId } = req.body;

      const candidate = await User.findOne({ _id: userId });

      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      if (!isMainAdmin(req) && (serviceName !== candidate.service)) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: `У Вас нет полномочий на удаление пользователя в службе ${candidate.service}` });
      }

      // Удаляем в БД запись о пользователе
      await User.deleteOne({ _id: userId });

      // Удаляем также информацию о его рабочих полигонах
      await TStationWorkPoligon.destroy({
        where: {
          SWP_UserID: userId,
        },
        transaction: t,
      });
      await TDNCSectorWorkPoligon.destroy({
        where: {
          DNCSWP_UserID: userId,
        },
        transaction: t,
      });
      await TECDSectorWorkPoligon.destroy({
        where: {
          ECDSWP_UserID: userId,
        },
        transaction: t,
      });

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
 * Обработка запроса на удаление роли пользователя.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может удалить роль любого пользователя,
 * иное же лицо может удалить лишь роль того пользователя, который закреплен за его службой.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * roleId - идентификатор роли (обязателен)
 */
router.post(
  '/delRole',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_USER_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delRoleValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId, roleId } = req.body;

      // Ищем в БД пользователя, id которого совпадает с переданным
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то процесс удаления роли продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      if (!isMainAdmin(req) && (serviceName !== candidate.service)) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на удаление роли пользователя в службе ${candidate.service}` });
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
        return res.status(ERR).json({ message: 'Указанная роль не определена для данного пользователя' });
      }

      // Сохраняем информацию в БД
      candidate.roles = candidate.roles.filter((role) => String(role) !== String(roleId));

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о пользователе.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может редактировать информацию о любои пользователе,
 * иное же лицо может отредактировать информацию лишь о том пользователе, который закреплен за его службой.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * login - логин пользователя (не обязателен),
 * password - пароль пользователя (не обязателен),
 * name - имя пользователя (не обязательно),
 * fatherName - отчество пользователя (не обязательно),
 * surname - фамилия пользователя (не обязательна),
 * post - наименование должности (не обязательно),
 * service - наименование службы (не обязательно),
 * roles - массив ролей (не обязателен; если задан и не пуст, то каждый элемент массива - строка с id роли)
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_USER_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modUserValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Считываем находящиеся в пользовательском запросе данные, которые понадобятся для дополнительных проверок
      // (остальными просто обновим запись в БД, когда все проверки будут пройдены)
      const { userId, login, password, service, roles } = req.body;

      if (!isMainAdmin(req) && (service !== serviceName)) {
        return res.status(ERR).json({ message: 'Вы не можете изменить принадлежность пользователя службе' });
      }

      // Ищем в БД пользователя, id которого совпадает с переданным
      let candidate = await User.findById(userId);

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный пользователь не существует в базе данных' });
      }

      if (!isMainAdmin(req) && (serviceName !== candidate.service)) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на редактирование информации о пользователе в службе ${candidate.service}` });
      }

      // Ищем в БД пользователя, login которого совпадает с переданным пользователем
      let antiCandidate;

      if (login) {
        antiCandidate = await User.findOne({ login });
      }

      // Если находим, то смотрим, тот ли это самый пользователь. Если нет, продолжать не можем.
      if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
        return res.status(ERR).json({ message: 'Пользователь с таким логином уже существует' });
      }

      if (roles) {
        for (let role of roles) {
          if (!await checkRoleExists(role)) {
            return res.status(ERR).json({ message: 'Для пользователя определены несуществующие роли' });
          }
        }
      }
      // Редактируем поля объекта перед его сохранением в БД
      if (req.body.hasOwnProperty('password')) {
        req.body.password = await bcrypt.hash(password, 12);
      }
      delete req.body.userId;
      candidate = Object.assign(candidate, req.body);

      // Редактируем в БД запись
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', user: candidate });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
