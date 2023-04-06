const { Router } = require('express');
const mongoose = require('mongoose');
const {
  getDefinitUsersValidationRules,
  changeStationWorkPoligonsValidationRules,
} = require('../validators/stationWorkPoligons.validator');
const validate = require('../validators/validate');
const User = require('../models/User');
const { TStationWorkPoligon } = require('../models/TStationWorkPoligon');
const matchUserRolesToAppsAndCreds = require('./additional/matchUserRolesToAppsAndCreds');
const getUserCredsInApps = require('./additional/getUserCredsInApps');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS, SUCCESS_ADD_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех рабочих полигонов-станций.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_STATION_WORK_POLIGONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_UserID', 'SWP_StID', 'SWP_StWP_ID'],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех рабочих полигонов-станций',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение id всех пользователей, у которых рабочий полигон -
 * станция с одним из заданных id. В выборку включаются также пользователи, у которых
 * рабочий полигон - рабочее место на указанных станциях. Если один пользователь
 * зарегистрирован на нескольких станциях, то запрос вернет такого пользователя для каждой
 * из записей о станции, где он зарегистрирован.
 * Работает только с теми пользователями, заявка на регистрацию которых подтверждена!
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationIds - id станций (обязателен)
 * onlyOnline - (пока НЕ РАБОТАЕТ: данное поле отсутствует в БД!!!)
 *              true, если необходимо получить список лишь тех пользователей, которые в данный
 *              момент online; false - если необходимо получить список всех пользователей
 * credsGroups - массив объектов с полями credsGroup (строка-условное наименование группы полномочий в приложениях
 *        ГИД Неман из коллекции appcreds в БД) и creds - массив строк-наименований полномочий группы;
 *        параметр credsGroups используется для поиска для каждого пользователя дополнительной информации о его
 *        полномочиях (из заданного списка) в каждой из указанных групп
 * includeWorkPlaces - если true, то в выборку включаются все пользователи станций; если false, то
 *                     в выборку включаются только "главные" на станциях с рабочим полигоном "станция" и
 *                     не включаются пользователи с рабочим полигоном "рабочее место на станции",
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_STATION_WORK_POLIGONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefinitUsersValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationIds, onlyOnline, credsGroups, includeWorkPlaces } = req.body;

    try {
      // Сюда помещу извлеченную и БД информацию о ролях, связанных с указанными в запросе приложениями
      const roles = await matchUserRolesToAppsAndCreds(credsGroups);

      const filter = {
        SWP_StID: stationIds,
      };
      if (includeWorkPlaces === false) {
        filter.SWP_StWP_ID = null;
      }

      // Ищем id пользователей и id соответствующих им рабочих полигонов (станций и рабочих мест на станциях)
      const users = await TStationWorkPoligon.findAll({
        raw: true,
        attributes: ['SWP_UserID', 'SWP_StID', 'SWP_StWP_ID'],
        where: filter,
      });

      // По найденным id пользователей ищем полную информацию по данным лицам
      let data;
      if (users) {
        const searchCondition = {
          _id: users.map((item) => item.SWP_UserID),
          confirmed: true,
        };
        if (onlyOnline) {
          searchCondition.online = true;
        }
        data = await User.find(searchCondition);
      }

      const dataToReturn = [];
      if (data?.length) {
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
            appsCredentials: getUserCredsInApps(roles, userInfo.roles),
            online: userInfo.online,
            post: userInfo.post,
            service: userInfo.service,
            userService: userInfo.userService,
            stationId: user.SWP_StID,
            stationWorkPlaceId: user.SWP_StWP_ID,
            contactData: userInfo.contactData,
          });
        });
      }

      res.status(OK).json(dataToReturn);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации о пользователях, у которых рабочий полигон - станция с одним из заданных id',
        error: error.message,
        actionParams: { stationIds, onlyOnline, credsGroups, includeWorkPlaces },
      });
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
 *            станции (id) и рабочего места в рамках данной станции (workPlaceId, необязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/change',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_USER_STATION_WORK_POLIGONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
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

    // транзакция MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    // транзакция MS SQL
    const t = await sequelize.transaction();

    try {
      // Ищем в БД пользователя с заданным id
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то продолжать не можем
      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Пользователь не найден' });
      }

      // Удаляю все рабочие полигоны-станции для заданного пользователя в БД (перед обновлением списка)
      await TStationWorkPoligon.destroy({
        where: {
          SWP_UserID: userId,
        },
        transaction: t,
      });

      if (poligons?.length) {
        // Не проверяю начилие в БД всех станций, которые необходимо связать с заданным пользователем,
        // т.к. модель TStationWorkPoligon определяет соответствующий внешний ключ

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

      candidate.lastEditDateTime = new Date();
      await candidate.save({ session });

      await t.commit();
      await session.commitTransaction();

      res.status(OK).json({ message: SUCCESS_ADD_MESS });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Изменение списка рабочих полигонов-станций',
        error: error.message,
        actionParams: { userId, poligons },
      });
      try { await t.rollback(); await session.abortTransaction(); } catch {}
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса от ГИД на получение списка лиц, являющихся работниками определенных станций
 * и имеющими определенные должности. Запрос возвращает полную информацию только по тем пользователям,
 * информация по которым изменилась. Если информация по пользователю не изменилась, то по нему будет
 * возвращена лишь информация о его id.
 *
 * Параметры запроса:
 * stationUNMCs - массив строк с "ЕСР кодами ГИД" станций
 * posts - массив строк с названиями должностей
 * lastRequestDateTime - дата-время, начиная с которого проверять наличие изменений в информации по пользователям
 */
router.post(
  '/definitDataForGID',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATION_USERS_FOR_GID; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {

    if (!req.sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции получения данных не определен объект для обращения к БД' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const { stationUNMCs, posts, lastRequestDateTime } = req.body;

    const actionTitle = 'Получение информации о пользователях на станциях для ГИД (с учетом ее изменений)';
    const actionParams = { stationUNMCs, posts, lastRequestDateTime };

    let lastTimeUserRequestedData = new Date(2000, 1, 1, 0, 0, 0);
    if (lastRequestDateTime) {
      try {
        lastTimeUserRequestedData = new Date(lastRequestDateTime);
      } catch (error) {
        return res.status(ERR).json({ message: 'Неверный формат даты' });
      }
    }

    try {
      // Вначале по ГИД-кодам ЕСР станций найдем их id
      const { TStation } = require('../models/TStation');
      let stationIds = await TStation.findAll({ raw: true, attributes: ['St_ID'], where: { St_GID_UNMC: stationUNMCs } });
      if (!stationIds?.length)
        return res.status(ERR).json({ message: `Указанные станции не найдены: ${stationUNMCs}` });
      stationIds = stationIds.map((el) => el.St_ID);

      // Ищем id пользователей и id соответствующих им рабочих полигонов-станций (сюда же войдут пользователи,
      // зарегистрированные лишь на рабочих местах операторов на станциях)
      const { QueryTypes } = require('sequelize');
      const userWorkPoligons = await req.sequelize.query(
        `SELECT DISTINCT SWP_UserID FROM TStationWorkPoligons WHERE SWP_StID IN (${stationIds})`,
        { type: QueryTypes.SELECT }
      );

      let dataToReturn = [];

      // По найденным id пользователей ищем интересующую информацию по данным лицам
      if (userWorkPoligons?.length) {
        const searchCondition = {
          _id: userWorkPoligons.map((item) => item.SWP_UserID),
          post: posts,
          confirmed: true,
        };
        const projection = {
          _id: 1, name: 1, surname: 1, fatherName: 1, post: 1, lastEditDateTime: 1,
        }
        const users = await User.find(searchCondition, projection);

        if (users?.length) {
          dataToReturn = users.map((user) => {
            // Если информация по пользователю с момента последнего запроса изменилась, то высылаем новую
            if (user.lastEditDateTime >= lastTimeUserRequestedData) {
              return {
                _id: user._id,
                name: user.name,
                fatherName: user.fatherName,
                surname: user.surname,
                post: user.post,
                changed: true,
              };
            } else {
              // Если информация по пользователю с момента последнего запроса не изменилась, то высылаем id этого пользователя
              return { _id: user._id, changed: false };
            }
          });
        }
      }

      res.status(OK).json(dataToReturn);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: actionTitle,
        error: error.message,
        actionParams,
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса от ГИД на получение списка лиц, являющихся работниками определенных станций
 * и имеющими определенные должности.
 *
 * Параметры запроса:
 * stationUNMCs - массив строк с "ЕСР кодами ГИД" станций
 * posts - массив строк с названиями должностей
 */
router.post(
  '/stationsUsers',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATION_USERS_FOR_GID; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {

    if (!req.sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции получения данных не определен объект для обращения к БД' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const { stationUNMCs, posts } = req.body;

    const actionTitle = 'Получение информации о пользователях на станциях для ГИД';
    const actionParams = { stationUNMCs, posts };

    try {
      // Вначале по ГИД-кодам ЕСР станций найдем их id
      const { TStation } = require('../models/TStation');
      let stations = await TStation.findAll({
        raw: true,
        attributes: ['St_ID','St_UNMC','St_GID_UNMC'],
        where: { St_GID_UNMC: stationUNMCs },
      });
      if (!stations?.length)
        return res.status(ERR).json({ message: `Указанные станции не найдены: ${stationUNMCs}` });

      // Ищем id пользователей и id соответствующих им рабочих полигонов-станций (сюда войдут все пользователи,
      // зарегистрированные на разных рабочих местах на станциях)
      const { QueryTypes } = require('sequelize');
      const userWorkPoligons = await req.sequelize.query(
        `SELECT DISTINCT SWP_UserID, SWP_StID FROM TStationWorkPoligons WHERE SWP_StID IN (${stations.map((el) => el.St_ID)})`,
        { type: QueryTypes.SELECT }
      );

      let dataToReturn = [];

      // По найденным id пользователей ищем интересующую информацию по данным лицам
      if (userWorkPoligons?.length) {
        const searchCondition = {
          _id: userWorkPoligons.map((item) => item.SWP_UserID),
          post: posts,
          confirmed: true,
        };
        const projection = {
          _id: 1, name: 1, surname: 1, fatherName: 1, post: 1,
        }
        const users = await User.find(searchCondition, projection);

        if (users?.length) {
          dataToReturn = userWorkPoligons
            .map((item) => {
              const user = users.find((el) => String(el._id) === String(item.SWP_UserID));
              if (!user) return null;
              const station = stations.find((st) => st.St_ID === item.SWP_StID);
              return {
                _id: user._id,
                name: user.name,
                fatherName: user.fatherName,
                surname: user.surname,
                post: user.post,
                station_UNMC: station.St_UNMC,
                stationGID_UNMC: station.St_GID_UNMC,
              };
            })
            .filter((el) => el);
        }
      }

      res.status(OK).json(dataToReturn);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: actionTitle,
        error: error.message,
        actionParams,
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
