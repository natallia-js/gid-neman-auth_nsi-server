const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  modECDTrainSectorStationsListValidationRules,
  delECDTrainSectorStationValidationRules,
  modECDTrainSectorStationValidationRules,
} = require('../validators/ecdTrainSectorStations.validator');
const validate = require('../validators/validate');
const { TECDTrainSector } = require('../models/TECDTrainSector');
const { TStation } = require('../models/TStation');
const { TECDTrainSectorStation } = require('../models/TECDTrainSectorStation');
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
 * Обработка запроса на редактирование списка станций поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ЭЦД (обязателен),
 * stationIds - массив id станций (обязателен),
 */
router.post(
  '/modStationsList',
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
  modECDTrainSectorStationsListValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции обновления списка станций не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, stationIds } = req.body;

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

      // Ищем в БД информацию обо всех станциях, принадлежащих заданному поездному участку ЭЦД
      let trainSectorStations = await TECDTrainSectorStation.findAll({
        raw: true,
        where: {
          ECDTSS_TrainSectorID: trainSectorId,
        },
        transaction: t,
      });

      // Теперь нужно сравнить массив trainSectorStations со входным параметром stationIds:
      // 1. если запись из stationIds есть в trainSectorStations, то ничего не делаем
      // 2. если записи из stationIds нет в trainSectorStations, то добавляем ее в БД
      // 3. если записи из trainSectorStations нет в stationIds, то удаляем ее из БД
      const existingStationsIds = trainSectorStations.map((rec) => rec.ECDTSS_StationID);
      let maxExistingStationPositionInTrainSector = 0;
      trainSectorStations.forEach((station) => {
        if (station.ECDTSS_StationPositionInTrainSector > maxExistingStationPositionInTrainSector) {
          maxExistingStationPositionInTrainSector = station.ECDTSS_StationPositionInTrainSector;
        }
      });
      const addRecs = [];
      const delRecs = [];
      let nextTrainSectorPos = maxExistingStationPositionInTrainSector + 1;
      stationIds.forEach((id, i) => {
        if (!existingStationsIds.includes(id)) {
          addRecs.push({
            ECDTSS_TrainSectorID: trainSectorId,
            ECDTSS_StationID: id,
            ECDTSS_StationPositionInTrainSector: nextTrainSectorPos,
            ECDTSS_StationBelongsToECDSector: 1,
          });
          nextTrainSectorPos += 1;
        }
      });
      existingStationsIds.forEach((id) => {
        if (!stationIds.includes(id)) {
          delRecs.push(id);
        }
      });

      // Для элементов из addRecs создаем записи в БД
      let createdRecs = await TECDTrainSectorStation.bulkCreate(addRecs, { returning: true, transaction: t });
      createdRecs = createdRecs.map((rec) => rec.dataValues);

      // Для элементов из delRecs удаляем записи из БД
      await TECDTrainSectorStation.destroy({
        where: {
          [Op.and]: [
            { ECDTSS_TrainSectorID: trainSectorId },
            { ECDTSS_StationID: delRecs },
          ],
        },
        transaction: t,
      });

      // Формируем массив для возврата пользователю (вся информация по станциям поездного участка)
      // (Возвращаемое значение формирую в том же виде, что и значения, возвращаемые запросом к информации
      // по участкам ЭЦД)
      trainSectorStations.push(...createdRecs);
      trainSectorStations = trainSectorStations.filter((station) => !delRecs.includes(station.ECDTSS_StationID));

      const stations = await TStation.findAll({
        raw: true,
        where: {
          St_ID: trainSectorStations.map(rec => rec.ECDTSS_StationID),
        },
        transaction: t,
      });

      trainSectorStations = trainSectorStations.map((sectorStation) => {
        return {
          ...stations.find(st => st.St_ID === sectorStation.ECDTSS_StationID),
          TECDTrainSectorStation: { ...sectorStation },
        };
      });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно обновлена', trainSectorStations });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Редактирование списка станций поездного участка ЭЦД',
        error,
        actionParams: { trainSectorId, stationIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление записи из таблицы станций поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ЭЦД (обязателен),
 * stationId - id станции (обязателен),
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
  delECDTrainSectorStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, stationId } = req.body;

    try {
      await TECDTrainSectorStation.destroy({
        where: {
          ECDTSS_TrainSectorID: trainSectorId,
          ECDTSS_StationID: stationId,
        },
      });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление записи из таблицы станций поездного участка ЭЦД',
        error,
        actionParams: { trainSectorId, stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о станции поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ЭЦД (обязателен),
 * stationId - id станции (обязателен),
 * posInTrainSector - позиция станции в рамках поездного участка (не обязателен),
 * belongsToSector - принадлежность станции участку ЭЦД (не обязательно),
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
  modECDTrainSectorStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, stationId, posInTrainSector, belongsToSector } = req.body;

    try {
      // Ищем в БД определенную запросом запись
      const candidate = await TECDTrainSectorStation.findOne({
        where: {
          ECDTSS_TrainSectorID: trainSectorId,
          ECDTSS_StationID: stationId,
        },
      });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная станция поездного участка ЭЦД не существует в базе данных' });
      }

      // Далее, смело редактируем (если что - СУБД не даст ошибиться)
      const updateFields = {};

      if (req.body.hasOwnProperty('posInTrainSector')) {
        updateFields.ECDTSS_StationPositionInTrainSector = posInTrainSector;
      }
      if (req.body.hasOwnProperty('belongsToSector')) {
        updateFields.ECDTSS_StationBelongsToECDSector = belongsToSector;
      }

      await TECDTrainSectorStation.update(updateFields, {
        where: {
          ECDTSS_TrainSectorID: trainSectorId,
          ECDTSS_StationID: stationId,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о станции поездного участка ЭЦД',
        error,
        actionParams: { trainSectorId, stationId, posInTrainSector, belongsToSector },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
