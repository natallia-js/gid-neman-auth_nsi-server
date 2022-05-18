const { Router } = require('express');
const {
  addAdjacentECDSectorsValidationRules,
  delAdjacentECDSectorValidationRules,
  changeAdjacentSectorsValidationRules,
} = require('../validators/adjacentECDSectors.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TAdjacentECDSectorFields, TAdjacentECDSector } = require('../models/TAdjacentECDSector');
const { TECDSector } = require('../models/TECDSector');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех смежных участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
router.get(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_ECD_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TAdjacentECDSector.findAll({
        raw: true,
        attributes: [TAdjacentECDSectorFields.AECDS_ECDSectorID1, TAdjacentECDSectorFields.AECDS_ECDSectorID2],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех смежных участков ЭЦД',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех смежных участков ЭЦД заданного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - id участка ЭЦД (обязателен)
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_ECD_SECTORS_OF_DEFINITE_ECD_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const { sectorId } = req.body;

    try {
      let data = await TAdjacentECDSector.findAll({
        raw: true,
        where: {
          [Op.or]: [
            { [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorId },
            { [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: sectorId },
          ],
        },
        attributes: [TAdjacentECDSectorFields.AECDS_ECDSectorID1, TAdjacentECDSectorFields.AECDS_ECDSectorID2],
      });

      if (!data || !data.length) {
        return res.status(OK).json([]);
      }

      const ecdSectorIds = data.map((info) => {
        if (info[TAdjacentECDSectorFields.AECDS_ECDSectorID1] === sectorId) {
          return info[TAdjacentECDSectorFields.AECDS_ECDSectorID2];
        }
        return info[TAdjacentECDSectorFields.AECDS_ECDSectorID1];
      });
      data = await TECDSector.findAll({
        raw: true,
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: ecdSectorIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех смежных участков ЭЦД заданного участка ЭЦД',
        error: error.message,
        actionParams: { sectorId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление смежных участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID - id участка ЭЦД (обязательно),
 * adjSectorIDs - массив id смежных участков ЭЦД (обязательно),
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ADJACENT_ECD_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addAdjacentECDSectorsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { sectorID, adjSectorIDs } = req.body;

    try {
      // Проверяем, существует ли участок ЭЦД с указанным идентификатором
      let candidate = await TECDSector.findOne({ where: { ECDS_ID: sectorID } });
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ЭЦД не существует в базе' });
      }

      // То же самое делаем для каждого заданного смежного участка, формируя массив id тех
      // переданных смежных участков, для которых проверка завершилась успехом
      const adjSectorsArr = [];

      for (let id of adjSectorIDs) {
        candidate = await TECDSector.findOne({ where: { ECDS_ID: id } });
        if (candidate) {
          adjSectorsArr.push(id);
        }
      }

      if (!adjSectorsArr.length) {
        return res.status(ERR).json({ message: 'Указанный(-ые) смежный(-ые) участок(-ки) ЭЦД не существует(-ют) в базе' });
      }

      const finalAdjSectIds = [];

      // Для каждого смежного участка ЭЦД ищем в БД одну из комбинаций
      // [sectorID, id] или [id, sectorID]
      for (let id of adjSectorsArr) {
        const antiCandidate = await TAdjacentECDSector.findOne({
          where: {
            [Op.or]: [
              {
                [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorID,
                [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: id,
              },
              {
                [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: id,
                [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: sectorID,
              },
            ],
          },
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
        await TAdjacentECDSector.create({
          [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorID,
          [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: id,
        });
      }

      res.status(OK).json({ message: 'Информация успешно сохранена', finalAdjSectIds });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление смежных участков ЭЦД',
        error: error.message,
        actionParams: { sectorID, adjSectorIDs },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление смежного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID1 - id участка ЭЦД (обязательно),
 * sectorID2 - id смежного участка ЭЦД (обязательно),
  */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ADJACENT_ECD_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delAdjacentECDSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { sectorID1, sectorID2 } = req.body;

    try {
      // Удаляем в БД запись
      const destroyedRows = await TAdjacentECDSector.destroy({
        where: {
          [Op.or]: [
            {
              [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorID1,
              [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: sectorID2,
            },
            {
              [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorID2,
              [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: sectorID1,
            },
          ],
        },
      });

      if (destroyedRows < 1) {
        return res.status(ERR).json({ message: 'Данные для удаления не были найдены в базе' });
      }

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление смежного участка ЭЦД',
        error: error.message,
        actionParams: { sectorID1, sectorID2 },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка смежных участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - идентификатор участка ЭЦД (обязателен),
 * adjacentSectIds - массив идентификаторов участков ЭЦД, которые необходимо связать с данным
 *                   (обязателен; если нет смежных участков, то массив должен быть пустым)
 */
 router.post(
  '/changeAdjacentSectors',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.CHANGE_ADJACENT_ECD_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  changeAdjacentSectorsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции установления смежности участков ЭЦД не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { sectorId, adjacentSectIds } = req.body;

    try {
      // Ищем в БД участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDSector.findOne({
        where: { ECDS_ID: sectorId },
        transaction: t,
      });

      // Если не находим, то процесс изменения списка смежных участков продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Участок ЭЦД не найден' });
      }

      if (adjacentSectIds && adjacentSectIds.length) {
        // Проверяю начилие в БД всех участков, которые необходимо связать с заданным
        const ecdSectors = await TECDSector.findAll({
          where: { ECDS_ID: adjacentSectIds },
          transaction: t,
        });

        if (!ecdSectors || ecdSectors.length !== adjacentSectIds.length) {
          await t.rollback();
          return res.status(ERR).json({ message: 'Не все смежные участки ЭЦД найдены в базе' });
        }

        const finalAdjSectIds = [];

        // Для каждого смежного участка ЭЦД ищем в БД одну из комбинаций
        // [sectorID, id] или [id, sectorID]
        for (let id of adjacentSectIds) {
          const antiCandidate = await TAdjacentECDSector.findOne({
            where: {
              [Op.or]: [
                {
                  [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorId,
                  [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: id,
                },
                {
                  [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: id,
                  [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: sectorId,
                },
              ],
            },
            transaction: t,
          });

          // Если находим, то установить смежность с данным участком не можем.
          // Если не находим, то помещаем id данного участка в специальный массив (для того, чтобы
          // в дальнейшем установить смежность с заданным участком ЭЦД).
          if (!antiCandidate) {
            finalAdjSectIds.push(id);
          }
        }

        if (finalAdjSectIds.length) {
          // Создаем в БД записи с идентификаторами смежных участков
          for (let id of finalAdjSectIds) {
            await TAdjacentECDSector.create({
              [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorId,
              [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: id,
            }, { transaction: t });
          }
        }
      }

      // Удаляю связь смежности с теми участками ЭЦД, которых нет в adjacentSectIds
      await TAdjacentECDSector.destroy({
        where: {
          [Op.or]: [
            {
              [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: sectorId,
              [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: { [Op.notIn]: adjacentSectIds },
            },
            {
              [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: { [Op.notIn]: adjacentSectIds },
              [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: sectorId,
            },
          ],
        },
        transaction: t,
      });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Изменение списка смежных участков ЭЦД',
        error: error.message,
        actionParams: { sectorId, adjacentSectIds },
      });
      await t.rollback();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
