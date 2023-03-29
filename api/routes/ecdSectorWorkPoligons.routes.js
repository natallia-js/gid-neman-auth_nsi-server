const { Router } = require('express');
const mongoose = require('mongoose');
const {
  getDefinitUsersValidationRules,
  changeECDSectorWorkPoligonsValidationRules,
} = require('../validators/ecdSectorWorkPoligons.validator');
const validate = require('../validators/validate');
const User = require('../models/User');
const { TECDSectorWorkPoligon } = require('../models/TECDSectorWorkPoligon');
const matchUserRolesToAppsAndCreds = require('./additional/matchUserRolesToAppsAndCreds');
const getUserCredsInApps = require('./additional/getUserCredsInApps');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS, SUCCESS_ADD_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех рабочих полигонов-участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ECD_SECTOR_WORK_POLIGONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TECDSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['ECDSWP_UserID', 'ECDSWP_ECDSID'],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех рабочих полигонов-участков ЭЦД',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение информации обо всех пользователях, у которых рабочий полигон -
 * участок ЭЦД с одним из заданных id. Если один пользователь зарегистрирован на нескольких участках
 * ЭЦД, то запрос вернет такого пользователя для каждой из записей об участке ЭЦД, на котором он
 * зарегистрирован.
 * Работает только с теми пользователями, заявка на регистрацию которых подтверждена!
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorIds - id участков ЭЦД (обязателен)
 * onlyOnline - (пока НЕ РАБОТАЕТ: данное поле отсутствует в БД!!!)
 *              true, если необходимо получить список лишь тех пользователей, которые в данный
 *              момент online; false - если необходимо получить список всех пользователей
 * credsGroups - массив объектов с полями credsGroup (строка-условное наименование группы полномочий в приложениях
 *        ГИД Неман из коллекции appcreds в БД) и creds - массив строк-наименований полномочий группы;
 *        параметр credsGroups используется для поиска для каждого пользователя дополнительной информации о его
 *        полномочиях (из заданного списка) в каждой из указанных групп
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_USERS_WITH_GIVEN_ECD_SECTOR_WORK_POLIGONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefinitUsersValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { sectorIds, onlyOnline, credsGroups } = req.body;

    try {
      // Сюда помещу извлеченную и БД информацию о ролях, связанных с указанными в запросе приложениями
      const roles = await matchUserRolesToAppsAndCreds(credsGroups);

      const users = await TECDSectorWorkPoligon.findAll({
        raw: true,
        attributes: ['ECDSWP_UserID', 'ECDSWP_ECDSID'],
        where: { ECDSWP_ECDSID: sectorIds },
      });

      let data;
      if (users && users.length) {
        const searchCondition = {
          _id: users.map((item) => item.ECDSWP_UserID),
          confirmed: true,
        };
        if (onlyOnline) {
          searchCondition.online = true;
        }
        data = await User.find(searchCondition);
      }

      const dataToReturn = [];
      if (data && data.length) {
        users.forEach((user) => {
          const userInfo = data.find((ui) => String(ui._id) === String(user.ECDSWP_UserID));
          if (!userInfo) {
            return;
          }
          dataToReturn.push({
            _id: user.ECDSWP_UserID,
            name: userInfo.name,
            fatherName: userInfo.fatherName,
            surname: userInfo.surname,
            appsCredentials: getUserCredsInApps(roles, userInfo.roles),
            online: userInfo.online,
            post: userInfo.post,
            service: userInfo.service,
            userService: userInfo.userService,
            ecdSectorId: user.ECDSWP_ECDSID,
            contactData: userInfo.contactData,
          });
        });
      }

      res.status(OK).json(dataToReturn);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации обо всех пользователях, у которых рабочий полигон - участок ЭЦД с одним из заданных id',
        error: error.message,
        actionParams: { sectorIds, onlyOnline, credsGroups },
      });
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
 *                полигоны для данного пользователя (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/change',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_USER_ECD_SECTOR_WORK_POLIGONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  changeECDSectorWorkPoligonsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции изменения списка рабочих полигонов-участков ЭЦД не определен объект транзакции' });
    }

    // транзакция MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    // транзакция MS SQL
    const t = await sequelize.transaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { userId, ecdSectorIds } = req.body;

    try {
      // Ищем в БД пользователя с заданным id
      const candidate = await User.findOne({ _id: userId });

      // Если не находим, то продолжать не можем
      if (!candidate) {
        await t.rollback();
        await session.abortTransaction();
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
        // Не проверяю начилие в БД всех участков ЭЦД, которые необходимо связать с заданным пользователем,
        // т.к. модель TECDSectorWorkPoligon определяет соответствующий внешний ключ

        // Создаем в БД рабочие полигоны-участки ЭЦД для заданного пользователя
        for (let id of ecdSectorIds) {
          await TECDSectorWorkPoligon.create({
            ECDSWP_UserID: userId,
            ECDSWP_ECDSID: id,
          }, { transaction: t });
        }
      }

      candidate.lastEditDateTime = new Date();
      await candidate.save({ session });

      await t.commit();
      await session.commitTransaction();

      res.status(OK).json({ message: SUCCESS_ADD_MESS });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Изменение списка рабочих полигонов-участков ЭЦД',
        error: error.message,
        actionParams: { userId, ecdSectorIds },
      });
      try { await t.rollback(); await session.abortTransaction(); } catch {}
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
