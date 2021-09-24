const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  getDefinitUsersValidationRules,
  changeECDSectorWorkPoligonsValidationRules,
} = require('../validators/ecdSectorWorkPoligons.validator');
const validate = require('../validators/validate');
const { TECDSector } = require('../models/TECDSector');
const User = require('../models/User');
const { TECDSectorWorkPoligon } = require('../models/TECDSectorWorkPoligon');

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
 * Обрабатывает запрос на получение списка всех рабочих полигонов-участков ЭЦД.
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
      const data = await TECDSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['ECDSWP_UserID', 'ECDSWP_ECDSID'],
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
 * участок ЭЦД с одним из заданных id.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorIds - id участков ЭЦД (обязателен)
 * onlyOnline - true, если необходимо получить список лишь тех пользователей, которые в данный
 *              момент online; false - если необходимо получить список всех пользователей
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
      const { sectorIds, onlyOnline } = req.body;

      const users = await TECDSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['ECDSWP_UserID', 'ECDSWP_ECDSID'],
        where: { ECDSWP_ECDSID: sectorIds },
      });

      let data;
      if (users) {
        const searchCondition = { _id: users.map((item) => item.ECDSWP_UserID) };
        if (onlyOnline) {
          searchCondition.online = true;
        }
        data = await User.find(searchCondition);
      }

      if (data) {
        data = data.map((user) => {
          return {
            _id: user._id,
            name: user.name,
            fatherName: user.fatherName,
            surname: user.surname,
            online: user.online,
            post: user.post,
            service: user.service,
            ecdSectorId: users.find((item) => String(item.ECDSWP_UserID) === String(user._id)).ECDSWP_ECDSID,
          };
        });
      }

      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка рабочих полигонов-участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * ecdSectorIds - массив идентификаторов участков ЭЦД, которые необходимо определить как рабочие
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
  changeECDSectorWorkPoligonsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции изменения списка рабочих полигонов-участков ЭЦД не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId, ecdSectorIds } = req.body;

      // Ищем в БД пользователя с заданным id
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      // Удаляю все рабочие полигоны-участки ЭЦД для заданного пользователя в БД (перед обновлением списка)
      await TECDSectorWorkPoligon.destroy({
        where: {
          ECDSWP_UserID: userId,
        },
        transaction: t,
      });

      if (ecdSectorIds && ecdSectorIds.length) {
        // Проверяю начилие в БД всех участков ЭЦД, которые необходимо связать с заданным пользователем
        const ecdSectors = await TECDSector.findAll({
          where: { ECDS_ID: ecdSectorIds },
          transaction: t,
        });

        if (!ecdSectors || ecdSectors.length !== ecdSectorIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все участки ЭЦД найдены в базе' });
        }

        // Создаем в БД рабочие полигоны-участки ЭЦД для заданного пользователя
        for (let id of ecdSectorIds) {
          await TECDSectorWorkPoligon.create({
            ECDSWP_UserID: userId,
            ECDSWP_ECDSID: id,
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
