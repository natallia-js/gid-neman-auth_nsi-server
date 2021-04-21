const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addECDToDNCValidationRules,
  addDNCToECDValidationRules,
  delNearestDNCOrECDValidationRules,
} = require('../validators/nearestDNCandECDSectots.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TNearestDNCandECDSector } = require('../models/TNearestDNCandECDSector');
const { TDNCSector} = require('../models/TDNCSector');
const { TECDSector} = require('../models/TECDSector');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_DNCSECTORS_ACTION,
  GET_ALL_ECDSECTORS_ACTION,
  MOD_DNCSECTOR_ACTION,
  MOD_ECDSECTOR_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех ближайших участков ДНЦ и ЭЦД.
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
      creds: [GET_ALL_DNCSECTORS_ACTION, GET_ALL_ECDSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TNearestDNCandECDSector.findAll({ raw: true });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление информации о близости участков ЭЦД к данному участку ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * dncSectorId - id участка ДНЦ (обязательно),
 * ecdSectorIds - массив id участков ЭЦД (обязательно),
 */
router.post(
  '/addECDToDNC',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION, MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addECDToDNCValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { dncSectorId, ecdSectorIds } = req.body;

      // Проверяем, существует ли участок ДНЦ с указанным идентификатором
      let candidate = await TDNCSector.findOne({ where: { DNCS_ID: dncSectorId } });
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ДНЦ не существует в базе' });
      }

      // То же самое делаем для каждого заданного ближайшего участка ЭЦД, формируя массив id тех
      // переданных ближайших участков, для которых проверка завершилась успехом
      const nearECDSectorsArr = [];

      for (let id of ecdSectorIds) {
        candidate = await TECDSector.findOne({ where: { ECDS_ID: id } });
        if (candidate) {
          nearECDSectorsArr.push(id);
        }
      }

      if (!nearECDSectorsArr.length) {
        return res.status(ERR).json({ message: 'Указанный(-ые) ближайший(-ие) участок(-ки) ЭЦД не существует(-ют) в базе' });
      }

      // Создаем в БД записи с идентификаторами ближайших участков
      for (let id of nearECDSectorsArr) {
        await TNearestDNCandECDSector.create({
          NDE_ECDSectorID: id,
          NDE_DNCSectorID: dncSectorId,
        });
      }

      res.status(OK).json({ message: 'Информация успешно сохранена', nearECDSectorsArr });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление информации о близости участков ДНЦ к данному участку ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * ecdSectorId - id участка ЭЦД (обязательно),
 * dncSectorIds - массив id участков ДНЦ (обязательно),
 */
 router.post(
  '/addDNCToECD',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION, MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addDNCToECDValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { ecdSectorId, dncSectorIds } = req.body;

      // Проверяем, существует ли участок ЭЦД с указанным идентификатором
      let candidate = await TECDSector.findOne({ where: { ECDS_ID: ecdSectorId } });
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ЭЦД не существует в базе' });
      }

      // То же самое делаем для каждого заданного ближайшего участка ДНЦ, формируя массив id тех
      // переданных ближайших участков, для которых проверка завершилась успехом
      const nearDNCSectorsArr = [];

      for (let id of dncSectorIds) {
        candidate = await TDNCSector.findOne({ where: { DNCS_ID: id } });
        if (candidate) {
          nearDNCSectorsArr.push(id);
        }
      }

      if (!nearDNCSectorsArr.length) {
        return res.status(ERR).json({ message: 'Указанный(-ые) ближайший(-ие) участок(-ки) ДНЦ не существует(-ют) в базе' });
      }

      // Создаем в БД записи с идентификаторами ближайших участков
      for (let id of nearDNCSectorsArr) {
        await TNearestDNCandECDSector.create({
          NDE_ECDSectorID: ecdSectorId,
          NDE_DNCSectorID: id,
        });
      }

      res.status(OK).json({ message: 'Информация успешно сохранена', nearDNCSectorsArr });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление ближайшего участка (ДНЦ либо ЭЦД).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * dncSectorID - id участка ДНЦ (обязательно),
 * ecdSectorID - id участка ЭЦД (обязательно),
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION, MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delNearestDNCOrECDValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { dncSectorID, ecdSectorID } = req.body;

      // Удаляем в БД запись
      await TNearestDNCandECDSector.destroy({
        where: {
          [Op.and]: [
            { NDE_ECDSectorID: ecdSectorID },
            { NDE_DNCSectorID: dncSectorID },
          ]
        }
      });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


module.exports = router;
