const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  addAdjacentDNCSectorsValidationRules,
  delAdjacentDNCSectorValidationRules,
  changeAdjacentSectorsValidationRules,
} = require('../validators/adjacentDNCSectors.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TAdjacentDNCSector } = require('../models/TAdjacentDNCSector');
const { TDNCSector } = require('../models/TDNCSector');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_DNCSECTORS_ACTION,
  MOD_DNCSECTOR_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех смежных участков ДНЦ.
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
      creds: [GET_ALL_DNCSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (_req, res) => {
    try {
      const data = await TAdjacentDNCSector.findAll({
        raw: true,
        attributes: ['ADNCS_DNCSectorID1', 'ADNCS_DNCSectorID2'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех смежных участков ДНЦ заданного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - id участка ДНЦ (обязателен)
 */
 router.post(
  '/definitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_DNCSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (req, res) => {
    try {
      const { sectorId } = req.body;

      let data = await TAdjacentDNCSector.findAll({
        raw: true,
        where: {
          [Op.or]: [
            { ADNCS_DNCSectorID1: sectorId },
            { ADNCS_DNCSectorID2: sectorId },
          ],
        },
        attributes: ['ADNCS_DNCSectorID1', 'ADNCS_DNCSectorID2'],
      });

      if (!data || !data.length) {
        return res.status(OK).json([]);
      }

      const dncSectorIds = data.map((info) => {
        if (info.ADNCS_DNCSectorID1 === sectorId) {
          return info.ADNCS_DNCSectorID2;
        }
        return info.ADNCS_DNCSectorID1;
      });
      data = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: dncSectorIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление смежных участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID - id участка ДНЦ (обязательно),
 * adjSectorIDs - массив id смежных участков ДНЦ (обязательно),
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  addAdjacentDNCSectorsValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorID, adjSectorIDs } = req.body;

      // Проверяем, существует ли участок ДНЦ с указанным идентификатором
      let candidate = await TDNCSector.findOne({ where: { DNCS_ID: sectorID } });
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ДНЦ не существует в базе' });
      }

      // То же самое делаем для каждого заданного смежного участка, формируя массив id тех
      // переданных смежных участков, для которых проверка завершилась успехом
      const adjSectorsArr = [];

      for (let id of adjSectorIDs) {
        candidate = await TDNCSector.findOne({ where: { DNCS_ID: id } });
        if (candidate) {
          adjSectorsArr.push(id);
        }
      }

      if (!adjSectorsArr.length) {
        return res.status(ERR).json({ message: 'Указанный(-ые) смежный(-ые) участок(-ки) ДНЦ не существует(-ют) в базе' });
      }

      const finalAdjSectIds = [];

      // Для каждого смежного участка ДНЦ ищем в БД одну из комбинаций
      // [sectorID, id] или [id, sectorID]
      for (let id of adjSectorsArr) {
        const antiCandidate = await TAdjacentDNCSector.findOne({
          where: {
            [Op.or]: [
              { ADNCS_DNCSectorID1: sectorID, ADNCS_DNCSectorID2: id },
              { ADNCS_DNCSectorID1: id, ADNCS_DNCSectorID2: sectorID },
            ]
          }
        });

        // Если находим, то установить смежность с данным участком не можем.
        // Если не находим, то помещаем id данного участка в специальный массив.
        if (!antiCandidate) {
          finalAdjSectIds.push(id);
        }
      }

      if (!finalAdjSectIds.length) {
        return res.status(ERR).json({ message: 'Все указанные участки уже объявлены как смежные' });
      }

      // Создаем в БД записи с идентификаторами смежных участков
      for (let id of finalAdjSectIds) {
        await TAdjacentDNCSector.create({
          ADNCS_DNCSectorID1: sectorID,
          ADNCS_DNCSectorID2: id,
        });
      }

      res.status(OK).json({ message: 'Информация успешно сохранена', finalAdjSectIds });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление смежного участка.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID1 - id участка ДНЦ (обязательно),
 * sectorID2 - id смежного участка ДНЦ (обязательно),
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  delAdjacentDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorID1, sectorID2 } = req.body;

      // Удаляем в БД запись
      const destroyedRows = await TAdjacentDNCSector.destroy({
        where: {
          [Op.or]: [
            { ADNCS_DNCSectorID1: sectorID1, ADNCS_DNCSectorID2: sectorID2 },
            { ADNCS_DNCSectorID1: sectorID2, ADNCS_DNCSectorID2: sectorID1 },
          ]
        }
      });

      if (destroyedRows < 1) {
        return res.status(ERR).json({ message: 'Данные для удаления не были найдены в базе' });
      }

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка смежных участков.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - идентификатор участка ДНЦ (обязателен),
 * adjacentSectIds - массив идентификаторов участков ДНЦ, которые необходимо связать с данным
 *                   (обязателен; если нет смежных участков, то массив должен быть пустым)
 */
 router.post(
  '/changeAdjacentSectors',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  changeAdjacentSectorsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции установления смежности участков ДНЦ не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorId, adjacentSectIds } = req.body;

      // Ищем в БД участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCSector.findOne({
        where: { DNCS_ID: sectorId },
        transaction: t,
      });

      // Если не находим, то процесс изменения списка смежных участков продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Участок ДНЦ не найден' });
      }

      if (adjacentSectIds && adjacentSectIds.length) {
        // Проверяю начилие в БД всех участков, которые необходимо связать с заданным
        const dncSectors = await TDNCSector.findAll({
          where: { DNCS_ID: adjacentSectIds },
          transaction: t,
        });

        if (!dncSectors || dncSectors.length !== adjacentSectIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все смежные участки ДНЦ найдены в базе' });
        }

        const finalAdjSectIds = [];

        // Для каждого смежного участка ДНЦ ищем в БД одну из комбинаций
        // [sectorID, id] или [id, sectorID]
        for (let id of adjacentSectIds) {
          const antiCandidate = await TAdjacentDNCSector.findOne({
            where: {
              [Op.or]: [
                { ADNCS_DNCSectorID1: sectorId, ADNCS_DNCSectorID2: id },
                { ADNCS_DNCSectorID1: id, ADNCS_DNCSectorID2: sectorId },
              ]
            },
            transaction: t,
          });

          // Если находим, то установить смежность с данным участком не можем.
          // Если не находим, то помещаем id данного участка в специальный массив (для того, чтобы
          // в дальнейшем установить смежность с заданным участком ДНЦ).
          if (!antiCandidate) {
            finalAdjSectIds.push(id);
          }
        }

        if (finalAdjSectIds.length) {
          // Создаем в БД записи с идентификаторами смежных участков
          for (let id of finalAdjSectIds) {
            await TAdjacentDNCSector.create({
              ADNCS_DNCSectorID1: sectorId,
              ADNCS_DNCSectorID2: id,
            }, { transaction: t });
          }
        }
      }

      // Удаляю связь смежности с теми участками ДНЦ, которых нет в adjacentSectIds
      await TAdjacentDNCSector.destroy({
        where: {
          [Op.or]: [
            { ADNCS_DNCSectorID1: sectorId, ADNCS_DNCSectorID2: { [Op.notIn]: adjacentSectIds } },
            { ADNCS_DNCSectorID1: { [Op.notIn]: adjacentSectIds }, ADNCS_DNCSectorID2: sectorId },
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
