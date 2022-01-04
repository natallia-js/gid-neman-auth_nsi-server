const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  getDefinitUsersValidationRules,
  changeStationWorkPoligonsValidationRules,
} = require('../validators/stationWorkPoligons.validator');
const validate = require('../validators/validate');
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
        attributes: ['SWP_UserID', 'SWP_StID', 'SWP_StWP_ID'],
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
 * станция с одним из заданных id. В выборку включаются также пользователи, у которых
 * рабочий полигон - рабочее место на указанных станциях. Если один пользователь
 * зарегистрирован на нескольких станциях, то запрос вернет такого пользователя для каждой
 * из записей о станции, на котором он зарегистрирован.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationIds - id станций (обязателен)
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
      const { stationIds, onlyOnline } = req.body;

      // Ищем id пользователей и id соответствующих им рабочих полигонов (станций и рабочих мест на станциях)
      const users = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_UserID', 'SWP_StID', 'SWP_StWP_ID'],
        where: { SWP_StID: stationIds },
      });

      // По найденным id пользователей ищем полную информацию по данным лицам
      let data;
      if (users) {
        const searchCondition = { _id: users.map((item) => item.SWP_UserID) };
        if (onlyOnline) {
          searchCondition.online = true;
        }
        data = await User.find(searchCondition);
      }

      const dataToReturn = [];
      if (data && data.length) {
        users.forEach((user) => {
          const userInfo = data.find((ui) => String(ui._id) === String(user.SWP_UserID));
          if (!userInfo) {
            return;
          }
          dataToReturn.push({
            _id: user.SWP_UserID,
            name: userInfo.name,
            fatherName: userInfo.fatherName,
            surname: userInfo.surname,
            online: userInfo.online,
            post: userInfo.post,
            service: userInfo.service,
            stationId: user.SWP_StID,
            stationWorkPlaceId: user.SWP_StWP_ID,
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
 * Обработка запроса на изменение списка рабочих полигонов-станций.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * userId - идентификатор пользователя (обязателен),
 * poligons - массив объектов, содержащих информацию о том, какие станции и рабочие места в рамках
 *            данных станций необходимо определить как рабочие полигоны для данного
 *            пользователя (обязателен); каждый объект массива содержит (обязательно) идентификатор
 *            станции (id) и рабочего места в рамках данной станции (workPlaceId, необязательно)
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

    // Считываем находящиеся в пользовательском запросе данные
    const { userId, poligons } = req.body;

    const t = await sequelize.transaction();

    try {
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

      if (poligons && poligons.length) {
        // Массив уникальных id станций
        /*const stationsIds = poligons
          .map((poligon) => poligon.id)
          .filter((value, index, self) => self.indexOf(value) === index);

        // Проверяю начилие в БД всех станций, которые необходимо связать с заданным пользователем
        const stationObjects = await TStation.findAll({
          where: { St_ID: stationsIds },
          transaction: t,
        });

        if (!stationObjects || stationObjects.length !== stationsIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все станции найдены в базе' });
        }*/

        // Создаем в БД рабочие полигоны-станции для заданного пользователя
        const objectsToCreateInDatabase = [];
        for (let stationObj of poligons) {
          objectsToCreateInDatabase.push({
            SWP_UserID: userId,
            SWP_StID: stationObj.id,
            SWP_StWP_ID: stationObj.workPlaceId,
          });
        }
        await TStationWorkPoligon.bulkCreate(objectsToCreateInDatabase, { transaction: t });
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
