const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  changeStationWorkPoligonsValidationRules,
} = require('../validators/stationWorkPoligons.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const User = require('../models/User');
const { TStationWorkPoligon } = require('../models/TStationWorkPoligon');

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
 * Обрабатывает запрос на получение списка всех рабочих полигонов-станций.
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
      const data = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_UserID', 'SWP_StID'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение id всех пользователей, у которых рабочий полигон -
 * станция с одним из заданных id.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationIds - id станций (обязателен)
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
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { stationIds } = req.body;

      const userIds = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_UserID'],
        where: { SWP_StID: stationIds },
      });

      let data;
      if (userIds) {
        data = await User.find({ _id: userIds.map((item) => item.SWP_UserID) });
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
          };
        });
      }

      res.status(OK).json(data || []);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка рабочих полигонов-станций.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * stationIds - массив идентификаторов станций, которые необходимо определить как рабочие
 *              полигоны для данного пользователя (обязателен)
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
  changeStationWorkPoligonsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции изменения списка рабочих полигонов-станций не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId, stationIds } = req.body;

      // Ищем в БД пользователя с заданным id
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      // Удаляю все рабочие полигоны-станции для заданного пользователя в БД (перед обновлением списка)
      await TStationWorkPoligon.destroy({
        where: {
          SWP_UserID: userId,
        },
        transaction: t,
      });

      if (stationIds && stationIds.length) {
        // Проверяю начилие в БД всех станций, которые необходимо связать с заданным пользователем
        const stations = await TStation.findAll({
          where: { St_ID: stationIds },
          transaction: t,
        });

        if (!stations || stations.length !== stationIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все станции найдены в базе' });
        }

        // Создаем в БД рабочие полигоны-станции для заданного пользователя
        for (let id of stationIds) {
          await TStationWorkPoligon.create({
            SWP_UserID: userId,
            SWP_StID: id,
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
