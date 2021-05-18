const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addECDToDNCValidationRules,
  addDNCToECDValidationRules,
  delNearestDNCOrECDValidationRules,
  changeNearestECDSectorsValidationRules,
  changeNearestDNCSectorsValidationRules,
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
      const data = await TNearestDNCandECDSector.findAll({
        raw: true,
        attributes: ['NDE_ECDSectorID', 'NDE_DNCSectorID'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
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

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
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

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
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

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка ближайших участков ЭЦД для данного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - идентификатор участка ДНЦ (обязателен),
 * nearestECDSectIds - массив идентификаторов участков ЭЦД, которые необходимо связать с данным участком ДНЦ
 *                     (обязателен; если нет ближайших участков ЭЦД, то массив должен быть пустым)
 */
 router.post(
  '/changeNearestECDSectors',
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
  changeNearestECDSectorsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции установления близости к участкам ЭЦД не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorId, nearestECDSectIds } = req.body;

      // Ищем в БД участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCSector.findOne({
        where: { DNCS_ID: sectorId },
        transaction: t,
      });

      // Если не находим, то процесс изменения списка ближайших участков продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Участок ДНЦ не найден' });
      }

      if (nearestECDSectIds && nearestECDSectIds.length) {
        // Проверяю начилие в БД всех участков ЭЦД, которые необходимо связать с заданным участком ДНЦ
        const ecdSectors = await TECDSector.findAll({
          where: { ECDS_ID: nearestECDSectIds },
          transaction: t,
        });

        if (!ecdSectors || ecdSectors.length !== nearestECDSectIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все ближайшие участки ЭЦД найдены в базе' });
        }

        // Для каждого ближайшего участка ЭЦД ищем в БД связь с текущим участком ДНЦ.
        // Если находим, то связь повторно не устанавливаем. Если не находим, то устанавливаем связь.
        for (let id of nearestECDSectIds) {
          const antiCandidate = await TNearestDNCandECDSector.findOne({
            where: {
             NDE_ECDSectorID: id,
             NDE_DNCSectorID: sectorId,
            },
            transaction: t,
          });

          if (!antiCandidate) {
            await TNearestDNCandECDSector.create({
              NDE_ECDSectorID: id,
              NDE_DNCSectorID: sectorId,
            }, { transaction: t });
          }
        }
      }

      // Удаляю связь близости с теми участками ЭЦД, которых нет в nearestECDSectIds
      await TNearestDNCandECDSector.destroy({
        where: {
          [Op.and]: [
            { NDE_ECDSectorID: { [Op.notIn]: nearestECDSectIds } },
            { NDE_DNCSectorID: sectorId },
          ]
        },
        transaction: t,
      });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      console.log(error);
      await t.rollback();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка ближайших участков ДНЦ для данного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - идентификатор участка ЭЦД (обязателен),
 * nearestDNCSectIds - массив идентификаторов участков ДНЦ, которые необходимо связать с данным участком ЭЦД
 *                     (обязателен; если нет ближайших участков ДНЦ, то массив должен быть пустым)
 */
 router.post(
  '/changeNearestDNCSectors',
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
  changeNearestDNCSectorsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции установления близости к участкам ДНЦ не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorId, nearestDNCSectIds } = req.body;

      // Ищем в БД участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDSector.findOne({ where: { ECDS_ID: sectorId } });

      // Если не находим, то процесс изменения списка ближайших участков продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Участок ЭЦД не найден' });
      }

      if (nearestDNCSectIds && nearestDNCSectIds.length) {
        // Проверяю начилие в БД всех участков ДНЦ, которые необходимо связать с заданным участком ЭЦД
        const dncSectors = await TDNCSector.findAll({ where: { DNCS_ID: nearestDNCSectIds } });

        if (!dncSectors || dncSectors.length !== nearestDNCSectIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все ближайшие участки ДНЦ найдены в базе' });
        }

        // Для каждого ближайшего участка ДНЦ ищем в БД связь с текущим участком ЭЦД.
        // Если находим, то связь повторно не устанавливаем. Если не находим, то устанавливаем связь.
        for (let id of nearestDNCSectIds) {
          const antiCandidate = await TNearestDNCandECDSector.findOne({
            where: {
             NDE_ECDSectorID: sectorId,
             NDE_DNCSectorID: id,
            },
          });

          if (!antiCandidate) {
            await TNearestDNCandECDSector.create({
              NDE_ECDSectorID: sectorId,
              NDE_DNCSectorID: id,
            }, { transaction: t });
          }
        }
      }

      // Удаляю связь близости с теми участками ДНЦ, которых нет в nearestDNCSectIds
      await TNearestDNCandECDSector.destroy({
        where: {
          [Op.and]: [
            { NDE_ECDSectorID: sectorId },
            { NDE_DNCSectorID: { [Op.notIn]: nearestDNCSectIds } },
          ]
        },
        transaction: t,
      });

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
