const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  getDefinitUsersValidationRules,
  changeDNCSectorWorkPoligonsValidationRules,
} = require('../validators/dncSectorWorkPoligons.validator');
const validate = require('../validators/validate');
const User = require('../models/User');
const { TDNCSectorWorkPoligon } = require('../models/TDNCSectorWorkPoligon');
const matchUserRolesToAppsAndCreds = require('./additional/matchUserRolesToAppsAndCreds');
const getUserCredsInApps = require('./additional/getUserCredsInApps');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_USERS_ACTION,
  MOD_USER_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех рабочих полигонов-участков ДНЦ.
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
      creds: [GET_ALL_USERS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TDNCSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['DNCSWP_UserID', 'DNCSWP_DNCSID'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение информации обо всех пользователях, у которых рабочий полигон -
 * участок ДНЦ с одним из заданных id. Если один пользователь зарегистрирован на нескольких участках
 * ДНЦ, то запрос вернет такого пользователя для каждой из записей об участке ДНЦ, на котором он
 * зарегистрирован.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorIds - id участков ДНЦ (обязателен)
 * onlyOnline - (пока НЕ РАБОТАЕТ: данное поле отсутствует в БД!!!)
 *              true, если необходимо получить список лишь тех пользователей, которые в данный
 *              момент online; false - если необходимо получить список всех пользователей
 * apps - массив объектов с полями app (строка-условное наименование приложения ГИД Неман из коллекции apps) и
 *        creds - массив строк - наименований полномочий в соответствующем приложении;
 *        параметр apps используется для поиска для каждого пользователя дополнительной информации о его
 *        полномочиях (из заданного списка) в каждом из указанных приложений
 */
 router.post(
  '/definitData',
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
  // проверка параметров запроса
  getDefinitUsersValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorIds, onlyOnline, apps } = req.body;

      // Сюда помещу извлеченную и БД информацию о ролях, связанных с указанными в запросе приложениями
      const roles = await matchUserRolesToAppsAndCreds(apps);

      const users = await TDNCSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['DNCSWP_UserID', 'DNCSWP_DNCSID'],
        where: { DNCSWP_DNCSID: sectorIds },
      });

      let data;
      if (users) {
        const searchCondition = { _id: users.map((item) => item.DNCSWP_UserID) };
        if (onlyOnline) {
          searchCondition.online = true;
        }
        data = await User.find(searchCondition);
      }

      const dataToReturn = [];
      if (data && data.length) {
        users.forEach((user) => {
          const userInfo = data.find((ui) => String(ui._id) === String(user.DNCSWP_UserID));
          if (!userInfo) {
            return;
          }
          dataToReturn.push({
            _id: user.DNCSWP_UserID,
            name: userInfo.name,
            fatherName: userInfo.fatherName,
            surname: userInfo.surname,
            appsCredentials: getUserCredsInApps(roles, userInfo.roles),
            online: userInfo.online,
            post: userInfo.post,
            service: userInfo.service,
            dncSectorId: user.DNCSWP_DNCSID,
          });
        });
      }

      res.status(OK).json(dataToReturn);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка рабочих полигонов-участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * dncSectorIds - массив идентификаторов участков ДНЦ, которые необходимо определить как рабочие
 *                полигоны для данного пользователя (обязателен)
 */
 router.post(
  '/change',
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
  changeDNCSectorWorkPoligonsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции изменения списка рабочих полигонов-участков ДНЦ не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId, dncSectorIds } = req.body;

      // Ищем в БД пользователя с заданным id
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      // Удаляю все рабочие полигоны-участки ДНЦ для заданного пользователя в БД (перед обновлением списка)
      await TDNCSectorWorkPoligon.destroy({
        where: {
          DNCSWP_UserID: userId,
        },
        transaction: t,
      });

      if (dncSectorIds && dncSectorIds.length) {
        // Проверяю начилие в БД всех участков ДНЦ, которые необходимо связать с заданным пользователем
        /*const dncSectors = await TDNCSector.findAll({
          where: { DNCS_ID: dncSectorIds },
          transaction: t,
        });

        if (!dncSectors || dncSectors.length !== dncSectorIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все участки ДНЦ найдены в базе' });
        }*/

        // Создаем в БД рабочие полигоны-участки ДНЦ для заданного пользователя
        for (let id of dncSectorIds) {
          await TDNCSectorWorkPoligon.create({
            DNCSWP_UserID: userId,
            DNCSWP_DNCSID: id,
          }, { transaction: t });
        }
      }

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      console.log(error);
      await t.rollback();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
