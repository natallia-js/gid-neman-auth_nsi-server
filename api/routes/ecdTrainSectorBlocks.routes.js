const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  modECDTrainSectorBlocksListValidationRules,
  delECDTrainSectorBlockValidationRules,
  modECDTrainSectorBlockValidationRules,
} = require('../validators/ecdTrainSectorBlocks.validator');
const validate = require('../validators/validate');
const { TECDTrainSector } = require('../models/TECDTrainSector');
const { TBlock } = require('../models/TBlock');
const { TECDTrainSectorBlock } = require('../models/TECDTrainSectorBlock');
const { Op } = require('sequelize');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  MOD_ECDSECTOR_ACTION,
} = require('../constants');


/**
 * Обработка запроса на редактирование списка перегонов поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ЭЦД (обязателен),
 * blockIds - массив id перегонов (обязателен),
 */
router.post(
  '/modBlocksList',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  modECDTrainSectorBlocksListValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции обновления списка перегонов не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, blockIds } = req.body;

    try {
      // Ищем в БД поездной участок ЭЦД, id которого совпадает с переданным пользователем
      const trainSector = await TECDTrainSector.findOne({
        where: { ECDTS_ID: trainSectorId },
        transaction: t,
      });

      // Если не находим, то продолжать не можем
      if (!trainSector) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Поездной участок ЭЦД с указанным id не существует' });
      }

      // Ищем в БД информацию обо всех перегонах, принадлежащих заданному поездному участку ЭЦД
      let trainSectorBlocks = await TECDTrainSectorBlock.findAll({
        raw: true,
        where: {
          ECDTSB_TrainSectorID: trainSectorId,
        },
        transaction: t,
      });

      // Теперь нужно сравнить массив trainSectorBlocks со входным параметром blockIds:
      // 1. если запись из blockIds есть в trainSectorBlocks, то ничего не делаем
      // 2. если записи из blockIds нет в trainSectorBlocks, то добавляем ее в БД
      // 3. если записи из trainSectorBlocks нет в blockIds, то удаляем ее из БД
      const existingBlocksIds = trainSectorBlocks.map((rec) => rec.ECDTSB_BlockID);
      let maxExistingBlockPositionInTrainSector = 0;
      trainSectorBlocks.forEach((block) => {
        if (block.ECDTSB_BlockPositionInTrainSector > maxExistingBlockPositionInTrainSector) {
          maxExistingBlockPositionInTrainSector = block.ECDTSB_BlockPositionInTrainSector;
        }
      });
      const addRecs = [];
      const delRecs = [];
      let nextTrainSectorPos = maxExistingBlockPositionInTrainSector + 1;
      blockIds.forEach((id) => {
        if (!existingBlocksIds.includes(id)) {
          addRecs.push({
            ECDTSB_TrainSectorID: trainSectorId,
            ECDTSB_BlockID: id,
            ECDTSB_BlockPositionInTrainSector: nextTrainSectorPos,
            ECDTSB_BlockBelongsToECDSector: 1,
          });
          nextTrainSectorPos += 1;
        }
      });
      existingBlocksIds.forEach((id) => {
        if (!blockIds.includes(id)) {
          delRecs.push(id);
        }
      });

      // Для элементов из addRecs создаем записи в БД
      let createdRecs = await TECDTrainSectorBlock.bulkCreate(addRecs, { returning: true, transaction: t });
      createdRecs = createdRecs.map((rec) => rec.dataValues);

      // Для элементов из delRecs удаляем записи из БД
      await TECDTrainSectorBlock.destroy({
        where: {
          [Op.and]: [
            { ECDTSB_TrainSectorID: trainSectorId },
            { ECDTSB_BlockID: delRecs },
          ],
        },
        transaction: t,
      });

      // Формируем массив для возврата пользователю (вся информация по перегонам поездного участка)
      // (Возвращаемое значение формирую в том же виде, что и значения, возвращаемые запросом к информации
      // по участкам ЭЦД)
      trainSectorBlocks.push(...createdRecs);
      trainSectorBlocks = trainSectorBlocks.filter((block) => !delRecs.includes(block.ECDTSB_BlockID));

      const blocks = await TBlock.findAll({
        raw: true,
        where: {
          Bl_ID: trainSectorBlocks.map(rec => rec.ECDTSB_BlockID),
        },
        transaction: t,
      });

      trainSectorBlocks = trainSectorBlocks.map((sectorBlock) => {
        return {
          ...blocks.find(bl => bl.Bl_ID === sectorBlock.ECDTSB_BlockID),
          TECDTrainSectorBlock: { ...sectorBlock },
        };
      });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно обновлена', trainSectorBlocks });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Редактирование списка перегонов поездного участка ЭЦД',
        error,
        actionParams: { trainSectorId, blockIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление записи из таблицы перегонов поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ЭЦД (обязателен),
 * blockId - id перегона (обязателен),
  */
 router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  delECDTrainSectorBlockValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, blockId } = req.body;

    try {
      await TECDTrainSectorBlock.destroy({
        where: {
          ECDTSB_TrainSectorID: trainSectorId,
          ECDTSB_BlockID: blockId,
        },
      });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление записи из таблицы перегонов поездного участка ЭЦД',
        error,
        actionParams: { trainSectorId, blockId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о перегоне поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ЭЦД (обязателен),
 * blockId - id перегона (обязателен),
 * posInTrainSector - позиция перегона в рамках поездного участка (не обязателен),
 * belongsToSector - принадлежность перегона участку ЭЦД (не обязательно),
 */
 router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  modECDTrainSectorBlockValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, blockId, posInTrainSector, belongsToSector } = req.body;

    try {
      // Ищем в БД определенную запросом запись
      const candidate = await TECDTrainSectorBlock.findOne({
        where: {
          ECDTSB_TrainSectorID: trainSectorId,
          ECDTSB_BlockID: blockId,
        },
      });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный перегон поездного участка ЭЦД не существует в базе данных' });
      }

      // Далее, смело редактируем (если что - СУБД не даст ошибиться)
      const updateFields = {};

      if (req.body.hasOwnProperty('posInTrainSector')) {
        updateFields.ECDTSB_BlockPositionInTrainSector = posInTrainSector;
      }
      if (req.body.hasOwnProperty('belongsToSector')) {
        updateFields.ECDTSB_BlockBelongsToECDSector = belongsToSector;
      }

      await TECDTrainSectorBlock.update(updateFields, {
        where: {
          ECDTSB_TrainSectorID: trainSectorId,
          ECDTSB_BlockID: blockId,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о перегоне поездного участка ЭЦД',
        error,
        actionParams: { trainSectorId, blockId, posInTrainSector, belongsToSector },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
