const { Router } = require('express');
const crypto = require('crypto');
const {
  addAdjacentDNCSectorsValidationRules,
  delAdjacentDNCSectorValidationRules,
  changeAdjacentSectorsValidationRules,
} = require('../validators/adjacentDNCSectors.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TAdjacentDNCSectorFields, TAdjacentDNCSector } = require('../models/TAdjacentDNCSector');
const { TDNCSector } = require('../models/TDNCSector');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех смежных участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_DNC_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TAdjacentDNCSector.findAll({
        raw: true,
        attributes: [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1, TAdjacentDNCSectorFields.ADNCS_DNCSectorID2],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех смежных участков ДНЦ',
        error: error.message,
        actionParams: {},
      });
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
 * onlyHash - если true, то ожидается, что запрос вернет только хэш-значение информации о смежных участках ДНЦ,
 *   если false, то запрос возвращает всю запрошенную информацию о смежных участках ДНЦ
 *   (параметр не обязателен; если не указан, то запрос возвращает информацию о смежных участках)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ADJACENT_DNC_SECTORS_OF_DEFINITE_DNC_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверку параметра запроса sectorId не делаю: если он будет указан неверно, то запрос ничего не вернет
  async (req, res) => {
    const { sectorId, onlyHash } = req.body;

    try {
      let data = await TAdjacentDNCSector.findAll({
        raw: true,
        where: {
          [Op.or]: [
            { [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorId },
            { [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: sectorId },
          ],
        },
        attributes: [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1, TAdjacentDNCSectorFields.ADNCS_DNCSectorID2],
      });

      if (!data || !data.length) {
        return res.status(OK).json([]);
      }

      const dncSectorIds = data.map((info) => {
        if (info[TAdjacentDNCSectorFields.ADNCS_DNCSectorID1] === sectorId) {
          return info[TAdjacentDNCSectorFields.ADNCS_DNCSectorID2];
        }
        return info[TAdjacentDNCSectorFields.ADNCS_DNCSectorID1];
      });

      data = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: dncSectorIds },
      });

      if (onlyHash) {
        const serializedData = JSON.stringify(data);
        data = crypto.createHash('md5').update(serializedData).digest('hex');
      }
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех смежных участков ДНЦ заданного участка ДНЦ',
        error: error.message,
        actionParams: { sectorId },
      });
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
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ADJACENT_DNC_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addAdjacentDNCSectorsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { sectorID, adjSectorIDs } = req.body;

    try {
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
              {
                [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorID,
                [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: id,
              },
              {
                [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: id,
                [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: sectorID,
              },
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
          [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorID,
          [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: id,
        });
      }

      res.status(OK).json({ message: 'Информация успешно сохранена', finalAdjSectIds });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление смежных участков ДНЦ',
        error: error.message,
        actionParams: { sectorID, adjSectorIDs },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление смежного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID1 - id участка ДНЦ (обязательно),
 * sectorID2 - id смежного участка ДНЦ (обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ADJACENT_DNC_SECTOR; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delAdjacentDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { sectorID1, sectorID2 } = req.body;

    try {
      // Удаляем в БД запись
      const destroyedRows = await TAdjacentDNCSector.destroy({
        where: {
          [Op.or]: [
            {
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorID1,
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: sectorID2,
            },
            {
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorID2,
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: sectorID1,
            },
          ]
        }
      });

      if (destroyedRows < 1) {
        return res.status(ERR).json({ message: 'Данные для удаления не были найдены в базе' });
      }

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление смежного участка ДНЦ',
        error: error.message,
        actionParams: { sectorID1, sectorID2 },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на изменение списка смежных участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - идентификатор участка ДНЦ (обязателен),
 * adjacentSectIds - массив идентификаторов участков ДНЦ, которые необходимо связать с данным
 *                   (обязателен; если нет смежных участков, то массив должен быть пустым),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/changeAdjacentSectors',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.CHANGE_ADJACENT_DNC_SECTORS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  changeAdjacentSectorsValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции установления смежности участков ДНЦ не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { sectorId, adjacentSectIds } = req.body;

    try {
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
                {
                  [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorId,
                  [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: id,
                },
                {
                  [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: id,
                  [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: sectorId,
                },
              ],
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
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorId,
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: id,
            }, { transaction: t });
          }
        }
      }

      // Удаляю связь смежности с теми участками ДНЦ, которых нет в adjacentSectIds
      await TAdjacentDNCSector.destroy({
        where: {
          [Op.or]: [
            {
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: sectorId,
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: { [Op.notIn]: adjacentSectIds },
            },
            {
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: { [Op.notIn]: adjacentSectIds },
              [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: sectorId,
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
        action: 'Изменение списка смежных участков ДНЦ',
        error: error.message,
        actionParams: { sectorId, adjacentSectIds },
      });
      await t.rollback();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
